import type { DictPath } from '@/lib/i18n';

export interface NivelReputacao {
  nivel: number;
  chave: DictPath;
  minimo: number;
  proximo_minimo: number | null;
}

// Faixas de reputacao exibidas no perfil. A pontuacao vem de public.detalhar_reputacao
// e os nomes dos niveis de src/lib/i18n.ts (reputation.levelN).
export const NIVEIS_REPUTACAO: NivelReputacao[] = [
  { nivel: 1, chave: 'reputation.level1', minimo: 0, proximo_minimo: 25 },
  { nivel: 2, chave: 'reputation.level2', minimo: 25, proximo_minimo: 100 },
  { nivel: 3, chave: 'reputation.level3', minimo: 100, proximo_minimo: 300 },
  { nivel: 4, chave: 'reputation.level4', minimo: 300, proximo_minimo: null },
];

export const PESOS_REPUTACAO = {
  voto_recebido: 1,
  resposta: 2,
  resposta_aceita: 5,
} as const;

export interface ProgressoReputacao extends NivelReputacao {
  faltam: number;
  progresso: number;
}

export const nivelDaReputacao = (pontos: number): ProgressoReputacao => {
  const total = Number.isFinite(pontos) ? Math.max(0, Math.floor(pontos)) : 0;
  const atual = [...NIVEIS_REPUTACAO].reverse().find((nivel) => total >= nivel.minimo) ?? NIVEIS_REPUTACAO[0];
  const proximo = atual.proximo_minimo;
  const faltam = proximo === null ? 0 : Math.max(0, proximo - total);
  const progresso = proximo === null
    ? 100
    : Math.min(100, Math.max(0, Math.round(((total - atual.minimo) / (proximo - atual.minimo)) * 100)));

  return { ...atual, faltam, progresso };
};
