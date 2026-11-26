/**
 * Sistema de ligas semanais (GAME-003).
 * Espelha a mesma regra de promocao/rebaixamento aplicada no banco
 * (funcao public.refresh_leagues) para exibir a zona do aluno na interface.
 */

export const LEAGUE_TIERS = ['bronze', 'prata', 'ouro', 'platina', 'diamante'] as const;

export type LeagueTier = (typeof LEAGUE_TIERS)[number];

export type LeagueZone = 'promocao' | 'rebaixamento' | 'manutencao';

export interface LeagueMeta {
  tier: LeagueTier;
  label: string;
  emoji: string;
  badge: string;
  ring: string;
}

export const DEFAULT_PROMOTION_ZONE = 10;
export const DEFAULT_RELEGATION_ZONE = 10;
export const DEFAULT_MIN_PLAYERS = 20;

export const LEAGUES: Record<LeagueTier, LeagueMeta> = {
  bronze: {
    tier: 'bronze',
    label: 'Liga de Bronze',
    emoji: '🥉',
    badge: 'bg-gradient-to-r from-amber-700/30 to-amber-500/30 border-amber-700/50 text-amber-100',
    ring: 'ring-amber-700/40',
  },
  prata: {
    tier: 'prata',
    label: 'Liga de Prata',
    emoji: '🥈',
    badge: 'bg-gradient-to-r from-slate-400/30 to-slate-200/30 border-slate-400/50 text-slate-100',
    ring: 'ring-slate-400/40',
  },
  ouro: {
    tier: 'ouro',
    label: 'Liga de Ouro',
    emoji: '🥇',
    badge: 'bg-gradient-to-r from-yellow-500/30 to-amber-400/30 border-yellow-500/50 text-yellow-100',
    ring: 'ring-yellow-500/40',
  },
  platina: {
    tier: 'platina',
    label: 'Liga de Platina',
    emoji: '💎',
    badge: 'bg-gradient-to-r from-cyan-500/30 to-sky-400/30 border-cyan-500/50 text-cyan-100',
    ring: 'ring-cyan-500/40',
  },
  diamante: {
    tier: 'diamante',
    label: 'Liga de Diamante',
    emoji: '👑',
    badge: 'bg-gradient-to-r from-fuchsia-500/30 to-violet-500/30 border-fuchsia-500/50 text-fuchsia-100',
    ring: 'ring-fuchsia-500/40',
  },
};

export const isLeagueTier = (value: unknown): value is LeagueTier =>
  typeof value === 'string' && (LEAGUE_TIERS as readonly string[]).includes(value);

export const leagueMeta = (value: string | null | undefined): LeagueMeta =>
  isLeagueTier(value) ? LEAGUES[value] : LEAGUES.bronze;

export const nextLeague = (value: string | null | undefined): LeagueTier | null => {
  const index = LEAGUE_TIERS.indexOf(leagueMeta(value).tier);
  return LEAGUE_TIERS[index + 1] ?? null;
};

export const previousLeague = (value: string | null | undefined): LeagueTier | null => {
  const index = LEAGUE_TIERS.indexOf(leagueMeta(value).tier);
  return index > 0 ? LEAGUE_TIERS[index - 1] : null;
};

/** Mesma regra do banco: so muda de liga quando a liga atinge o minimo de jogadores. */
export const zoneOf = (
  position: number,
  totalPlayers: number,
  promotionZone: number = DEFAULT_PROMOTION_ZONE,
  relegationZone: number = DEFAULT_RELEGATION_ZONE,
  minPlayers: number = DEFAULT_MIN_PLAYERS,
): LeagueZone => {
  if (totalPlayers < minPlayers) return 'manutencao';
  if (position <= promotionZone) return 'promocao';
  if (position > totalPlayers - relegationZone) return 'rebaixamento';
  return 'manutencao';
};

export const zoneLabel = (zone: LeagueZone): string => {
  switch (zone) {
    case 'promocao':
      return 'Zona de promocao';
    case 'rebaixamento':
      return 'Zona de rebaixamento';
    default:
      return 'Zona de manutencao';
  }
};

export const changeLabel = (tipo: string | null | undefined): string | null => {
  switch (tipo) {
    case 'promovido':
      return 'Voce subiu de liga nesta semana';
    case 'rebaixado':
      return 'Voce caiu de liga nesta semana';
    case 'mantido':
      return 'Voce permaneceu na mesma liga';
    default:
      return null;
  }
};

const brDate = (value: string | Date | null | undefined): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(`${value}`.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

/** "23/11 a 29/11" a partir das datas ISO da semana corrente. */
export const formatLeagueWeek = (start: string | null | undefined, end: string | null | undefined): string | null => {
  const from = brDate(start);
  const to = brDate(end);
  if (!from || !to) return null;
  return `${from} a ${to}`;
};

export const formatLeagueReset = (value: string | null | undefined): string | null => {
  const date = brDate(value);
  return date ? `Nova semana em ${date}` : null;
};

export const xpToGoal = (xpSemana: number, xpMeta = 1000): number =>
  Math.max(0, Math.min(100, Math.round((xpSemana / xpMeta) * 100)));