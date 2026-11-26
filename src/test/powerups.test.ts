import { describe, expect, it } from 'vitest';
import { t } from '@/lib/i18n';
import {
  POWERUP_WALLET_VAZIA,
  boostSummary,
  formatDuration,
  formatMultiplier,
  parsePowerupWallet,
  powerupEffectLabel,
  powerupKindLabel,
  powerupNeedsActivation,
  remainingLabel,
} from '@/lib/powerups';

const noFuturo = (minutos: number) => new Date(Date.now() + minutos * 60_000).toISOString();

describe('rotulos de power-up', () => {
  it('traduz os tipos conhecidos e preserva desconhecidos', () => {
    expect(powerupKindLabel('xp_boost')).toBe('Impulsionador de XP');
    expect(powerupKindLabel('streak_freeze')).toBe('Blindagem de Sequencia');
    expect(powerupKindLabel('outro')).toBe('outro');
    expect(powerupKindLabel(null)).toBe('Power-up');
  });

  it('so o impulsionador precisa de ativacao manual', () => {
    expect(powerupNeedsActivation('xp_boost')).toBe(true);
    expect(powerupNeedsActivation('streak_freeze')).toBe(false);
    expect(powerupNeedsActivation(null)).toBe(false);
  });

  it('descreve o efeito de cada tipo', () => {
    expect(powerupEffectLabel('xp_boost', 2, 60)).toContain('1 h');
    expect(powerupEffectLabel('streak_freeze', null, 1440)).toContain('1 dia');
    expect(powerupEffectLabel('desconhecido', null, 0)).toBe('');
  });
});

describe('formatacao', () => {
  it('mostra multiplicador sem zeros sobrando', () => {
    expect(formatMultiplier(2)).toBe('x2');
    expect(formatMultiplier(1.5)).toBe('x1,5');
    expect(formatMultiplier(Number.NaN)).toBe('x1');
  });

  it('formata duracao em minutos e horas', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(1440)).toBe('24 h');
    expect(formatDuration(-10)).toBe('0 min');
  });

  it('resume o tempo restante do impulsionador', () => {
    expect(remainingLabel(0)).toBe('encerrado');
    expect(remainingLabel(30)).toBe('menos de 1 min');
    expect(remainingLabel(600)).toBe('10 min restantes');
    expect(remainingLabel(3900)).toBe('1 h 5 min restantes');
  });

  it('resume o impulsionador ativo', () => {
    expect(boostSummary(null)).toBe('Nenhum impulsionador ativo');
    expect(boostSummary({ multiplier: 2, expires_at: noFuturo(60), restante_segundos: 600 })).toBe(
      'XP x2 por 10 min restantes',
    );
  });
});

describe('parsePowerupWallet', () => {
  it('devolve carteira vazia para respostas invalidas', () => {
    expect(parsePowerupWallet(null)).toEqual(POWERUP_WALLET_VAZIA);
    expect(parsePowerupWallet('texto')).toEqual(POWERUP_WALLET_VAZIA);
    expect(parsePowerupWallet({})).toEqual(POWERUP_WALLET_VAZIA);
  });

  it('normaliza os itens disponiveis e descarta quantidade zero', () => {
    const carteira = parsePowerupWallet({
      disponiveis: [
        { kind: 'streak_freeze', nome: 'Blindagem', quantidade: 2, duration_minutes: 1440, multiplier: null, desde: '2026-11-26T10:00:00Z' },
        { kind: 'xp_boost', nome: 'Boost', quantidade: 0, duration_minutes: 60 },
      ],
      boost: null,
    });

    expect(carteira.disponiveis).toHaveLength(1);
    expect(carteira.disponiveis[0]).toMatchObject({ kind: 'streak_freeze', quantidade: 2, duration_minutes: 1440 });
    expect(carteira.boost).toBeNull();
  });

  it('aceita boost vigente e ignora boost expirado', () => {
    const vigente = parsePowerupWallet({
      disponiveis: [],
      boost: { multiplier: 2, expires_at: noFuturo(30), restante_segundos: 1800 },
    });
    expect(vigente.boost?.multiplier).toBe(2);

    const expirado = parsePowerupWallet({
      disponiveis: [],
      boost: { multiplier: 2, expires_at: new Date(Date.now() - 60_000).toISOString(), restante_segundos: 0 },
    });
    expect(expirado.boost).toBeNull();
  });

  it('usa o rotulo do tipo quando o nome vem vazio', () => {
    const carteira = parsePowerupWallet({ disponiveis: [{ kind: 'xp_boost', quantidade: 1 }] });
    expect(carteira.disponiveis[0].nome).toBe('Impulsionador de XP');
    expect(carteira.disponiveis[0].duration_minutes).toBe(0);
  });
});

describe('textos dos power-ups nos tres idiomas', () => {
  const chaves = [
    'store.powerups',
    'store.powerupLoadError',
    'store.retry',
    'store.boostTitle',
    'store.boostActive',
    'store.boostInactive',
    'store.boostBadge',
    'store.powerupsLoading',
    'store.powerupsEmptyTitle',
    'store.powerupsEmptyDescription',
    'store.durationLabel',
    'store.freezeAutomatic',
    'store.activateNow',
    'store.boostAlreadyActive',
    'store.freezeNoActivation',
    'store.powerupActivateError',
    'store.freezeSaved',
  ] as const;

  it('tem texto nos tres idiomas (nada cai no fallback da chave)', () => {
    for (const locale of ['pt-BR', 'en', 'es'] as const) {
      for (const chave of chaves) {
        const texto = t(chave, locale);
        expect(texto, `${locale} ${chave}`).not.toBe(chave);
        expect(texto.length).toBeGreaterThan(0);
      }
    }
  });

  it('avisa quantos dias a blindagem salvou no idioma escolhido', () => {
    for (const locale of ['pt-BR', 'en', 'es'] as const) {
      const texto = t('store.freezeSaved', locale).replace('{n}', '12');
      expect(texto, locale).toContain('12');
      expect(texto, locale).not.toContain('{n}');
    }
  });

  it('traduz os botoes da mochila em ingles', () => {
    expect(t('store.activateNow', 'en')).toBe('Activate now');
    expect(t('store.freezeNoActivation', 'en')).toContain('activation needed');
  });
});
