#!/usr/bin/env node
/**
 * Testa scripts/ai-context/gerar.mjs rodando o gerador DE VERDADE (execFileSync) sobre repos
 * sinteticos: determinismo, tolerancia a falha, e as extracoes que o INDEX.md promete. Se o
 * gerador nao for determinista, o commit do contexto viraria ruido toda semana.
 *
 * node --test scripts/ci/ai-context.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const GERADOR = path.join(RAIZ, 'scripts/ai-context/gerar.mjs');

function gerar(raiz, out = 'inventario/ia') {
  execFileSync(process.execPath, [GERADOR, '--root', raiz, '--out', out, '--quiet'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const dir = path.resolve(raiz, out);
  return Object.fromEntries(fs.readdirSync(dir).sort().map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]));
}

function repoDeBrinquedo(extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-ctx-'));
  const arquivos = {
    'package.json': JSON.stringify({ name: 'brinquedo', scripts: { dev: 'vite' } }),
    'src/main.tsx': 'import App from "./App";\n',
    'src/App.tsx': 'import Card from "@/components/Card";\nexport default function App() { return (<div><Card /></div>); }\n',
    'src/components/Card.tsx': `
import { useDados } from "@/hooks/useDados";
export default function Card() {
  // TODO: paginar
  const x: any = useDados();
  console.log(x);
  return (<span />);
}
`,
    'src/components/Orfao.tsx': 'export default function Orfao() { return (<i />); }\n',
    'src/hooks/useDados.ts': `
import { sb } from "@/lib/sb";
export const useDados = () => {
  sb.from("cursos").select();
  sb.rpc("has_role");
  sb.functions.invoke("minha-edge");
  return import.meta.env.VITE_ALGO;
};
`,
    'src/lib/sb.ts': 'export const sb = {} as any;\n',
    ...extra,
  };
  for (const [rel, texto] of Object.entries(arquivos)) {
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), texto);
  }
  return dir;
}

test('gera os 6 arquivos e o manifest tem hash de cada um', () => {
  const dir = repoDeBrinquedo();
  try {
    const saida = gerar(dir);
    assert.deepEqual(Object.keys(saida).sort(), ['INDEX.md', 'baseline.json', 'componentes.json', 'grafo.json', 'hooks.json', 'manifest.json']);
    const manifest = JSON.parse(saida['manifest.json']);
    assert.deepEqual(Object.keys(manifest.arquivos).sort(), ['INDEX.md', 'baseline.json', 'componentes.json', 'grafo.json', 'hooks.json']);
    assert.deepEqual(manifest.erros, [], 'nenhuma secao pode falhar num repo valido');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('deterministico: duas execucoes dao os mesmos bytes (fora o gerado_em do manifest)', () => {
  const dir = repoDeBrinquedo();
  // Saida FORA do repo varrido, como no uso real (inventario/ fica na lista de pastas ignoradas):
  // gerar duas vezes para dentro faria a 2a execucao contar os arquivos da 1a.
  const fora = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-ctx-out-'));
  try {
    const a = gerar(dir, path.join(fora, 'a'));
    const b = gerar(dir, path.join(fora, 'b'));
    for (const nome of Object.keys(a)) {
      if (nome === 'manifest.json') continue;
      assert.equal(a[nome], b[nome], `${nome} mudou entre duas execucoes`);
    }
    const [ma, mb] = [JSON.parse(a['manifest.json']), JSON.parse(b['manifest.json'])];
    assert.deepEqual(ma.arquivos, mb.arquivos, 'os hashes tem de ser iguais');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(fora, { recursive: true, force: true });
  }
});

test('hooks: o que o hook toca, quem o usa e se tem teste', () => {
  const dir = repoDeBrinquedo({ 'src/hooks/useDados.test.ts': 'import { useDados } from "./useDados";\n' });
  try {
    const h = JSON.parse(gerar(dir)['hooks.json']).hooks.useDados;
    assert.equal(h.arquivo, 'src/hooks/useDados.ts');
    assert.deepEqual(h.tabelas, ['cursos']);
    assert.deepEqual(h.rpcs, ['has_role']);
    assert.deepEqual(h.edges, ['minha-edge']);
    assert.deepEqual(h.usado_por, ['src/components/Card.tsx']);
    assert.equal(h.coberto_por_teste, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('componentes: orfao e nome duplicado aparecem', () => {
  const dir = repoDeBrinquedo({ 'src/components/outro/Card.tsx': 'export default function Card() { return (<b />); }\nexport const Card2 = 1;\n' });
  try {
    const c = JSON.parse(gerar(dir)['componentes.json']);
    assert.ok(c.orfaos.includes('src/components/Orfao.tsx'));
    assert.ok('Card' in c.nomes_duplicados, 'dois arquivos exportando Card tem de aparecer como duplicado');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('grafo: ciclo de import e detectado', () => {
  const dir = repoDeBrinquedo({
    'src/lib/a.ts': 'import { b } from "./b";\nexport const a = () => b;\n',
    'src/lib/b.ts': 'import { a } from "./a";\nexport const b = () => a;\n',
  });
  try {
    const g = JSON.parse(gerar(dir)['grafo.json']);
    assert.equal(g.ciclos.total, 1, 'o ciclo a <-> b tem de ser achado');
    assert.deepEqual(g.ciclos.maiores[0], ['src/lib/a.ts', 'src/lib/b.ts']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('import() dinamico nao forma ciclo (lazy e resolvido em runtime)', () => {
  const dir = repoDeBrinquedo({
    'src/lib/prefetch.ts': 'export const mapa = { "/x": () => import("@/pages/X") };\n',
    'src/pages/X.tsx': 'import { mapa } from "@/lib/prefetch";\nexport default function X() { return (<i>{Object.keys(mapa).length}</i>); }\n',
  });
  try {
    const g = JSON.parse(gerar(dir)['grafo.json']);
    assert.equal(g.ciclos.total, 0, 'prefetch <-> pagina por import() nao e ciclo que quebra');
    assert.deepEqual(g.arestas_dinamicas['src/lib/prefetch.ts'], ['src/pages/X.tsx']);
    assert.ok(!g.orfaos.includes('src/pages/X.tsx'), 'quem e importado so por import() nao e orfao');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('baseline: divida medida e env usada mas nao declarada', () => {
  const dir = repoDeBrinquedo({ '.env': 'VITE_OUTRA=1\n' });
  try {
    const b = JSON.parse(gerar(dir)['baseline.json']);
    assert.equal(b.qualidade.any, 1);
    assert.equal(b.qualidade.console_log, 1);
    assert.equal(b.qualidade.todos, 1);
    assert.deepEqual(b.env.usadas_mas_nao_declaradas, ['VITE_ALGO']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('repo sem git e sem rotas/edges/schema gerados ainda produz saida valida', () => {
  const dir = repoDeBrinquedo();
  try {
    const saida = gerar(dir);
    const b = JSON.parse(saida['baseline.json']);
    assert.equal(b.git.commit, null, 'sem git, commit e null — nao inventa');
    assert.equal(b.contagens.rotas, null, 'sem rotas.json, a contagem e null — nao inventa 0');
    assert.match(saida['INDEX.md'], /# Contexto do Multiplixe V2 para agentes/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('arquivo binario, BOM, CRLF e nome com espaco nao derrubam a geracao', () => {
  const dir = repoDeBrinquedo({
    'src/lib/com bom.ts': '\uFEFFexport const x = 1;\r\nexport const y = 2;\r\n',
    'src/lib/unicode.ts': 'export const emoji = "cafe \u2615 acentuacao";\n',
  });
  try {
    fs.writeFileSync(path.join(dir, 'src/lib/binario.ts'), Buffer.from([0, 1, 2, 255, 254, 0, 66]));
    const saida = gerar(dir);
    const manifest = JSON.parse(saida['manifest.json']);
    assert.deepEqual(manifest.erros, [], 'arquivo estranho nao pode virar erro de secao');
    assert.ok(manifest.contagens.arquivos_de_codigo >= 9);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ----------------------------------------------------------------- repo real
test('repo real: o contexto commitado esta em dia (fora o gerado_em)', { skip: process.env.INVENTARIO_CHECK ? false : 'frescor do inventario e trabalho do cron semanal (inventario-estado-semanal.yml); rode com INVENTARIO_CHECK=1 para cobrar aqui' }, () => {
  // INDEX.md e baseline.json sao excluidos da comparacao porque embutem git.commit/branch/data
  // que mudam a cada squash-merge (mesmo sem mudanca estrutural). Sao regenerados pelo cron, nao
  // precisam estar em dia no HEAD. Ver .github/workflows/inventario-estado-semanal.yml: secao
  // "Decidir se vale PR" para o mesmo raciocinio no gating do cron.
  const VOLATEIS = new Set(['INDEX.md', 'baseline.json']);
  const semVolateis = (arqs) => Object.fromEntries(Object.entries(arqs).filter(([k]) => !VOLATEIS.has(k)));
  const commitado = path.join(RAIZ, 'inventario/ia');
  assert.ok(fs.existsSync(path.join(commitado, 'manifest.json')), 'rode node scripts/ai-context/gerar.mjs');
  const fresco = fs.mkdtempSync(path.join(os.tmpdir(), 'mpx-ctx-real-'));
  try {
    execFileSync(process.execPath, [GERADOR, '--out', fresco, '--quiet'], { cwd: RAIZ, encoding: 'utf8' });
    const antes = semVolateis(JSON.parse(fs.readFileSync(path.join(commitado, 'manifest.json'), 'utf8')).arquivos);
    const depois = semVolateis(JSON.parse(fs.readFileSync(path.join(fresco, 'manifest.json'), 'utf8')).arquivos);
    assert.deepEqual(depois, antes, 'inventario/ia desatualizado: rode node scripts/ai-context/gerar.mjs e commite');
  } finally { fs.rmSync(fresco, { recursive: true, force: true }); }
});

test('repo real: nada com cara de credencial foi para o contexto', () => {
  // O NOME da variavel de ambiente que uma edge le (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY) e
  // saida esperada — e o que diz qual segredo cada edge precisa. O VALOR nunca pode aparecer: e
  // isso que estes tres padroes pegam (token Bearer, JWT e chave sb_secret_).
  const PARECE_CREDENCIAL = /Bearer\s+[A-Za-z0-9._-]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.|sb_secret_[A-Za-z0-9_-]{8,}/;
  for (const f of fs.readdirSync(path.join(RAIZ, 'inventario/ia'))) {
    const texto = fs.readFileSync(path.join(RAIZ, 'inventario/ia', f), 'utf8');
    assert.doesNotMatch(texto, PARECE_CREDENCIAL, `${f} tem algo com cara de credencial`);
  }
});
