import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SkillAssessment {
  id: string;
  title: string;
  description: string | null;
  skill_area: string;
  frequency_days: number;
  passing_score: number;
  quiz_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DueAssessment {
  assessment_id: string;
  title: string;
  skill_area: string;
  frequency_days: number;
  passing_score: number;
  quiz_id: string | null;
  last_completed_at: string | null;
  next_due_at: string | null;
  status: 'pending' | 'overdue' | 'due_soon' | 'on_track';
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  passed: boolean;
  gaps: string[];
  completed_at: string;
  next_due_at: string | null;
}

export const useSkillAssessments = () => {
  return useQuery({
    queryKey: ['skill-assessments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('skill_assessments').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SkillAssessment[];
    },
  });
};

export const useDueAssessments = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['due-assessments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.rpc('get_due_assessments', { p_user_id: user.id });
      if (error) throw error;
      return (data || []) as DueAssessment[];
    },
    enabled: !!user,
  });
};

export const useUserAssessmentResults = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['assessment-results', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({ ...r, gaps: (r.gaps as unknown as string[]) || [] })) as AssessmentResult[];
    },
    enabled: !!user,
  });
};

export const useSubmitAssessment = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ assessmentId, score, passingScore, frequencyDays, gaps }: {
      assessmentId: string; score: number; passingScore: number; frequencyDays: number; gaps: string[];
    }) => {
      if (!user) throw new Error('Não autenticado');
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + frequencyDays);
      const { error } = await supabase.from('user_assessment_results').insert({
        user_id: user.id,
        assessment_id: assessmentId,
        score,
        passed: score >= passingScore,
        gaps: gaps as unknown as never,
        next_due_at: nextDue.toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['due-assessments'] });
      qc.invalidateQueries({ queryKey: ['assessment-results'] });
      toast.success('Avaliação registrada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSaveAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SkillAssessment> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from('skill_assessments').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('skill_assessments').insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skill-assessments'] });
      toast.success('Avaliação salva');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeleteAssessment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('skill_assessments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['skill-assessments'] });
      toast.success('Avaliação excluída');
    },
  });
};
