import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type OnboardingStepType = 'video' | 'playbook' | 'quiz' | 'course' | 'task';

export interface OnboardingStep {
  id: string;
  type: OnboardingStepType;
  title: string;
  description?: string;
  resource_id?: string;
  resource_url?: string;
  required: boolean;
}

export interface OnboardingWorkflow {
  id: string;
  name: string;
  description: string | null;
  role_target: string;
  steps: OnboardingStep[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserOnboardingProgress {
  id: string;
  user_id: string;
  workflow_id: string;
  current_step: number;
  completed_steps: string[];
  started_at: string;
  completed_at: string | null;
}

export const useOnboardingWorkflows = () => {
  return useQuery({
    queryKey: ['onboarding-workflows'],
    queryFn: async () => {
      const { data, error } = await supabase.from('onboarding_workflows').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(w => ({ ...w, steps: (w.steps as unknown as OnboardingStep[]) || [] })) as OnboardingWorkflow[];
    },
  });
};

export const useDefaultWorkflowProgress = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['onboarding-progress', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: workflow } = await supabase
        .from('onboarding_workflows')
        .select('*')
        .eq('is_active', true)
        .eq('is_default', true)
        .maybeSingle();
      if (!workflow) return null;

      const { data: progress } = await supabase
        .from('user_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('workflow_id', workflow.id)
        .maybeSingle();

      return {
        workflow: { ...workflow, steps: (workflow.steps as unknown as OnboardingStep[]) || [] } as OnboardingWorkflow,
        progress: progress as UserOnboardingProgress | null,
      };
    },
    enabled: !!user,
  });
};

export const useUpdateOnboardingProgress = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ workflowId, stepId, totalSteps }: { workflowId: string; stepId: string; totalSteps: number }) => {
      if (!user) throw new Error('Não autenticado');

      const { data: existing } = await supabase
        .from('user_onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('workflow_id', workflowId)
        .maybeSingle();

      const completed = new Set<string>(((existing?.completed_steps as unknown) as string[]) || []);
      completed.add(stepId);
      const completedArr = Array.from(completed);
      const isComplete = completedArr.length >= totalSteps;

      if (existing) {
        const { error } = await supabase
          .from('user_onboarding_progress')
          .update({
            completed_steps: completedArr,
            current_step: completedArr.length,
            completed_at: isComplete ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_onboarding_progress').insert({
          user_id: user.id,
          workflow_id: workflowId,
          completed_steps: completedArr,
          current_step: completedArr.length,
          completed_at: isComplete ? new Date().toISOString() : null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-progress'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSaveWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<OnboardingWorkflow> & { id?: string }) => {
      const { id, steps, ...rest } = input;
      const payload = { ...rest, steps: (steps as unknown) as never };
      if (id) {
        const { error } = await supabase.from('onboarding_workflows').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('onboarding_workflows').insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-workflows'] });
      toast.success('Workflow salvo');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('onboarding_workflows').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-workflows'] });
      toast.success('Workflow removido');
    },
  });
};
