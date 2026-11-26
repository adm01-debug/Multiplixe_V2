import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface LeagueRankEntry {
  posicao: number;
  user_id: string;
  nome: string;
  avatar_url: string | null;
  xp_semana: number;
  eu: boolean;
}

export interface LeagueChange {
  tipo: string | null;
  em: string | null;
}

export interface MyLeagueInfo {
  liga: string;
  nivel: number;
  proxima_liga: string | null;
  xp_semana: number;
  posicao: number;
  total_jogadores: number;
  zona_promocao: number;
  zona_rebaixamento: number;
  minimo_jogadores: number;
  semana_inicio: string;
  semana_fim: string;
  atualiza_em: string;
  ranking: LeagueRankEntry[];
  ultima_mudanca: LeagueChange | null;
}

export interface LeagueRefreshResult {
  semana: string;
  novos_participantes: number;
  processados: number;
  promovidos: number;
  rebaixados: number;
  por_liga: Record<string, number>;
}

export const useLeague = () => {
  const { user } = useAuth();
  const [league, setLeague] = useState<MyLeagueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeague = useCallback(async () => {
    if (!user) {
      setLeague(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('get_my_league');

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      setLeague((data as unknown as MyLeagueInfo | null) ?? null);
    } catch {
      setError('Nao foi possivel carregar sua liga');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeague();
  }, [fetchLeague]);

  const recalc = useCallback(async (zone = 10, minPlayers = 20) => {
    const { data, error: recalcError } = await supabase.rpc('refresh_leagues', {
      p_zone: zone,
      p_min_jogadores: minPlayers,
    });

    if (recalcError) return { error: recalcError.message };
    await fetchLeague();
    return { error: null as string | null, result: data as unknown as LeagueRefreshResult };
  }, [fetchLeague]);

  return { league, loading, error, refetch: fetchLeague, recalc };
};