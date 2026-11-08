#!/usr/bin/env node
/**
 * O inventario mudou de verdade? Compara cada arquivo de inventario/estado/ com a versao do HEAD
 * depois de tirar os carimbos de data (`medido_em`, `gerado_em`) e a telemetria que rola sozinha
 * numa janela de 7 dias. Imprime `true` ou `false`.
 *
 * Serve para o cron semanal (.github/workflows/inventario-estado-semanal.yml) nao abrir PR por
 * ruido: so mudanca estrutural (tabela nova, alerta novo, RLS/policy, rota, edge, contagem real de
 * linhas) vale PR. O preco, assumido de proposito: se SO a telemetria mudar, o arquivo commitado
 * fica velho nesses campos por tempo indefinido — confie neles so depois de regerar a mao.
 *
 * Uso: node scripts/inventario/mudou-conteudo.mjs [arquivo...]  (padrao: banco, rotas e edges)
 */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const PADRAO = [
  'inventario/estado/banco.json',
  'inventario/estado/rotas.json',
  'inventario/estado/edges.json',
];
const CARIMBOS = new Set(['medido_em', 'gerado_em']);
/** Telemetria viva: muda quase toda semana so pela janela rolante, sem mudanca estrutural nenhuma. */
const TELEMETRIA = new Set([
  'execucoes_24h', 'falhas_24h', 'execucoes_7d', 'falhas_7d', 'taxa_falha_7d_pct',
  'ultima_falha', 'duracao_max_s_7d', 'horas_paradas_7d', 'mais_antigo', 'mais_de_7_dias',
  'usuarios_ativos_7d', 'logins_7d', 'eventos_seguranca_7d', 'atualizada_em',
]);
const IGNORADOS = new Set([...CARIMBOS, ...TELEMETRIA]);

/**
 * `historico.linhas`/`historico.bytes` tambem rolam todo dia, mas `linhas`/`bytes` sao os mesmos
 * nomes usados em cada tabela de `tabelas[]`, onde a contagem real importa. So ignora dentro de
 * `cron.historico`.
 */
function limparHistoricoCron(historico) {
  if (!historico || typeof historico !== 'object') return historico;
  const { linhas, bytes, ...resto } = historico;
  return resto;
}

/**
 * A telemetria tambem vaza para o TEXTO de `alertas[].detalhe`, onde a lista por nome de campo nao
 * alcanca: `cron_falhando` grava "nome (9.0% em 7d)" e a porcentagem rola toda semana mesmo sem o
 * job entrar ou sair da lista. Normaliza so o TEXTO: entrar/sair da lista continua sendo mudanca.
 */
const PORCENTAGEM_7D = /\s*\([\d.]+%\s*em\s*7d\)\s*$/;
function normalizarAlerta(a) {
  if (!a || typeof a !== 'object' || !('tipo' in a) || !Array.isArray(a.detalhe)) return a;
  if (a.tipo === 'cron_falhando') {
    return { ...a, detalhe: a.detalhe.map((d) => (typeof d === 'string' ? d.replace(PORCENTAGEM_7D, '') : d)) };
  }
  if (a.tipo === 'cron_parado' || a.tipo === 'historico_cron_sem_limpeza') return { ...a, detalhe: [] };
  return a;
}

/** JSON canonico sem carimbos e sem telemetria viva. Texto que nao e JSON volta como esta. */
export function semCarimbos(texto) {
  if (texto === null) return null;
  let dado;
  try { dado = JSON.parse(texto); } catch { return texto; }
  const limpar = (v, chave) => {
    if (Array.isArray(v)) return v.map((x) => limpar(chave === 'alertas' ? normalizarAlerta(x) : x));
    if (v && typeof v === 'object') {
      const base = chave === 'historico' ? limparHistoricoCron(v) : v;
      return Object.fromEntries(
        Object.keys(base).filter((k) => !IGNORADOS.has(k)).sort().map((k) => [k, limpar(base[k], k)]),
      );
    }
    return v;
  };
  return JSON.stringify(limpar(dado));
}

/** true se algum arquivo mudou alem dos carimbos (arquivo novo ou apagado conta). */
export function mudou(arquivos, lerAntes, lerDepois) {
  return arquivos.some((f) => semCarimbos(lerAntes(f)) !== semCarimbos(lerDepois(f)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const arquivos = process.argv.length > 2 ? process.argv.slice(2) : PADRAO;
  const lerAntes = (f) => {
    try { return execFileSync('git', ['show', `HEAD:${f}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { return null; }
  };
  const lerDepois = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
  console.log(String(mudou(arquivos, lerAntes, lerDepois)));
}
