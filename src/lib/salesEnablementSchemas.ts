import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const urlSchema = z.string().trim().url({ message: 'URL inválida' }).max(2048);

export const playbookSchema = z.object({
  title: z.string().trim().min(3, 'Título muito curto').max(200),
  slug: z.string().trim().min(3).max(120).regex(slugRegex, 'Use apenas letras minúsculas, números e hífens'),
  category: z.string().trim().min(2).max(50),
  summary: z.string().trim().max(500).optional().nullable(),
  content: z.string().trim().min(10, 'Conteúdo muito curto').max(50000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  is_published: z.boolean(),
});

export const trainingVideoSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  video_url: urlSchema,
  thumbnail_url: z.union([urlSchema, z.literal('')]).optional().nullable(),
  category: z.string().trim().min(2).max(50),
  duration_seconds: z.number().int().min(0).max(36000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  is_published: z.boolean(),
});

export const onboardingStepSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['video', 'playbook', 'quiz', 'course', 'task']),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(500).optional(),
  resource_id: z.string().trim().max(120).optional(),
  resource_url: z.string().trim().max(2048).optional(),
  required: z.boolean(),
});

export const onboardingWorkflowSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(500).optional().nullable(),
  role_target: z.string().trim().min(2).max(50),
  steps: z.array(onboardingStepSchema).min(1, 'Adicione ao menos um passo').max(50),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

export const skillAssessmentSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  skill_area: z.string().trim().min(2).max(80),
  frequency_days: z.number().int().min(1).max(3650),
  passing_score: z.number().int().min(0).max(100),
  quiz_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean(),
});

export type PlaybookInput = z.infer<typeof playbookSchema>;
export type TrainingVideoInput = z.infer<typeof trainingVideoSchema>;
export type OnboardingWorkflowInput = z.infer<typeof onboardingWorkflowSchema>;
export type SkillAssessmentInput = z.infer<typeof skillAssessmentSchema>;
