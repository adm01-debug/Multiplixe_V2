import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Playbook {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string | null;
  content: string;
  tags: string[];
  author_id: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export const playbookKeys = {
  all: ['playbooks'] as const,
  list: (includeUnpublished = false) => ['playbooks', 'list', includeUnpublished] as const,
  detail: (slug: string) => ['playbooks', 'detail', slug] as const,
};

export const usePlaybooks = (includeUnpublished = false) => {
  return useQuery({
    queryKey: playbookKeys.list(includeUnpublished),
    queryFn: async () => {
      let query = supabase.from('playbooks').select('*').order('created_at', { ascending: false });
      if (!includeUnpublished) query = query.eq('is_published', true);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Playbook[];
    },
  });
};

export const usePlaybook = (slug: string) => {
  return useQuery({
    queryKey: playbookKeys.detail(slug),
    queryFn: async () => {
      const { data, error } = await supabase.from('playbooks').select('*').eq('slug', slug).maybeSingle();
      if (error) throw error;
      return data as Playbook | null;
    },
    enabled: !!slug,
  });
};

export const useRegisterPlaybookView = () => {
  return useMutation({
    mutationFn: async (playbookId: string) => {
      const { error } = await supabase.rpc('register_playbook_view', { p_playbook_id: playbookId });
      if (error) throw error;
    },
  });
};

export const useSavePlaybook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Playbook> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from('playbooks').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('playbooks').insert(rest as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: playbookKeys.all });
      toast.success('Playbook salvo');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useDeletePlaybook = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('playbooks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: playbookKeys.all });
      toast.success('Playbook excluído');
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
