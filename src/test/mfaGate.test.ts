import { describe, expect, it } from 'vitest';
import { codigoTotpValido, precisaSegundoFator } from '@/lib/mfaGate';

describe('precisaSegundoFator', () => {
  it('não exige código para visitante sem sessão', () => {
    expect(precisaSegundoFator(false, null, null)).toBe(false);
    expect(precisaSegundoFator(false, 'aal1', 'aal2')).toBe(false);
  });

  it('exige código quando a conta tem 2FA e a sessão só tem senha', () => {
    expect(precisaSegundoFator(true, 'aal1', 'aal2')).toBe(true);
  });

  it('libera quando o segundo fator já foi validado', () => {
    expect(precisaSegundoFator(true, 'aal2', 'aal2')).toBe(false);
  });

  it('libera conta sem 2FA (níveis iguais)', () => {
    expect(precisaSegundoFator(true, 'aal1', 'aal1')).toBe(false);
  });

  it('libera quando o Supabase não informa os níveis', () => {
    expect(precisaSegundoFator(true, null, null)).toBe(false);
    expect(precisaSegundoFator(true, undefined, 'aal2')).toBe(false);
  });
});

describe('codigoTotpValido', () => {
  it('aceita exatamente 6 dígitos', () => {
    expect(codigoTotpValido('123456')).toBe(true);
    expect(codigoTotpValido(' 654321 ')).toBe(true);
  });

  it('recusa tamanho errado ou caracteres não numéricos', () => {
    expect(codigoTotpValido('')).toBe(false);
    expect(codigoTotpValido('12345')).toBe(false);
    expect(codigoTotpValido('1234567')).toBe(false);
    expect(codigoTotpValido('12a456')).toBe(false);
    expect(codigoTotpValido('12345 6')).toBe(false);
  });
});