#!/usr/bin/env node
/**
 * Inventario do schema DECLARADO pelo repo -> inventario/estado/schema-declarado.json
 *
 * Cruza as tres unicas fontes que existem dentro do repositorio:
 *   1. `src/integrations/supabase/types.ts` (gerado pelo Lovable): tabelas, colunas, views,
 *      funcoes expostas e enums;
 *   2. `supabase/migrations/*.sql` por replay (scripts/lib/migrations-supabase.mjs): RLS, policies,
 *      triggers, indices, cron jobs, buckets, SECURITY DEFINER e search_path;
 *   3. `src/` e `supabase/functions/`: quantos `.from('tabela')` e `.rpc('funcao')` existem.
 *
 * Roda OFFLINE, sem credencial — e por isso que da para rodar em qualquer sessao de agente.
 *
 * O QUE ISTO NAO E (declarado de proposito, para o arquivo nao virar teatro): prova do banco ao
 * vivo. Nenhum agente desta sessao tem MCP do projeto oficial `ywsblgsikhiscvpmopkp`
 * (`docs/agentes/banco.md`) e o Lovable tambem aplica DDL direto pelo painel, sem gerar migration.
 * O que esta aqui e "o que o repositorio declara"; divergencia entre as duas fontes aparece em
 * `drift`, e so o banco resolve quem esta certo (scripts/inventario/banco.sql).
 *
 * Uso:
 *   node scripts/inventario/gerar-schema.mjs           grava o arquivo
 *   node scripts/inventario/gerar-schema.mjs --check   exit 1 se o commitado esta desatualizado
 * Saida deterministica (sem data).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { lerTypes } from '../lib/types-supabase.mjs';
import { lerMigrations } from '../lib/migrations-supabase.mjs';
import { carregarCorpus, edgesNoRepo } from './gerar-repo.mjs';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SAIDA_REL = 'inventario/estado/schema-declarado.json';
const unico = (lista) => [...new Set(lista)].sort();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Quantos `.from('x')` / `.rpc('y')` cada objeto tem em src/ (sem teste) e nas edge functions. */
export function usoNoCodigo(raiz, tabelas, funcoes) {
  const src = carregarCorpus(raiz, ['src'], (p) => /\.(ts|tsx|js|jsx)$/.test(p) && !/(\.test\.|\.spec\.|__tests__|\/test\/)/.test(p));
  const edges = carregarCorpus(raiz, ['supabase/functions']);
  const contar = (corpus, re) => corpus.reduce((n, a) => n + [...a.texto.matchAll(re)].length, 0);
  const uso = { tabelas: {}, funcoes: {} };
  for (const t of tabelas) {
    const re = new RegExp(`(?<!storage)\\.from\\(\\s*['"\`]${esc(t)}['"\`]`, 'g');
    uso.tabelas[t] = { src: contar(src, re), edges: contar(edges, re) };
  }
  for (const f of funcoes) {
    const re = new RegExp(`\\.rpc\\(\\s*['"\`]${esc(f)}['"\`]`, 'g');
    uso.funcoes[f] = { src: contar(src, re), edges: contar(edges, re) };
  }
  return uso;
}

