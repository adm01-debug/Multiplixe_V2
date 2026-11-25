#!/usr/bin/env node
/**
 * Testa scripts/inventario/gerar-rotas.mjs com um repo de brinquedo (prova que o parser funciona)
 * E contra o repo real (prova que o arquivo commitado esta em dia). As duas coisas: um parser que
 * funciona com fixture e esta desatualizado no repo nao serve para nada.
 *
 * node --test scripts/ci/inventario-rotas.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gerarRotas, extrairChamadas, extrairImports, resolverImport, lerRotas, lerEntradasUi, serializar } from '../inventario/gerar-rotas.mjs';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');

function repoDeBrinquedo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-rotas-'));
  const escrever = (rel, texto) => {
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), texto);
  };
  escrever('src/App.tsx', `
import { lazy } from "react";
const Dash = lazy(() => import("./pages/Dash"));
const Secreta = lazy(() => import("./pages/Secreta"));
const Fantasma = lazy(() => import("./pages/NaoExiste"));
const App = () => (
  <Routes>
    <Route path="/" element={<RouteErrorBoundary routeName="Home"><Dash /></RouteErrorBoundary>} />
    <Route path="/secreta" element={<ProtectedRoute requireAdmin><Secreta /></ProtectedRoute>} />
    <Route path="/fantasma" element={<ProtectedRoute><Fantasma /></ProtectedRoute>} />
  </Routes>
);
`);
  escrever('src/pages/Dash.tsx', `
import { useCoisa } from "@/hooks/useCoisa";
import { supabase } from "@/lib/sb";
export default function Dash() {
  supabase.from("tabela_a").select();
  supabase.functions.invoke("edge-x");
  return <div />;
}
`);
  escrever('src/pages/Secreta.tsx', 'export default function Secreta() { return <div />; }\n');
  escrever('src/hooks/useCoisa.ts', `
import { supabase } from "@/lib/sb";
export const useCoisa = () => {
  supabase.from("tabela_b").select();
  supabase.rpc("minha_rpc");
  supabase.storage.from("meu-bucket").upload();
};
`);
  escrever('src/lib/sb.ts', 'export const supabase = {} as any;\n');
  escrever('src/components/CommandPalette.tsx', `
const PAGES = [
  { id: "dash", title: "Dash", url: "/", icon: X },
  { id: "morta", title: "Morta", url: "/rota-que-nao-existe", icon: X },
];
`);
  return dir;
}

test('repo de brinquedo: rotas, fecho de imports e problemas', () => {
  const dir = repoDeBrinquedo();
  try {
    const inv = gerarRotas(dir);
    assert.equal(inv.resumo.rotas, 3);
    assert.equal(inv.resumo.so_admin, 1);

    const home = inv.rotas.find((r) => r.caminho === '/');
    assert.equal(home.arquivo, 'src/pages/Dash.tsx');
    assert.equal(home.rotulo_tecnico, 'Home');
    // fecho: a pagina -> hook -> tabelas/rpc/bucket dos dois
    assert.deepEqual(home.tabelas, ['tabela_a', 'tabela_b']);
    assert.deepEqual(home.rpcs, ['minha_rpc']);
    assert.deepEqual(home.buckets, ['meu-bucket']);
    assert.deepEqual(home.edges, ['edge-x']);
    assert.ok(home.hooks.some((h) => h.nome === 'useCoisa'));

    const tipos = inv.problemas.map((p) => p.tipo);
    assert.ok(tipos.includes('rota_sem_arquivo'), 'rota com componente que nao resolve tem de virar problema');
    assert.ok(tipos.includes('rota_sem_entrada_na_ui'), '/secreta nao tem nenhuma entrada na UI');
    assert.ok(tipos.includes('entrada_ui_sem_rota'), 'item da paleta apontando para rota inexistente');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('rota com parametro nao e acusada de "sem entrada na UI"', () => {
  const dir = repoDeBrinquedo();
  try {
    fs.writeFileSync(path.join(dir, 'src/App.tsx'), `
const Dash = lazy(() => import("./pages/Dash"));
const App = () => (<Routes>
  <Route path="/item/:id" element={<ProtectedRoute><Dash /></ProtectedRoute>} />
</Routes>);
`);
    const inv = gerarRotas(dir);
    assert.equal(inv.problemas.filter((p) => p.tipo === 'rota_sem_entrada_na_ui').length, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('lazy tambem e lido na forma React.lazy(...)', () => {
  const dir = repoDeBrinquedo();
  try {
    fs.writeFileSync(path.join(dir, 'src/App.tsx'), `
const Dash = React.lazy(() => import("./pages/Dash"));
const Secreta = lazy(() => import("./pages/Secreta"));
const App = () => (<Routes>
  <Route path="/" element={<Dash />} />
  <Route path="/secreta" element={<Secreta />} />
</Routes>);
`);
    const rotas = lerRotas(dir);
    assert.deepEqual(rotas.map((r) => r.arquivo), ['src/pages/Dash.tsx', 'src/pages/Secreta.tsx']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('extrairChamadas: storage.from e bucket, .from e tabela; constante do modulo resolve', () => {
  const c = extrairChamadas(`
const TABELA = 'minha_tabela';
const BUCKET = 'meu_bucket';
sb.from(TABELA).select();
sb.storage.from(BUCKET).upload();
sb.from('direta').select();
fetch(\`\${URL}/rest/v1/por_rest\`);
fetch(\`\${URL}/functions/v1/edge-por-url\`);
`);
  assert.deepEqual([...new Set(c.tabelas)].sort(), ['direta', 'minha_tabela', 'por_rest']);
  assert.deepEqual([...new Set(c.buckets)], ['meu_bucket']);
  assert.deepEqual(c.edges, ['edge-por-url']);
});

test('extrairChamadas: constante declarada DENTRO de funcao nao e resolvida (na duvida, nao inventa)', () => {
  const c = extrairChamadas(`
function f() {
const INTERNA = 'tabela_interna';
  return sb.from(INTERNA);
}
`);
  assert.deepEqual(c.tabelas, []);
});

test('extrairImports ignora import type e pega import() dinamico', () => {
  const imps = extrairImports(`
import type { A } from "./a";
import { useB } from "@/hooks/useB";
const C = () => import("./c");
`);
  const specs = imps.map((i) => i.especificador);
  assert.ok(!specs.includes('./a'), 'import type nao existe em runtime');
  assert.ok(specs.includes('@/hooks/useB'));
  assert.ok(specs.includes('./c'));
  assert.ok(imps.find((i) => i.especificador === '@/hooks/useB').nomes.includes('useB'));
});

test('resolverImport: externo = null, local inexistente = undefined', () => {
  const dir = repoDeBrinquedo();
  try {
    const de = path.join(dir, 'src/pages/Dash.tsx');
    assert.equal(resolverImport(dir, de, 'react'), null);
    assert.equal(resolverImport(dir, de, './NaoExiste'), undefined);
    assert.equal(resolverImport(dir, de, '@/lib/sb'), path.join(dir, 'src/lib/sb.ts'));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ----------------------------------------------------------------- repo real
test('repo real: o inventario commitado esta em dia', { skip: process.env.INVENTARIO_CHECK ? false : 'frescor do inventario e trabalho do cron semanal (inventario-estado-semanal.yml); rode com INVENTARIO_CHECK=1 para cobrar aqui' }, () => {
  const commitado = path.join(RAIZ, 'inventario/estado/rotas.json');
  assert.ok(fs.existsSync(commitado), 'inventario/estado/rotas.json nao existe: rode node scripts/inventario/gerar-rotas.mjs');
  assert.equal(
    fs.readFileSync(commitado, 'utf8'),
    serializar(gerarRotas(RAIZ)),
    'rotas.json desatualizado: rode node scripts/inventario/gerar-rotas.mjs e commite',
  );
});

test('repo real: toda rota do App.tsx resolve para um arquivo que existe', () => {
  const rotas = lerRotas(RAIZ);
  assert.ok(rotas.length >= 20, `so ${rotas.length} rotas lidas — o parser perdeu o alvo em src/App.tsx`);
  for (const r of rotas) {
    if (!r.componente || r.redireciona) continue;
    assert.ok(r.arquivo, `rota ${r.caminho} (${r.componente}) nao resolve para arquivo`);
    assert.ok(fs.existsSync(path.join(RAIZ, r.arquivo)), `${r.arquivo} nao existe`);
  }
});

test('repo real: as entradas de UI foram lidas das 5 origens', () => {
  const origens = new Set(lerEntradasUi(RAIZ).map((e) => e.origem));
  for (const o of ['command-palette', 'menu-mobile', 'atalho-teclado', 'prefetch', 'navegacao-no-codigo']) {
    assert.ok(origens.has(o), `nenhuma entrada de "${o}" foi lida — o parser perdeu o alvo`);
  }
});
