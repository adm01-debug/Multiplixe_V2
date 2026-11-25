import { z } from 'zod';

/**
 * Schemas reutilizáveis de validação (Zod).
 * Regras que antes só existiam espalhadas em `handleSave` de cada tela.
 */

export const MAX_QUIZ_QUESTIONS = 50;
export const MAX_QUIZ_OPTIONS = 10;

const optionSchema = z.object({
  id: z.string().optional(),
  option_text: z.string().trim().min(1, 'opção sem texto').max(500, 'opção muito longa (máx. 500)'),
  is_correct: z.boolean(),
  order_index: z.number().int().min(0),
});

const optionsSchema = z.preprocess(
  // O formulário começa com 4 linhas de opção; as que ficam em branco são descartadas
  // (mesmo comportamento de antes, mas agora de forma explícita).
  (value) =>
    Array.isArray(value)
      ? value.filter((o) => typeof (o as { option_text?: unknown })?.option_text === 'string' && (o as { option_text: string }).option_text.trim() !== '')
      : value,
  z
    .array(optionSchema)
    .min(2, 'precisa de pelo menos 2 opções preenchidas')
    .max(MAX_QUIZ_OPTIONS, `no máximo ${MAX_QUIZ_OPTIONS} opções`)
    .refine((opts) => opts.some((o) => o.is_correct), 'precisa ter uma resposta correta marcada'),
);

export const quizQuestionSchema = z.object({
  id: z.string().optional(),
  question_text: z.string().trim().min(1, 'está sem texto').max(2000, 'texto muito longo (máx. 2000)'),
  explanation: z.string().trim().max(2000, 'explicação muito longa (máx. 2000)'),
  order_index: z.number().int().min(0),
  options: optionsSchema,
});

export const quizSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Informe o título do quiz').max(200, 'Título muito longo (máx. 200)'),
  description: z.string().trim().max(2000, 'Descrição muito longa (máx. 2000)'),
  passing_score: z.number().int('Pontuação mínima inválida').min(0, 'Pontuação mínima não pode ser negativa').max(100, 'Pontuação mínima vai até 100'),
  xp_reward: z.number().int('XP inválido').min(0, 'XP não pode ser negativo').max(10000, 'XP por quiz vai até 10000'),
  time_limit_seconds: z.number().int('Tempo limite inválido').min(1, 'Tempo limite mínimo é 1 segundo').max(7200, 'Tempo limite vai até 7200 segundos').nullable(),
  cooldown_hours: z.number().int('Cooldown inválido').min(0, 'Cooldown não pode ser negativo').max(720, 'Cooldown vai até 720 horas'),
  questions: z.array(quizQuestionSchema).min(1, 'Adicione pelo menos uma questão').max(MAX_QUIZ_QUESTIONS, `no máximo ${MAX_QUIZ_QUESTIONS} questões`),
});

export type QuizInput = z.infer<typeof quizSchema>;
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;
