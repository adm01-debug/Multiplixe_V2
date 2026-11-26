import { describe, expect, it } from 'vitest';
import {
  applyAdaptivePlan,
  describeAdaptiveFeedback,
  describeDifficultyBreakdown,
  describeXpBonus,
  difficultyLabel,
  type AdaptiveQuizPlan,
} from '@/lib/quizAdaptive';

const questions = [
  { id: 'q1', question_text: 'facil 1' },
  { id: 'q2', question_text: 'medio 1' },
  { id: 'q3', question_text: 'dificil 1' },
];

const plan: AdaptiveQuizPlan = {
  quiz_id: 'quiz-1',
  target_difficulty: 'dificil',
  question_ids: ['q3', 'q2', 'q1'],
  limit: 3,
  total_available: 3,
  counts: { dificil: { total: 1 } },
};

describe('FUNC-020 quiz adaptativo', () => {
  it('aplica a ordem do plano e mantém o subconjunto escolhido pelo servidor', () => {
    const subset = { ...plan, question_ids: ['q3', 'q1'], limit: 2 };
    expect(applyAdaptivePlan(questions, subset).map((q) => q.id)).toEqual(['q3', 'q1']);
  });

  it('não quebra quando o plano cita questão que não existe mais no quiz', () => {
    const stale = { ...plan, question_ids: ['q3', 'q9'] };
    expect(applyAdaptivePlan(questions, stale)).toEqual(questions);
    expect(applyAdaptivePlan(questions, null)).toEqual(questions);
  });

  it('resume acertos por nível e o feedback do próximo nível', () => {
    expect(describeDifficultyBreakdown({ facil: { total: 3, correct: 2 }, dificil: { total: 1, correct: 1 } }))
      .toBe('Fácil 2/3 · Difícil 1/1');
    expect(describeDifficultyBreakdown(null)).toBe('');
    expect(difficultyLabel('dificil')).toBe('Difícil');
    expect(difficultyLabel(undefined)).toBe('Médio');
    expect(describeAdaptiveFeedback('dificil', 92)).toContain('nível Difícil');
    expect(describeAdaptiveFeedback('facil', 30)).toContain('nível Fácil');
    expect(describeXpBonus(15)).toContain('15 XP');
    expect(describeXpBonus(0)).toBe('');
  });
});