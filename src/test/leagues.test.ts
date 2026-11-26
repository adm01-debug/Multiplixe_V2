import { describe, expect, it } from 'vitest';
import {
  LEAGUE_TIERS,
  changeLabel,
  formatLeagueReset,
  formatLeagueWeek,
  isLeagueTier,
  leagueMeta,
  nextLeague,
  previousLeague,
  xpToGoal,
  zoneOf,
} from '@/lib/leagues';

describe('ligas semanais', () => {
  it('reconhece apenas tiers validos', () => {
    expect(LEAGUE_TIERS).toHaveLength(5);
    expect(isLeagueTier('ouro')).toBe(true);
    expect(isLeagueTier('esmeralda')).toBe(false);
    expect(isLeagueTier(null)).toBe(false);
  });

  it('cai para bronze quando o tier e desconhecido', () => {
    expect(leagueMeta('esmeralda').tier).toBe('bronze');
    expect(leagueMeta(undefined).tier).toBe('bronze');
  });

  it('calcula proxima liga e anterior respeitando os limites', () => {
    expect(nextLeague('bronze')).toBe('prata');
    expect(nextLeague('diamante')).toBeNull();
    expect(previousLeague('prata')).toBe('bronze');
    expect(previousLeague('bronze')).toBeNull();
  });

  it('classifica a zona igual ao banco (minimo de jogadores bloqueia mudanca)', () => {
    expect(zoneOf(1, 200, 10, 10, 20)).toBe('promocao');
    expect(zoneOf(10, 200, 10, 10, 20)).toBe('promocao');
    expect(zoneOf(11, 200, 10, 10, 20)).toBe('manutencao');
    expect(zoneOf(191, 200, 10, 10, 20)).toBe('rebaixamento');
    expect(zoneOf(190, 200, 10, 10, 20)).toBe('manutencao');
    expect(zoneOf(2, 2, 1, 1, 2)).toBe('rebaixamento');
    expect(zoneOf(1, 19, 10, 10, 20)).toBe('manutencao');
  });

  it('traduz a ultima mudanca de liga', () => {
    expect(changeLabel('promovido')).toContain('subiu');
    expect(changeLabel('rebaixado')).toContain('caiu');
    expect(changeLabel('mantido')).toContain('permaneceu');
    expect(changeLabel(null)).toBeNull();
    expect(changeLabel('qualquer')).toBeNull();
  });

  it('formata a semana e a data de virada', () => {
    expect(formatLeagueWeek('2026-11-23', '2026-11-29')).toBe('23/11 a 29/11');
    expect(formatLeagueWeek(null, '2026-11-29')).toBeNull();
    expect(formatLeagueReset('2026-11-30')).toBe('Nova semana em 30/11');
    expect(formatLeagueReset(undefined)).toBeNull();
  });

  it('limita o progresso semanal entre 0 e 100', () => {
    expect(xpToGoal(0)).toBe(0);
    expect(xpToGoal(500)).toBe(50);
    expect(xpToGoal(5000)).toBe(100);
  });
});