#!/usr/bin/env node
/**
 * Inventario do lado do repositorio (sem acesso ao banco) -> inventario/estado/edges.json
 *
 * Para cada edge function de supabase/functions/: linhas, segredos lidos (Deno.env.get), qual
 * tabela/RPC ela toca, e quem a invoca (src, migrations, outras edges, supabase/config.toml).
 * Edge sem nenhum chamador no repo e codigo morto em producao — e o que `sem_chamador` marca.
 *
 * Tambem, se receber nomes de tabela no stdin (um por linha), grava
 * inventario/estado/tabelas-uso.json com quantos `.from('tabela')` cada uma tem em src/ e nas
 * edges (o mesmo numero sai em banco.json -> tabelas[].uso_no_codigo quando ha acesso ao banco).
 *
 * Uso: node scripts/inventario/gerar-repo.mjs
 *      node scripts/inventario/gerar-repo.mjs < tabelas.txt
 *      node scripts/inventario/gerar-repo.mjs --check    exit 1 se edges.json esta desatualizado
 *
 * Varredura em Node puro (sem ripgrep): o repo nao tem CI para instalar binario, e assim o
 * script roda igual na maquina do agente e no runner.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/edges.json';
const SAIDA_TABELAS_REL = 'inventario/estado/tabelas-uso.json';
const EXT_CODIGO = /\.(ts|tsx|js|jsx|mjs|cjs)$/;

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const unico = (lista) => [...new Set(lista)].sort();

/** Arquivos de uma pasta (recursivo), ignorando node_modules e dotfiles. */
export function listarArquivos(dir, filtro = () => true, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listarArquivos(p, filtro, acc);
    else if (filtro(p)) acc.push(p);
  }
  return acc;
}

/** Texto de cada arquivo das pastas pedidas: [{ rel, texto }]. Lido uma vez e reusado. */
export function carregarCorpus(raiz, pastas, filtro = (p) => EXT_CODIGO.test(p)) {
  const corpus = [];
  for (const pasta of pastas) {
    const base = path.join(raiz, pasta);
    if (!fs.existsSync(base)) continue;
    if (fs.statSync(base).isFile()) {
      corpus.push({ rel: pasta, texto: fs.readFileSync(base, 'utf8') });
      continue;
    }
    for (const abs of listarArquivos(base, filtro)) {
      corpus.push({ rel: path.relative(raiz, abs).split(path.sep).join('/'), texto: fs.readFileSync(abs, 'utf8') });
    }
  }
  return corpus;
}

const arquivosQueCasam = (corpus, re) => corpus.filter((a) => re.test(a.texto)).map((a) => a.rel).sort();
const ocorrencias = (corpus, re) => corpus.reduce((n, a) => n + [...a.texto.matchAll(re)].length, 0);

/** Edge functions do repo: pastas de supabase/functions/ com index.ts (sem as `_compartilhadas`). */
export function edgesNoRepo(raiz) {
  const dir = path.join(raiz, 'supabase/functions');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && fs.existsSync(path.join(dir, d.name, 'index.ts')))
    .map((d) => d.name).sort();
}

