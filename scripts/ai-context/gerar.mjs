#!/usr/bin/env node
/**
 * Contexto para agentes de IA: le o repositorio inteiro e grava em `inventario/ia/` o mapa do que
 * existe hoje, para a proxima sessao nao gastar token redescobrindo o projeto arquivo por arquivo.
 *
 * Saida (determinista: o mesmo codigo gera os mesmos bytes; so manifest.json tem data):
 *   INDEX.md          o documento que o agente le PRIMEIRO
 *   componentes.json  componente -> exports, linhas, hooks, tabelas, quem usa, orfao
 *   hooks.json        hook -> arquivo, o que toca (tabelas/rpcs/edges), quem usa, tem teste
 *   grafo.json        grafo de imports: hubs, ciclos, orfaos, arestas
 *   baseline.json     numeros do repo, qualidade (any/console.log/@ts-ignore/TODO), git, alertas
 *   manifest.json     sha256 de cada arquivo acima + commit + gerado_em
 *
 * Nao repete o que ja e gerado por script proprio: rotas (`inventario/estado/rotas.json`), edge
 * functions (`edges.json`) e schema (`schema-declarado.json`) sao LIDOS daqui e resumidos no
 * INDEX.md. Rode os tres antes para o INDEX sair completo.
 *
 * Uso: node scripts/ai-context/gerar.mjs [--out inventario/ia] [--root .] [--quiet]
 * Exit 0 sempre que conseguir gravar: falha de secao vira `erros` no manifest, nunca arquivo pela
 * metade sem aviso.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const FORMAT_VERSION = 1;
const AVISO = 'GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — nao editar a mao; sera sobrescrito.';
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', 'public', '.git', '.lovable', 'inventario']);
const EXT_CODIGO = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const EXT_RESOLVE = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.d.ts', '.json', '/index.ts', '/index.tsx', '/index.js'];
const EH_TESTE = /(\.test\.|\.spec\.|__tests__|\/test\/)/;

const args = process.argv.slice(2);
const flag = (nome, padrao) => { const i = args.indexOf(nome); return i === -1 ? padrao : args[i + 1]; };
const RAIZ = path.resolve(flag('--root', path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')));
const SAIDA_REL = flag('--out', 'inventario/ia');
const SAIDA = path.resolve(RAIZ, SAIDA_REL);
const QUIETO = args.includes('--quiet');

const ERROS = [];
/** Secao isolada: excecao nao derruba a execucao, vira `erros` no manifest. */
const secao = (nome, fn, fallback) => {
  try { return fn(); } catch (e) {
    ERROS.push({ secao: nome, erro: String(e?.stack || e).split('\n').slice(0, 3).join(' | ') });
    return fallback;
  }
};
const uniq = (a) => [...new Set(a)].sort();
const ordObj = (o) => Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]]));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
const relp = (abs) => path.relative(RAIZ, abs).split(path.sep).join('/');
const git = (...a) => {
  try { return execFileSync('git', a, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 32 * 1024 * 1024 }).trim(); } catch { return ''; }
};
const lerJson = (rel) => { try { return JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8')); } catch { return null; } };
const semComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\'"`])\/\/[^\n]*/g, '$1');

// ---------------------------------------------------------------- varredura
const TODOS = [];
(function walk(dir) {
  let entradas = [];
  try { entradas = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entradas.sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name.startsWith('.') && e.name !== '.github') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (SKIP_DIRS.has(e.name) || full === SAIDA) continue; walk(full); }
    else if (e.isFile()) TODOS.push(relp(full));
  }
})(RAIZ);
TODOS.sort();
const CONJUNTO = new Set(TODOS);

/** Resolve import `@/x` ou relativo para um arquivo do repo (null = externo/nao existe). */
function resolver(deArquivo, spec) {
  if (!spec || spec.startsWith('node:') || /^https?:/.test(spec)) return null;
  let base;
  if (spec.startsWith('@/')) base = `src/${spec.slice(2)}`;
  else if (spec.startsWith('.')) base = path.posix.normalize(path.posix.join(path.posix.dirname(deArquivo), spec));
  else return null;
  const limpo = base.replace(/\.js$/, '');
  for (const cand of [base, limpo, ...EXT_RESOLVE.map((x) => limpo + x)]) if (CONJUNTO.has(cand)) return cand;
  return null;
}

