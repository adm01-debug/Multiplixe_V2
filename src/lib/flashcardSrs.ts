/**
 * Regras do SRS de flashcards no cliente. Espelha o calculo de `public.review_flashcard`
 * (SM-2 simplificado): a fonte da verdade e o banco; aqui e so para mostrar ao aluno
 * quando a questao volta e quanto XP ele ganha.
 */

export type FlashcardGrade = 0 | 1 | 2 | 3;

export interface FlashcardGradeOption {
  grade: FlashcardGrade;
  label: string;
  hint: string;
  xp: number;
  className: string;
}

export interface FlashcardProgressState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface FlashcardNextState {
  progress: FlashcardProgressState;
  /** Intervalo ate a proxima revisao, em minutos (0 = volta na mesma sessao de 10 min). */
  minutes: number;
  /** Texto pronto para o botao, ex.: "10 min", "1 dia", "6 dias". */
  label: string;
  mastered: boolean;
}

export const INITIAL_PROGRESS: FlashcardProgressState = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
  lapses: 0,
};

export const XP_POR_NOTA: Record<FlashcardGrade, number> = { 0: 0, 1: 3, 2: 5, 3: 7 };

export const MASTERY_TARGET = 5;

export const FLASHCARD_GRADES: FlashcardGradeOption[] = [
  { grade: 0, label: 'Errei', hint: 'Volta em 10 minutos', xp: 0, className: 'border-destructive/40 text-destructive hover:bg-destructive/10' },
  { grade: 1, label: 'Difícil', hint: 'Volta amanhã', xp: 3, className: 'border-amber-500/40 text-amber-600 hover:bg-amber-500/10' },
  { grade: 2, label: 'Bom', hint: 'Intervalo maior', xp: 5, className: 'border-primary/40 text-primary hover:bg-primary/10' },
  { grade: 3, label: 'Fácil', hint: 'Intervalo maior ainda', xp: 7, className: 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10' },
];

export const isFlashcardGrade = (value: unknown): value is FlashcardGrade =>
  value === 0 || value === 1 || value === 2 || value === 3;

const qualityFor = (grade: FlashcardGrade): number => [2, 3, 4, 5][grade];

const clampEase = (value: number): number => Math.min(3.2, Math.max(1.3, Math.round(value * 100) / 100));

/** Mesmo delta do SM-2 aplicado no banco. */
export const nextEaseFactor = (easeFactor: number, grade: FlashcardGrade): number => {
  const q = qualityFor(grade);
  return clampEase(easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
};

export const formatInterval = (minutes: number): string => {
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const days = Math.round(minutes / 1440);
  if (days <= 1) return '1 dia';
  return `${days} dias`;
};

export const nextFlashcardState = (
  state: FlashcardProgressState,
  grade: FlashcardGrade,
): FlashcardNextState => {
  const easeFactor = nextEaseFactor(state.easeFactor, grade);
  if (grade === 0) {
    const progress: FlashcardProgressState = {
      easeFactor,
      intervalDays: 0,
      repetitions: 0,
      lapses: state.lapses + 1,
    };
    return { progress, minutes: 10, label: '10 min', mastered: false };
  }

  const repetitions = state.repetitions + 1;
  const intervalDays = repetitions === 1
    ? 1
    : repetitions === 2
      ? 6
      : Math.max(1, Math.round(Math.max(state.intervalDays, 1) * easeFactor));
  const progress: FlashcardProgressState = {
    easeFactor,
    intervalDays,
    repetitions,
    lapses: state.lapses,
  };
  const minutes = intervalDays * 1440;
  return { progress, minutes, label: formatInterval(minutes), mastered: repetitions >= MASTERY_TARGET };
};

export const gradeOption = (grade: FlashcardGrade): FlashcardGradeOption =>
  FLASHCARD_GRADES.find(option => option.grade === grade) ?? FLASHCARD_GRADES[0];

export const xpForGrade = (grade: FlashcardGrade): number => XP_POR_NOTA[grade];

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Atrasado 2 dias" / "Hoje" / "Em 3 dias" — para a lista de baralhos. */
export const describeDue = (dueAt: string | Date, now: Date = new Date()): string => {
  const due = typeof dueAt === 'string' ? new Date(dueAt) : dueAt;
  const diffDays = Math.floor((due.getTime() - now.getTime()) / DAY_MS);
  if (diffDays <= -2) return `Atrasado ${Math.abs(diffDays)} dias`;
  if (diffDays === -1) return 'Atrasado 1 dia';
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Em 1 dia';
  return `Em ${diffDays} dias`;
};

export const masteryLabel = (repetitions: number): string => {
  if (repetitions <= 0) return 'Novo';
  if (repetitions >= MASTERY_TARGET) return 'Dominado';
  return 'Aprendendo';
};