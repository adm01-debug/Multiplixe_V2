import { describe, expect, it } from 'vitest';
import { formatarMultiplicador } from '@/lib/xpFormat';

describe('formatarMultiplicador', () => {
  it('arredonda o multiplicador para duas casas como o rotulo do bonus', () => {
    expect(formatarMultiplicador(1.995)).toBe('2');
    expect(formatarMultiplicador(1.334)).toBe('1.33');
  });

  it('nao deixa zeros sobrando', () => {
    expect(formatarMultiplicador(1.5)).toBe('1.5');
    expect(formatarMultiplicador(3)).toBe('3');
  });

  it('cai para 1 quando o valor nao e numero', () => {
    expect(formatarMultiplicador(Number.NaN)).toBe('1');
  });
});