// -------------------------------------------------- analise arquivo a arquivo
const RE = {
  imp: /import\s+(?:type\s+)?[\s\S]*?from\s*['"]([^'"]+)['"]/g,
  impBare: /(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g,
  dyn: /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  reexp: /export\s+(?:\{[^}]*\}|\*)\s+from\s+['"]([^'"]+)['"]/g,
  usoHook: /\b(use[A-Z]\w*)\s*\(/g,
  defHook: /export\s+(?:default\s+)?(?:async\s+)?(?:function|const)\s+(use[A-Z]\w*)/g,
  expNome: /export\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Za-z_$][\w$]*)/g,
  expLista: /export\s*\{([^}]*)\}/g,
  from: /(?<!storage)\.from\(\s*['"`]([A-Za-z0-9_]+)['"`]/g,
  bucket: /storage\s*\.from\(\s*['"`]([A-Za-z0-9_-]+)['"`]/g,
  rpc: /\.rpc\(\s*['"`]([A-Za-z0-9_]+)['"`]/g,
  invoke: /functions\s*\.\s*invoke(?:<[^>()]*>)?\(\s*['"`]([A-Za-z0-9_-]+)/g,
  envVite: /import\.meta\.env\.([A-Z0-9_]+)/g,
  envDeno: /Deno\.env\.get\(\s*['"]([A-Z0-9_]+)['"]/g,
  todo: /\b(TODO|FIXME|HACK|XXX)\b/g,
};

const ARQ = new Map();
for (const f of TODOS) {
  if (!EXT_CODIGO.has(path.extname(f))) continue;
  if (f.endsWith('.d.ts')) continue;
  secao(`arquivo:${f}`, () => {
    const cru = fs.readFileSync(path.join(RAIZ, f), 'utf8');
    const texto = semComentarios(cru);
    const pegar = (re) => uniq([...texto.matchAll(re)].map((m) => m[1]));
    const resolverTodos = (lista) => uniq(lista.map((x) => resolver(f, x)).filter(Boolean));
    const estaticos = resolverTodos([
      ...[...texto.matchAll(RE.imp)].map((m) => m[1]),
      ...[...texto.matchAll(RE.impBare)].map((m) => m[1]),
      ...[...texto.matchAll(RE.reexp)].map((m) => m[1]),
    ]);
    // `import()` entra em `imports` (quem e carregado por lazy() nao e orfao) mas NAO conta para
    // ciclo: a aresta e resolvida em tempo de execucao, so quando a rota abre. Sem essa separacao,
    // routePrefetch.ts <-> paginas apareceria como ciclo de 16 arquivos que nao quebra nada.
    const dinamicos = resolverTodos([...texto.matchAll(RE.dyn)].map((m) => m[1])).filter((x) => !estaticos.includes(x));
    const imports = uniq([...estaticos, ...dinamicos]);
    const exports = uniq([
      ...[...texto.matchAll(RE.expNome)].map((m) => m[1]),
      ...[...texto.matchAll(RE.expLista)].flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean)),
    ]);
    ARQ.set(f, {
      linhas: cru.split('\n').length,
      bytes: Buffer.byteLength(cru),
      imports,
      imports_estaticos: estaticos,
      imports_dinamicos: dinamicos,
      exports,
      hooks_usados: pegar(RE.usoHook),
      hooks_definidos: pegar(RE.defHook),
      tabelas: pegar(RE.from),
      buckets: pegar(RE.bucket),
      rpcs: pegar(RE.rpc),
      edges: pegar(RE.invoke),
      env: uniq([...pegar(RE.envVite), ...pegar(RE.envDeno)]),
      teste: EH_TESTE.test(f),
      componente: /\.tsx$/.test(f) && /return\s*\(?\s*</.test(texto),
      todos: [...cru.split('\n').entries()].filter(([, l]) => RE.todo.test(l)).map(([i, l]) => ({ linha: i + 1, texto: l.trim().slice(0, 140) })),
      qualidade: {
        any: (texto.match(/:\s*any\b/g) || []).length,
        console_log: (texto.match(/console\.log\s*\(/g) || []).length,
        ts_ignore: (texto.match(/@ts-(ignore|expect-error|nocheck)/g) || []).length,
        eslint_disable: (texto.match(/eslint-disable/g) || []).length,
      },
    });
  }, undefined);
}

/** Grafo reverso: arquivo -> quem o importa (sem contar teste). */
const USADO_POR = new Map();
for (const [f, d] of ARQ) for (const i of d.imports) {
  if (!USADO_POR.has(i)) USADO_POR.set(i, new Set());
  if (!d.teste) USADO_POR.get(i).add(f);
}
const usadoPor = (f) => [...(USADO_POR.get(f) ?? [])].sort();

// -------------------------------------------------------------------- secoes
const componentes = secao('componentes', () => {
  const nomes = new Map();
  const lista = [];
  for (const [f, d] of ARQ) {
    if (!d.componente || d.teste) continue;
    const pascal = d.exports.filter((n) => /^[A-Z]/.test(n));
    for (const n of pascal) { if (!nomes.has(n)) nomes.set(n, []); nomes.get(n).push(f); }
    lista.push({
      arquivo: f,
      exports: pascal,
      linhas: d.linhas,
      hooks: d.hooks_usados,
      tabelas: d.tabelas,
      edges: d.edges,
      usado_por: usadoPor(f).length,
      orfao: usadoPor(f).length === 0,
    });
  }
  lista.sort((a, b) => a.arquivo.localeCompare(b.arquivo));
  return {
    aviso: AVISO,
    format_version: FORMAT_VERSION,
    total: lista.length,
    orfaos: lista.filter((c) => c.orfao).map((c) => c.arquivo),
    nomes_duplicados: ordObj(Object.fromEntries([...nomes].filter(([, v]) => v.length > 1).map(([k, v]) => [k, v.sort()]))),
    componentes: lista,
  };
}, { aviso: AVISO, total: 0, componentes: [] });

const hooks = secao('hooks', () => {
  const mapa = {};
  for (const [f, d] of ARQ) {
    if (d.teste) continue;
    for (const h of d.hooks_definidos) {
      mapa[h] = {
        arquivo: f,
        linhas: d.linhas,
        tabelas: d.tabelas,
        rpcs: d.rpcs,
        edges: d.edges,
        usado_por: [...ARQ].filter(([g, e]) => g !== f && !e.teste && e.hooks_usados.includes(h)).map(([g]) => g).sort(),
        coberto_por_teste: [...ARQ].some(([g, e]) => e.teste && (e.hooks_usados.includes(h) || e.imports.includes(f))),
      };
    }
  }
  const ord = ordObj(mapa);
  return {
    aviso: AVISO,
    format_version: FORMAT_VERSION,
    total: Object.keys(ord).length,
    sem_uso: Object.keys(ord).filter((h) => ord[h].usado_por.length === 0),
    sem_teste: Object.keys(ord).filter((h) => !ord[h].coberto_por_teste),
    hooks: ord,
  };
}, { aviso: AVISO, total: 0, hooks: {} });

const grafo = secao('grafo', () => {
  const nos = [...ARQ.keys()];
  const indice = new Map(nos.map((n, i) => [n, i]));
  // Tarjan iterativo: ciclo de import e o que faz o Vite quebrar em ordem imprevisivel.
  // Ciclo so faz sentido em aresta estatica (ver o comentario na analise por arquivo).
  const adj = nos.map((n) => (ARQ.get(n).imports_estaticos ?? []).map((i) => indice.get(i)).filter((x) => x !== undefined));
  const num = new Array(nos.length).fill(-1);
  const low = new Array(nos.length).fill(0);
  const naPilha = new Array(nos.length).fill(false);
  const pilha = [];
  let contador = 0;
  const ciclos = [];
  for (const raiz of nos.keys()) {
    if (num[raiz] !== -1) continue;
    const trabalho = [[raiz, 0]];
    while (trabalho.length) {
      const topo = trabalho[trabalho.length - 1];
      const [v, i] = topo;
      if (i === 0) { num[v] = contador; low[v] = contador; contador += 1; pilha.push(v); naPilha[v] = true; }
      if (i < adj[v].length) {
        topo[1] += 1;
        const w = adj[v][i];
        if (num[w] === -1) trabalho.push([w, 0]);
        else if (naPilha[w]) low[v] = Math.min(low[v], num[w]);
      } else {
        if (low[v] === num[v]) {
          const comp = [];
          for (;;) { const w = pilha.pop(); naPilha[w] = false; comp.push(nos[w]); if (w === v) break; }
          if (comp.length > 1) ciclos.push(comp.sort());
        }
        trabalho.pop();
        if (trabalho.length) { const pai = trabalho[trabalho.length - 1][0]; low[pai] = Math.min(low[pai], low[v]); }
      }
    }
  }
  const entradas = new Set(['src/main.tsx', 'src/App.tsx']);
  const hubs = nos.map((n) => ({ arquivo: n, importado_por: usadoPor(n).length }))
    .sort((a, b) => b.importado_por - a.importado_por || a.arquivo.localeCompare(b.arquivo)).slice(0, 30);
  return {
    aviso: AVISO,
    format_version: FORMAT_VERSION,
    nos: nos.length,
    arestas: adj.reduce((n, a) => n + a.length, 0),
    hubs,
    ciclos: {
      criterio: 'so import estatico; import() dinamico (lazy) nao forma ciclo em tempo de execucao',
      total: ciclos.length,
      maiores: ciclos.sort((a, b) => b.length - a.length).slice(0, 10),
    },
    orfaos: nos.filter((n) => !entradas.has(n) && !ARQ.get(n).teste && usadoPor(n).length === 0).sort(),
    arestas_por_arquivo: ordObj(Object.fromEntries(nos.map((n) => [n, ARQ.get(n).imports_estaticos]))),
    arestas_dinamicas: ordObj(Object.fromEntries(nos.filter((n) => ARQ.get(n).imports_dinamicos.length).map((n) => [n, ARQ.get(n).imports_dinamicos]))),
  };
}, { aviso: AVISO, nos: 0, arestas: 0 });

const baseline = secao('baseline', () => {
  const soma = (campo) => [...ARQ.values()].reduce((n, d) => n + d.qualidade[campo], 0);
  const pkg = lerJson('package.json') ?? {};
  const porPasta = {};
  for (const f of TODOS) {
    const pasta = f.split('/').slice(0, 2).join('/');
    porPasta[pasta] = (porPasta[pasta] ?? 0) + 1;
  }
  const todos = [...ARQ].flatMap(([f, d]) => d.todos.map((t) => ({ arquivo: f, ...t })))
    .sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);
  const rotas = lerJson('inventario/estado/rotas.json');
  const edges = lerJson('inventario/estado/edges.json');
  const schema = lerJson('inventario/estado/schema-declarado.json');
  const envDeclaradas = (() => {
    try { return uniq(fs.readFileSync(path.join(RAIZ, '.env'), 'utf8').split('\n').map((l) => (l.match(/^([A-Z0-9_]+)=/) || [])[1]).filter(Boolean)); } catch { return []; }
  })();
  const envUsadas = uniq([...ARQ.values()].flatMap((d) => d.env));
  return {
    aviso: AVISO,
    format_version: FORMAT_VERSION,
    git: {
      commit: git('rev-parse', 'HEAD') || null,
      branch: git('rev-parse', '--abbrev-ref', 'HEAD') || null,
      data_commit: git('log', '-1', '--format=%cI') || null,
      ultimos_commits: git('log', '-10', '--format=%h %s').split('\n').filter(Boolean),
      arquivos_mais_mudados_90d: Object.entries(git('log', '--since=90.days', '--name-only', '--format=').split('\n')
        .filter(Boolean).reduce((a, f) => { a[f] = (a[f] ?? 0) + 1; return a; }, {}))
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 20).map(([arquivo, mudancas]) => ({ arquivo, mudancas })),
    },
    contagens: {
      arquivos: TODOS.length,
      arquivos_de_codigo: ARQ.size,
      linhas_de_codigo: [...ARQ.values()].reduce((n, d) => n + d.linhas, 0),
      componentes: componentes.total,
      hooks: hooks.total,
      paginas: TODOS.filter((f) => f.startsWith('src/pages/') && f.endsWith('.tsx')).length,
      testes: [...ARQ].filter(([, d]) => d.teste).length,
      edge_functions: edges?.resumo?.edges ?? null,
      rotas: rotas?.resumo?.rotas ?? null,
      tabelas: schema?.resumo?.tabelas ?? null,
      migrations: schema?.resumo?.migrations ?? null,
    },
    por_pasta: ordObj(porPasta),
    maiores_arquivos: [...ARQ].map(([f, d]) => ({ arquivo: f, linhas: d.linhas }))
      .sort((a, b) => b.linhas - a.linhas || a.arquivo.localeCompare(b.arquivo)).slice(0, 25),
    qualidade: {
      any: soma('any'),
      console_log: soma('console_log'),
      ts_ignore: soma('ts_ignore'),
      eslint_disable: soma('eslint_disable'),
      todos: todos.length,
      arquivos_acima_500_linhas: [...ARQ].filter(([, d]) => d.linhas > 500).map(([f]) => f).sort(),
    },
    todos: todos.slice(0, 200),
    env: {
      declaradas_no_env: envDeclaradas,
      usadas_no_codigo: envUsadas,
      usadas_mas_nao_declaradas: envUsadas.filter((e) => e.startsWith('VITE_') && !envDeclaradas.includes(e)),
    },
    scripts_npm: ordObj(pkg.scripts ?? {}),
    alertas: {
      componentes_orfaos: componentes.orfaos?.length ?? 0,
      componentes_com_nome_duplicado: Object.keys(componentes.nomes_duplicados ?? {}).length,
      hooks_sem_uso: hooks.sem_uso?.length ?? 0,
      ciclos_de_import: grafo.ciclos?.total ?? 0,
      problemas_de_rota: rotas?.resumo?.problemas ?? null,
      edges_sem_chamador: edges?.resumo?.sem_chamador_no_repo ?? null,
      alertas_de_schema: schema?.resumo?.alertas ?? null,
    },
    erros_do_gerador: ERROS,
  };
}, { aviso: AVISO, contagens: {} });

// ------------------------------------------------------------------ INDEX.md
const indexMd = secao('INDEX.md', () => {
  const rotas = lerJson('inventario/estado/rotas.json');
  const edges = lerJson('inventario/estado/edges.json');
  const schema = lerJson('inventario/estado/schema-declarado.json');
  const l = [];
  l.push('# Contexto do Multiplixe V2 para agentes', '', `> ${AVISO}`, '');
  l.push(`Commit: \`${baseline.git?.commit ?? '?'}\` · branch \`${baseline.git?.branch ?? '?'}\` · ${baseline.git?.data_commit ?? '?'}`, '');
  if (ERROS.length) l.push(`> ATENCAO: ${ERROS.length} secao(oes) falharam na geracao; veja \`erros\` em manifest.json.`, '');
  l.push('## Como usar', '',
    '| Pergunta | Onde responder |', '|---|---|',
    '| que rota existe, o que cada tela toca | `inventario/estado/rotas.json` |',
    '| que edge function existe, quem a chama | `inventario/estado/edges.json` |',
    '| tabela, RLS, policy, funcao, cron, bucket | `inventario/estado/schema-declarado.json` |',
    '| estado real do banco (linhas, alertas) | `inventario/estado/banco.json` (so com token/consulta) |',
    '| onde fica um componente, quem o usa | `inventario/ia/componentes.json` |',
    '| que hook toca que tabela, quem usa | `inventario/ia/hooks.json` |',
    '| ciclo de import, hub, arquivo orfao | `inventario/ia/grafo.json` |',
    '| numeros do repo, divida, TODO, git | `inventario/ia/baseline.json` |', '');
  const c = baseline.contagens ?? {};
  l.push('## Numeros', '', '| | |', '|---|---|',
    `| arquivos (codigo) | ${c.arquivos} (${c.arquivos_de_codigo}) |`,
    `| linhas de codigo | ${c.linhas_de_codigo} |`,
    `| paginas / rotas | ${c.paginas} / ${c.rotas ?? '—'} |`,
    `| componentes / hooks | ${c.componentes} / ${c.hooks} |`,
    `| arquivos de teste | ${c.testes} |`,
    `| edge functions | ${c.edge_functions ?? '—'} |`,
    `| tabelas / migrations | ${c.tabelas ?? '—'} / ${c.migrations ?? '—'} |`, '');
  const q = baseline.qualidade ?? {};
  l.push('## Divida medida', '',
    `\`: any\`: ${q.any} · \`console.log\`: ${q.console_log} · \`@ts-ignore\`: ${q.ts_ignore} · `
    + `\`eslint-disable\`: ${q.eslint_disable} · TODO/FIXME: ${q.todos} · arquivos > 500 linhas: ${q.arquivos_acima_500_linhas?.length ?? 0}`, '');
  if (rotas?.rotas) {
    l.push('## Rotas', '', '| URL | arquivo | protegida | entradas na UI | tabelas | edges |', '|---|---|---|---|---|---|');
    for (const r of rotas.rotas) {
      l.push(`| \`${r.caminho}\` | ${r.arquivo ?? '—'} | ${r.so_admin ? 'admin' : r.protegida ? 'sim' : 'nao'} | `
        + `${r.entradas_na_ui?.join(', ') || '—'} | ${r.tabelas?.length ?? 0} | ${r.edges?.join(', ') || '—'} |`);
    }
    l.push('');
    if (rotas.problemas?.length) {
      l.push('### Problemas de rota', '');
      for (const p of rotas.problemas) l.push(`- **${p.tipo}** \`${p.id}\`: ${p.detalhe}`);
      l.push('');
    }
  }
  if (edges?.edge_functions) {
    l.push('## Edge functions', '', '| nome | linhas | segredos | chamada em | tabelas |', '|---|---|---|---|---|');
    for (const [nome, e] of Object.entries(edges.edge_functions)) {
      const chamadores = e.chamada_em.src.length + e.chamada_em.migrations.length + e.chamada_em.outras_edges.length;
      l.push(`| \`${nome}\` | ${e.linhas} | ${e.segredos_lidos.join(', ') || '—'} | `
        + `${chamadores === 0 ? '**ninguem**' : chamadores} | ${e.tabelas.join(', ') || '—'} |`);
    }
    l.push('');
  }
  if (schema) {
    l.push('## Banco (declarado pelo repo)', '',
      `${schema.resumo.tabelas} tabelas · ${schema.resumo.policies} policies · ${schema.resumo.funcoes} funcoes · `
      + `${schema.resumo.cron_jobs} cron jobs · ${schema.resumo.buckets} bucket(s) · ${schema.resumo.migrations} migrations`, '',
      `> ${schema.nao_verificado}`, '');
    if (schema.alertas?.length) {
      l.push('| alerta | o que |', '|---|---|');
      for (const a of schema.alertas) l.push(`| \`${a.tipo}\` | ${a.detalhe.join(', ')} |`);
      l.push('');
    }
    if (Object.keys(schema.cron ?? {}).length) {
      l.push('### Cron', '', '| job | agenda | chama edge |', '|---|---|---|');
      for (const [nome, j] of Object.entries(schema.cron)) l.push(`| \`${nome}\` | \`${j.agenda}\` | ${j.chama_edge ?? '—'} |`);
      l.push('');
    }
  }
  if (grafo.ciclos?.total) {
    l.push('## Ciclos de import', '');
    for (const ciclo of grafo.ciclos.maiores) l.push(`- ${ciclo.length} arquivos: ${ciclo.slice(0, 5).join(' -> ')}${ciclo.length > 5 ? ' -> ...' : ''}`);
    l.push('');
  }
  l.push('## Hubs (mais importados)', '');
  for (const h of (grafo.hubs ?? []).slice(0, 10)) l.push(`- \`${h.arquivo}\` (${h.importado_por})`);
  l.push('');
  l.push('## Mexido nos ultimos 90 dias', '');
  for (const h of (baseline.git?.arquivos_mais_mudados_90d ?? []).slice(0, 10)) l.push(`- \`${h.arquivo}\` (${h.mudancas})`);
  l.push('');
  l.push('## Scripts npm', '');
  for (const [k, v] of Object.entries(baseline.scripts_npm ?? {})) l.push(`- \`npm run ${k}\` → \`${v}\``);
  l.push('');
  return `${l.join('\n')}\n`;
}, `# Contexto\n\n> falha ao gerar o INDEX.md\n`);

// -------------------------------------------------------------------- escrita
const arquivos = {
  'componentes.json': componentes,
  'hooks.json': hooks,
  'grafo.json': grafo,
  'baseline.json': baseline,
};
fs.mkdirSync(SAIDA, { recursive: true });
const hashes = {};
for (const [nome, dado] of Object.entries(arquivos)) {
  const txt = `${JSON.stringify(dado, null, 1)}\n`;
  fs.writeFileSync(path.join(SAIDA, nome), txt);
  hashes[nome] = sha(txt);
}
fs.writeFileSync(path.join(SAIDA, 'INDEX.md'), indexMd);
hashes['INDEX.md'] = sha(indexMd);
fs.writeFileSync(path.join(SAIDA, 'manifest.json'), `${JSON.stringify({
  aviso: AVISO,
  format_version: FORMAT_VERSION,
  gerado_em: new Date().toISOString(),
  commit: baseline.git?.commit ?? null,
  branch: baseline.git?.branch ?? null,
  gerador: 'scripts/ai-context/gerar.mjs',
  node: process.version,
  arquivos: ordObj(hashes),
  contagens: baseline.contagens ?? {},
  erros: ERROS,
}, null, 1)}\n`);

if (!QUIETO) {
  console.log(`[contexto-ia] ${SAIDA_REL}: ${Object.keys(hashes).length + 1} arquivos, `
    + `${baseline.contagens?.arquivos_de_codigo ?? 0} arquivos de codigo, ${componentes.total} componentes, `
    + `${hooks.total} hooks, ${grafo.ciclos?.total ?? 0} ciclos de import, ${ERROS.length} erro(s) de secao.`);
}
