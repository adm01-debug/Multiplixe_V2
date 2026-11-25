#!/usr/bin/env node
/**
 * Inventario do banco OFICIAL ao vivo -> inventario/estado/banco.json (fonte de consulta dos agentes).
 *
 * Tudo sai de comando: o SQL de leitura `scripts/inventario/banco.sql`, a lista de edge functions
 * publicadas (GET /functions) e o uso de cada tabela no codigo (`.from('tabela')`). Nada escrito a mao.
 *
 * Dois jeitos de rodar:
 *   1) Com token (o cron semanal faz isso):
 *        SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs
 *      Le pela Management API: POST /database/query/read-only (transacao so leitura) e GET
 *      /functions. 429 e 5xx sao repetidos com backoff (honrando o Retry-After). Projeto fixo:
 *      ywsblgsikhiscvpmopkp (supabase/config.toml:1). SUPABASE_PROJECT_REF
 *      so troca para teste; qualquer outro valor exige INVENTARIO_PERMITIR_OUTRO_PROJETO=1.
 *   2) Sem token (nenhum agente desta sessao tem MCP do projeto — `docs/agentes/banco.md`):
 *      rodar `scripts/inventario/banco.sql` no SQL Editor do Lovable Cloud, salvar a resposta e
 *        node scripts/inventario/gerar-banco.mjs --entrada /caminho/resposta.json
 *      Aceita a resposta crua ({"rows":[{"inventario":{...}}]}), o envelope de MCP ou o objeto
 *      direto. Sem token as edges publicadas ficam de fora (`edge_functions.publicadas: null`).
 *
 * Antes de gravar: confere que a resposta e mesmo do banco oficial (tabelas x types.ts e ledger x
 * supabase/migrations/) e recusa saida com cara de credencial.
 * Exit: 0 = gravado; 2 = entrada invalida, consulta falhou ou saida com credencial.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lerTypes, nomesDeTabelas } from '../lib/types-supabase.mjs';
import { NOME_MIGRATION } from '../lib/migrations-supabase.mjs';
import { carregarCorpus, edgesNoRepo } from './gerar-repo.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SQL_PATH = path.join(RAIZ, 'scripts/inventario/banco.sql');
const SAIDA = path.join(RAIZ, 'inventario/estado/banco.json');
export const PROJETO_OFICIAL = 'ywsblgsikhiscvpmopkp';
// SUPABASE_API_URL so existe para o teste apontar um servidor local.
const apiBase = () => `${(process.env.SUPABASE_API_URL || 'https://api.supabase.com').replace(/\/$/, '')}/v1/projects`;

/**
 * A Management API limita requisicoes (HTTP 429) e devolve 5xx em pico. Sem retry o cron semanal
 * perde a semana inteira por um blip de segundos.
 */
export const RETRY = { tentativas: 4, baseMs: 1000, maxMs: 30_000 };

/** Limiares dos alertas: o que um agente precisa saber antes de mexer no sistema. */
export const LIMIARES = {
  taxaFalhaCronPct: 5,
  historicoCronMaisDe7Dias: 50000,
};

