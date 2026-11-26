export type PowerupKind = 'xp_boost' | 'streak_freeze';

export const POWERUP_KINDS: PowerupKind[] = ['xp_boost', 'streak_freeze'];

export const POWERUP_KIND_LABEL: Record<PowerupKind, string> = {
  xp_boost: 'Impulsionador de XP',
  streak_freeze: 'Blindagem de Sequencia',
};

/** Rotulo de um power-up (aceita valores vindos do banco). */
export const powerupKindLabel = (value: string | null | undefined): string =>
  value ? POWERUP_KIND_LABEL[value as PowerupKind] ?? value : 'Power-up';

export interface PowerupStock {
  kind: string;
  nome: string;
  icone: string | null;
  multiplier: number | null;
  duration_minutes: number;
  quantidade: number;
  desde: string | null;
}

export interface PowerupBoost {
  multiplier: number;
  expires_at: string;
  restante_segundos: number;
}

export interface PowerupWallet {
  disponiveis: PowerupStock[];
  boost: PowerupBoost | null;
}

export const POWERUP_WALLET_VAZIA: PowerupWallet = { disponiveis: [], boost: null };

const numero = (valor: unknown): number | null => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

/** Normaliza a resposta de get_my_powerups (jsonb) sem confiar no formato. */
export const parsePowerupWallet = (raw: unknown): PowerupWallet => {
  if (!raw || typeof raw !== 'object') return POWERUP_WALLET_VAZIA;
  const bruto = raw as { disponiveis?: unknown; boost?: unknown };

  const disponiveis = Array.isArray(bruto.disponiveis)
    ? bruto.disponiveis
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((item) => ({
          kind: String(item.kind ?? ''),
          nome: String(item.nome ?? powerupKindLabel(String(item.kind ?? ''))),
          icone: typeof item.icone === 'string' ? item.icone : null,
          multiplier: numero(item.multiplier),
          duration_minutes: numero(item.duration_minutes) ?? 0,
          quantidade: numero(item.quantidade) ?? 0,
          desde: typeof item.desde === 'string' ? item.desde : null,
        }))
        .filter((item) => item.kind !== '' && item.quantidade > 0)
    : [];

  const boostBruto = bruto.boost && typeof bruto.boost === 'object' ? (bruto.boost as Record<string, unknown>) : null;
  const boostValido =
    boostBruto &&
    numero(boostBruto.multiplier) !== null &&
    typeof boostBruto.expires_at === 'string' &&
    new Date(boostBruto.expires_at as string).getTime() > Date.now();

  const boost: PowerupBoost | null = boostValido
    ? {
        multiplier: numero(boostBruto!.multiplier) ?? 1,
        expires_at: String(boostBruto!.expires_at),
        restante_segundos: Math.max(0, numero(boostBruto!.restante_segundos) ?? 0),
      }
    : null;

  return { disponiveis, boost };
};

/** 2 -> "x2", 1.5 -> "x1,5" */
export const formatMultiplier = (multiplicador: number): string => {
  const valor = Number.isFinite(multiplicador) ? multiplicador : 1;
  return `x${String(valor).replace('.', ',')}`;
};

/** 60 -> "1 h", 90 -> "1 h 30 min", 45 -> "45 min" */
export const formatDuration = (minutos: number): string => {
  const total = Math.max(0, Math.round(Number.isFinite(minutos) ? minutos : 0));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
};

/** Tempo restante do impulsionador em linguagem curta. */
export const remainingLabel = (segundos: number): string => {
  const total = Math.max(0, Math.floor(Number.isFinite(segundos) ? segundos : 0));
  if (total <= 0) return 'encerrado';
  if (total < 60) return 'menos de 1 min';
  const minutos = Math.ceil(total / 60);
  return `${formatDuration(minutos)} restantes`;
};

/** Texto do card do impulsionador ativo. */
export const boostSummary = (boost: PowerupBoost | null): string => {
  if (!boost) return 'Nenhum impulsionador ativo';
  return `XP ${formatMultiplier(boost.multiplier)} por ${remainingLabel(boost.restante_segundos)}`;
};

/** O que o aluno ganha ao comprar o power-up. */
export const powerupEffectLabel = (kind: string | null | undefined, multiplier: number | null, durationMinutes: number | null): string => {
  if (kind === 'xp_boost') {
    return `Dobra o XP por ${formatDuration(durationMinutes ?? 60)} a partir da ativacao.`;
  }
  if (kind === 'streak_freeze') {
    return 'Cobre 1 dia perdido e mantem a sequencia viva. Usada automaticamente.';
  }
  return '';
};

/** Apenas o impulsionador precisa de ativacao manual. */
export const powerupNeedsActivation = (kind: string | null | undefined): boolean => kind === 'xp_boost';