/** Monta o inventario das edges. Funcao pura sobre o disco (testavel com repo de brinquedo). */
export function gerarEdges(raiz = RAIZ_PADRAO) {
  const edges = edgesNoRepo(raiz);
  const corpusSrc = carregarCorpus(raiz, ['src']);
  const corpusEdges = carregarCorpus(raiz, ['supabase/functions']);
  const corpusMigrations = carregarCorpus(raiz, ['supabase/migrations'], (p) => p.endsWith('.sql'));
  const corpusConfig = carregarCorpus(raiz, ['supabase/config.toml'], () => true);

  const inventario = {};
  for (const nome of edges) {
    const q = esc(nome);
    const codigo = fs.readFileSync(path.join(raiz, 'supabase/functions', nome, 'index.ts'), 'utf8');
    const segredos = unico([...codigo.matchAll(/Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g)].map((m) => m[1]));
    const tabelas = unico([...codigo.matchAll(/(?<!storage)\.from\(\s*['"`]([A-Za-z0-9_]+)['"`]/g)].map((m) => m[1]));
    const rpcs = unico([...codigo.matchAll(/\.rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g)].map((m) => m[1]));
    const src = arquivosQueCasam(corpusSrc, new RegExp(`functions\\s*\\.\\s*invoke(?:<[^>()]*>)?\\(\\s*['"\`]${q}['"\`]|/functions/v1/${q}\\b`));
    const migrations = arquivosQueCasam(corpusMigrations, new RegExp(`/functions/v1/${q}\\b`));
    const outrasEdges = arquivosQueCasam(corpusEdges, new RegExp(`/functions/v1/${q}\\b|invoke\\(\\s*['"\`]${q}['"\`]`))
      .filter((p) => !p.startsWith(`supabase/functions/${nome}/`));
    const config = arquivosQueCasam(corpusConfig, new RegExp(`\\[functions\\.${q}\\]`));
    inventario[nome] = {
      linhas: codigo.split('\n').length,
      segredos_lidos: segredos,
      tabelas,
      rpcs,
      chamada_em: { src, migrations, outras_edges: outrasEdges },
      declarada_no_config: config.length > 0,
      sem_chamador: src.length + migrations.length + outrasEdges.length === 0,
    };
  }
  const semChamador = Object.entries(inventario).filter(([, v]) => v.sem_chamador).map(([k]) => k);
  const segredos = unico(Object.values(inventario).flatMap((v) => v.segredos_lidos));
  return {
    format_version: 1,
    fonte: 'scripts/inventario/gerar-repo.mjs (le supabase/functions/, src/, supabase/migrations/ e supabase/config.toml)',
    resumo: { edges: edges.length, sem_chamador_no_repo: semChamador.length, segredos_distintos: segredos.length },
    sem_chamador_no_repo: semChamador,
    segredos_lidos_pelas_edges: segredos,
    edge_functions: inventario,
  };
}

/** Uso de cada tabela no codigo de producao: `.from('tabela')` em src/ e nas edges. */
export function gerarUsoDeTabelas(raiz, nomes) {
  const corpusSrc = carregarCorpus(raiz, ['src'], (p) => EXT_CODIGO.test(p) && !/(\.test\.|\.spec\.|__tests__|\/test\/)/.test(p));
  const corpusEdges = carregarCorpus(raiz, ['supabase/functions']);
  const uso = {};
  for (const t of nomes) {
    const re = new RegExp(`(?<!storage)\\.from\\(\\s*['"\`]${esc(t)}['"\`]`, 'g');
    uso[t] = { from_src: ocorrencias(corpusSrc, re), from_edges: ocorrencias(corpusEdges, re) };
  }
  const semFrom = Object.entries(uso).filter(([, v]) => v.from_src + v.from_edges === 0).map(([k]) => k);
  return { format_version: 1, total: nomes.length, sem_from_em_src_nem_edges: semFrom, tabelas: uso };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarEdges(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-repo.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`edges.json: ${r.edges} edge functions, ${r.sem_chamador_no_repo} sem chamador no repo, ${r.segredos_distintos} segredos lidos.`);

  // Lista de tabelas pelo stdin (quando ha): o mesmo numero sai em banco.json com acesso ao banco.
  if (!process.stdin.isTTY) {
    const nomes = unico(fs.readFileSync(0, 'utf8').split(/\s+/).filter(Boolean));
    if (nomes.length > 0) {
      const alvo = path.join(RAIZ_PADRAO, SAIDA_TABELAS_REL);
      fs.writeFileSync(alvo, serializar(gerarUsoDeTabelas(RAIZ_PADRAO, nomes)));
      const semFrom = JSON.parse(fs.readFileSync(alvo, 'utf8')).sem_from_em_src_nem_edges.length;
      console.log(`tabelas-uso.json: ${nomes.length} tabelas, ${semFrom} sem .from() em src nem nas edges.`);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