/** Monta o inventario. Funcao pura sobre o disco: o teste roda com repo de brinquedo. */
export function gerarSchema(raiz = RAIZ_PADRAO) {
  const types = lerTypes(undefined, raiz);
  const mig = lerMigrations(raiz);
  const edges = edgesNoRepo(raiz);

  const nomesTypes = Object.keys(types.tabelas).sort();
  const nomesMig = Object.keys(mig.tabelas).sort();
  const todas = unico([...nomesTypes, ...nomesMig]);
  const uso = usoNoCodigo(raiz, todas, unico([...Object.keys(types.funcoes), ...Object.keys(mig.funcoes)]));

  const tabelas = Object.fromEntries(todas.map((nome) => {
    const t = mig.tabelas[nome] ?? null;
    return [nome, {
      no_types: nome in types.tabelas,
      nas_migrations: Boolean(t),
      colunas: Object.keys(types.tabelas[nome]?.colunas ?? {}).length,
      rls: t ? t.rls : null,
      policies: t ? t.policies.length : null,
      triggers: t ? t.triggers : [],
      indices: t ? t.indices.length : null,
      criada_em: t?.criada_em ?? null,
      uso_no_codigo: uso.tabelas[nome] ?? { src: 0, edges: 0 },
    }];
  }));

  const funcoesTodas = unico([...Object.keys(types.funcoes), ...Object.keys(mig.funcoes)]);
  const funcoes = Object.fromEntries(funcoesTodas.map((nome) => {
    const f = mig.funcoes[nome] ?? null;
    return [nome, {
      exposta_no_types: nome in types.funcoes,
      args: types.funcoes[nome]?.args ?? null,
      retorno: types.funcoes[nome]?.retorno ?? null,
      security_definer: f ? f.security_definer : null,
      search_path: f ? f.search_path : null,
      criada_em: f?.criada_em ?? null,
      uso_no_codigo: uso.funcoes[nome] ?? { src: 0, edges: 0 },
    }];
  }));

  const soNoTypes = nomesTypes.filter((n) => !nomesMig.includes(n));
  const soNasMigrations = nomesMig.filter((n) => !nomesTypes.includes(n));

  const alertas = [];
  const add = (tipo, detalhe) => { if (detalhe.length) alertas.push({ tipo, detalhe: unico(detalhe) }); };
  add('tabela_sem_rls', nomesMig.filter((n) => mig.tabelas[n].rls === false));
  add('rls_sem_policy', nomesMig.filter((n) => mig.tabelas[n].rls && mig.tabelas[n].policies.length === 0));
  add('funcao_secdef_sem_search_path', Object.keys(mig.funcoes).filter((n) => mig.funcoes[n].security_definer && !mig.funcoes[n].search_path));
  add('tabela_so_no_types', soNoTypes);
  add('tabela_so_nas_migrations', soNasMigrations);
  add('tabela_sem_uso_no_codigo', todas.filter((n) => (uso.tabelas[n]?.src ?? 0) + (uso.tabelas[n]?.edges ?? 0) === 0));
  add('funcao_sem_uso_no_codigo', funcoesTodas.filter((n) => types.funcoes[n] && uso.funcoes[n].src + uso.funcoes[n].edges === 0));
  add('view_sem_security_invoker', Object.keys(mig.views).filter((n) => !mig.views[n].security_invoker));
  add('bucket_publico', Object.keys(mig.buckets).filter((b) => mig.buckets[b].publico));
  add('cron_chama_edge_inexistente', Object.values(mig.cron).map((c) => c.chama_edge).filter((e) => e && !edges.includes(e)));

  const problemas = [
    ...mig.problemas,
    ...Object.entries(mig.referenciadas_sem_create).map(([nome, arquivo]) => ({
      tipo: 'tabela_referenciada_sem_create',
      id: nome,
      detalhe: `policy/trigger/indice em ${arquivo} mexe numa tabela que nenhuma migration do repo cria: o CREATE foi aplicado fora das migrations`,
    })),
    ...mig.ddl_dinamico.map((d) => ({ tipo: 'ddl_dinamico', id: d.arquivo, detalhe: `EXECUTE format(...) nao e rastreado pelo replay: ${d.trecho}` })),
  ];

  return {
    format_version: 1,
    fonte: 'scripts/inventario/gerar-schema.mjs (src/integrations/supabase/types.ts + replay de supabase/migrations/ + .from()/.rpc() em src/ e supabase/functions/)',
    nao_verificado: 'nada aqui prova o banco ao vivo: types.ts e uma foto do momento em que o Lovable o gerou e o replay e o que o repo pediu. Para o estado real: scripts/inventario/banco.sql + gerar-banco.mjs.',
    resumo: {
      tabelas: todas.length,
      tabelas_no_types: nomesTypes.length,
      tabelas_nas_migrations: nomesMig.length,
      colunas: nomesTypes.reduce((n, t) => n + Object.keys(types.tabelas[t].colunas).length, 0),
      views: Object.keys(types.views).length,
      funcoes: funcoesTodas.length,
      funcoes_expostas_no_types: Object.keys(types.funcoes).length,
      enums: Object.keys(types.enums).length,
      policies: nomesMig.reduce((n, t) => n + mig.tabelas[t].policies.length, 0),
      cron_jobs: Object.keys(mig.cron).length,
      buckets: Object.keys(mig.buckets).length,
      migrations: mig.migrations,
      alertas: alertas.length,
      problemas: problemas.length,
    },
    drift: {
      criterio: 'types.ts (foto do banco) x replay das migrations (o que o repo pede)',
      so_no_types: soNoTypes,
      so_nas_migrations: soNasMigrations,
      referenciadas_sem_create: mig.referenciadas_sem_create,
      objetos_de_outros_schemas: mig.objetos_de_outros_schemas,
    },
    tabelas,
    views: Object.fromEntries(Object.keys(types.views).sort().map((v) => [v, {
      colunas: Object.keys(types.views[v].colunas).length,
      security_invoker: mig.views[v]?.security_invoker ?? null,
      criada_em: mig.views[v]?.criada_em ?? null,
    }])),
    funcoes,
    enums: types.enums,
    cron: mig.cron,
    buckets: mig.buckets,
    alertas,
    problemas,
  };
}

export const serializar = (inv) => JSON.stringify(inv, null, 2) + '\n';

function main(argv) {
  const saida = path.join(RAIZ_PADRAO, SAIDA_REL);
  const conteudo = serializar(gerarSchema(RAIZ_PADRAO));
  if (argv.includes('--check')) {
    const atual = fs.existsSync(saida) ? fs.readFileSync(saida, 'utf8') : '';
    if (atual !== conteudo) {
      console.error(`${SAIDA_REL} desatualizado: rode node scripts/inventario/gerar-schema.mjs e commite o resultado.`);
      process.exit(1);
    }
    console.log(`${SAIDA_REL} em dia.`);
    return;
  }
  fs.mkdirSync(path.dirname(saida), { recursive: true });
  fs.writeFileSync(saida, conteudo);
  const inv = JSON.parse(conteudo);
  console.log(`schema-declarado.json: ${inv.resumo.tabelas} tabelas (${inv.resumo.policies} policies), `
    + `${inv.resumo.funcoes} funcoes, ${inv.resumo.cron_jobs} cron jobs, ${inv.resumo.alertas} alertas, ${inv.resumo.problemas} problemas.`);
  for (const a of inv.alertas) console.log(`  alerta ${a.tipo}: ${a.detalhe.length} (${a.detalhe.slice(0, 4).join(', ')}${a.detalhe.length > 4 ? ', ...' : ''})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
