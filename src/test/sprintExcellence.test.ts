import { describe, it, expect } from 'vitest';

describe('Sprint Excelência — exports', () => {
  it('ErrorBoundary é exportado', async () => {
    const mod = await import('@/components/ErrorBoundary');
    expect(mod.default).toBeDefined();
  });

  it('AdminTopPlaybooksWidget é exportado', async () => {
    const mod = await import('@/components/admin/AdminTopPlaybooksWidget');
    expect(mod.default).toBeDefined();
  });

  it('AdminVideoEngagementWidget é exportado', async () => {
    const mod = await import('@/components/admin/AdminVideoEngagementWidget');
    expect(mod.default).toBeDefined();
  });

  it('schemas Sales Enablement são exportados', async () => {
    const mod = await import('@/lib/salesEnablementSchemas');
    expect(mod.playbookSchema).toBeDefined();
    expect(mod.trainingVideoSchema).toBeDefined();
    expect(mod.onboardingWorkflowSchema).toBeDefined();
    expect(mod.skillAssessmentSchema).toBeDefined();
  });
});

describe('Sprint Excelência — queryClient retry', () => {
  it('queryClient está configurado com retry', async () => {
    const { queryClient } = await import('@/lib/queryClient');
    const defaults = queryClient.getDefaultOptions();
    expect(defaults.queries?.retry).toBeDefined();
    expect(defaults.mutations?.retry).toBeDefined();
  });
});
