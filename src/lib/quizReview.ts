/**
 * Revisão de quiz (FUNC-021).
 *
 * O cliente lê as opções por `quiz_options_public`, que não expõe `is_correct`.
 * Depois que a tentativa é gravada, a RPC `get_quiz_review` devolve o gabarito
 * apenas da tentativa do próprio usuário; este módulo converte o payload para o
 * formato consumido pelo componente `QuizReview`.
 */

export interface QuizReviewOptionRow {
  id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface QuizReviewQuestionRow {
  id: string;
  question_text: string;
  explanation: string | null;
  order_index: number;
  selected_option_id: string | null;
  options: QuizReviewOptionRow[];
}

export interface QuizReviewPayload {
  attempt_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  passed: boolean;
  questions: QuizReviewQuestionRow[];
}

export interface QuizReviewStep {
  id: string;
  question_text: string;
  explanation?: string;
  options: Array<{ id: string; option_text: string; is_correct: boolean }>;
}

export interface QuizReviewAnswer {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface QuizReviewData {
  steps: QuizReviewStep[];
  answers: QuizReviewAnswer[];
  correctCount: number;
  totalQuestions: number;
}

export const buildQuizReview = (payload: QuizReviewPayload | null | undefined): QuizReviewData | null => {
  const questions = payload?.questions ?? [];
  if (!payload || questions.length === 0) return null;

  const steps: QuizReviewStep[] = questions.map((question) => ({
    id: question.id,
    question_text: question.question_text,
    explanation: question.explanation ?? undefined,
    options: (question.options ?? []).map((option) => ({
      id: option.id,
      option_text: option.option_text,
      is_correct: option.is_correct,
    })),
  }));

  const answers: QuizReviewAnswer[] = questions
    .filter((question) => Boolean(question.selected_option_id))
    .map((question) => ({
      questionId: question.id,
      selectedOptionId: question.selected_option_id as string,
      isCorrect: (question.options ?? []).some(
        (option) => option.id === question.selected_option_id && option.is_correct
      ),
    }));

  return {
    steps,
    answers,
    correctCount: answers.filter((answer) => answer.isCorrect).length,
    totalQuestions: questions.length,
  };
};