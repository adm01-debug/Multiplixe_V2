#!/usr/bin/env node
/**
 * Garante que as instrucoes para agentes nao foram apagadas ou esvaziadas por outra sessao
 * (o Lovable commita direto na main e varias sessoes de agente escrevem no mesmo repo).
 * Alvo: AGENTS.md (regras) + docs/agentes/**\/*.md (referencia, recursivo) + CLAUDE.md (so `@AGENTS.md`).
 * Verifica, nessa ordem: AGENTS.md existe; CLAUDE.md existe e e exatamente `@AGENTS.md`; cabecalhos
 * obrigatorios presentes como heading real (linha inteira, nao substring dentro de bloco de codigo,
 * comentario ou de um heading maior como "### Postura antiga"); o conjunto AGENTS.md + CLAUDE.md +
 * docs/agentes/**\/*.md nao encolheu >30% em bytes vs a base; e cada arquivo vigiado (AGENTS.md e cada
 * docs/agentes/**\/*.md que exista na base) continua existindo com >=50% do tamanho que tem na base
 * (o limiar do conjunto sozinho nao pega o esvaziamento de 1 arquivo).
 * Base: CLAUDE_MD_BASE (ex.: CLAUDE_MD_BASE=origin/main). Sem a variavel, compara com o HEAD. Se a base
 * nao puder ser resolvida (ref invalida, sem git, fora de um repo), a comparacao de bytes e PULADA e o
 * script avisa isso bem alto (nao falha silenciosamente) — so os cabecalhos e o CLAUDE.md sao checados.
 * Nao ha CI neste repo: rode a mao antes do PR
 *   node scripts/ci/check-claude-md-integrity.mjs
 *
 * Limitacoes conhecidas (aceitas, ver scripts/ci/README.md): o limite de bytes mede volume, nao
 * substancia — enchimento (lorem ipsum) dentro das secoes obrigatorias passa; e um rename legitimo de
 * um docs/agentes/*.md (conteudo preservado sob outro nome) dispara falso positivo de "sumiu".
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const AGENTS = 'AGENTS.md';
const CLAUDE = 'CLAUDE.md';
const CLAUDE_CONTEUDO_ESPERADO = '@AGENTS.md';
const DOCS_DIR = 'docs/agentes';
const CONJUNTO_RAIZ = [AGENTS, CLAUDE];
const REQUIRED_SECTIONS = [
  '## Postura',
  '## Bugs e funcionalidades',
  '## Comunicação',
  '## Fluxo Git',
  '## Banco',
  '## Serviços',
  '## Stack e comandos',
  '## Grafo de código',
];
const SHRINK_THRESHOLD = 0.30;
const FILE_SHRINK_THRESHOLD = 0.50;

function falhar(mensagem) {
  console.error(`::error::${mensagem}`);
  process.exitCode = 1;
  process.exit();
}

let content;
try {
  content = readFileSync(AGENTS, 'utf8');
} catch {
  falhar(`${AGENTS} nao encontrado. Outra sessao pode ter apagado o arquivo.`);
}

// CLAUDE.md e o arquivo que o Claude Code le no boot para resolver o import `@AGENTS.md` — vazio,
// apagado ou apontando para outro arquivo nao e pego pelo limite de bytes (fica fora dele por design,
// ja que tem so 11 bytes), entao o conteudo e checado explicitamente aqui.
let claudeMd;
try {
  claudeMd = readFileSync(CLAUDE, 'utf8');
} catch {
  falhar(`${CLAUDE} nao encontrado. Outra sessao pode ter apagado o arquivo.`);
}
if (claudeMd.trim() !== CLAUDE_CONTEUDO_ESPERADO) {
  falhar(`${CLAUDE} deveria ser exatamente "${CLAUDE_CONTEUDO_ESPERADO}" e esta "${claudeMd.trim().slice(0, 80)}".`);
}

// Remove bloco de codigo (``` ... ```) e comentario HTML (<!-- ... -->) antes de procurar heading,
// senao "## Postura" colado dentro de um desses dois nao vira heading real so por estar no inicio
// de uma linha.
function textoSemBlocosNaoProsa(texto) {
  return texto.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
}

// Heading real = linha comecando com a secao (podendo ter sufixo, ex.: "## Banco — ler..."), fora de
// bloco de codigo/comentario HTML, e nao prefixo de um heading maior (ex.: "### Postura antiga" nao
// conta como "## Postura", mas "## Banco — ler ..." conta).
function temHeadingReal(texto, secao) {
  const literal = secao.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${literal}(?:\\s|$)`, 'm').test(textoSemBlocosNaoProsa(texto));
}

const missing = REQUIRED_SECTIONS.filter((s) => !temHeadingReal(content, s));
if (missing.length > 0) {
  for (const s of missing) console.error(`::error::${AGENTS}: secao obrigatoria ausente: ${s}`);
  process.exitCode = 1;
  process.exit();
}

// Recursivo: precisa bater com `git ls-tree -r` usado em bytesNaBase, senao um arquivo movido para
// uma subpasta de docs/agentes/ some da contagem "atual" sem sumir da contagem da base.
function arquivosMd(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(dir, f));
}

function bytesAtuais() {
  let total = 0;
  for (const f of CONJUNTO_RAIZ) {
    if (existsSync(f)) total += Buffer.byteLength(readFileSync(f, 'utf8'));
  }
  for (const f of arquivosMd(DOCS_DIR)) total += Buffer.byteLength(readFileSync(f, 'utf8'));
  return total;
}

// Tamanho na base de cada arquivo do conjunto: { total, porArquivo: Map(path -> bytes) } ou null
// quando a base nao tem nenhum deles (ref inexistente, checkout raso sem a main, sem git, fora de repo).
function bytesNaBase(base) {
  const porArquivo = new Map();
  const tamanho = (path) => {
    try {
      const out = execSync(`git cat-file -s ${base}:${path}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      porArquivo.set(path, Number.parseInt(out.trim(), 10) || 0);
    } catch {
      /* nao existe na base */
    }
  };
  for (const f of CONJUNTO_RAIZ) tamanho(f);
  let lista = '';
  try {
    lista = execSync(`git ls-tree -r --name-only ${base} -- ${DOCS_DIR}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    lista = '';
  }
  for (const path of lista.split('\n').map((l) => l.trim()).filter((l) => l.endsWith('.md'))) tamanho(path);
  if (porArquivo.size === 0) return null;
  let total = 0;
  for (const n of porArquivo.values()) total += n;
  return { total, porArquivo };
}

const BASE_EXPLICITA = process.env.CLAUDE_MD_BASE;
const BASE = BASE_EXPLICITA || 'HEAD';
const atual = bytesAtuais();
const base = bytesNaBase(BASE);

if (!base) {
  // Nao pode virar exit 1 (nao ha o que comparar), mas tambem nao pode ficar muda: sem isto, uma
  // referencia invalida ou um git ausente faz o guard "passar" sem checar encolhimento nenhum.
  console.error(`::warning::Base "${BASE}" nao resolvida (ref inexistente, sem git ou fora de um repositorio) — comparacao de bytes PULADA; so os cabecalhos e o CLAUDE.md foram checados.`);
}

if (base) {
  const ratio = atual / base.total;
  if (ratio < (1 - SHRINK_THRESHOLD)) {
    console.error(`::error::Instrucoes para agentes (AGENTS.md + CLAUDE.md + ${DOCS_DIR}/**/*.md) encolheram ${Math.round((1 - ratio) * 100)}% vs ${BASE} (atual: ${atual} bytes, base: ${base.total} bytes). Possivel wipe por sessao paralela.`);
    process.exitCode = 1;
    process.exit();
  }
  // Por arquivo: AGENTS.md e cada docs/agentes/**/*.md que exista na base precisa continuar existindo
  // com >= 50% do tamanho de la. CLAUDE.md fica de fora: e checado por conteudo exato acima.
  let falhas = 0;
  for (const [path, naBase] of base.porArquivo) {
    if (path === CLAUDE || naBase === 0) continue;
    if (!existsSync(path)) {
      console.error(`::error::${path} existia em ${BASE} (${naBase} bytes) e sumiu. Possivel wipe por sessao paralela (ou rename sem o conteudo preservado sob o nome antigo — se foi rename legitimo, explique na PR).`);
      falhas += 1;
      continue;
    }
    const agora = Buffer.byteLength(readFileSync(path, 'utf8'));
    if (agora < naBase * FILE_SHRINK_THRESHOLD) {
      console.error(`::error::${path} encolheu ${Math.round((1 - agora / naBase) * 100)}% vs ${BASE} (atual: ${agora} bytes, base: ${naBase} bytes); limite por arquivo e ${Math.round(FILE_SHRINK_THRESHOLD * 100)}%.`);
      falhas += 1;
    }
  }
  if (falhas > 0) {
    process.exitCode = 1;
    process.exit();
  }
}

console.log(`${AGENTS} + ${CLAUDE} OK: ${REQUIRED_SECTIONS.length} secoes presentes; conjunto com ${DOCS_DIR}/**: ${atual} bytes${base ? ` (base ${BASE}: ${base.total} bytes em ${base.porArquivo.size} arquivos, cada um >= ${Math.round(FILE_SHRINK_THRESHOLD * 100)}% do tamanho na base)` : ''}.`);
