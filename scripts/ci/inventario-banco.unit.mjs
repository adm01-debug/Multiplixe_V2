#!/usr/bin/env node
/**
 * Testa as funcoes puras de scripts/inventario/gerar-banco.mjs e varre o banco.sql: e o unico
 * script do repo que fala com o banco oficial, e ele roda com um papel que passa por cima do RLS.
 * Se o SQL ganhar escrita ou campo sensivel, o teste barra aqui.
 *
 * node --test scripts/ci/inventario-banco.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {
  extrairInventario, conferirOrigem, montarInventario, compararEdges, rodaTodoDia,
  versoesDoRepo, PARECE_CREDENCIAL, PROJETO_OFICIAL, LIMIARES, RETRY, esperaDoRetry, chamarApi,
} from '../inventario/gerar-banco.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const SQL = fs.readFileSync(path.join(RAIZ, 'scripts/inventario/banco.sql'), 'utf8');

const base = (over = {}) => ({
  format_version: 1,
  medido_em: '2026-11-08T00:00:00Z',
  resumo: { tabelas_public: 2, ledger_registros: 49, ledger_versao_max: '20260727133050' },
  tabelas: [
    { nome: 'cursos', rls: true, policies: 2, triggers: 0, indices: 1, linhas: 10, linhas_exatas: true, bytes: 8192, citada_no_banco: true },
    { nome: 'alunos', rls: true, policies: 1, triggers: 0, indices: 1, linhas: 5, linhas_exatas: true, bytes: 8192, citada_no_banco: true },
  ],
  funcoes: [{ nome: 'has_role', security_definer: true, tem_search_path: true }],
  cron: { jobs: [], horas_paradas_7d: [], historico: { linhas: 0, mais_de_7_dias: 0, mais_antigo: null, bytes: 0 } },
  ...over,
});

test('extrairInventario aceita os envelopes que as tres origens produzem', () => {
  const direto = base();
  assert.equal(extrairInventario(direto).format_version, 1);
  assert.equal(extrairInventario(JSON.stringify(direto)).format_version, 1);
  assert.equal(extrairInventario({ rows: [{ inventario: direto }] }).format_version, 1);
  assert.equal(extrairInventario([{ inventario: direto }]).format_version, 1);
  assert.equal(extrairInventario({ result: { content: [{ type: 'text', text: JSON.stringify(direto) }] } }).format_version, 1);
});

test('extrairInventario recusa versao errada, chave faltando e lista vazia', () => {
  assert.throws(() => extrairInventario(base({ format_version: 2 })), /format_version 2/);
  const { cron, ...semCron } = base();
  assert.throws(() => extrairInventario(semCron), /sem as chaves: cron/);
  assert.throws(() => extrairInventario(base({ tabelas: [] })), /sem tabelas/);
});

test('conferirOrigem aceita o banco oficial', () => {
  // 49 arquivos no repo contra 49 registros no ledger: dentro da tolerancia de 10%.
  const versoes = [...Array.from({ length: 48 }, (_, i) => `202601${String(i + 10).padStart(2, '0')}000000`), '20260727133050'];
  const o = conferirOrigem(base(), ['cursos', 'alunos'], versoes);
  assert.equal(o.tabelas_em_comum_com_types, 2);
  assert.equal(o.ledger_registros, 49);
});

test('conferirOrigem recusa outro banco com schema diferente', () => {
  assert.throws(
    () => conferirOrigem(base(), ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'cursos']),
    /nao parece ser do banco oficial/,
  );
});

test('conferirOrigem recusa banco irmao: mesmas tabelas, ledger parado', () => {
  const versoes = Array.from({ length: 49 }, (_, i) => `202601${String(i + 10).padStart(2, '0')}000000`);
  assert.throws(
    () => conferirOrigem(base({ resumo: { ledger_registros: 3, ledger_versao_max: '20250101000000' } }), ['cursos', 'alunos'], versoes),
    /ledger com 3 registros/,
  );
});

test('conferirOrigem exige que a resposta traga o resumo do ledger', () => {
  assert.throws(
    () => conferirOrigem(base({ resumo: {} }), ['cursos', 'alunos'], ['20260101000000']),
    /ledger_versao_max/,
  );
});

test('montarInventario: orfa = 0 linhas + nao citada no banco + sem uso no codigo', () => {
  const dado = base({
    tabelas: [...base().tabelas, { nome: 'lixo', rls: true, policies: 1, triggers: 0, indices: 0, linhas: 0, linhas_exatas: true, bytes: 0, citada_no_banco: false }],
  });
  const uso = { cursos: { src: 3, edges: 0 }, alunos: { src: 1, edges: 0 }, lixo: { src: 0, edges: 0 } };
  assert.deepEqual(montarInventario(dado, uso).tabelas_orfas.lista, ['lixo']);
});

test('montarInventario: alertas de RLS, policy, secdef, cron e drift com o types.ts', () => {
  const dado = base({
    tabelas: [
      { nome: 'aberta', rls: false, policies: 0, triggers: 0, indices: 0, linhas: 1, linhas_exatas: true, bytes: 0, citada_no_banco: true },
      { nome: 'trancada', rls: true, policies: 0, triggers: 0, indices: 0, linhas: 1, linhas_exatas: true, bytes: 0, citada_no_banco: true },
    ],
    funcoes: [{ nome: 'f_aberta', security_definer: true, tem_search_path: false }],
    cron: {
      jobs: [
        { nome: 'quebrado', agenda: '*/5 * * * *', ativo: true, execucoes_24h: 10, execucoes_7d: 100, falhas_7d: 90, taxa_falha_7d_pct: 90 },
        { nome: 'mudo', agenda: '0 3 * * *', ativo: true, execucoes_24h: 0, execucoes_7d: 0, falhas_7d: 0, taxa_falha_7d_pct: 0 },
      ],
      horas_paradas_7d: [{ hora: '2026-11-07T03:00Z', execucoes: 4, falhas: 4 }],
      historico: { linhas: 1, mais_de_7_dias: LIMIARES.historicoCronMaisDe7Dias + 1, mais_antigo: null, bytes: 1 },
    },
  });
  const uso = { aberta: { src: 1, edges: 0 }, trancada: { src: 1, edges: 0 } };
  const edges = compararEdges([{ slug: 'publicada-sem-codigo', version: 1, status: 'ACTIVE', verify_jwt: true, updated_at: '2026-01-01T00:00:00Z' }], ['no-repo-sem-deploy']);
  const porTipo = Object.fromEntries(montarInventario(dado, uso, edges, ['aberta', 'trancada', 'so_no_types']).alertas.map((a) => [a.tipo, a.detalhe]));
  assert.deepEqual(porTipo.tabela_sem_rls, ['aberta']);
  assert.deepEqual(porTipo.rls_sem_policy, ['trancada']);
  assert.deepEqual(porTipo.funcao_secdef_sem_search_path, ['f_aberta']);
  assert.deepEqual(porTipo.cron_falhando, ['quebrado (90% em 7d)']);
  assert.deepEqual(porTipo.cron_sem_execucao, ['mudo'], 'job diario sem execucao em 24 h');
  assert.deepEqual(porTipo.cron_parado, ['2026-11-07T03:00Z']);
  assert.ok(porTipo.historico_cron_sem_limpeza);
  assert.deepEqual(porTipo.edge_sem_deploy, ['no-repo-sem-deploy']);
  assert.deepEqual(porTipo.edge_publicada_sem_codigo, ['publicada-sem-codigo']);
  assert.deepEqual(porTipo.tabela_so_no_types, ['so_no_types']);
});

