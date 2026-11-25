import { describe, it, expect } from 'vitest';
import { buildQuizReview, type QuizReviewPayload } from '@/lib/quizReview';

const payload: QuizReviewPayload = {
  attempt_id: 'attempt-1',
  quiz_id: 'quiz-1',
  score: 50,
  total_questions: 2,
  passed: false,
  questions: [
    {
      id: 'q1',
      question_text: 'Pergunta 1',
      explanation: 'Porque sim',
      order_index: 0,
      selected_option_id: 'o1b',
      options: [
        { id: 'o1a', option_text: 'Errada', is_correct: false, order_index: 0 },
        { id: 'o1b', option_text: 'Certa', is_correct: true, order_index: 1 },
      ],
    },
    {
      id: 'q2',
      question_text: 'Pergunta 2',
      explanation: null,
      order_index: 1,
      selected_option_id: 'o2a',
      options: [
        { id: 'o2a', option_text: 'Certa', is_correct: true, order_index: 0 },
        { id: 'o2b', option_text: 'Errada', is_correct: false, order_index: 1 },
      ],
    },
  ],
};

describe('buildQuizReview', () => {
  it('retorna null sem payload ou sem questões', () => {
    expect(buildQuizReview(null)).toBeNull();
    expect(buildQuizReview(undefined)).toBeNull();
    expect(buildQuizReview({ ...payload, questions: [] })).toBeNull();
  });

  it('mapeia questões e opções preservando o gabarito', () => {
    const review = buildQuizReview(payload)!;
    expect(review.steps).toHaveLength(2);
    expect(review.totalQuestions).toBe(2);
    expect(review.steps[0]).toEqual({
      id: 'q1',
      question_text: 'Pergunta 1',
      explanation: 'Porque sim',
      options: [
        { id: 'o1a', option_text: 'Errada', is_correct: false },
        { id: 'o1b', option_text: 'Certa', is_correct: true },
      ],
    });
    expect(review.steps[1].explanation).toBeUndefined();
  });

  it('calcula acertos a partir da opção selecionada', () => {
    const review = buildQuizReview(payload)!;
    expect(review.answers).toEqual([
      { questionId: 'q1', selectedOptionId: 'o1b', isCorrect: true },
      { questionId: 'q2', selectedOptionId: 'o2a', isCorrect: true },
    ]);
    expect(review.correctCount).toBe(2);
  });

  it('ignora questões não respondidas ao montar as respostas', () => {
    const review = buildQuizReview({
      ...payload,
      questions: [{ ...payload.questions[0], selected_option_id: null }],
    })!;
    expect(review.answers).toHaveLength(0);
    expect(review.correctCount).toBe(0);
    expect(review.totalQuestions).toBe(1);
  });

  it('marca como errada a opção incorreta selecionada', () => {
    const review = buildQuizReview({
      ...payload,
      questions: [{ ...payload.questions[0], selected_option_id: 'o1a' }],
    })!;
    expect(review.answers[0]).toEqual({
      questionId: 'q1',
      selectedOptionId: 'o1a',
      isCorrect: false,
    });
    expect(review.correctCount).toBe(0);
  });
});