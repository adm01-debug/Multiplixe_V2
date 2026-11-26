import { describe, expect, it } from 'vitest';
import {
  STORE_CATEGORIES,
  canAfford,
  categoryLabel,
  formatCoins,
  formatNumber,
  shortfall,
  walletSourceLabel,
} from '@/lib/store';

describe('loja de recompensas - regras de exibicao', () => {
  it('formata moedas com separador de milhar', () => {
    expect(formatNumber(1234567)).toBe('1.234.567');
    expect(formatCoins(150)).toBe('150 moedas');
  });

  it('usa singular para uma moeda e trata valores negativos', () => {
    expect(formatCoins(1)).toBe('1 moeda');
    expect(formatCoins(-1)).toBe('-1 moeda');
    expect(formatCoins(-1500)).toBe('-1.500 moedas');
    expect(formatNumber(-42)).toBe('-42');
  });

  it('nao quebra com valores invalidos', () => {
    expect(formatNumber(Number.NaN)).toBe('0');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0');
  });

  it('so permite comprar quando o saldo cobre o preco', () => {
    expect(canAfford(80, 80)).toBe(true);
    expect(canAfford(79, 80)).toBe(false);
    expect(canAfford(0, 0)).toBe(true);
  });

  it('calcula quanto falta para a compra', () => {
    expect(shortfall(30, 80)).toBe(50);
    expect(shortfall(80, 80)).toBe(0);
    expect(shortfall(500, 80)).toBe(0);
  });

  it('rotula as categorias de itens da loja', () => {
    expect(categoryLabel('power_up')).toBe('Power-up');
    expect(categoryLabel('cosmetic')).toBe('Cosmetico');
    expect(categoryLabel('categoria-nova')).toBe('categoria-nova');
    expect(STORE_CATEGORIES).toHaveLength(4);
  });

  it('rotula a origem das movimentacoes de moedas', () => {
    expect(walletSourceLabel('xp')).toBe('XP convertido');
    expect(walletSourceLabel('purchase')).toBe('Compra na loja');
    expect(walletSourceLabel('achievement')).toBe('Conquista desbloqueada');
    expect(walletSourceLabel(null)).toBe('Movimentacao');
    expect(walletSourceLabel('origem-desconhecida')).toBe('origem-desconhecida');
  });
});