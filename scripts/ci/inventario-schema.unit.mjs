#!/usr/bin/env node
/**
 * Testa os dois leitores do schema declarado (types.ts e replay das migrations) e o inventario que
 * eles alimentam. Fixture prova o parser; repo real prova que o arquivo commitado esta em dia.
 *
 * node --test scripts/ci/inventario-schema.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { lerTypes, bloco, chavesDeNivel1, camposDe } from '../lib/types-supabase.mjs';
import { lerMigrations, tirarComentarios, quebrarComandos } from '../lib/migrations-supabase.mjs';
import { gerarSchema, serializar } from '../inventario/gerar-schema.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');

const TYPES_FIXTURE = `export type Database = {
  public: {
    Tables: {
      cursos: {
        Row: {
          id: string
          titulo: string
          publicado: boolean | null
        }
        Insert: { id?: string }
      }
      alunos: {
        Row: {
          id: string
          nome: string
        }
      }
    }
    Views: {
      cursos_publicos: {
        Row: { id: string | null }
      }
    }
    Functions: {
      has_role: {
        Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
  }
}
`;

function repoDeBrinquedo(migrations = {}, types = TYPES_FIXTURE) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-schema-'));
  fs.mkdirSync(path.join(dir, 'src/integrations/supabase'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src/integrations/supabase/types.ts'), types);
  fs.mkdirSync(path.join(dir, 'supabase/migrations'), { recursive: true });
  for (const [nome, sql] of Object.entries(migrations)) fs.writeFileSync(path.join(dir, 'supabase/migrations', nome), sql);
  return dir;
}

test('types.ts: tabelas, colunas, views, funcoes e enums', () => {
  const dir = repoDeBrinquedo();
  try {
    const s = lerTypes(undefined, dir);
    assert.deepEqual(Object.keys(s.tabelas).sort(), ['alunos', 'cursos']);
    assert.deepEqual(Object.keys(s.tabelas.cursos.colunas).sort(), ['id', 'publicado', 'titulo']);
    assert.deepEqual(Object.keys(s.views), ['cursos_publicos']);
    assert.deepEqual(s.funcoes.has_role.args, ['_role', '_user_id']);
    assert.equal(s.funcoes.has_role.retorno, 'boolean');
    assert.deepEqual(s.enums.app_role, ['admin', 'user']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

    test('types.ts: enum com valor quebrado em varias linhas', () => {
      const types = TYPES_FIXTURE.replace(
        'app_role: "admin" | "user"',
        'app_role:\n        | "admin"\n        | "gestor"\n        | "user"',
      );
      const dir = repoDeBrinquedo({}, types);
      try {
        const s = lerTypes(undefined, dir);
        assert.deepEqual(s.enums.app_role, ['admin', 'gestor', 'user']);
      } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    });

test('types.ts: bloco/chavesDeNivel1/camposDe sao estaveis com objeto aninhado', () => {
  const corpo = bloco('a: { b: { c: 1 }, d: { e: 2 } }', 'a');
  assert.deepEqual(chavesDeNivel1(corpo).map((x) => x.nome), ['b', 'd']);
  assert.deepEqual(camposDe('  x: string\n  y: number | null\n'), { x: 'string', y: 'number | null' });
});

test('replay: CREATE/DROP/RLS/policy/trigger/enum/cron/bucket', () => {
  const dir = repoDeBrinquedo({
    '20260101000000_base.sql': `
CREATE TABLE public.cursos (id uuid primary key);
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura" ON public.cursos FOR SELECT USING (true);
CREATE TABLE public.lixo (id uuid);
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
`,
    '20260102000000_depois.sql': `
DROP TABLE public.lixo;
CREATE TABLE public.alunos (id uuid primary key);
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TYPE public.app_role ADD VALUE 'gestor';
CREATE OR REPLACE FUNCTION public.f_segura() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN; PERFORM 1; END;
$$;
CREATE OR REPLACE FUNCTION public.f_aberta() RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN; PERFORM 1; END;
$$;
SELECT cron.schedule('diario', '0 3 * * *', $$ SELECT net.http_post('https://x/functions/v1/minha-edge') $$);
`,
  });
  try {
    const s = lerMigrations(dir);
    assert.deepEqual(Object.keys(s.tabelas).sort(), ['alunos', 'cursos'], 'DROP TABLE tem de remover a tabela');
    assert.equal(s.tabelas.cursos.rls, true);
    assert.deepEqual(s.tabelas.cursos.policies, ['leitura']);
    assert.deepEqual(s.enums['app_role'], ['admin', 'gestor', 'user']);
    assert.equal(s.funcoes.f_segura.search_path, 'public');
    assert.equal(s.funcoes.f_aberta.search_path, null);
    assert.equal(s.funcoes.f_aberta.security_definer, true);
    assert.equal(s.cron.diario.agenda, '0 3 * * *');
    assert.equal(s.cron.diario.chama_edge, 'minha-edge');
    assert.equal(s.buckets.avatars.publico, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('replay: policy em tabela que o repo nunca cria NAO inventa a tabela', () => {
  const dir = repoDeBrinquedo({
    '20260101000000_x.sql': 'CREATE POLICY "p" ON public.user_roles FOR SELECT USING (true);\n',
  });
  try {
    const s = lerMigrations(dir);
    assert.deepEqual(Object.keys(s.tabelas), [], 'tabela so referenciada nao entra como criada');
    assert.deepEqual(Object.keys(s.referenciadas_sem_create), ['user_roles']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('replay: trigger em outro schema nao vira tabela do public', () => {
  const dir = repoDeBrinquedo({
    '20260101000000_x.sql': 'CREATE TRIGGER t AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.f();\n',
  });
  try {
    const s = lerMigrations(dir);
    assert.deepEqual(Object.keys(s.tabelas), []);
    assert.deepEqual(s.objetos_de_outros_schemas, ['auth.users']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('replay: comentario nao conta como comando (o -- rollback: DROP ... e so texto)', () => {
  const dir = repoDeBrinquedo({
    '20260101000000_x.sql': 'CREATE TABLE public.cursos (id uuid);\n-- rollback: DROP TABLE public.cursos;\n',
  });
  try {
    assert.deepEqual(Object.keys(lerMigrations(dir).tabelas), ['cursos']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('replay: nome fora do padrao e migration vazia viram problema', () => {
  const dir = repoDeBrinquedo({ 'sem_carimbo.sql': 'CREATE TABLE public.a (id uuid);\n', '20260101000000_vazia.sql': '\n' });
  try {
    const tipos = lerMigrations(dir).problemas.map((p) => p.tipo);
    assert.ok(tipos.includes('nome_fora_do_padrao'));
    assert.ok(tipos.includes('migration_vazia'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('tirarComentarios preserva string e quebrarComandos respeita corpo $$', () => {
  assert.match(tirarComentarios("SELECT '-- nao e comentario';"), /-- nao e comentario/);
  const cmds = quebrarComandos("CREATE FUNCTION f() AS $$ BEGIN; a; b; END; $$; SELECT 1;");
  assert.equal(cmds.length, 2, 'os ; de dentro do $$ nao quebram comando');
});

test('gerarSchema: alertas de RLS, drift e bucket publico', () => {
  const dir = repoDeBrinquedo({
    '20260101000000_x.sql': `
CREATE TABLE public.cursos (id uuid);
CREATE TABLE public.alunos (id uuid);
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.fora_do_types (id uuid);
ALTER TABLE public.fora_do_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "p" ON public.fora_do_types FOR SELECT USING (true);
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
`,
  });
  try {
    const inv = gerarSchema(dir);
    const porTipo = Object.fromEntries(inv.alertas.map((a) => [a.tipo, a.detalhe]));
    assert.deepEqual(porTipo.tabela_sem_rls, ['cursos'], 'tabela criada sem ENABLE RLS');
    assert.deepEqual(porTipo.rls_sem_policy, ['alunos'], 'RLS ligado e nenhuma policy nega tudo');
    assert.deepEqual(porTipo.tabela_so_nas_migrations, ['fora_do_types']);
    assert.deepEqual(porTipo.bucket_publico, ['avatars']);
    assert.deepEqual(inv.drift.so_no_types, [], 'o types.ts da fixture nao tem tabela a mais');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ----------------------------------------------------------------- repo real
test('repo real: schema-declarado.json commitado esta em dia', { skip: process.env.INVENTARIO_CHECK ? false : 'frescor do inventario e trabalho do cron semanal (inventario-estado-semanal.yml); rode com INVENTARIO_CHECK=1 para cobrar aqui' }, () => {
  const commitado = path.join(RAIZ, 'inventario/estado/schema-declarado.json');
  assert.ok(fs.existsSync(commitado), 'rode node scripts/inventario/gerar-schema.mjs');
  assert.equal(fs.readFileSync(commitado, 'utf8'), serializar(gerarSchema(RAIZ)),
    'schema-declarado.json desatualizado: rode node scripts/inventario/gerar-schema.mjs e commite');
});

test('repo real: o types.ts continua legivel (se o formato mudar, o parser avisa aqui)', () => {
  const s = lerTypes(undefined, RAIZ);
  assert.ok(Object.keys(s.tabelas).length >= 50, `so ${Object.keys(s.tabelas).length} tabelas lidas do types.ts`);
  assert.ok(Object.keys(s.funcoes).length >= 20, `so ${Object.keys(s.funcoes).length} funcoes lidas do types.ts`);
  assert.ok(s.enums.app_role?.includes('admin'), 'o enum app_role tem de ter admin');
});

test('repo real: nenhuma tabela criada por migration ficou sem RLS', () => {
  const inv = gerarSchema(RAIZ);
  const semRls = inv.alertas.find((a) => a.tipo === 'tabela_sem_rls')?.detalhe ?? [];
  assert.deepEqual(semRls, [], `tabela(s) sem RLS nas migrations: ${semRls.join(', ')}`);
});