test('compararEdges: sem consulta a API, publicadas fica null (nunca "0 publicadas")', () => {
  const e = compararEdges(null, ['a', 'b']);
  assert.equal(e.publicadas, null);
  assert.equal(e.no_repo, 2);
  assert.equal(e.no_repo_sem_deploy, null);
});

test('rodaTodoDia entende agenda diaria, semanal e por segundo', () => {
  assert.equal(rodaTodoDia('0 3 * * *'), true);
  assert.equal(rodaTodoDia('*/5 * * * *'), true);
  assert.equal(rodaTodoDia('30 seconds'), true);
  assert.equal(rodaTodoDia('0 9 * * 1'), false, 'semanal nao roda todo dia');
  assert.equal(rodaTodoDia('0 0 1 * *'), false, 'mensal nao roda todo dia');
  assert.equal(rodaTodoDia(''), false);
});

test('esperaDoRetry: 429 respeita Retry-After, 5xx faz backoff, 4xx desiste', () => {
  assert.equal(esperaDoRetry(429, '2', 1), 2_000, 'Retry-After em segundos manda');
  assert.equal(esperaDoRetry(429, null, 1), RETRY.baseMs, 'sem cabecalho cai no backoff');
  assert.equal(esperaDoRetry(429, '0', 1), 0);
  assert.equal(esperaDoRetry(503, null, 3), RETRY.baseMs * 4, 'backoff dobra a cada tentativa');
  assert.equal(esperaDoRetry(500, null, 99), RETRY.maxMs, 'backoff tem teto');
  assert.equal(esperaDoRetry(401, null, 1), null, 'erro do pedido nao se repete');
  assert.equal(esperaDoRetry(404, null, 1), null);
});

// ------------------------------------------------- chamarApi contra servidor local
// SUPABASE_API_URL existe exatamente para isto (gerar-banco.mjs:36): exercitar o retry
// sem tocar na Management API de verdade.
async function comServidorLocal(respostas, cenario) {
  const vistas = [];
  const servidor = http.createServer((req, res) => {
    let corpo = '';
    req.on('data', (pedaco) => { corpo += pedaco; });
    req.on('end', () => {
      vistas.push({ url: req.url, auth: req.headers.authorization, corpo });
      const r = respostas[Math.min(vistas.length - 1, respostas.length - 1)];
      res.writeHead(r.status, { 'Content-Type': 'application/json', ...(r.headers || {}) });
      res.end(r.corpo ?? '{"ok":true}');
    });
  });
  await new Promise((pronto) => servidor.listen(0, '127.0.0.1', pronto));

  const antes = { ...process.env };
  process.env.SUPABASE_API_URL = `http://127.0.0.1:${servidor.address().port}`;
  process.env.SUPABASE_ACCESS_TOKEN = 'sbp_token_de_teste';
  process.env.SUPABASE_PROJECT_REF = 'projeto-de-teste';
  process.env.INVENTARIO_PERMITIR_OUTRO_PROJETO = '1';
  try {
    return await cenario(vistas);
  } finally {
    servidor.close();
    for (const chave of ['SUPABASE_API_URL', 'SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_REF', 'INVENTARIO_PERMITIR_OUTRO_PROJETO']) {
      if (antes[chave] === undefined) delete process.env[chave]; else process.env[chave] = antes[chave];
    }
  }
}

