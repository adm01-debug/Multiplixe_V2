#!/usr/bin/env node
/**
 * Reconstroi o schema a partir de `supabase/migrations/*.sql`, por replay dos comandos em ordem
 * de nome de arquivo. E a unica forma de saber RLS, policy, trigger, cron job e bucket neste repo:
 * `types.ts` nao carrega nada disso, e nenhum agente desta sessao tem acesso ao banco
 * (`docs/agentes/banco.md`).
 *
 * O que NAO e: prova do banco ao vivo. O Lovable aplica as migrations, mas tambem aplica DDL
 * direto pelo painel sem gerar arquivo; e um `DROP` feito a mao nao aparece aqui. Replay e a
 * verdade do que o repo PEDIU, nao do que o banco TEM. Para o banco ao vivo: scripts/inventario/
 * banco.sql + gerar-banco.mjs.
 *
 * Uso: node scripts/lib/migrations-supabase.mjs        imprime o resumo
 *      import { lerMigrations } from './migrations-supabase.mjs'
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DIR_PADRAO = 'supabase/migrations';

/**
 * Nome das policies que o replay reconstroi. Exportado para quem compara as migrations com o
 * banco ao vivo (scripts/inventario/comparar-banco.mjs): a comparacao precisa do mesmo criterio
 * de nome que o replay usa, senao acusa divergencia de policy escrita com ou sem aspas.
 */
export const nomesDePolicies = (schema) => Object.entries(schema.tabelas)
  .flatMap(([tabela, t]) => (t.policies ?? []).map((nome) => `${tabela}.${nome}`));
/** Nome de migration do Supabase: 14 digitos (AAAAMMDDHHMMSS) + _ + resto. */
export const NOME_MIGRATION = /^(\d{14})_.*\.sql$/;

/** Remove comentarios de linha e de bloco sem estragar o conteudo de strings. */
export function tirarComentarios(sql) {
  let saida = '';
  let aspas = null;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const prox = sql[i + 1];
    if (aspas) {
      saida += ch;
      if (ch === aspas) aspas = null;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') { aspas = ch; saida += ch; i += 1; continue; }
    if (ch === '-' && prox === '-') { while (i < sql.length && sql[i] !== '\n') i += 1; continue; }
    if (ch === '/' && prox === '*') { i += 2; while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i += 1; i += 2; continue; }
    saida += ch;
    i += 1;
  }
  return saida;
}

/**
 * Quebra em comandos pelo `;`, respeitando string simples/dupla e corpo `$$ ... $$` (ou
 * `$tag$ ... $tag$`) de funcao — sem isso cada `;` do plpgsql virava um comando.
 */
export function quebrarComandos(sql) {
  const comandos = [];
  let atual = '';
  let aspas = null;
  let dolar = null;
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (dolar) {
      if (sql.startsWith(dolar, i)) { atual += dolar; i += dolar.length; dolar = null; continue; }
      atual += ch; i += 1; continue;
    }
    if (aspas) {
      atual += ch;
      if (ch === aspas) aspas = null;
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') { aspas = ch; atual += ch; i += 1; continue; }
    if (ch === '$') {
      const m = sql.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (m) { dolar = m[0]; atual += m[0]; i += m[0].length; continue; }
    }
    if (ch === ';') { comandos.push(atual); atual = ''; i += 1; continue; }
    atual += ch;
    i += 1;
  }
  if (atual.trim()) comandos.push(atual);
  return comandos;
}

