#!/usr/bin/env node
/**
 * Testa scripts/inventario/mudou-conteudo.mjs: o que decide se o cron semanal abre PR. Errar para
 * o lado frouxo enche o repo de PR de ruido; errar para o lado apertado esconde mudanca real.
 *
 * node --test scripts/ci/inventario-mudou.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mudou, semCarimbos, PADRAO } from '../inventario/mudou-conteudo.mjs';

const comparar = (antes, depois) => mudou(['x.json'], () => JSON.stringify(antes), () => JSON.stringify(depois));

test('so o carimbo de data mudou: nao abre PR', () => {
  assert.equal(comparar({ medido_em: 'a', gerado_em: 'a', tabelas: [1] }, { medido_em: 'b', gerado_em: 'b', tabelas: [1] }), false);
});

test('tabela nova: abre PR', () => {
  assert.equal(comparar({ tabelas: ['a'] }, { tabelas: ['a', 'b'] }), true);
});

test('telemetria rolante de 7 dias: nao abre PR', () => {
  const antes = { cron: { jobs: [{ nome: 'j', ativo: true, execucoes_7d: 100, falhas_7d: 9, taxa_falha_7d_pct: 9 }] } };
  const depois = { cron: { jobs: [{ nome: 'j', ativo: true, execucoes_7d: 120, falhas_7d: 11, taxa_falha_7d_pct: 9.2 }] } };
  assert.equal(comparar(antes, depois), false);
});

test('job que entra ou sai do alerta cron_falhando: abre PR', () => {
  const antes = { alertas: [{ tipo: 'cron_falhando', detalhe: ['j1 (9.0% em 7d)'] }] };
  const mesmoJob = { alertas: [{ tipo: 'cron_falhando', detalhe: ['j1 (12.0% em 7d)'] }] };
  const outroJob = { alertas: [{ tipo: 'cron_falhando', detalhe: ['j1 (9.0% em 7d)', 'j2 (30.0% em 7d)'] }] };
  assert.equal(comparar(antes, mesmoJob), false, 'so a porcentagem mudando e ruido');
  assert.equal(comparar(antes, outroJob), true, 'job novo na lista e mudanca real');
});

test('historico do cron (linhas/bytes) e ignorado, mas linhas de TABELA nao', () => {
  assert.equal(comparar(
    { cron: { historico: { linhas: 100, bytes: 10 } } },
    { cron: { historico: { linhas: 900, bytes: 90 } } },
  ), false);
  assert.equal(comparar({ tabelas: [{ nome: 't', linhas: 10 }] }, { tabelas: [{ nome: 't', linhas: 11 }] }), true,
    'contagem real de linhas de tabela e mudanca estrutural');
});

test('alerta cron_parado aparecer/desaparecer conta; a lista de horas nao', () => {
  const sem = { alertas: [] };
  const com = { alertas: [{ tipo: 'cron_parado', detalhe: ['2026-11-01T03:00Z'] }] };
  const outrasHoras = { alertas: [{ tipo: 'cron_parado', detalhe: ['2026-11-08T05:00Z', '2026-11-08T06:00Z'] }] };
  assert.equal(comparar(sem, com), true);
  assert.equal(comparar(com, outrasHoras), false, 'a janela rolante muda as horas toda semana');
});

test('arquivo novo ou apagado conta como mudanca', () => {
  assert.equal(mudou(['x.json'], () => null, () => '{"a":1}'), true);
  assert.equal(mudou(['x.json'], () => '{"a":1}', () => null), true);
});

test('ordem das chaves nao conta (JSON canonico)', () => {
  assert.equal(mudou(['x.json'], () => '{"a":1,"b":2}', () => '{"b":2,"a":1}'), false);
});

test('texto que nao e JSON e comparado como texto', () => {
  assert.equal(semCarimbos('nao e json'), 'nao e json');
  assert.equal(mudou(['x.md'], () => 'a', () => 'b'), true);
});

test('o padrao cobre os tres arquivos do cron semanal', () => {
  assert.deepEqual(PADRAO, [
    'inventario/estado/banco.json',
    'inventario/estado/rotas.json',
    'inventario/estado/edges.json',
  ]);
});

// Regressao: INDEX.md e baseline.json NAO podem ser usados para decidir se vale PR no cron semanal.
// INDEX.md embute "Commit: `<sha>`..." que muda a cada squash-merge (nao e JSON: semCarimbos devolve
// texto bruto e qualquer mudanca de SHA abre PR de ruido). baseline.json embute git.commit/branch
// que tambem mudam a cada commit e nao estao em IGNORADOS.
test('INDEX.md com commit diferente nao deve ser tratado como mudanca estrutural (trava regressao)', () => {
  const antes = 'Commit: `abc123` · branch `main` · 2026-11-01\n\n## Tabelas\n- users (5 colunas)\n';
  const depois = 'Commit: `def456` · branch `main` · 2026-11-09\n\n## Tabelas\n- users (5 colunas)\n';
  // mudou-conteudo.mjs nao filtra nada de texto: o gating nao deve incluir INDEX.md
  // Este teste documenta o comportamento que CAUSARIA falso-positivo se INDEX.md fosse incluido.
  assert.equal(mudou(['x.md'], () => antes, () => depois), true,
    'mudou-conteudo.mjs trata texto bruto como mudanca — INDEX.md NAO pode entrar no gating do cron');
});

test('baseline.json com git.commit diferente sozinho nao e mudanca estrutural (trava regressao)', () => {
  const base = { format_version: 1, nos: 150, arestas: 300 };
  const git1 = { commit: 'abc123', branch: 'main', data_commit: '2026-11-01T00:00:00Z', ultimos_commits: [] };
  const git2 = { commit: 'def456', branch: 'main', data_commit: '2026-11-09T00:00:00Z', ultimos_commits: [] };
  // git.commit/branch/data_commit NAO estao em IGNORADOS: mudou-conteudo nao os filtra.
  // Portanto baseline.json NAO pode entrar no gating do cron semanal.
  assert.equal(
    mudou(['x.json'], () => JSON.stringify({ ...base, git: git1 }), () => JSON.stringify({ ...base, git: git2 })),
    true,
    'git.commit/branch nao sao filtrados por semCarimbos — baseline.json NAO pode entrar no gating do cron',
  );
});
