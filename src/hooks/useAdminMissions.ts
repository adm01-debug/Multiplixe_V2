import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  normalizarMissao,
  type MetricaMissao,
  type MissaoDepartamento,
} from '@/hooks/useDepartmentChallenges';

export interface MissaoAdmin extends MissaoDepartamento {
  ativa: boolean;
  resgates: number;
}

export interface MissaoInput {
  title: string;
  description: string | null;
  department: string | null;
  metric: MetricaMissao;
  target_value: number;
  xp_reward: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const CHAVE = ['admin-desafios-departamento'];

const normalizarAdmin = (bruto: Record<string, unknown>): MissaoAdmin => ({
  ...normalizarMissao(bruto),
  ativa: bruto.is_active === true,
  resgates: Number(bruto.resgates) || 0,
});

export const useAdminMissions = () => {
  const consulta = useQuery({
    queryKey: CHAVE,
    staleTime: 0,
    queryFn: async (): Promise<MissaoAdmin[]> => {
      const { data, error } = await supabase.rpc('get_admin_department_challenges');
      if (error) throw error;

      const linhas = Array.isArray(data) ? (data as unknown as Record<string, unknown>[]) : [];
      return linhas.map(normalizarAdmin);
    },
  });

  return {
    missoes: consulta.data ?? [],
    carregando: consulta.isPending,
    erro: consulta.error ? (consulta.error as Error).message : null,
    recarregar: consulta.refetch,
  };
};

const invalidar = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: CHAVE });
  queryClient.invalidateQueries({ queryKey: ['desafios-departamento'] });
};

export const useSalvarMissao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dados }: MissaoInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('department_challenges').update(dados).eq('id', id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase
        .from('department_challenges')
        .insert(dados)
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_id, variaveis) => {
      toast.success(variaveis.id ? 'Missão atualizada' : 'Missão criada');
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Não foi possível salvar a missão: ${(erro as Error).message}`),
  });
};

export const useAlternarMissao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase
        .from('department_challenges')
        .update({ is_active: ativa })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Não foi possível mudar a missão: ${(erro as Error).message}`),
  });
};

export const useExcluirMissao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('department_challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Missão excluída');
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`Não foi possível excluir a missão: ${(erro as Error).message}`),
  });
};