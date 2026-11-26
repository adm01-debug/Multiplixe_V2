import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CHAVE_EVENTO_SAZONAL } from '@/hooks/useSeasonalEvent';
import { t } from '@/lib/i18n';

export interface EventoAdmin {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  starts_at: string;
  ends_at: string;
  xp_multiplier: number;
  is_active: boolean;
}

export interface EventoInput {
  slug: string;
  title: string;
  description: string | null;
  emoji: string | null;
  starts_at: string;
  ends_at: string;
  xp_multiplier: number;
  is_active: boolean;
}

export const CHAVE_ADMIN_EVENTOS = ['admin-eventos-sazonais'];

export const gerarSlug = (titulo: string) =>
  titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const normalizarEventoAdmin = (bruto: Record<string, unknown>): EventoAdmin => {
  const multiplicador = Number(bruto.xp_multiplier);

  return {
    id: String(bruto.id ?? ''),
    slug: typeof bruto.slug === 'string' ? bruto.slug : '',
    title: typeof bruto.title === 'string' ? bruto.title : '',
    description: typeof bruto.description === 'string' ? bruto.description : null,
    emoji: typeof bruto.emoji === 'string' ? bruto.emoji : null,
    starts_at: typeof bruto.starts_at === 'string' ? bruto.starts_at : '',
    ends_at: typeof bruto.ends_at === 'string' ? bruto.ends_at : '',
    xp_multiplier: Number.isFinite(multiplicador) ? multiplicador : 1,
    is_active: bruto.is_active === true,
  };
};

export const useAdminSeasonalEvents = () => {
  const consulta = useQuery({
    queryKey: CHAVE_ADMIN_EVENTOS,
    staleTime: 0,
    queryFn: async (): Promise<EventoAdmin[]> => {
      const { data, error } = await supabase
        .from('seasonal_events')
        .select('id, slug, title, description, emoji, starts_at, ends_at, xp_multiplier, is_active')
        .order('starts_at', { ascending: false });
      if (error) throw error;

      return (data ?? []).map(normalizarEventoAdmin);
    },
  });

  return {
    eventos: consulta.data ?? [],
    carregando: consulta.isPending,
    erro: consulta.error ? (consulta.error as Error).message : null,
    recarregar: consulta.refetch,
  };
};

const invalidar = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: CHAVE_ADMIN_EVENTOS });
  queryClient.invalidateQueries({ queryKey: CHAVE_EVENTO_SAZONAL });
};

export const useSalvarEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dados }: EventoInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('seasonal_events').update(dados).eq('id', id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase
        .from('seasonal_events')
        .insert(dados)
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_id, variaveis) => {
      toast.success(variaveis.id ? t('eventsAdmin.saved') : t('eventsAdmin.created'));
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`${t('eventsAdmin.saveError')}: ${(erro as Error).message}`),
  });
};

export const useAlternarEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from('seasonal_events')
        .update({ is_active: ativo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`${t('eventsAdmin.toggleError')}: ${(erro as Error).message}`),
  });
};

export const useExcluirEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seasonal_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('eventsAdmin.deleted'));
      invalidar(queryClient);
    },
    onError: (erro) => toast.error(`${t('eventsAdmin.deleteError')}: ${(erro as Error).message}`),
  });
};