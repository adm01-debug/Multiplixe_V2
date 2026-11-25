import { describe, it, expect } from 'vitest';
import { quizSchema, MAX_QUIZ_OPTIONS } from '@/lib/schemas';

const option = (option_text: string, is_correct: boolean, order_index: number) => ({ option_text, is_correct, order_index });

const quiz = (overrides: Record<string, unknown> = {}) => ({
  title: 'Quiz da aula',
  description: '',
  passing_score: 90,
  xp_reward: 50,
  time_limit_seconds: null,
  cooldown_hours: 24,
  questions: [
    {
      question_text: 'Qual é a resposta?',
      explanation: '',
      order_index: 0,
      options: [option('Certa', true, 0), option('Errada', false, 1)],
    },
  ],
  ...overrides,
});

describe('quizSchema', () => {
  it('aceita payload válido', () => expect(quizSchema.safeParse(quiz()).success).toBe(true));

  it('aceita quiz sem tempo limite', () => expect(quizSchema.safeParse(quiz({ time_limit_seconds: null })).success).toBe(true));

  it('descarta opções em branco do formulário', () => {
    const data = quiz({
      questions: [
        {
          question_text: 'Q1',
          explanation: '',
          order_index: 0,
          options: [option('Certa', true, 0), option('Errada', false, 1), option('', false, 2), option('   ', false, 3)],
        },
      ],
    });
    const parsed = quizSchema.safeParse(data);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.questions[0].options).toHaveLength(2);
  });

  it('rejeita quiz sem título', () => expect(quizSchema.safeParse(quiz({ title: '  ' })).success).toBe(false));

  it('rejeita quiz sem questões', () => expect(quizSchema.safeParse(quiz({ questions: [] })).success).toBe(false));

  it('rejeita questão sem texto', () => {
    const data = quiz({ questions: [{ question_text: '', explanation: '', order_index: 0, options: [option('a', true, 0), option('b', false, 1)] }] });
    expect(quizSchema.safeParse(data).success).toBe(false);
  });

  it('rejeita questão com menos de 2 opções preenchidas', () => {
    const data = quiz({ questions: [{ question_text: 'Q1', explanation: '', order_index: 0, options: [option('a', true, 0), option('', false, 1)] }] });
    const parsed = quizSchema.safeParse(data);
    expect(parsed.success).toBe(false);
    expect(parsed.success === false && parsed.error.issues[0].message).toContain('2 opções');
    expect(parsed.success === false && parsed.error.issues[0].path).toEqual(['questions', 0, 'options']);
  });

  it('rejeita questão sem resposta correta marcada', () => {
    const data = quiz({ questions: [{ question_text: 'Q1', explanation: '', order_index: 0, options: [option('a', false, 0), option('b', false, 1)] }] });
    const parsed = quizSchema.safeParse(data);
    expect(parsed.success).toBe(false);
    expect(parsed.success === false && parsed.error.issues[0].message).toContain('resposta correta');
  });

  it('rejeita mais opções que o limite', () => {
    const options = Array.from({ length: MAX_QUIZ_OPTIONS + 1 }, (_, i) => option(`opção ${i}`, i === 0, i));
    expect(quizSchema.safeParse(quiz({ questions: [{ question_text: 'Q1', explanation: '', order_index: 0, options }] })).success).toBe(false);
  });

  it('rejeita pontuação mínima fora de 0-100', () => {
    expect(quizSchema.safeParse(quiz({ passing_score: 101 })).success).toBe(false);
    expect(quizSchema.safeParse(quiz({ passing_score: -1 })).success).toBe(false);
  });

  it('rejeita XP e cooldown negativos', () => {
    expect(quizSchema.safeParse(quiz({ xp_reward: -1 })).success).toBe(false);
    expect(quizSchema.safeParse(quiz({ cooldown_hours: -1 })).success).toBe(false);
  });

  it('rejeita time_limit_seconds não inteiro', () => {
    expect(quizSchema.safeParse(quiz({ time_limit_seconds: 12.5 })).success).toBe(false);
  });
});
