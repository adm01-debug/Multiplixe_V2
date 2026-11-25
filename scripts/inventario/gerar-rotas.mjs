#!/usr/bin/env node
/**
 * Inventario das rotas do front -> inventario/estado/rotas.json (fonte de consulta dos agentes).
 *
 * Le o CODIGO, nao documentacao:
 *  - Rotas:    src/App.tsx (<Route path>, componente lazy, ProtectedRoute/requireAdmin, routeName)
 *  - Entradas na UI: src/components/CommandPalette.tsx (PAGES), src/components/navigation/
 *    MobileBottomNav.tsx (itens), src/hooks/useGlobalShortcuts.ts (atalho -> rota) e
 *    src/lib/routePrefetch.ts (mapa de prefetch)
 *  - Para cada rota: segue os imports a partir do arquivo da pagina (a propria pasta, src/hooks,
 *    src/lib, src/integrations sem limite; src/components fora de ui/ ate MAX_SALTOS saltos) e
 *    lista hooks, tabelas (.from e /rest/v1), RPCs, buckets (storage.from) e edge functions
 *    (functions.invoke e /functions/v1/<edge>).
 *  - `problemas`: rota sem arquivo, rota protegida sem nenhuma entrada na UI, entrada de UI
 *    apontando para rota que nao existe, atalho/prefetch orfao e import local que nao resolve.
 *
 * Uso:
 *   node scripts/inventario/gerar-rotas.mjs           grava inventario/estado/rotas.json
 *   node scripts/inventario/gerar-rotas.mjs --check   exit 1 se o arquivo commitado esta desatualizado
 * Saida deterministica (sem data): o mesmo codigo gera o mesmo arquivo. Por isso da para usar
 * `--check` como guarda: se alguem mexeu em rota sem regerar, o comando acusa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { carregarCorpus } from './gerar-repo.mjs';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/rotas.json';
const EXTENSOES = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts'];
/** Wrappers de rota: nao sao a pagina, so embrulham. */
const WRAPPERS = ['ProtectedRoute', 'Navigate', 'Route', 'Routes', 'Suspense', 'ErrorBoundary', 'RouteErrorBoundary', 'PageTransition'];
/** Pastas que o fecho de imports percorre sem gastar salto (codigo da propria tela e infra). */
const LIVRES = ['src/hooks', 'src/lib', 'src/integrations'];
export const MAX_SALTOS = 2;

const ler = (raiz, rel) => fs.readFileSync(path.join(raiz, rel), 'utf8');
const existe = (raiz, rel) => fs.existsSync(path.join(raiz, rel));
const rel = (raiz, abs) => path.relative(raiz, abs).split(path.sep).join('/');
const unico = (lista) => [...new Set(lista)].sort();

/** Resolve um especificador de import para um arquivo do repo (null = externo; undefined = local que nao existe). */
export function resolverImport(raiz, deArquivoAbs, especificador) {
  let base;
  if (especificador.startsWith('@/')) base = path.join(raiz, 'src', especificador.slice(2));
  else if (especificador.startsWith('.')) base = path.resolve(path.dirname(deArquivoAbs), especificador);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTENSOES) if (fs.existsSync(base + ext)) return base + ext;
  return undefined;
}

