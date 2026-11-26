import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EventoSazonal {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  xp_multiplier: number;
  starts_at: string;
  ends_at: string;
  days_left: number;
}

export const CHAVE_EVENTO_SAZONAL = ['evento-sazonal'] as const;

export const normalizarEvento = (bruto: unknown): EventoSazonal | null => {
  if (!bruto || typeof bruto !== 'object') return null;

  const dados = bruto as Record<string, unknown>;
  const id = typeof dados.id === 'string' ? dados.id : '';
  const title = typeof dados.title === 'string' ? dados.title : '';
  if (!id || !title) return null;

  const multiplicador = Number(dados.xp_multiplier);

  return {
    id,
    slug: typeof dados.slug === 'string' ? dados.slug : '',
    title,
    description: typeof dados.description === 'string' ? dados.description : null,
    emoji: typeof dados.emoji === 'string' ? dados.emoji : null,
    xp_multiplier: Number.isFinite(multiplicador) && multiplicador > 1 ? multiplicador : 1,
    starts_at: typeof dados.starts_at === 'string' ? dados.starts_at : '',
    ends_at: typeof dados.ends_at === 'string' ? dados.ends_at : '',
    days_left: Math.max(0, Number(dados.days_left) || 0),
  };
};

export const useSeasonalEvent = () => {
  const { user } = useAuth();
  const userId = user?.id;

  const consulta = useQuery({
    queryKey: [...CHAVE_EVENTO_SAZONAL, userId],
    enabled: Boolean(userId),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<EventoSazonal | null> => {
      const { data, error } = await supabase.rpc('get_active_seasonal_event');
      if (error) throw error;
      return normalizarEvento(data);
    },
  });

  return {
    evento: consulta.data ?? null,
    carregando: Boolean(userId) && consulta.isPending,
    erro: Boolean(consulta.error),
    recarregar: consulta.refetch,
  };
};