/** Algo com cara de credencial no texto? */
export const PARECE_CREDENCIAL = /Bearer\s+[A-Za-z0-9._-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_/;

/** Extrai o objeto do inventario da Management API, do SQL Editor, do MCP ou do objeto direto. */
export function extrairInventario(bruto) {
  let dado = typeof bruto === 'string' ? JSON.parse(bruto.trim()) : bruto;
  const conteudo = dado?.result?.content ?? dado?.content;
  if (Array.isArray(conteudo) && typeof conteudo[0]?.text === 'string') dado = JSON.parse(conteudo[0].text);
  if (dado && Array.isArray(dado.rows)) dado = dado.rows[0];
  if (Array.isArray(dado)) dado = dado[0];
  if (dado && dado.inventario) dado = dado.inventario;
  if (typeof dado === 'string') dado = JSON.parse(dado);
  const faltando = ['format_version', 'medido_em', 'resumo', 'tabelas', 'funcoes', 'cron']
    .filter((chave) => !(dado && chave in dado));
  if (faltando.length) throw new Error(`entrada sem as chaves: ${faltando.join(', ')}`);
  if (dado.format_version !== 1) throw new Error(`format_version ${dado.format_version} desconhecido (esperado 1)`);
  if (!Array.isArray(dado.tabelas) || dado.tabelas.length === 0) throw new Error('entrada sem tabelas');
  return dado;
}

/** Uso de cada tabela no codigo de producao (teste fora): `.from('tabela')` e `/rest/v1/tabela`. */
export function contarUsoNoCodigo(raiz, nomes) {
  const uso = Object.fromEntries(nomes.map((n) => [n, { src: 0, edges: 0 }]));
  const src = carregarCorpus(raiz, ['src'], (p) => /\.(ts|tsx|js|jsx)$/.test(p) && !/(\.test\.|\.spec\.|__tests__|\/test\/)/.test(p));
  const edges = carregarCorpus(raiz, ['supabase/functions']);
  const reFrom = /(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_]+)['"`]/g;
  const reRest = /\/rest\/v1\/([A-Za-z0-9_]+)/g;
  for (const [chave, corpus] of [['src', src], ['edges', edges]]) {
    for (const arquivo of corpus) {
      for (const m of arquivo.texto.matchAll(reFrom)) if (!m[1] && uso[m[2]]) uso[m[2]][chave] += 1;
      for (const m of arquivo.texto.matchAll(reRest)) if (m[1] !== 'rpc' && uso[m[1]]) uso[m[1]][chave] += 1;
    }
  }
  return uso;
}

/**
 * A resposta e mesmo do banco oficial? Confere contra duas fontes independentes do arquivo de
 * entrada: as tabelas declaradas em `types.ts` (>=90% nos dois sentidos) e o ledger de migrations
 * (maior versao aplicada entre as 20 mais recentes do repo, ou a frente, e quantidade de registros
 * a ate 10% da de arquivos). Barra resposta colada de outro banco com schema parecido.
 */
export const LEDGER_TOLERANCIA = { versoesRecentes: 20, registrosPct: 10 };
export function conferirOrigem(dado, tabelasDeclaradas, versoesRepo = null) {
  const resposta = new Set(dado.tabelas.map((t) => t.nome));
  const declaradas = new Set(tabelasDeclaradas);
  const comuns = [...declaradas].filter((t) => resposta.has(t)).length;
  const cobreDeclaradas = declaradas.size ? comuns / declaradas.size : 0;
  const cobreResposta = resposta.size ? comuns / resposta.size : 0;
  if (cobreDeclaradas < 0.9 || cobreResposta < 0.9) {
    throw new Error(`a resposta nao parece ser do banco oficial: ${comuns} tabelas em comum com o types.ts `
      + `(${Math.round(cobreDeclaradas * 100)}% do types.ts, ${Math.round(cobreResposta * 100)}% da resposta). `
      + `Confira se a consulta rodou no projeto ${PROJETO_OFICIAL}.`);
  }
  const origem = { tabelas_em_comum_com_types: comuns, tabelas_no_types: declaradas.size };
  if (!versoesRepo?.length) return origem;
  const { ledger_versao_max: max, ledger_registros: registros } = dado.resumo ?? {};
  if (!max || !Number.isFinite(registros)) {
    throw new Error('a resposta nao traz resumo.ledger_versao_max/ledger_registros; rode o banco.sql atual.');
  }
  const recentes = [...versoesRepo].sort().reverse();
  const limite = recentes[Math.min(LEDGER_TOLERANCIA.versoesRecentes, recentes.length) - 1];
  const difPct = Math.abs(registros - versoesRepo.length) * 100 / versoesRepo.length;
  if (String(max) < limite || difPct > LEDGER_TOLERANCIA.registrosPct) {
    throw new Error(`a resposta nao parece ser do banco oficial: ledger com ${registros} registros e maior versao ${max}; `
      + `o repo tem ${versoesRepo.length} migrations e a ${LEDGER_TOLERANCIA.versoesRecentes}a mais recente e ${limite}.`);
  }
  return { ...origem, ledger_registros: registros, migrations_no_repo: versoesRepo.length };
}

/** Versoes (prefixo de 14 digitos) dos .sql de supabase/migrations/. */
export const versoesDoRepo = (raiz) => fs.readdirSync(path.join(raiz, 'supabase/migrations'))
  .filter((f) => NOME_MIGRATION.test(f)).map((f) => f.match(NOME_MIGRATION)[1]);

/** Edges publicadas (resposta de GET /functions) x repo. `publicadas: null` = nao consultado. */
export function compararEdges(publicadasApi, noRepo) {
  if (!publicadasApi) return { publicadas: null, no_repo: noRepo.length, publicadas_sem_codigo_no_repo: null, no_repo_sem_deploy: null };
  const publicadas = publicadasApi.map((f) => ({
    slug: f.slug,
    versao: f.version,
    status: f.status,
    verify_jwt: f.verify_jwt,
    atualizada_em: f.updated_at ? `${new Date(f.updated_at).toISOString().slice(0, 16)}Z` : null,
  })).sort((a, b) => a.slug.localeCompare(b.slug));
  const slugs = new Set(publicadas.map((f) => f.slug));
  return {
    publicadas,
    no_repo: noRepo.length,
    publicadas_sem_codigo_no_repo: [...slugs].filter((s) => !noRepo.includes(s)).sort(),
    no_repo_sem_deploy: noRepo.filter((s) => !slugs.has(s)),
  };
}

/** Ordena chaves recursivamente: o diff entre semanas fica so no que mudou. */
function ordenar(valor) {
  if (Array.isArray(valor)) return valor.map(ordenar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(Object.keys(valor).sort().map((k) => [k, ordenar(valor[k])]));
  }
  return valor;
}

/**
 * A agenda do pg_cron roda ao menos uma vez por dia? 'N seconds', ou dia do mes, mes e dia da
 * semana cobrindo tudo (`*`, `*\/1` ou a faixa inteira).
 */
const CAMPO_TODO = [/^(\*|\*\/1|1-31)$/, /^(\*|\*\/1|1-12)$/, /^(\*|\*\/1|0-6|0-7|1-7)$/];
export function rodaTodoDia(agenda) {
  const a = String(agenda ?? '').trim();
  if (/^\d+\s+seconds?$/i.test(a)) return true;
  const campos = a.split(/\s+/);
  return campos.length === 5 && CAMPO_TODO.every((re, i) => re.test(campos[i + 2]));
}

/** Junta banco + codigo + edges e calcula orfas e alertas. Funcao pura (testada em scripts/ci/). */
export function montarInventario(dado, uso, edges = compararEdges(null, []), tabelasDeclaradas = []) {
  const tabelas = dado.tabelas.map((t) => ({ ...t, uso_no_codigo: uso[t.nome] ?? { src: 0, edges: 0 } }));
  const orfas = tabelas
    .filter((t) => t.linhas === 0 && !t.citada_no_banco && t.uso_no_codigo.src + t.uso_no_codigo.edges === 0)
    .map((t) => t.nome);

  const alertas = [];
  const add = (tipo, detalhe) => { if (detalhe.length) alertas.push({ tipo, detalhe }); };
  add('tabela_sem_rls', tabelas.filter((t) => !t.rls).map((t) => t.nome));
  // RLS ligado sem nenhuma policy nega tudo para authenticated/anon (service_role passa por cima).
  // Pode ser de proposito, mas sem este alerta fica invisivel.
  add('rls_sem_policy', tabelas.filter((t) => t.rls && t.policies === 0).map((t) => t.nome));
  add('funcao_secdef_sem_search_path', (dado.funcoes ?? [])
    .filter((f) => f.security_definer && !f.tem_search_path).map((f) => f.nome));
  add('cron_falhando', dado.cron.jobs
    .filter((j) => j.ativo && j.taxa_falha_7d_pct >= LIMIARES.taxaFalhaCronPct)
    .map((j) => `${j.nome} (${j.taxa_falha_7d_pct}% em 7d)`));
  // Cron 100% parado nao grava linha em job_run_details: a taxa fica 0 e ele sai das horas paradas.
  add('cron_sem_execucao', dado.cron.jobs.filter((j) => j.ativo && j.execucoes_24h === 0 && rodaTodoDia(j.agenda)).map((j) => j.nome));
  add('cron_parado', (dado.cron.horas_paradas_7d ?? []).map((h) => h.hora));
  if (dado.cron.historico?.mais_de_7_dias > LIMIARES.historicoCronMaisDe7Dias) {
    alertas.push({ tipo: 'historico_cron_sem_limpeza', detalhe: [`${dado.cron.historico.mais_de_7_dias} linhas com mais de 7 dias`] });
  }
  add('edge_sem_deploy', edges.no_repo_sem_deploy ?? []);
  add('edge_publicada_sem_codigo', edges.publicadas_sem_codigo_no_repo ?? []);
  // types.ts e o que o front compila contra: tabela no banco e fora dele = front sem tipo; tabela
  // no types.ts e fora do banco = types.ts velho (ou tabela apagada a mao).
  if (tabelasDeclaradas.length) {
    const noBanco = new Set(tabelas.map((t) => t.nome));
    add('tabela_so_no_banco', tabelas.map((t) => t.nome).filter((n) => !tabelasDeclaradas.includes(n)));
    add('tabela_so_no_types', tabelasDeclaradas.filter((n) => !noBanco.has(n)));
  }

  return ordenar({
    ...dado,
    fonte: 'scripts/inventario/banco.sql + GET /functions + .from() em src/ e supabase/functions/ (scripts/inventario/gerar-banco.mjs)',
    tabelas,
    tabelas_orfas: {
      criterio: '0 linhas + nao citada em funcao/view do banco + nenhum .from() em src/ ou supabase/functions/',
      lista: orfas,
    },
    edge_functions: edges,
    alertas,
  });
}

function projeto() {
  const ref = (process.env.SUPABASE_PROJECT_REF || PROJETO_OFICIAL).trim();
  if (ref !== PROJETO_OFICIAL && process.env.INVENTARIO_PERMITIR_OUTRO_PROJETO !== '1') {
    throw new Error(`SUPABASE_PROJECT_REF=${ref} nao e o banco oficial (${PROJETO_OFICIAL}).`);
  }
  return ref;
}

/**
 * Quanto esperar antes de repetir, em ms, ou null quando nao adianta insistir (erro do pedido).
 * 429 respeita o Retry-After quando ele vem; 5xx e 429 sem cabecalho usam backoff exponencial.
 */
export function esperaDoRetry(status, retryAfter, tentativa) {
  const exponencial = Math.min(RETRY.baseMs * 2 ** (tentativa - 1), RETRY.maxMs);
  if (status === 429) {
    // get('retry-after') devolve null quando o cabecalho falta: tratar como ausente, nao como 0,
    // senao a repeticao vira metralhadora contra a API.
    const bruto = String(retryAfter ?? '').trim();
    const segundos = bruto === '' ? Number.NaN : Number(bruto);
    return Number.isFinite(segundos) && segundos >= 0 ? Math.min(segundos * 1000, RETRY.maxMs) : exponencial;
  }
  return status >= 500 && status <= 599 ? exponencial : null;
}

export async function chamarApi(caminho, init = {}) {
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  for (let tentativa = 1; ; tentativa += 1) {
    const res = await fetch(`${apiBase()}/${encodeURIComponent(projeto())}${caminho}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
      signal: AbortSignal.timeout(120_000),
    });
    if (res.ok) return res.json();
    const espera = tentativa < RETRY.tentativas ? esperaDoRetry(res.status, res.headers.get('retry-after'), tentativa) : null;
    // Nunca repassa o corpo do erro: pode ecoar cabecalho ou parte da consulta.
    if (espera === null) throw new Error(`Management API ${caminho} respondeu HTTP ${res.status}`);
    await new Promise((resolver) => setTimeout(resolver, espera));
  }
}

async function main(argv) {
  const iEntrada = argv.indexOf('--entrada');
  const iFunctions = argv.indexOf('--functions');
  const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
  let bruto;
  let publicadasApi = null;
  if (iEntrada !== -1) {
    const arquivo = argv[iEntrada + 1];
    if (!arquivo) throw new Error('--entrada exige o caminho do arquivo com a resposta do banco.sql');
    bruto = fs.readFileSync(arquivo, 'utf8');
    if (iFunctions !== -1) publicadasApi = JSON.parse(fs.readFileSync(argv[iFunctions + 1], 'utf8'));
  } else {
    if (!token) throw new Error('sem --entrada e sem SUPABASE_ACCESS_TOKEN: nada para ler (veja o cabecalho do script).');
    bruto = await chamarApi('/database/query/read-only', {
      method: 'POST',
      body: JSON.stringify({ query: fs.readFileSync(SQL_PATH, 'utf8') }),
    });
  }
  if (!publicadasApi && token) publicadasApi = await chamarApi('/functions');

  const dado = extrairInventario(bruto);
  const declaradas = nomesDeTabelas(lerTypes(undefined, RAIZ));
  conferirOrigem(dado, declaradas, versoesDoRepo(RAIZ));
  const uso = contarUsoNoCodigo(RAIZ, dado.tabelas.map((t) => t.nome));
  const inventario = montarInventario(dado, uso, compararEdges(publicadasApi, edgesNoRepo(RAIZ)), declaradas);
  const texto = `${JSON.stringify(inventario, null, 2)}\n`;
  if (PARECE_CREDENCIAL.test(texto)) {
    throw new Error('a saida tem algo com cara de credencial; nada foi gravado. Revise banco.sql.');
  }
  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, texto);
  const ed = inventario.edge_functions;
  console.log(`banco.json: ${inventario.tabelas.length} tabelas, ${inventario.cron.jobs.length} cron jobs, `
    + `${inventario.tabelas_orfas.lista.length} orfas, ${inventario.alertas.length} alertas, `
    + `edges ${ed.publicadas ? `${ed.publicadas.length} publicadas/${ed.no_repo} no repo` : `${ed.no_repo} no repo (publicadas nao consultadas)`} `
    + `(medido_em ${inventario.medido_em}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`ERRO: ${error.message}`);
    process.exit(2);
  });
}