/** Imports de um arquivo: [{ especificador, nomes[] }] (estaticos, `export ... from` e import() dinamico). */
export function extrairImports(texto) {
  const out = [];
  for (const m of texto.matchAll(/import\s+(type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    if (m[1]) continue; // import type: nao existe em runtime, nao conta como dependencia
    const nomes = [...m[2].matchAll(/\b([A-Za-z_$][\w$]*)\b(?!\s*as\b)/g)].map((x) => x[1])
      .filter((n) => !['type', 'as', 'default'].includes(n));
    out.push({ especificador: m[3], nomes });
  }
  for (const m of texto.matchAll(/(?:import|export)\s*(?:\*\s*from\s*)?['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) out.push({ especificador: m[1], nomes: [] });
  for (const m of texto.matchAll(/export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g)) out.push({ especificador: m[1], nomes: [] });
  return out;
}

/**
 * Mapa nome -> valor dos `const NOME = 'literal'` de nivel de modulo. Serve para resolver
 * `.from(TABELA)` / `storage.from(BUCKET)` quando o nome vem de uma constante do mesmo arquivo.
 * Conta profundidade de chaves linha a linha: `const` dentro de funcao nao entra (um arquivo sem
 * Prettier pode ter `const` em coluna zero dentro de bloco). Na duvida, prefere nao resolver.
 */
function constantesDeString(texto) {
  const mapa = new Map();
  let profundidade = 0;
  for (const linha of texto.split('\n')) {
    if (profundidade === 0) {
      const m = linha.match(/^(?:export\s+)?const\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?::\s*[^=]+)?=\s*['"`]([A-Za-z0-9_.-]+)['"`]\s*[;,]?\s*$/);
      if (m) mapa.set(m[1], m[2]);
    }
    for (const ch of linha) {
      if (ch === '{') profundidade++;
      else if (ch === '}') profundidade--;
    }
  }
  return mapa;
}

/**
 * Chamadas ao Supabase num texto: tabelas (`.from('x')` e `/rest/v1/x`), buckets
 * (`storage.from('x')`), RPCs (`.rpc('x')`) e edges (`functions.invoke('x')`, `/functions/v1/x`).
 * Limite conhecido e aceito: `.from(variavel)` so resolve quando a variavel e constante de
 * string no mesmo arquivo.
 */
export function extrairChamadas(texto) {
  const pegar = (re) => [...texto.matchAll(re)].map((m) => m[1]);
  const consts = constantesDeString(texto);
  const tabelas = [];
  const buckets = [];
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g)) (m[1] ? buckets : tabelas).push(m[2]);
  for (const m of texto.matchAll(/(\bstorage\s*)?\.from\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)/g)) {
    if (consts.has(m[2])) (m[1] ? buckets : tabelas).push(consts.get(m[2]));
  }
  tabelas.push(...pegar(/\/rest\/v1\/([A-Za-z0-9_]+)/g).filter((t) => t !== 'rpc'));
  return {
    tabelas,
    buckets,
    rpcs: [...pegar(/(?:\.|\b)rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g), ...pegar(/\/rest\/v1\/rpc\/([A-Za-z0-9_]+)/g)],
    edges: [
      ...pegar(/functions\s*\.\s*invoke(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)(?:\/[^'"`]*)?['"`]/g),
      ...pegar(/['"`][^'"`\n]*\/functions\/v1\/([A-Za-z0-9_-]+)/g),
    ],
  };
}

const ehTeste = (p) => /(\.test\.|\.spec\.|__tests__|\.stories\.|\/test\/)/.test(p);

/**
 * Fecho de imports a partir do arquivo da pagina. Sem limite na propria pasta e em
 * src/hooks|lib|integrations; componentes fora de src/components/ui/ entram ate MAX_SALTOS saltos
 * (o kit de UI do shadcn nao chama banco, so gastaria tempo). Teste fica de fora.
 */
export function fechoDaRota(raiz, arquivoPaginaAbs) {
  const pastaPagina = path.dirname(arquivoPaginaAbs);
  const dentro = (abs, r) => abs.startsWith(path.join(raiz, r) + path.sep);
  const livre = (abs) => abs.startsWith(pastaPagina + path.sep) || LIVRES.some((d) => dentro(abs, d));
  const componente = (abs) => dentro(abs, 'src/components') && !dentro(abs, 'src/components/ui');
  const saltosVistos = new Map();
  const hooks = new Map();
  const quebrados = new Set();
  const chamadas = { tabelas: [], buckets: [], rpcs: [], edges: [] };
  const fila = [[arquivoPaginaAbs, 0]];
  while (fila.length) {
    const [atual, saltos] = fila.shift();
    if (saltosVistos.has(atual) && saltosVistos.get(atual) <= saltos) continue;
    const primeiraVez = !saltosVistos.has(atual);
    saltosVistos.set(atual, saltos);
    const texto = fs.readFileSync(atual, 'utf8');
    if (primeiraVez) {
      const c = extrairChamadas(texto);
      for (const k of Object.keys(chamadas)) chamadas[k].push(...c[k]);
    }
    for (const imp of extrairImports(texto)) {
      const alvo = resolverImport(raiz, atual, imp.especificador);
      if (alvo === undefined && !/\.(css|scss|svg|png|jpe?g|webp|gif|json)(\?.*)?$|\?/.test(imp.especificador)) {
        quebrados.add(`${rel(raiz, atual)} -> ${imp.especificador}`);
      }
      if (!alvo || ehTeste(alvo)) continue;
      for (const nome of imp.nomes) if (/^use[A-Z]/.test(nome) && !hooks.has(nome)) hooks.set(nome, rel(raiz, alvo));
      if (livre(alvo)) fila.push([alvo, saltos]);
      else if (componente(alvo) && saltos < MAX_SALTOS) fila.push([alvo, saltos + 1]);
    }
  }
  return {
    arquivos_lidos: saltosVistos.size,
    hooks: [...hooks.entries()].map(([nome, arquivo]) => ({ nome, arquivo })).sort((a, b) => a.nome.localeCompare(b.nome)),
    buckets: unico(chamadas.buckets),
    edges: unico(chamadas.edges),
    rpcs: unico(chamadas.rpcs),
    tabelas: unico(chamadas.tabelas),
    imports_quebrados: [...quebrados].sort(),
  };
}

/** Rotas do react-router em src/App.tsx. */
export function lerRotas(raiz) {
  const arquivo = 'src/App.tsx';
  const texto = ler(raiz, arquivo);
  const abs = path.join(raiz, arquivo);
  const lazy = Object.fromEntries([...texto.matchAll(/const\s+(\w+)\s*=\s*(?:React\.)?lazy\w*\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)/g)]
    .map((m) => [m[1], m[2]]));
  const corpo = texto.slice(texto.indexOf('<Routes>'), texto.indexOf('</Routes>'));
  return corpo.split(/<Route\b/).slice(1).map((pedaco) => {
    const caminho = (pedaco.match(/path=["']([^"']+)["']/) || [])[1];
    const redireciona = (pedaco.match(/<Navigate\s+to=["']([^"']+)["']/) || [])[1] ?? null;
    const componente = [...pedaco.matchAll(/<([A-Z]\w*)/g)].map((m) => m[1]).find((n) => !WRAPPERS.includes(n)) ?? null;
    const alvo = componente && lazy[componente] ? resolverImport(raiz, abs, lazy[componente]) : null;
    return {
      caminho,
      rotulo_tecnico: (pedaco.match(/routeName=["']([^"']+)["']/) || [])[1] ?? null,
      componente,
      arquivo: alvo ? rel(raiz, alvo) : null,
      protegida: pedaco.includes('<ProtectedRoute'),
      so_admin: /<ProtectedRoute[^>]*requireAdmin/.test(pedaco),
      com_parametro: Boolean(caminho && caminho.includes(':')),
      redireciona,
    };
  }).filter((r) => r.caminho).sort((a, b) => a.caminho.localeCompare(b.caminho));
}

/**
 * Entradas na UI que levam a uma rota. Uma rota protegida sem nenhuma entrada aqui existe no
 * codigo mas o usuario nao tem como chegar nela clicando (so digitando a URL) — e o que a regra
 * "funcionalidade pronta = com entrada na UI" do AGENTS.md cobra.
 */
export function lerEntradasUi(raiz) {
  const entradas = [];
  const push = (origem, destino, rotulo) => { if (destino) entradas.push({ origem, destino, rotulo: rotulo ?? null }); };

  const paleta = 'src/components/CommandPalette.tsx';
  if (existe(raiz, paleta)) {
    for (const m of ler(raiz, paleta).matchAll(/\{\s*id:\s*["']([^"']+)["'],\s*title:\s*["']([^"']+)["'],\s*url:\s*["']([^"']+)["']/g)) {
      push('command-palette', m[3], m[2]);
    }
  }
  const nav = 'src/components/navigation/MobileBottomNav.tsx';
  if (existe(raiz, nav)) {
    for (const m of ler(raiz, nav).matchAll(/\{\s*path:\s*['"]([^'"]+)['"],\s*label:\s*([^,]+),/g)) {
      push('menu-mobile', m[1], m[2].trim());
    }
  }
  const atalhos = 'src/hooks/useGlobalShortcuts.ts';
  if (existe(raiz, atalhos)) {
    for (const m of ler(raiz, atalhos).matchAll(/^\s*(\w+):\s*["'](\/[^"']*)["']/gm)) push('atalho-teclado', m[2], m[1]);
  }
  const prefetch = 'src/lib/routePrefetch.ts';
  if (existe(raiz, prefetch)) {
    for (const m of ler(raiz, prefetch).matchAll(/^\s*['"](\/[^'"]*)['"]:\s*\(\)\s*=>\s*import/gm)) push('prefetch', m[1], null);
  }
  // Botao/link no meio de uma pagina: `navigate('/x')`, `<Link to="/x">`, `href="/x"`. Sem isto o
  // guard acusaria como "sem entrada na UI" uma rota que tem botao (ex.: /onboarding/executar, que
  // sai de src/pages/SalesOnboarding.tsx).
  for (const arquivo of carregarCorpus(raiz, ['src'], (p) => /\.(tsx|ts)$/.test(p) && !/(\.test\.|\.spec\.|__tests__|\/test\/)/.test(p))) {
    for (const m of arquivo.texto.matchAll(/(?:navigate\(\s*|(?:\bto|\bhref)=\{?\s*)['"](\/[A-Za-z0-9/_-]*)['"]/g)) {
      push('navegacao-no-codigo', m[1], arquivo.rel);
    }
  }
  return unico(entradas.map((e) => JSON.stringify([e.origem, e.destino, e.rotulo])))
    .map((s) => { const [origem, destino, rotulo] = JSON.parse(s); return { origem, destino, rotulo }; });
}

/** Monta o inventario inteiro a partir de uma raiz de repo. */
export function gerarRotas(raiz = RAIZ_PADRAO) {
  const rotasBase = lerRotas(raiz);
  const entradas = lerEntradasUi(raiz);
  const caminhos = new Set(rotasBase.map((r) => r.caminho));
  /** `/curso/:slug` cobre `/curso`: o prefetch e os atalhos usam a raiz da rota com parametro. */
  const cobre = (destino) => caminhos.has(destino)
    || rotasBase.some((r) => r.com_parametro && r.caminho.startsWith(`${destino}/`));

  const rotas = rotasBase.map((r) => ({
    ...r,
    entradas_na_ui: unico(entradas.filter((e) => e.destino === r.caminho).map((e) => e.origem)),
    ...(r.arquivo
      ? fechoDaRota(raiz, path.join(raiz, r.arquivo))
      : { arquivos_lidos: 0, hooks: [], buckets: [], edges: [], rpcs: [], tabelas: [], imports_quebrados: [] }),
  }));

  const hooks = {};
  for (const r of rotas) for (const h of r.hooks) {
    hooks[h.nome] ??= { arquivo: h.arquivo, rotas: [] };
    hooks[h.nome].rotas.push(r.caminho);
  }

  const problemas = [
    ...rotas.filter((r) => r.componente && !r.arquivo && !r.redireciona)
      .map((r) => ({ tipo: 'rota_sem_arquivo', id: r.caminho, detalhe: `${r.componente} nao resolve em src/App.tsx` })),
    ...rotas.filter((r) => r.protegida && !r.com_parametro && r.entradas_na_ui.length === 0)
      .map((r) => ({ tipo: 'rota_sem_entrada_na_ui', id: r.caminho, detalhe: 'nenhum item de menu, atalho ou paleta leva a esta rota: so por URL digitada' })),
    ...unico(entradas.filter((e) => !cobre(e.destino)).map((e) => `${e.origem} -> ${e.destino}`))
      .map((par) => {
        const [origem, destino] = par.split(' -> ');
        return {
          tipo: 'entrada_ui_sem_rota',
          id: destino,
          detalhe: origem === 'prefetch'
            ? `${par}: chave de prefetch que nenhuma rota alcanca (prefetchRouteChunk casa o caminho inteiro ou o 1o segmento) — nunca aquece nada`
            : `${par}: nenhuma rota casa, o usuario cai no NotFound`,
        };
      }),
    ...rotas.flatMap((r) => r.imports_quebrados.map((q) => ({ tipo: 'import_quebrado', id: r.caminho, detalhe: q }))),
  ];

  return {
    format_version: 1,
    fonte: 'scripts/inventario/gerar-rotas.mjs (le src/App.tsx, CommandPalette, MobileBottomNav, useGlobalShortcuts, routePrefetch e os imports de cada pagina)',
    resumo: {
      rotas: rotas.length,
      protegidas: rotas.filter((r) => r.protegida).length,
      so_admin: rotas.filter((r) => r.so_admin).length,
      entradas_na_ui: entradas.length,
      hooks_distintos: Object.keys(hooks).length,
      problemas: problemas.length,
    },
    rotas,
    entradas_na_ui: entradas,
    hooks: Object.fromEntries(Object.keys(hooks).sort().map((k) => [k, { arquivo: hooks[k].arquivo, rotas: unico(hooks[k].rotas) }])),
    problemas,
  };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarRotas(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-rotas.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const r = JSON.parse(conteudo).resumo;
  console.log(`rotas.json: ${r.rotas} rotas (${r.protegidas} protegidas, ${r.so_admin} so admin), `
    + `${r.entradas_na_ui} entradas na UI, ${r.hooks_distintos} hooks, ${r.problemas} problemas.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
