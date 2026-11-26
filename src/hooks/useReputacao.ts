import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface DetalheReputacao {
  total: number;
  votos_recebidos: number;
  votos_negativos: number;
  respostas: number;
  respostas_aceitas: number;
}

const VAZIO: DetalheReputacao = { total: 0, votos_recebidos: 0, votos_negativos: 0, respostas: 0, respostas_aceitas: 0 };

const numero = (valor: unknown) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : Number(valor) || 0);

export const useReputacao = (userId?: string) => {
  const { user } = useAuth();
  const alvo = userId ?? user?.id ?? null;

  const consulta = useQuery({
    queryKey: ['reputacao', alvo],
    enabled: !!alvo,
    queryFn: async (): Promise<DetalheReputacao> => {
      const { data, error } = await supabase.rpc('detalhar_reputacao', { p_user_id: alvo });
      if (error) throw error;
      const bruto = (data ?? {}) as Record<string, unknown>;
      return {
        total: numero(bruto.total),
        votos_recebidos: numero(bruto.votos_recebidos),
        votos_negativos: numero(bruto.votos_negativos),
        respostas: numero(bruto.respostas),
        respostas_aceitas: numero(bruto.respostas_aceitas),
      };
    },
  });

  return {
    detalhe: consulta.data ?? null,
    carregando: !!alvo && consulta.isLoading,
    erro: consulta.error ? (consulta.error as Error).message : null,
    recarregar: consulta.refetch,
  };
};

export const REPUTACAO_VAZIA = VAZIO;
