#!/usr/bin/env node
/**
 * Testa scripts/inventario/comparar-banco.mjs: o drift entre migrations e banco ao vivo.
 * Errrar para o lado frouxo deixa um ambiente novo subir sem policy de admin (ja aconteceu com 12);
 * errar para o lado apertado deixa o CI vermelho por objeto que nem e do app.
 *
 * node --test scripts/ci/comparar-banco.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { comparar, extrairInventario } from '../inventario/comparar-banco.mjs';

const migrations = {
  tabelas: {
    courses: { policies: ['Admins can view all courses', 'Alunos veem cursos'] },
    profiles: { policies: [] },
  },
  funcoes: { has_role: {}, get_platform_stats: {} },
};

const banco = (extra = {}) => ({
  tabelas: [{ nome: 'courses' }, { nome: 'profiles' }],
  policies: [
    { tabela: 'courses', nome: 'Admins can view all courses' },
    { tabela: 'courses', nome: 'Alunos veem cursos' },
  ],
  funcoes: [{ nome: 'has_role' }, { nome: 'get_platform_stats' }],
  ...extra,
});

test('banco igual ao declarado: nenhum objeto so no banco', () => {
  const d = comparar(banco(), migrations);
  assert.deepEqual(d.policies_so_no_banco, []);
  assert.deepEqual(d.tabelas_so_no_banco, []);
  assert.deepEqual(d.funcoes_so_no_banco, []);
  assert.deepEqual(d.policies_so_no_repo, []);
});

test('policy que so existe em producao e apontada (o caso das 12 de admin)', () => {
  const d = comparar(banco({ policies: [
    { tabela: 'courses', nome: 'Admins can view all courses' },
    { tabela: 'courses', nome: 'Admins can delete courses' },
  ] }), migrations);
  assert.deepEqual(d.policies_so_no_banco, ['courses.Admins can delete courses']);
});

test('schema public. nos dois lados nao vira drift', () => {
  const d = comparar(banco({ tabelas: [{ nome: 'public.courses' }, { nome: 'public.profiles' }],
    funcoes: [{ nome: 'public.has_role' }, { nome: 'public.get_platform_stats' }] }), migrations);
  assert.deepEqual(d.tabelas_so_no_banco, []);
  assert.deepEqual(d.funcoes_so_no_banco, []);
});

test('policy removida do banco aparece como so no repo', () => {
  const d = comparar(banco({ policies: [{ tabela: 'courses', nome: 'Admins can view all courses' }] }), migrations);
  assert.deepEqual(d.policies_so_no_repo, ['courses.Alunos veem cursos']);
  assert.deepEqual(d.policies_so_no_banco, []);
});

test('objeto da plataforma (mcp_exec) nao conta como drift', () => {
  const d = comparar(banco({ funcoes: [{ nome: 'mcp_exec' }] }), migrations);
  assert.deepEqual(d.funcoes_so_no_banco, []);
});

test('aceita resposta crua do banco.sql: lista com inventario e listas em objeto', () => {
  const bruto = [{ inventario: { tabelas: { courses: { linha: 1 } }, policies: {}, funcoes: {} } }];
  assert.deepEqual(extrairInventario(bruto).tabelas, { courses: { linha: 1 } });
});

test('aceita o inventario direto', () => {
  const direto = { tabelas: [], policies: [], funcoes: [] };
  assert.equal(extrairInventario(direto), direto);
});

test('entrada sem inventario e recusada com mensagem de acao', () => {
  assert.throws(() => extrairInventario({ nada: true }), /rode scripts\/inventario\/banco\.sql/);
});