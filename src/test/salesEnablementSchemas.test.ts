import { describe, it, expect } from 'vitest';
import {
  playbookSchema,
  trainingVideoSchema,
  onboardingWorkflowSchema,
  skillAssessmentSchema,
} from '@/lib/salesEnablementSchemas';

describe('salesEnablementSchemas', () => {
  describe('playbookSchema', () => {
    const valid = {
      title: 'Como prospectar leads',
      slug: 'como-prospectar-leads',
      category: 'prospeccao',
      summary: 'Um guia',
      content: 'Conteúdo do playbook em markdown.',
      tags: ['vendas'],
      is_published: true,
    };
    it('aceita payload válido', () => expect(playbookSchema.safeParse(valid).success).toBe(true));
    it('rejeita slug com maiúsculas', () => expect(playbookSchema.safeParse({ ...valid, slug: 'BadSlug' }).success).toBe(false));
    it('rejeita slug com espaços', () => expect(playbookSchema.safeParse({ ...valid, slug: 'bad slug' }).success).toBe(false));
    it('rejeita título curto', () => expect(playbookSchema.safeParse({ ...valid, title: 'a' }).success).toBe(false));
    it('rejeita conteúdo vazio', () => expect(playbookSchema.safeParse({ ...valid, content: 'a' }).success).toBe(false));
    it('rejeita mais de 20 tags', () => {
      const tags = Array.from({ length: 21 }, (_, i) => `tag${i}`);
      expect(playbookSchema.safeParse({ ...valid, tags }).success).toBe(false);
    });
  });

  describe('trainingVideoSchema', () => {
    const valid = {
      title: 'Demo do produto',
      description: 'Descrição',
      video_url: 'https://example.com/video.mp4',
      thumbnail_url: 'https://example.com/t.jpg',
      category: 'demo',
      duration_seconds: 120,
      tags: ['demo'],
      is_published: true,
    };
    it('aceita payload válido', () => expect(trainingVideoSchema.safeParse(valid).success).toBe(true));
    it('rejeita URL inválida', () => expect(trainingVideoSchema.safeParse({ ...valid, video_url: 'not-a-url' }).success).toBe(false));
    it('aceita thumbnail vazia', () => expect(trainingVideoSchema.safeParse({ ...valid, thumbnail_url: '' }).success).toBe(true));
    it('rejeita duração negativa', () => expect(trainingVideoSchema.safeParse({ ...valid, duration_seconds: -1 }).success).toBe(false));
  });

  describe('onboardingWorkflowSchema', () => {
    const valid = {
      name: 'Onboarding SDR',
      description: 'Para novos SDRs',
      role_target: 'sales',
      steps: [{ id: '1', type: 'task' as const, title: 'Apresentação', required: true }],
      is_active: true,
      is_default: false,
    };
    it('aceita payload válido', () => expect(onboardingWorkflowSchema.safeParse(valid).success).toBe(true));
    it('rejeita workflow sem passos', () => expect(onboardingWorkflowSchema.safeParse({ ...valid, steps: [] }).success).toBe(false));
    it('rejeita tipo de passo inválido', () => {
      const bad = { ...valid, steps: [{ id: '1', type: 'invalid', title: 'X', required: true }] };
      expect(onboardingWorkflowSchema.safeParse(bad).success).toBe(false);
    });
  });

  describe('skillAssessmentSchema', () => {
    const valid = {
      title: 'Avaliação de prospecção',
      description: null,
      skill_area: 'prospeccao',
      frequency_days: 90,
      passing_score: 70,
      quiz_id: null,
      is_active: true,
    };
    it('aceita payload válido', () => expect(skillAssessmentSchema.safeParse(valid).success).toBe(true));
    it('rejeita score acima de 100', () => expect(skillAssessmentSchema.safeParse({ ...valid, passing_score: 101 }).success).toBe(false));
    it('rejeita frequência zero', () => expect(skillAssessmentSchema.safeParse({ ...valid, frequency_days: 0 }).success).toBe(false));
    it('aceita quiz_id null', () => expect(skillAssessmentSchema.safeParse({ ...valid, quiz_id: null }).success).toBe(true));
    it('rejeita quiz_id inválido', () => expect(skillAssessmentSchema.safeParse({ ...valid, quiz_id: 'not-uuid' }).success).toBe(false));
  });
});