const semSchema = (nome) => String(nome).replace(/^public\./i, '').replace(/"/g, '');

/**
 * Replay das migrations. Devolve o schema pedido pelo repo + os problemas achados no caminho.
 * Ordem de aplicacao = ordem do nome do arquivo (o que o Supabase usa).
 */
export function lerMigrations(raiz = RAIZ_PADRAO, dir = DIR_PADRAO) {
  const base = path.join(raiz, dir);
  const arquivos = fs.existsSync(base)
    ? fs.readdirSync(base).filter((f) => f.endsWith('.sql')).sort()
    : [];

  const tabelas = new Map();   // nome -> { rls, policies:Set, triggers:Set, indices:Set, criada_em }
  const funcoes = new Map();   // nome -> { security_definer, search_path, criada_em }
  const enums = new Map();
  const views = new Map();
  const cron = new Map();
  const buckets = new Map();
  const problemas = [];
  const ddlDinamico = [];

  const outrosSchemas = new Set();
  const referenciadasSemCreate = new Map(); // tabela -> primeiro arquivo que a referenciou
  const VAZIA = { rls: false, policies: new Set(), triggers: new Set(), indices: new Set(), criada_em: null };

  /**
   * `criar` so e true em CREATE TABLE. Policy/trigger/indice sobre tabela que o repo nunca criou
   * NAO inventa a tabela: ela vai para `referenciadas_sem_create` (sinal de DDL aplicado fora das
   * migrations, o que acontece neste projeto porque o Lovable tambem aplica pelo painel). Sem isso
   * `user_roles` aparecia como "tabela sem RLS" so por ter um trigger.
   */
  const tabela = (nome, arquivo, criar = false) => {
    const bruto = String(nome).replace(/"/g, '');
    if (/^[A-Za-z0-9_]+\./.test(bruto) && !/^public\./i.test(bruto)) { outrosSchemas.add(bruto); return null; }
    const n = semSchema(bruto);
    if (!tabelas.has(n)) {
      if (!criar) {
        if (!referenciadasSemCreate.has(n)) referenciadasSemCreate.set(n, arquivo);
        return null;
      }
      tabelas.set(n, { rls: false, policies: new Set(), triggers: new Set(), indices: new Set(), criada_em: arquivo });
    }
    return tabelas.get(n);
  };
  /** Acesso que tolera tabela desconhecida: devolve um alvo descartavel em vez de explodir. */
  const alvo = (nome, arquivo) => tabela(nome, arquivo) ?? { ...VAZIA, policies: new Set(), triggers: new Set(), indices: new Set() };

  for (const arquivo of arquivos) {
    if (!NOME_MIGRATION.test(arquivo)) {
      problemas.push({ tipo: 'nome_fora_do_padrao', id: arquivo, detalhe: 'esperado AAAAMMDDHHMMSS_<nome>.sql' });
    }
    const bruto = fs.readFileSync(path.join(base, arquivo), 'utf8');
    if (!bruto.trim()) {
      problemas.push({ tipo: 'migration_vazia', id: arquivo, detalhe: 'arquivo sem nenhum comando' });
      continue;
    }
    const sql = tirarComentarios(bruto);
    for (const cmd of quebrarComandos(sql)) {
      const c = cmd.trim();
      if (!c) continue;
      if (/EXECUTE\s+format\s*\(/i.test(c)) ddlDinamico.push({ arquivo, trecho: c.slice(0, 120).replace(/\s+/g, ' ') });

      let m;
      if ((m = c.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i))) {
        tabela(m[1], arquivo, true);
      } else if ((m = c.match(/^DROP\s+TABLE(?:\s+IF\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i))) {
        tabelas.delete(semSchema(m[1]));
      } else if ((m = c.match(/^ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:ONLY\s+)?([A-Za-z0-9_."]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i))) {
        alvo(m[1], arquivo).rls = true;
      } else if ((m = c.match(/^ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:ONLY\s+)?([A-Za-z0-9_."]+)\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY/i))) {
        alvo(m[1], arquivo).rls = false;
      } else if ((m = c.match(/^ALTER\s+TABLE(?:\s+IF\s+EXISTS)?\s+(?:ONLY\s+)?([A-Za-z0-9_."]+)\s+RENAME\s+TO\s+([A-Za-z0-9_."]+)/i))) {
        const antigo = semSchema(m[1]);
        const novo = semSchema(m[2]);
        if (tabelas.has(antigo)) { tabelas.set(novo, tabelas.get(antigo)); tabelas.delete(antigo); }
      } else if ((m = c.match(/^CREATE\s+POLICY\s+("[^"]+"|[A-Za-z0-9_]+)\s+ON\s+([A-Za-z0-9_."]+)/i))) {
        alvo(m[2], arquivo).policies.add(m[1].replace(/"/g, ''));
      } else if ((m = c.match(/^DROP\s+POLICY(?:\s+IF\s+EXISTS)?\s+("[^"]+"|[A-Za-z0-9_]+)\s+ON\s+([A-Za-z0-9_."]+)/i))) {
        tabelas.get(semSchema(m[2]))?.policies.delete(m[1].replace(/"/g, ''));
      } else if ((m = c.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+([A-Za-z0-9_"]+)[\s\S]*?\sON\s+([A-Za-z0-9_."]+)/i))) {
        alvo(m[2], arquivo).triggers.add(m[1].replace(/"/g, ''));
      } else if ((m = c.match(/^DROP\s+TRIGGER(?:\s+IF\s+EXISTS)?\s+([A-Za-z0-9_"]+)\s+ON\s+([A-Za-z0-9_."]+)/i))) {
        tabelas.get(semSchema(m[2]))?.triggers.delete(m[1].replace(/"/g, ''));
      } else if ((m = c.match(/^CREATE\s+(?:UNIQUE\s+)?INDEX(?:\s+CONCURRENTLY)?(?:\s+IF\s+NOT\s+EXISTS)?\s+([A-Za-z0-9_"]+)\s+ON\s+([A-Za-z0-9_."]+)/i))) {
        alvo(m[2], arquivo).indices.add(m[1].replace(/"/g, ''));
      } else if ((m = c.match(/^DROP\s+INDEX(?:\s+CONCURRENTLY)?(?:\s+IF\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i))) {
        for (const t of tabelas.values()) t.indices.delete(semSchema(m[1]));
      } else if ((m = c.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([A-Za-z0-9_."]+)\s*\(/i))) {
        const nome = semSchema(m[1]);
        funcoes.set(nome, {
          security_definer: /SECURITY\s+DEFINER/i.test(c),
          // Lista de identificadores/strings separada por virgula. Nao usar `[^\n;]+`: na mesma
          // linha vem `AS $$`, `LANGUAGE plpgsql` etc. e o valor capturado sairia sujo.
          search_path: (c.match(/SET\s+search_path\s*(?:=|TO)\s*((?:'[^']*'|"[^"]*"|[A-Za-z0-9_$.]+)(?:\s*,\s*(?:'[^']*'|"[^"]*"|[A-Za-z0-9_$.]+))*)/i) || [])[1]?.trim().replace(/['"]/g, '') ?? null,
          criada_em: arquivo,
        });
      } else if ((m = c.match(/^DROP\s+FUNCTION(?:\s+IF\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i))) {
        funcoes.delete(semSchema(m[1]));
      } else if ((m = c.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW(?:\s+IF\s+NOT\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i))) {
        views.set(semSchema(m[1]), { criada_em: arquivo, security_invoker: /security_invoker\s*=\s*(on|true)/i.test(c) });
      } else if ((m = c.match(/^DROP\s+(?:MATERIALIZED\s+)?VIEW(?:\s+IF\s+EXISTS)?\s+([A-Za-z0-9_."]+)/i))) {
        views.delete(semSchema(m[1]));
      } else if ((m = c.match(/^CREATE\s+TYPE\s+([A-Za-z0-9_."]+)\s+AS\s+ENUM\s*\(([\s\S]*)\)/i))) {
        enums.set(semSchema(m[1]), [...m[2].matchAll(/'([^']*)'/g)].map((x) => x[1]));
      } else if ((m = c.match(/^ALTER\s+TYPE\s+([A-Za-z0-9_."]+)\s+ADD\s+VALUE(?:\s+IF\s+NOT\s+EXISTS)?\s+'([^']*)'/i))) {
        const atual = enums.get(semSchema(m[1])) ?? [];
        if (!atual.includes(m[2])) enums.set(semSchema(m[1]), [...atual, m[2]]);
      } else if ((m = c.match(/cron\.schedule\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/i))) {
        const chamaEdge = (c.match(/\/functions\/v1\/([A-Za-z0-9_-]+)/) || [])[1] ?? null;
        cron.set(m[1], { agenda: m[2], chama_edge: chamaEdge, definido_em: arquivo });
      } else if ((m = c.match(/cron\.unschedule\s*\(\s*'([^']+)'/i))) {
        cron.delete(m[1]);
      } else if (/insert\s+into\s+storage\.buckets/i.test(c)) {
        for (const b of c.matchAll(/\(\s*'([^']+)'\s*,\s*'[^']*'\s*,\s*(true|false)/gi)) {
          buckets.set(b[1], { publico: b[2].toLowerCase() === 'true', definido_em: arquivo });
        }
      }
    }
  }

  const ordenado = (mapa, fn) => Object.fromEntries([...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, fn(v)]));

  return {
    fonte: `${dir} (replay por scripts/lib/migrations-supabase.mjs)`,
    migrations: arquivos.length,
    versoes: arquivos.filter((f) => NOME_MIGRATION.test(f)).map((f) => f.match(NOME_MIGRATION)[1]),
    tabelas: ordenado(tabelas, (t) => ({
      rls: t.rls,
      policies: [...t.policies].sort(),
      triggers: [...t.triggers].sort(),
      indices: [...t.indices].sort(),
      criada_em: t.criada_em,
    })),
    views: ordenado(views, (v) => v),
    funcoes: ordenado(funcoes, (f) => f),
    enums: Object.fromEntries([...enums.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, [...v].sort()])),
    cron: ordenado(cron, (c) => c),
    buckets: ordenado(buckets, (b) => b),
    referenciadas_sem_create: Object.fromEntries([...referenciadasSemCreate.entries()].sort(([x], [y]) => x.localeCompare(y))),
    objetos_de_outros_schemas: [...outrosSchemas].sort(),
    ddl_dinamico: ddlDinamico,
    problemas,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const s = lerMigrations();
  const semRls = Object.entries(s.tabelas).filter(([, t]) => !t.rls).map(([n]) => n);
  const rlsSemPolicy = Object.entries(s.tabelas).filter(([, t]) => t.rls && t.policies.length === 0).map(([n]) => n);
  const secdefSemPath = Object.entries(s.funcoes).filter(([, f]) => f.security_definer && !f.search_path).map(([n]) => n);
  console.log(`${s.migrations} migrations: ${Object.keys(s.tabelas).length} tabelas, ${Object.keys(s.views).length} views, `
    + `${Object.keys(s.funcoes).length} funcoes, ${Object.keys(s.enums).length} enums, ${Object.keys(s.cron).length} cron jobs, `
    + `${Object.keys(s.buckets).length} buckets.`);
  console.log(`sem RLS: ${semRls.length}${semRls.length ? ` (${semRls.join(', ')})` : ''}`);
  console.log(`RLS sem policy: ${rlsSemPolicy.length}${rlsSemPolicy.length ? ` (${rlsSemPolicy.join(', ')})` : ''}`);
  console.log(`SECURITY DEFINER sem search_path: ${secdefSemPath.length}${secdefSemPath.length ? ` (${secdefSemPath.join(', ')})` : ''}`);
  if (s.problemas.length) console.log(`problemas: ${s.problemas.map((p) => `${p.tipo}:${p.id}`).join(', ')}`);
  if (s.ddl_dinamico.length) console.log(`DDL dinamico (nao rastreado): ${s.ddl_dinamico.length} trecho(s)`);
}
