import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useT, type DictPath } from '@/lib/i18n';
import { toast } from 'sonner';

export type MetricaMissao = 'xp' | 'lessons' | 'courses';

export interface MissaoDepartamento {
  id: string;
  titulo: string;
  descricao: string;
  departamento: string | null;
  metrica: MetricaMissao;
  meta: number;
  xp: number;
  inicio: string;
  fim: string;
  progresso: number;
  participantes: number;
  membros: number;
  concluido: boolean;
  resgatado: boolean;
  resgatadoEm: string | null;
  xpResgatado: number;
}

const numero = (valor: unknown) =>
  typeof valor === 'number' && Number.isFinite(valor) ? valor : Number(valor) || 0;

const texto = (valor: unknown) => (typeof valor === 'string' ? valor : '');

export const normalizarMissao = (bruto: Record<string, unknown>): MissaoDepartamento => {
  const metrica = bruto.metric;
  return {
    id: texto(bruto.id),
    titulo: texto(bruto.title),
    descricao: texto(bruto.description),
    departamento: typeof bruto.department === 'string' ? bruto.department : null,
    metrica: metrica === 'lessons' || metrica === 'courses' ? metrica : 'xp',
    meta: numero(bruto.target_value),
    xp: numero(bruto.xp_reward),
    inicio: texto(bruto.starts_at),
    fim: texto(bruto.ends_at),
    progresso: numero(bruto.progresso),
    participantes: numero(bruto.participantes),
    membros: numero(bruto.membros),
    concluido: bruto.concluido === true,
    resgatado: bruto.resgatado === true,
    resgatadoEm: typeof bruto.resgatado_em === 'string' ? bruto.resgatado_em : null,
    xpResgatado: numero(bruto.xp_resgatado),
  };
};

/** Motivo devolvido pelo banco vira chave traduzida. */
export const motivoFalha = (codigo?: string): DictPath => {
  switch (codigo) {
    case 'not_completed':
      return 'missions.errorNotCompleted';
    case 'already_claimed':
      return 'missions.errorAlreadyClaimed';
    case 'period':
      return 'missions.errorPeriod';
    case 'other_department':
      return 'missions.errorOtherDepartment';
    case 'not_found':
      return 'missions.errorNotFound';
    default:
      return 'missions.errorUnknown';
  }
};

export const metricaLabel = (metrica: MetricaMissao): DictPath => {
  switch (metrica) {
    case 'lessons':
      return 'missions.metricLessons';
    case 'courses':
      return 'missions.metricCourses';
    default:
      return 'missions.metricXp';
  }
};

export const useDepartmentChallenges = () => {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { t } = useT();
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ['desafios-departamento', userId],
    enabled: !!userId,
    staleTime: 0,
    queryFn: async (): Promise<MissaoDepartamento[]> => {
      const { data, error } = await supabase.rpc('get_my_department_challenges');
      if (error) throw error;

      const linhas = Array.isArray(data) ? (data as unknown as Record<string, unknown>[]) : [];
      return linhas.map(normalizarMissao);
    },
  });

  const resgate = useMutation({
    mutationFn: async (challengeId: string) => {
      const { data, error } = await supabase.rpc('resgatar_desafio_departamento', {
        p_challenge_id: challengeId,
      });
      if (error) throw error;

      return (data ?? {}) as {
        success?: boolean;
        xp_earned?: number;
        challenge_title?: string;
        error?: string;
      };
    },
    onSuccess: (resultado) => {
      if (resultado.success) {
        toast.success(`+${numero(resultado.xp_earned)} XP — ${t('missions.claimedToast')}`, {
          description: resultado.challenge_title || undefined,
        });
      } else {
        toast.error(t(motivoFalha(resultado.error)));
      }
      queryClient.invalidateQueries({ queryKey: ['desafios-departamento'] });
    },
    onError: () => toast.error(t('missions.errorUnknown')),
  });

  return {
    missoes: consulta.data ?? [],
    carregando: !!userId && consulta.isPending,
    erro: consulta.error ? (consulta.error as Error).message : null,
    recarregar: consulta.refetch,
    resgatar: resgate.mutateAsync,
    resgatandoId: resgate.isPending ? resgate.variables ?? null : null,
  };
};