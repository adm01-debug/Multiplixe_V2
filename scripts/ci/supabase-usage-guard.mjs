#!/usr/bin/env node
/**
 * Guarda de uso do Supabase: todo `.from('tabela')` e `.rpc('funcao')` do codigo aponta para um
 * objeto que o repositorio declara? Alvo inexistente nao da erro de compilacao nem de lint — da
 * 404/42P01 em producao, na mao do usuario.
 *
 * Fonte dos objetos conhecidos: `inventario/estado/schema-declarado.json`
 * (scripts/inventario/gerar-schema.mjs = types.ts + replay das migrations). Roda OFFLINE.
 *
 * Ratchet: a divida que ja existe fica registrada em `scripts/ci/known-violations.json` e nao
 * quebra o build; violacao NOVA quebra. Entrada que nao existe mais vira aviso, e
 * `--prune-obsolete` reescreve o arquivo (o diff do baseline entra na PR para ser revisado).
 * A chave do ratchet e `kind:alvo:arquivo` — a MESMA divida movida para outro arquivo conta como
 * violacao nova (a entrada antiga so vira aviso de obsoleta), entao mover codigo reabre a divida.
 *
 * Escopo varrido: `src/` e `supabase/functions/`, arquivos .ts/.tsx/.js/.jsx que nao sao de teste.
 * `scripts/` e `.mjs` ficam de fora de proposito (script de manutencao nao fala com o banco de
 * producao). Chamada com alvo montado em runtime — variavel, concatenacao (`'t_' + id`) ou
 * template literal (`` `t_${id}` ``) — entra na contagem de NAO CONFERIDAS: nao e aprovada nem
 * reprovada, so fica visivel no resumo em vez de sumir sem ninguem ver.
 *
 * Uso:
 *   node scripts/ci/supabase-usage-guard.mjs
 *   node scripts/ci/supabase-usage-guard.mjs --prune-obsolete
 *   node scripts/ci/supabase-usage-guard.mjs --root <dir> --schema <arquivo> --baseline <arquivo>
 *
 * Exit: 0 = sem violacao nova; 1 = violacao nova; 2 = entrada invalida (schema ausente/ilegivel).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_PADRAO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SCHEMA_PADRAO = 'inventario/estado/schema-declarado.json';
export const BASELINE_PADRAO = 'scripts/ci/known-violations.json';
const PASTAS = ['src', 'supabase/functions'];
const EXT = /\.(ts|tsx|js|jsx)$/;
const EH_TESTE = /(\.test\.|\.spec\.|__tests__|\/test\/)/;

/**
 * Receptores que NAO sao o cliente do banco oficial: `storage.from('bucket')` e qualquer
 * `Array.from`. Olha os 40 caracteres antes da chamada.
 */
const RECEPTOR_ALHEIO = /(storage|Array|Object|Buffer|Int8Array|Uint8Array|Float64Array)\s*$/;

/** Logo depois da aspa vem `+`: o "literal" e so o prefixo de uma concatenacao, nao e alvo. */
const SEGUE_CONCAT = /^\s*\+/;

export function listarArquivos(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listarArquivos(p, acc);
    else if (EXT.test(e.name) && !EH_TESTE.test(p)) acc.push(p);
  }
  return acc;
}