test('chamarApi repete 429 e devolve a resposta que deu certo', async () => {
  await comServidorLocal(
    [{ status: 429, headers: { 'Retry-After': '0' } }, { status: 429, headers: { 'Retry-After': '0' } }, { status: 200, corpo: '{"deu":"certo"}' }],
    async (vistas) => {
      const corpo = { query: 'select 1' };
      const saida = await chamarApi('/database/query/read-only', { method: 'POST', body: JSON.stringify(corpo) });
      assert.deepEqual(saida, { deu: 'certo' });
      assert.equal(vistas.length, 3, 'duas tentativas bloqueadas + a que passou');
      assert.equal(vistas[2].auth, 'Bearer sbp_token_de_teste');
      assert.equal(vistas[2].url, '/v1/projects/projeto-de-teste/database/query/read-only');
      assert.equal(vistas[2].corpo, JSON.stringify(corpo), 'o corpo e reenviado igual');
    },
  );
});

test('chamarApi desiste depois de RETRY.tentativas e nao vaza o corpo do erro', async () => {
  await comServidorLocal(
    [{ status: 429, headers: { 'Retry-After': '0' } }],
    async (vistas) => {
      await assert.rejects(
        chamarApi('/functions'),
        (erro) => erro.message === 'Management API /functions respondeu HTTP 429',
        'mensagem seca, sem nada do corpo',
      );
      assert.equal(vistas.length, RETRY.tentativas);
    },
  );

  await comServidorLocal(
    [{ status: 401, corpo: '{"message":"token sbp_vazado nao confere"}' }],
    async (vistas) => {
      await assert.rejects(
        chamarApi('/functions'),
        (erro) => erro.message === 'Management API /functions respondeu HTTP 401',
        'erro do pedido falha na primeira',
      );
      assert.equal(vistas.length, 1, 'sem retry em 401');
    },
  );
});

test('PARECE_CREDENCIAL pega Bearer, JWT e sb_secret_', () => {
  assert.match('Authorization: Bearer sbp_0123456789abcdefghijklmno', PARECE_CREDENCIAL);
  assert.match('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def', PARECE_CREDENCIAL);
  assert.match('sb_secret_xyz', PARECE_CREDENCIAL);
  assert.doesNotMatch('{"tabelas":[{"nome":"cursos"}]}', PARECE_CREDENCIAL);
});

// ------------------------------------------------------- varredura do banco.sql
test('banco.sql nao escreve nada', () => {
  const sem = /\b(INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|TRUNCATE|DROP\s+|ALTER\s+|CREATE\s+(TABLE|FUNCTION|POLICY|INDEX|VIEW|TYPE|TRIGGER)|GRANT\s+|REVOKE\s+)/i;
  assert.doesNotMatch(SQL.replace(/--[^\n]*/g, ''), sem, 'banco.sql e SOMENTE leitura');
});

test('banco.sql nao le o command do cron (que leva URL e chave) nem campo sensivel', () => {
  const corpo = SQL.replace(/--[^\n]*/g, '');
  assert.doesNotMatch(corpo, /'command'/, "de cron.job sai so o nome das funcoes, nunca o command");
  for (const proibido of ['password', 'token', 'secret', 'api_key', 'qr_code', 'phone']) {
    assert.doesNotMatch(corpo, new RegExp(`'${proibido}'`, 'i'), `banco.sql nao pode devolver ${proibido}`);
  }
});

test('banco.sql pede o ledger (e o que prova a identidade do banco)', () => {
  assert.match(SQL, /ledger_versao_max/);
  assert.match(SQL, /ledger_registros/);
  assert.match(SQL, /supabase_migrations\.schema_migrations/);
});

test('repo real: o projeto oficial do script e o do supabase/config.toml', () => {
  const config = fs.readFileSync(path.join(RAIZ, 'supabase/config.toml'), 'utf8');
  const ref = (config.match(/project_id\s*=\s*"([^"]+)"/) || [])[1];
  assert.equal(PROJETO_OFICIAL, ref, 'PROJETO_OFICIAL divergiu de supabase/config.toml');
});

test('repo real: versoesDoRepo le as migrations com carimbo de 14 digitos', () => {
  const v = versoesDoRepo(RAIZ);
  assert.ok(v.length >= 40, `so ${v.length} migrations com carimbo`);
  assert.ok(v.every((x) => /^\d{14}$/.test(x)));
});
