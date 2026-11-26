#!/usr/bin/env node
/**
 * Barreira contra o retorno de edge function temporaria que expoe o service_role.
 *
 * `migrate-helper` nasceu como funcao de migracao, com chave de acesso fixa no
 * arquivo e `action=credentials` devolvendo `SUPABASE_SERVICE_ROLE_KEY`. Ela nunca
 * esteve publicada e saiu do repo em 26/11/2026 ? mas o editor do Lovable
 * reintroduz arquivo removido (aconteceu em 08/11/2026). Este teste deixa a CI
 * vermelha se voltar.
 *
 * node --test scripts/ci/edge-funcoes-proibidas.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');

const PROIBIDAS = [
  ['migrate-helper', 'devolvia SUPABASE_SERVICE_ROLE_KEY para quem acertasse a chave fixa do arquivo'],
];

test('funcoes proibidas nao existem em supabase/functions', () => {
  for (const [slug, motivo] of PROIBIDAS) {
    const dir = path.join(RAIZ, 'supabase', 'functions', slug);
    assert.equal(fs.existsSync(dir), false, `supabase/functions/${slug} nao pode existir: ${motivo}`);
  }
});

test('supabase/config.toml nao declara funcoes proibidas', () => {
  const config = fs.readFileSync(path.join(RAIZ, 'supabase', 'config.toml'), 'utf8');
  for (const [slug] of PROIBIDAS) {
    assert.equal(config.includes(`[functions.${slug}]`), false, `supabase/config.toml nao pode declarar [functions.${slug}]`);
  }
});
