import { describe, expect, it } from 'vitest';
import { paraInputLocal } from '@/lib/datetimeInput';

const doisDigitos = (n: number) => String(n).padStart(2, '0');

describe('paraInputLocal', () => {
  it('converte UTC para o horario local do navegador (UTC-3)', () => {
    expect(paraInputLocal('2026-12-01T15:30:00Z', 180)).toBe('2026-12-01T12:30');
  });

  it('respeita fusos positivos com meia hora (UTC+5:30)', () => {
    expect(paraInputLocal('2026-12-01T15:30:00Z', -330)).toBe('2026-12-01T21:00');
  });

  it('atravessa a virada do dia sem perder a data correta', () => {
    expect(paraInputLocal('2026-12-01T02:30:00Z', 180)).toBe('2026-11-30T23:30');
  });

  it('aceita Date e mantem o minuto exato', () => {
    const instante = new Date('2026-12-01T12:30:00Z');
    expect(paraInputLocal(instante, 0)).toBe('2026-12-01T12:30');
  });

  it('devolve vazio para valor invalido', () => {
    expect(paraInputLocal('nao-e-data', 180)).toBe('');
    expect(paraInputLocal('', 0)).toBe('');
  });

  it('usa o fuso real do ambiente quando o offset nao e informado', () => {
    const agora = new Date();
    const esperado = `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(
      agora.getDate(),
    )}T${doisDigitos(agora.getHours())}:${doisDigitos(agora.getMinutes())}`;
    expect(paraInputLocal(agora)).toBe(esperado);
  });

  it('faz round-trip com o value do input datetime-local', () => {
    const texto = paraInputLocal('2026-12-01T15:30:45Z', 180);
    expect(new Date(`${texto}:00Z`).getTime()).toBe(Date.parse('2026-12-01T12:30:00Z'));
  });
});