/** Chamadas encontradas: [{ kind: 'table'|'rpc', alvo, arquivo, linha }] + nao resolvidas. */
export function coletarChamadas(raiz, pastas = PASTAS) {
  const chamadas = [];
  const dinamicas = [];
  for (const pasta of pastas) {
    for (const abs of listarArquivos(path.join(raiz, pasta))) {
      const arquivo = path.relative(raiz, abs).split(path.sep).join('/');
      const texto = fs.readFileSync(abs, 'utf8');
      const linhaDe = (i) => texto.slice(0, i).split('\n').length;
      for (const m of texto.matchAll(/\.from\(\s*(['"`])([A-Za-z0-9_-]+)\1/g)) {
        if (RECEPTOR_ALHEIO.test(texto.slice(Math.max(0, m.index - 40), m.index))) continue;
        if (SEGUE_CONCAT.test(texto.slice(m.index + m[0].length))) continue;
        chamadas.push({ kind: 'table', alvo: m[2], arquivo, linha: linhaDe(m.index) });
      }
      for (const m of texto.matchAll(/\.rpc\(\s*(['"`])([A-Za-z0-9_]+)\1/g)) {
        if (SEGUE_CONCAT.test(texto.slice(m.index + m[0].length))) continue;
        chamadas.push({ kind: 'rpc', alvo: m[2], arquivo, linha: linhaDe(m.index) });
      }
      // `.from(variavel)` / `.rpc(variavel)`: nao da para resolver com certeza, entra na contagem
      // de nao resolvidas em vez de virar violacao inventada.
      for (const m of texto.matchAll(/\.(from|rpc)\(\s*([A-Za-z_$][\w$.]*)\s*[,)]/g)) {
        if (RECEPTOR_ALHEIO.test(texto.slice(Math.max(0, m.index - 40), m.index))) continue;
        dinamicas.push({ kind: m[1] === 'from' ? 'table' : 'rpc', expressao: m[2], arquivo, linha: linhaDe(m.index) });
      }
      // Concatenacao (`'t_' + id`) e template literal (`\`t_${id}\``): as varreduras acima pedem
      // literal puro ou identificador puro, entao estes casos nao casavam com nada e a chamada
      // desaparecia sem virar violacao nem aparecer no resumo. Alvo continua desconhecido.
      for (const m of texto.matchAll(/\.(from|rpc)\(\s*([`'"][^)]*?)[)\n]/g)) {
        if (RECEPTOR_ALHEIO.test(texto.slice(Math.max(0, m.index - 40), m.index))) continue;
        if (!m[2].includes('+') && !m[2].includes('${')) continue;
        dinamicas.push({ kind: m[1] === 'from' ? 'table' : 'rpc', expressao: m[2].trim(), arquivo, linha: linhaDe(m.index) });
      }
    }
  }
  const ord = (a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha || a.alvo?.localeCompare(b.alvo ?? '');
  return { chamadas: chamadas.sort(ord), dinamicas: dinamicas.sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha) };
}

/** Objetos que o repo declara, a partir do schema-declarado.json. */
export function objetosConhecidos(schema) {
  const tabelas = new Set([...Object.keys(schema.tabelas ?? {}), ...Object.keys(schema.views ?? {})]);
  const funcoes = new Set(Object.keys(schema.funcoes ?? {}));
  if (tabelas.size === 0) throw new Error('schema-declarado sem tabelas: regere com node scripts/inventario/gerar-schema.mjs');
  return { tabelas, funcoes };
}

export const chaveDe = (v) => `${v.kind}:${v.alvo}:${v.arquivo}`;

/** Violacoes = alvo que o repo nao declara. Funcao pura (o teste chama direto). */
export function violacoes(chamadas, conhecidos) {
  return chamadas.filter((c) => (c.kind === 'table' ? !conhecidos.tabelas.has(c.alvo) : !conhecidos.funcoes.has(c.alvo)));
}

export function comparar(viols, baseline) {
  const registradas = new Set(baseline.violations ?? []);
  const atuais = new Set(viols.map(chaveDe));
  return {
    novas: viols.filter((v) => !registradas.has(chaveDe(v))),
    obsoletas: [...registradas].filter((k) => !atuais.has(k)).sort(),
    atuais: [...atuais].sort(),
  };
}

function lerJson(arquivo, obrigatorio) {
  if (!fs.existsSync(arquivo)) {
    if (obrigatorio) throw new Error(`${arquivo} nao existe`);
    return null;
  }
  return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
}

export function main(argv = process.argv.slice(2)) {
  const opt = (nome, padrao) => { const i = argv.indexOf(nome); return i === -1 ? padrao : argv[i + 1]; };
  const raiz = path.resolve(opt('--root', RAIZ_PADRAO));
  const schemaPath = path.resolve(raiz, opt('--schema', SCHEMA_PADRAO));
  const baselinePath = path.resolve(raiz, opt('--baseline', BASELINE_PADRAO));

  let conhecidos;
  try {
    conhecidos = objetosConhecidos(lerJson(schemaPath, true));
  } catch (erro) {
    console.error(`ERRO: ${erro.message}`);
    return 2;
  }
  const baseline = lerJson(baselinePath, false) ?? { schemaVersion: 1, violations: [] };
  const { chamadas, dinamicas } = coletarChamadas(raiz);
  const viols = violacoes(chamadas, conhecidos);
  const { novas, obsoletas, atuais } = comparar(viols, baseline);

  console.log(`uso do Supabase: ${chamadas.length} chamadas resolvidas (${dinamicas.length} com alvo em variavel, nao conferidas), `
    + `${viols.length} violacao(oes), ${novas.length} nova(s).`);
  for (const v of novas) {
    console.error(`::error file=${v.arquivo},line=${v.linha}::${v.kind === 'table' ? 'tabela' : 'RPC'} "${v.alvo}" nao existe no schema declarado`);
  }
  if (novas.length) {
    console.error('\nSe o objeto existe no banco mas nao no repo, regere o schema '
      + '(node scripts/inventario/gerar-schema.mjs). Se e divida aceita, registre em '
      + `${path.relative(raiz, baselinePath)}:\n${novas.map((v) => `  "${chaveDe(v)}"`).join('\n')}`);
  }
  if (obsoletas.length) {
    console.log(`\nAVISO: ${obsoletas.length} entrada(s) do baseline nao existem mais. Enquanto ficarem `
      + 'registradas, a mesma violacao voltando no mesmo arquivo passa calada:');
    for (const k of obsoletas) console.log(`  ${k}`);
    if (argv.includes('--prune-obsolete')) {
      fs.writeFileSync(baselinePath, `${JSON.stringify({ ...baseline, schemaVersion: 1, violations: atuais }, null, 2)}\n`);
      console.log(`${path.relative(raiz, baselinePath)} reescrito (${atuais.length} entrada(s)).`);
    } else {
      console.log('Rode com --prune-obsolete para limpar.');
    }
  }
  return novas.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
