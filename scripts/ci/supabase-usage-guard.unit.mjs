#!/usr/bin/env node
/**
 * Testa scripts/ci/supabase-usage-guard.mjs: alvo inexistente tem de quebrar, divida registrada
 * tem de passar, e o repo real tem de estar limpo hoje. Os dois lados (vermelho e verde) para o
 * teste nao ficar verde por ter perdido o alvo.
 *
 * node --test scripts/ci/supabase-usage-guard.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { main, coletarChamadas, objetosConhecidos, violacoes, comparar, chaveDe } from './supabase-usage-guard.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');

const SCHEMA = {
  tabelas: { cursos: {}, alunos: {} },
  views: { cursos_publicos: {} },
  funcoes: { has_role: {} },
};

function repoDeBrinquedo(codigo, baseline = { schemaVersion: 1, violations: [] }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-guard-'));
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  for (const [rel, texto] of Object.entries(codigo)) {
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), texto);
  }
  fs.mkdirSync(path.join(dir, 'inventario/estado'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'inventario/estado/schema-declarado.json'), JSON.stringify(SCHEMA));
  fs.writeFileSync(path.join(dir, 'baseline.json'), JSON.stringify(baseline));
  return dir;
}

const rodar = (dir, ...extra) => main(['--root', dir, '--baseline', 'baseline.json', ...extra]);

test('alvo que existe passa (exit 0)', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': "sb.from('cursos').select(); sb.from('cursos_publicos').select(); sb.rpc('has_role');\n" });
  try { assert.equal(rodar(dir), 0); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('tabela inexistente quebra (exit 1)', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': "sb.from('tabela_fantasma').select();\n" });
  try { assert.equal(rodar(dir), 1); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('RPC inexistente quebra (exit 1)', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': "sb.rpc('rpc_fantasma');\n" });
  try { assert.equal(rodar(dir), 1); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('violacao registrada no baseline passa; a mesma em OUTRO arquivo quebra', () => {
  const codigo = { 'src/a.ts': "sb.from('tabela_fantasma').select();\n" };
  const dir = repoDeBrinquedo(codigo, { schemaVersion: 1, violations: ['table:tabela_fantasma:src/a.ts'] });
  try {
    assert.equal(rodar(dir), 0, 'divida registrada nao quebra o build');
    fs.writeFileSync(path.join(dir, 'src/b.ts'), "sb.from('tabela_fantasma').select();\n");
    assert.equal(rodar(dir), 1, 'a chave inclui o arquivo: a mesma tabela em outro arquivo e violacao nova');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('storage.from e Array.from nao sao tabela', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': "sb.storage.from('meu-bucket').upload(); Array.from('abc');\n" });
  try { assert.equal(rodar(dir), 0); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('arquivo de teste nao e varrido (fixture pode citar tabela que nao existe)', () => {
  const dir = repoDeBrinquedo({ 'src/a.test.ts': "sb.from('tabela_fantasma').select();\n" });
  try { assert.equal(rodar(dir), 0); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('schema ausente = exit 2 (nunca 0: sem a fonte, o guard nao prova nada)', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': "sb.from('cursos').select();\n" });
  try {
    fs.rmSync(path.join(dir, 'inventario/estado/schema-declarado.json'));
    assert.equal(rodar(dir), 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('schema sem tabela nenhuma = exit 2 (arquivo truncado nao vira "tudo errado")', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': "sb.from('cursos').select();\n" });
  try {
    fs.writeFileSync(path.join(dir, 'inventario/estado/schema-declarado.json'), '{"tabelas":{},"funcoes":{}}');
    assert.equal(rodar(dir), 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('--prune-obsolete limpa entrada que nao existe mais', () => {
  const dir = repoDeBrinquedo(
    { 'src/a.ts': "sb.from('cursos').select();\n" },
    { schemaVersion: 1, violations: ['table:ja_corrigida:src/a.ts'] },
  );
  try {
    assert.equal(rodar(dir, '--prune-obsolete'), 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'baseline.json'), 'utf8')).violations, []);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('chaveDe e comparar: novas, obsoletas e atuais', () => {
  const chamadas = [{ kind: 'table', alvo: 'x', arquivo: 'src/a.ts', linha: 1 }];
  const conhecidos = objetosConhecidos(SCHEMA);
  const v = violacoes(chamadas, conhecidos);
  assert.equal(chaveDe(v[0]), 'table:x:src/a.ts');
  const c = comparar(v, { violations: ['table:velha:src/b.ts'] });
  assert.equal(c.novas.length, 1);
  assert.deepEqual(c.obsoletas, ['table:velha:src/b.ts']);
});

test('coletarChamadas registra alvo em variavel como nao conferido, nao como violacao', () => {
  const dir = repoDeBrinquedo({ 'src/a.ts': 'const t = nome; sb.from(t).select();\n' });
  try {
    const { chamadas, dinamicas } = coletarChamadas(dir, ['src']);
    assert.equal(chamadas.length, 0);
    assert.equal(dinamicas.length, 1);
    assert.equal(rodar(dir), 0, 'alvo em variavel nao pode inventar violacao');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ----------------------------------------------------------------- repo real
test('repo real: nenhum .from()/.rpc() aponta para objeto que o repo nao declara', () => {
  assert.equal(main(['--root', RAIZ]), 0, 'rode node scripts/ci/supabase-usage-guard.mjs para ver o que quebrou');
});

test('repo real: o guard esta de fato varrendo codigo (nao passou verde por nao achar nada)', () => {
  const { chamadas } = coletarChamadas(RAIZ);
  assert.ok(chamadas.length > 100, `so ${chamadas.length} chamadas encontradas — o guard perdeu o alvo`);
});
