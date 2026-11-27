#!/usr/bin/env node
/**
 * Drift entre as migrations e o banco ao vivo: o que existe em producao e nao esta declarado no
 * repo (ou o contrario). Existe porque o Lovable aplica DDL direto pelo painel, sem gerar
 * migration — ja apareceram 12 policies de admin so no banco, e um ambiente criado do zero
 * subiria sem elas.
 *
 * Entrada: a resposta crua de `scripts/inventario/banco.sql` rodado em producao (mesmo formato de
 * `gerar-banco.mjs --entrada`, inclusive o envelope de MCP). Nada de rede aqui.
 *
 * Uso:
 *   node scripts/inventario/comparar-banco.mjs --entrada resposta.json
 *   node scripts/inventario/comparar-banco.mjs --entrada resposta.json --max 0   (tolerar tudo)
 * Exit: 0 = sem drift acima do limite; 1 = drift; 2 = entrada invalida.
 *
 * Limite (`--max`, padrao 0): quantos objetos podem estar so no banco. Toda vez que um objeto
 * aparece, a migration que o declara deve entrar no repo — e ai o numero volta a zero.
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { lerMigrations, nomesDePolicies } from '../lib/migrations-supabase.mjs';

/** A resposta pode vir crua ({"rows":[...]}), no envelope de MCP ou como o objeto direto. */
export function extrairInventario(bruto) {
  // `tabelas` e um objeto nos dois formatos; so a lista vazia denuncia entrada errada.
  const tentar = (v) => (v && typeof v === 'object' && (Array.isArray(v.tabelas) || v.tabelas) ? v : null);
  const direto = tentar(bruto) ?? tentar(bruto?.inventario) ?? tentar(bruto?.[0]?.inventario);
  if (direto) return direto;
  const linhas = bruto?.rows ?? bruto?.result ?? bruto;
  if (Array.isArray(linhas)) {
    const texto = linhas[0]?.inventario ?? linhas[0]?.json ?? linhas[0];
    const objeto = typeof texto === 'string' ? JSON.parse(texto) : texto;
    return tentar(objeto) ?? tentar(objeto?.inventario);
  }
  throw new Error('entrada nao traz o inventario do banco (rode scripts/inventario/banco.sql em producao)');
}

/**
 * Compara. `banco` e o inventario ao vivo; `migrations` e o replay do repo (lerMigrations).
 * Devolve so os nomes (tabela, tabela.coluna, tabela.policy, funcao, trigger) para a mensagem
 * de erro ser curta e o diff entre semanas ser estavel.
 */
export function comparar(banco, migrations) {
  const semSchema = (n) => String(n).replace(/^public\./, '');
  const repo = {
    tabelas: new Set(Object.keys(migrations.tabelas)),
    policies: new Set(nomesDePolicies(migrations)),
    funcoes: new Set(Object.keys(migrations.funcoes)),
  };
  // O banco.sql devolve as listas como objeto {nome: {...}}; a consulta avulsa usa array.
  const lista = (v) => (Array.isArray(v) ? v : Object.keys(v ?? {}).map((nome) => ({ nome, ...v[nome] })));
  const vivo = {
    tabelas: new Set(lista(banco.tabelas).map((t) => semSchema(t.nome))),
    policies: new Set((banco.policies ?? []).map((p) => `${semSchema(p.tabela)}.${p.nome}`)),
    funcoes: new Set((banco.funcoes ?? []).map((f) => semSchema(f.nome))),
    colunas: new Set((banco.colunas ?? []).map((c) => `${semSchema(c.tabela)}.${c.nome}`)),
  };
  // `mcp_exec` e o executor MCP do Supabase, criado pela plataforma: nao e objeto do app.
  const DA_PLATAFORMA = new Set(['mcp_exec']);
  const soNoBanco = (a, b) => [...a].filter((x) => !b.has(x) && !DA_PLATAFORMA.has(x)).sort();
  const soNoRepo = (a, b) => [...a].filter((x) => !b.has(x)).sort();
  return {
    tabelas_so_no_banco: soNoBanco(vivo.tabelas, repo.tabelas),
    policies_so_no_banco: soNoBanco(vivo.policies, repo.policies),
    funcoes_so_no_banco: soNoBanco(vivo.funcoes, repo.funcoes),
    tabelas_so_no_repo: soNoRepo(repo.tabelas, vivo.tabelas),
    policies_so_no_repo: soNoRepo(repo.policies, vivo.policies),
    funcoes_so_no_repo: soNoRepo(repo.funcoes, vivo.funcoes),
    total_colunas_vivas: vivo.colunas.size,
  };
}

const principal = () => {
  const args = process.argv.slice(2);
  const pos = (nome) => { const i = args.indexOf(nome); return i === -1 ? null : args[i + 1]; };
  const entrada = pos('--entrada');
  const max = Number(pos('--max') ?? 0);
  if (!entrada) { console.error('uso: comparar-banco.mjs --entrada <resposta.json> [--max N]'); process.exit(2); }
  let bruto;
  try { bruto = JSON.parse(fs.readFileSync(entrada, 'utf8')); }
  catch (e) { console.error(`ERRO: nao consegui ler ${entrada}: ${e.message}`); process.exit(2); }

  let banco;
  try { banco = extrairInventario(bruto); }
  catch (e) { console.error(`ERRO: ${e.message}`); process.exit(2); }

  const drift = comparar(banco, lerMigrations());
  const soBanco = drift.tabelas_so_no_banco.length + drift.policies_so_no_banco.length + drift.funcoes_so_no_banco.length;
  for (const [chave, lista] of Object.entries(drift)) {
    if (!Array.isArray(lista) || lista.length === 0) continue;
    console.log(`${chave}: ${lista.length}`);
    for (const item of lista.slice(0, 40)) console.log(`  - ${item}`);
  }
  if (soBanco === 0) { console.log('drift: nenhum objeto de producao fora das migrations'); return 0; }
  console.log(`drift: ${soBanco} objeto(s) em producao sem migration (limite ${max})`);
  if (soBanco > max) {
    console.log('acao: escreva a migration que declara cada um deles e rode de novo');
    return 1;
  }
  return 0;
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(principal());