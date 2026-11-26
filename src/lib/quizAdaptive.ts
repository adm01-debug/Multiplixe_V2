/**
 * FUNC-020 — quiz adaptativo.
 * O nível alvo de cada tentativa vem do servidor (get_adaptive_quiz_plan), que
 * olha o desempenho anterior do próprio usuário. Aqui só ficam os rótulos e a
 * aplicação do plano sobre as questões já carregadas.
 */

export type QuizDifficulty = 'facil' | 'medio' | 'dificil';

export const QUIZ_DIFFICULTIES: QuizDifficulty[] = ['facil', 'medio', 'dificil'];

export const QUIZ_DIFFICULTY_LABELS: Record<QuizDifficulty, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

export const QUIZ_DIFFICULTY_HINTS: Record<QuizDifficulty, string> = {
  facil: 'Acerto vale 1 ponto e bônus de 2 XP.',
  medio: 'Acerto vale 1,5 ponto e bônus de 5 XP.',
  dificil: 'Acerto vale 2 pontos e bônus de 10 XP.',
};

export const QUIZ_DIFFICULTY_BADGE_CLASS: Record<QuizDifficulty, string> = {
  facil: 'border-green-500/40 text-green-600',
  medio: 'border-amber-500/40 text-amber-600',
  dificil: 'border-red-500/40 text-red-600',
};

export interface AdaptiveQuizPlan {
  quiz_id: string;
  target_difficulty: QuizDifficulty;
  question_ids: string[];
  limit: number;
  total_available: number;
  counts: Partial<Record<QuizDifficulty, { total: number }>>;
}

export type QuizDifficultyGrade = {
  total: number;
  correct: number;
};

export const isQuizDifficulty = (value: unknown): value is QuizDifficulty =>
  typeof value === 'string' && (QUIZ_DIFFICULTIES as string[]).includes(value);

export const difficultyLabel = (value: string | null | undefined): string =>
  isQuizDifficulty(value) ? QUIZ_DIFFICULTY_LABELS[value] : QUIZ_DIFFICULTY_LABELS.medio;

export const difficultyBadgeClass = (value: string | null | undefined): string =>
  QUIZ_DIFFICULTY_BADGE_CLASS[isQuizDifficulty(value) ? value : 'medio'];

/**
 * Aplica a ordem/escolha do plano sobre as questões carregadas.
 * Se o plano citar questão que o cliente não tem (plano velho ou quiz editado),
 * devolve a lista original para não quebrar a tentativa.
 */
export const applyAdaptivePlan = <T extends { id: string }>(
  questions: T[],
  plan: AdaptiveQuizPlan | null | undefined
): T[] => {
  if (!plan || !Array.isArray(plan.question_ids) || plan.question_ids.length === 0) {
    return questions;
  }

  const byId = new Map(questions.map((q) => [q.id, q]));
  const ordered: T[] = [];
  for (const id of plan.question_ids) {
    const question = byId.get(id);
    if (!question) return questions;
    ordered.push(question);
  }

  return ordered;
};

/** Texto curto do resultado por nível, ex.: "Fácil 2/3 · Difícil 1/1". */
export const describeDifficultyBreakdown = (
  byDifficulty: Record<string, QuizDifficultyGrade> | null | undefined
): string => {
  if (!byDifficulty) return '';

  return QUIZ_DIFFICULTIES.filter((level) => byDifficulty[level])
    .map((level) => {
      const grade = byDifficulty[level];
      return `${QUIZ_DIFFICULTY_LABELS[level]} ${grade.correct}/${grade.total}`;
    })
    .join(' · ');
};

/** Aviso de desempenho por nível acima/abaixo do esperado. */
export const describeAdaptiveFeedback = (
  recommended: string | null | undefined,
  weightedScore: number | null | undefined
): string => {
  const level = difficultyLabel(recommended);
  if (typeof weightedScore !== 'number') {
    return `Suas próximas questões vêm no nível ${level}.`;
  }
  if (weightedScore >= 85) {
    return `Bom desempenho: suas próximas questões sobem para o nível ${level}.`;
  }
  if (weightedScore >= 60) {
    return `Desempenho mediano: suas próximas questões ficam no nível ${level}.`;
  }
  return `Vamos reforçar a base: suas próximas questões voltam ao nível ${level}.`;
};

/** Bônus de XP do servidor, ex.: "+15 XP de bônus (questões difíceis)". */
export const describeXpBonus = (xpBonus: number | null | undefined): string =>
  typeof xpBonus === 'number' && xpBonus > 0 ? `+${xpBonus} XP de bônus por questões difíceis` : '';