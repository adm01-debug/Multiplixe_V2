#!/usr/bin/env node
/**
 * Item A11Y-001 do PLANO_IMPLEMENTACAO_PENDENTES.md: todo <Input> do app precisa de nome
 * acessivel — `id` casado com um <Label htmlFor> ou `aria-label`. Sem isso o campo fica mudo
 * para leitor de tela e o autofill do navegador nao reconhece o campo.
 *
 * Testa o auditor com JSX de brinquedo (inclusive `onChange={e => ...}`, que tem `>` no meio da
 * tag) e roda contra o src real: um auditor que passa no brinquedo e deixa o repo sujo nao serve.
 *
 * node --test scripts/ci/a11y-input-labels.unit.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = path.resolve(import.meta.dirname, '..', '..');
const SRC = path.join(RAIZ, 'src');

function listar(diretorio, saida = []) {
  for (const entrada of fs.readdirSync(diretorio)) {
    const caminho = path.join(diretorio, entrada);
    if (fs.statSync(caminho).isDirectory()) {
      if (entrada === 'ui' && diretorio.endsWith('components')) continue; // primitivos recebem id de quem usa
      if (entrada === 'test') continue;
      listar(caminho, saida);
    } else if (entrada.endsWith('.tsx')) {
      saida.push(caminho);
    }
  }
  return saida;
}

// Fim da tag de abertura respeitando strings e chaves: `onChange={e => x}` tem `>` que nao fecha tag.
export function fimDaTag(texto, inicio) {
  let profundidade = 0;
  let aspas = null;
  for (let i = inicio; i < texto.length; i += 1) {
    const c = texto[i];
    if (aspas) {
      if (c === aspas) aspas = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { aspas = c; continue; }
    if (c === '{') { profundidade += 1; continue; }
    if (c === '}') { profundidade -= 1; continue; }
    if (profundidade === 0 && c === '>') return i;
  }
  return -1;
}

export function inputsSemRotulo(texto) {
  const problemas = [];
  for (const tag of texto.matchAll(/<Input(?![A-Za-z0-9])/g)) {
    const fim = fimDaTag(texto, tag.index + tag[0].length);
    if (fim === -1) continue;
    const atributos = texto.slice(tag.index, fim + 1);
    if (/id=/.test(atributos) || /aria-label/.test(atributos)) continue;
    problemas.push({ linha: texto.slice(0, tag.index).split('\n').length, trecho: atributos.replace(/\s+/g, ' ').slice(0, 100) });
  }
  return problemas;
}

export function htmlForOrfaos(texto) {
  const ids = new Set([...texto.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  return [...texto.matchAll(/htmlFor="([^"]+)"/g)]
    .filter((m) => !ids.has(m[1]))
    .map((m) => ({ linha: texto.slice(0, m.index).split('\n').length, alvo: m[1] }));
}

function varrer(regra) {
  const falhas = [];
  for (const arquivo of listar(SRC)) {
    const texto = fs.readFileSync(arquivo, 'utf8');
    for (const problema of regra(texto)) {
      falhas.push({ arquivo: path.relative(RAIZ, arquivo).replace(/\\/g, '/'), ...problema });
    }
  }
  return falhas;
}

test('Input com id casado por htmlFor passa', () => {
  assert.deepEqual(inputsSemRotulo('<Label htmlFor="email">Email</Label><Input id="email" value={v} />'), []);
});

test('Input com aria-label passa', () => {
  assert.deepEqual(inputsSemRotulo('<Input aria-label="Buscar cursos" placeholder="Buscar..." />'), []);
});

test('Input sem id e sem aria-label e acusado com a linha certa', () => {
  const problemas = inputsSemRotulo('<div>\n  <Input value={v} />\n</div>');
  assert.equal(problemas.length, 1);
  assert.equal(problemas[0].linha, 2);
});

test('tag com onChange={e => ...} nao corta o parser no `>` do arrow', () => {
  assert.deepEqual(inputsSemRotulo('<Input value={v} onChange={e => setV(e.target.value)} id="titulo" />'), []);
});

test('outros componentes que comecam com Input nao contam', () => {
  assert.deepEqual(inputsSemRotulo('<InputOTP maxLength={6} />\n<InputGroup />'), []);
});

test('htmlFor sem id correspondente no mesmo arquivo e acusado', () => {
  const orfaos = htmlForOrfaos('<Label htmlFor="nivel">Nivel</Label>\n<Select><SelectTrigger id="outro" /></Select>');
  assert.deepEqual(orfaos, [{ linha: 1, alvo: 'nivel' }]);
});

test('src real: todo Input tem nome acessivel', () => {
  const falhas = varrer(inputsSemRotulo);
  assert.deepEqual(
    falhas,
    [],
    `Input sem nome acessivel:\n${falhas.map((f) => `  ${f.arquivo}:${f.linha}  ${f.trecho}`).join('\n')}`,
  );
});

test('src real: todo htmlFor aponta para um id do mesmo arquivo', () => {
  const falhas = varrer(htmlForOrfaos);
  assert.deepEqual(
    falhas,
    [],
    `htmlFor sem id correspondente:\n${falhas.map((f) => `  ${f.arquivo}:${f.linha}  htmlFor="${f.alvo}"`).join('\n')}`,
  );
});