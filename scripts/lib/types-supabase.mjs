#!/usr/bin/env node
/**
 * Leitor de `src/integrations/supabase/types.ts` (arquivo GERADO pelo Lovable, proibido editar
 * a mao). E a unica foto do schema que existe dentro do repo: nenhum agente desta sessao tem MCP
 * do projeto oficial (`docs/agentes/banco.md`), entao tabela/coluna/funcao/enum/view sai daqui.
 *
 * Nao e parser de TypeScript: conta chaves `{`/`}` fora de string, o que basta para o formato
 * estavel que o gerador do Supabase emite. Qualquer bloco que nao feche faz a leitura devolver o
 * que conseguiu ler — nunca inventa nome.
 *
 * LIMITE IMPORTANTE, declarado de proposito: isto NAO prova nada sobre o banco ao vivo. O
 * `types.ts` reflete o schema no instante em que o Lovable o gerou; se houve DDL depois, ele e
 * so mais um arquivo velho do repo. Comparar algo com ele prova coerencia interna, nunca frescura.
 */
import fs from 'node:fs';
import path from 'node:path';

export const CAMINHO_PADRAO = 'src/integrations/supabase/types.ts';

/** Fim do bloco `{...}` que comeca em `inicio` (indice da `{`). -1 se nao fechar. */
function fimDoBloco(texto, inicio) {
  let profundidade = 0;
  let aspas = null;
  for (let i = inicio; i < texto.length; i += 1) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '\\') i += 1;
      else if (ch === aspas) aspas = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { aspas = ch; continue; }
    if (ch === '{') profundidade += 1;
    else if (ch === '}') {
      profundidade -= 1;
      if (profundidade === 0) return i;
    }
  }
  return -1;
}

/** Corpo do bloco de `chave: {` dentro de `texto` (a partir de `de`), ou null. */
export function bloco(texto, chave, de = 0) {
  const re = new RegExp(`(^|[\\s{,])${chave}\\s*:\\s*\\{`, 'g');
  re.lastIndex = de;
  const m = re.exec(texto);
  if (!m) return null;
  const abre = texto.indexOf('{', m.index + m[0].length - 1);
  const fecha = fimDoBloco(texto, abre);
  if (fecha === -1) return null;
  return texto.slice(abre + 1, fecha);
}

/** Chaves de primeiro nivel de um corpo de bloco: [{ nome, corpo }] (corpo null se nao for objeto). */
export function chavesDeNivel1(corpo) {
  const saida = [];
  let profundidade = 0;
  let aspas = null;
  let inicioLinha = 0;
  for (let i = 0; i < corpo.length; i += 1) {
    const ch = corpo[i];
    if (aspas) {
      if (ch === '\\') i += 1;
      else if (ch === aspas) aspas = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { aspas = ch; continue; }
    if (ch === '{' || ch === '[' || ch === '(') {
      if (profundidade === 0) {
        const cabeca = corpo.slice(inicioLinha, i);
        const m = cabeca.match(/([A-Za-z_][A-Za-z0-9_]*|"[^"]+")\s*:\s*$/);
        if (m && ch === '{') {
          const fecha = fimDoBloco(corpo, i);
          if (fecha !== -1) {
            saida.push({ nome: m[1].replace(/"/g, ''), corpo: corpo.slice(i + 1, fecha) });
            i = fecha;
            inicioLinha = i + 1;
            continue;
          }
        }
      }
      profundidade += 1;
      continue;
    }
    if (ch === '}' || ch === ']' || ch === ')') { profundidade -= 1; continue; }
    if (profundidade === 0 && (ch === '\n' || ch === ',')) inicioLinha = i + 1;
  }
  return saida;
}

/** `nome: tipo` de primeiro nivel (uma por linha, como o gerador emite). */
export function camposDe(corpo) {
  const campos = {};
  // Uma declaracao por linha e o que o gerador do Supabase emite, mas `Args` as vezes vem na
  // mesma linha separada por `;` — por isso o split duplo (`;` nao aparece dentro de tipo).
  for (const linha of corpo.split('\n')) {
    for (const parte of linha.split(';')) {
      const m = parte.match(/^\s{0,16}([A-Za-z_][A-Za-z0-9_]*|"[^"]+")\??\s*:\s*(.+?)\s*$/);
      if (!m) continue;
      const tipo = m[2].replace(/[,;]$/, '').trim();
      if (tipo === '{' || tipo === '[' || tipo === '') continue;
      campos[m[1].replace(/"/g, '')] = tipo;
    }
  }
  return campos;
}

/**
 * Le o types.ts e devolve o schema declarado: tabelas (com colunas), views, funcoes (com args e
 * retorno) e enums. `fonte` guarda o caminho lido, para o chamador citar a origem.
 */
export function lerTypes(caminho = CAMINHO_PADRAO, raiz = process.cwd()) {
  const abs = path.isAbsolute(caminho) ? caminho : path.join(raiz, caminho);
  const texto = fs.readFileSync(abs, 'utf8');
  const publico = bloco(texto, 'public');
  if (!publico) throw new Error(`${caminho}: nao achei o bloco public — o formato do types.ts mudou`);

  const tabelas = {};
  const corpoTabelas = bloco(publico, 'Tables');
  for (const t of corpoTabelas ? chavesDeNivel1(corpoTabelas) : []) {
    const row = bloco(t.corpo, 'Row');
    tabelas[t.nome] = { colunas: row ? camposDe(row) : {} };
  }

  const views = {};
  const corpoViews = bloco(publico, 'Views');
  for (const v of corpoViews ? chavesDeNivel1(corpoViews) : []) {
    const row = bloco(v.corpo, 'Row');
    views[v.nome] = { colunas: row ? camposDe(row) : {} };
  }

  const funcoes = {};
  const corpoFuncoes = bloco(publico, 'Functions');
  for (const f of corpoFuncoes ? chavesDeNivel1(corpoFuncoes) : []) {
    const args = bloco(f.corpo, 'Args');
    const retorno = (f.corpo.match(/Returns\s*:\s*(.+?)\s*$/m) || [])[1] ?? null;
    funcoes[f.nome] = { args: args ? Object.keys(camposDe(args)).sort() : [], retorno };
  }

  const enums = {};
  const corpoEnums = bloco(publico, 'Enums');
  if (corpoEnums) {
    for (const m of corpoEnums.matchAll(/^\s{0,16}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+?)\s*$/gm)) {
      const valores = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
      if (valores.length) enums[m[1]] = valores;
    }
  }

  return { fonte: caminho, tabelas, views, funcoes, enums };
}

/** Só os nomes das tabelas, ordenados (prova de origem do inventário de banco usa isto). */
export const nomesDeTabelas = (schema) => Object.keys(schema.tabelas).sort();
