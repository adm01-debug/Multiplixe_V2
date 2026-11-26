import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { POWERUP_WALLET_VAZIA, parsePowerupWallet, type PowerupWallet } from '@/lib/powerups';

export interface ActivatePowerupResult {
  ok: boolean;
  mensagem: string;
  kind?: string;
  multiplier?: number;
  expires_at?: string;
}

export const usePowerups = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['powerups', user?.id ?? null],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: async (): Promise<PowerupWallet> => {
      const { data, error } = await supabase.rpc('get_my_powerups');
      if (error) throw error;
      return parsePowerupWallet(data);
    },
    placeholderData: POWERUP_WALLET_VAZIA,
  });
};

export const useActivatePowerup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kind: string): Promise<ActivatePowerupResult> => {
      const { data, error } = await supabase.rpc('activate_powerup', { p_kind: kind });
      if (error) throw error;
      return (data ?? { ok: false, mensagem: 'Nao foi possivel ativar o power-up' }) as unknown as ActivatePowerupResult;
    },
    onSuccess: (resultado) => {
      if (resultado.ok) {
        toast.success(resultado.mensagem);
        void queryClient.invalidateQueries({ queryKey: ['powerups'] });
        void queryClient.invalidateQueries({ queryKey: ['wallet'] });
        // O multiplicador de XP e lido por hook proprio em outras telas.
        window.dispatchEvent(new Event('powerup:activated'));
      } else {
        toast.warning(resultado.mensagem);
      }
    },
    onError: () => toast.error('Nao foi possivel ativar o power-up. Tente novamente.'),
  });
};