import { describe, expect, it } from 'vitest';
import {
  INITIAL_PROGRESS,
  describeDue,
  formatInterval,
  masteryLabel,
  nextEaseFactor,
  nextFlashcardState,
  xpForGrade,
} from '@/lib/flashcardSrs';

describe('flashcardSrs', () => {
  it('primeira revisao boa cai para 1 dia e ganha 5 XP', () => {
    const { progress, label, minutes } = nextFlashcardState(INITIAL_PROGRESS, 2);
    expect(progress.repetitions).toBe(1);
    expect(progress.intervalDays).toBe(1);
    expect(minutes).toBe(1440);
    expect(label).toBe('1 dia');
    expect(xpForGrade(2)).toBe(5);
  });

  it('segunda revisao sobe para 6 dias e a terceira multiplica pelo fator de facilidade', () => {
    const primeira = nextFlashcardState(INITIAL_PROGRESS, 3).progress;
    expect(primeira.easeFactor).toBe(2.6);

    const segunda = nextFlashcardState(primeira, 2).progress;
    expect(segunda.repetitions).toBe(2);
    expect(segunda.intervalDays).toBe(6);

    const terceira = nextFlashcardState({ ...segunda, repetitions: 3 }, 2).progress;
    expect(terceira.intervalDays).toBe(Math.round(6 * 2.6));
  });

  it('errar zera a sequencia, conta lapso e agenda 10 minutos', () => {
    const { progress, label, mastered } = nextFlashcardState(
      { easeFactor: 2.6, intervalDays: 6, repetitions: 2, lapses: 0 },
      0,
    );
    expect(progress.repetitions).toBe(0);
    expect(progress.intervalDays).toBe(0);
    expect(progress.lapses).toBe(1);
    expect(label).toBe('10 min');
    expect(mastered).toBe(false);
    expect(xpForGrade(0)).toBe(0);
  });

  it('fator de facilidade respeita os limites de 1.3 a 3.2', () => {
    expect(nextEaseFactor(1.3, 0)).toBe(1.3);
    expect(nextEaseFactor(3.2, 3)).toBe(3.2);
    expect(nextEaseFactor(2.5, 2)).toBe(2.5);
  });

  it('marca como dominado a partir da quinta repeticao correta', () => {
    const { mastered } = nextFlashcardState(
      { easeFactor: 2.5, intervalDays: 20, repetitions: 4, lapses: 1 },
      2,
    );
    expect(mastered).toBe(true);
    expect(masteryLabel(5)).toBe('Dominado');
    expect(masteryLabel(1)).toBe('Aprendendo');
    expect(masteryLabel(0)).toBe('Novo');
  });

  it('descreve e formata prazos para o aluno', () => {
    const agora = new Date('2026-11-26T12:00:00Z');
    expect(formatInterval(10)).toBe('10 min');
    expect(formatInterval(1440)).toBe('1 dia');
    expect(formatInterval(6 * 1440)).toBe('6 dias');
    expect(describeDue('2026-11-26T18:00:00Z', agora)).toBe('Hoje');
    expect(describeDue('2026-11-27T12:00:00Z', agora)).toBe('Em 1 dia');
    expect(describeDue('2026-11-24T12:00:00Z', agora)).toBe('Atrasado 2 dias');
  });
});