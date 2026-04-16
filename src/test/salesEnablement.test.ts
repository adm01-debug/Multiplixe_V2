import { describe, it, expect } from 'vitest';

describe('Sales Enablement Suite', () => {
  describe('Module exports', () => {
    it('exports playbook hooks', async () => {
      const mod = await import('@/hooks/usePlaybooks');
      expect(typeof mod.usePlaybooks).toBe('function');
    });
    it('exports training video hooks', async () => {
      const mod = await import('@/hooks/useTrainingVideos');
      expect(typeof mod.useTrainingVideos).toBe('function');
    });
    it('exports onboarding workflow hooks', async () => {
      const mod = await import('@/hooks/useOnboardingWorkflow');
      expect(typeof mod.useOnboardingWorkflows).toBe('function');
      expect(typeof mod.useDefaultWorkflowProgress).toBe('function');
      expect(typeof mod.useUpdateOnboardingProgress).toBe('function');
      expect(typeof mod.useSaveWorkflow).toBe('function');
      expect(typeof mod.useDeleteWorkflow).toBe('function');
    });
    it('exports skill assessment hooks', async () => {
      const mod = await import('@/hooks/useSkillAssessments');
      expect(typeof mod.useSkillAssessments).toBe('function');
      expect(typeof mod.useDueAssessments).toBe('function');
      expect(typeof mod.useSubmitAssessment).toBe('function');
      expect(typeof mod.useSaveAssessment).toBe('function');
      expect(typeof mod.useDeleteAssessment).toBe('function');
    });
  });

  describe('Page modules load', () => {
    it('Playbooks page loads', async () => {
      const mod = await import('@/pages/Playbooks');
      expect(mod.default).toBeDefined();
    });
    it('PlaybookDetail page loads', async () => {
      const mod = await import('@/pages/PlaybookDetail');
      expect(mod.default).toBeDefined();
    });
    it('VideoLibrary page loads', async () => {
      const mod = await import('@/pages/VideoLibrary');
      expect(mod.default).toBeDefined();
    });
    it('SalesOnboarding page loads', async () => {
      const mod = await import('@/pages/SalesOnboarding');
      expect(mod.default).toBeDefined();
    });
    it('SkillAssessments page loads', async () => {
      const mod = await import('@/pages/SkillAssessments');
      expect(mod.default).toBeDefined();
    });
    it('AssessmentRunner page loads', async () => {
      const mod = await import('@/pages/AssessmentRunner');
      expect(mod.default).toBeDefined();
    });
  });

  describe('Admin tab modules', () => {
    it('AdminPlaybooksTab loads', async () => {
      const mod = await import('@/components/admin/AdminPlaybooksTab');
      expect(mod.default).toBeDefined();
    });
    it('AdminVideosTab loads', async () => {
      const mod = await import('@/components/admin/AdminVideosTab');
      expect(mod.default).toBeDefined();
    });
    it('AdminWorkflowsTab loads', async () => {
      const mod = await import('@/components/admin/AdminWorkflowsTab');
      expect(mod.default).toBeDefined();
    });
    it('AdminAssessmentsTab loads', async () => {
      const mod = await import('@/components/admin/AdminAssessmentsTab');
      expect(mod.default).toBeDefined();
    });
  });

  describe('Dashboard widgets', () => {
    it('OnboardingWidget loads', async () => {
      const mod = await import('@/components/dashboard/OnboardingWidget');
      expect(mod.default).toBeDefined();
    });
    it('DueAssessmentsWidget loads', async () => {
      const mod = await import('@/components/dashboard/DueAssessmentsWidget');
      expect(mod.default).toBeDefined();
    });
  });
});
