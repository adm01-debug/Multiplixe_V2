import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  challenge_period: 'daily' | 'weekly';
}

export interface ChallengeProgress {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  challenge_date: string;
  ends_at: string;
  challenge: DailyChallenge;
}

interface RawChallengeRow {
  progress_id: string | null;
  challenge_id: string;
  title: string;
  description: string | null;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  challenge_period: string | null;
  challenge_date: string | null;
  current_progress: number | null;
  is_completed: boolean | null;
  xp_claimed: boolean | null;
  ends_at: string | null;
}

const sortChallenges = (list: ChallengeProgress[]) =>
  [...list].sort((a, b) => {
    if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
    return a.challenge.target_value - b.challenge.target_value;
  });

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // O progresso é recalculado no banco a partir do histórico do aluno,
      // então o cliente só precisa ler o resultado.
      const { data, error } = await supabase.rpc('get_my_challenges');

      if (error) throw error;

      const rows = (data || []) as unknown as RawChallengeRow[];

      setChallenges(
        rows.map(row => {
          const period: 'daily' | 'weekly' =
            row.challenge_period === 'weekly' ? 'weekly' : 'daily';

          return {
            id: row.progress_id || `pending-${row.challenge_id}`,
            challenge_id: row.challenge_id,
            current_progress: row.current_progress || 0,
            is_completed: row.is_completed || false,
            xp_claimed: row.xp_claimed || false,
            challenge_date: row.challenge_date || '',
            ends_at: row.ends_at || '',
            challenge: {
              id: row.challenge_id,
              title: row.title,
              description: row.description || '',
              challenge_type: row.challenge_type,
              target_value: row.target_value,
              xp_reward: row.xp_reward,
              challenge_period: period,
            },
          };
        })
      );
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  // Voltar para a tela depois de concluir aulas/quizzes recarrega o progresso
  useEffect(() => {
    const onFocus = () => fetchChallenges();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchChallenges]);

  const claimReward = useCallback(async (progressId: string) => {
    if (!userId || claiming) return;

    setClaiming(progressId);

    try {
      const { data, error } = await supabase
        .rpc('claim_daily_challenge_reward', {
          p_user_id: userId,
          p_progress_id: progressId,
        });

      if (error) throw error;

      const result = data as { success: boolean; xp_earned?: number; challenge_title?: string; error?: string };

      if (result.success) {
        toast.success(`+${result.xp_earned} XP conquistado!`, {
          description: `Desafio "${result.challenge_title}" recompensado!`,
        });
        fetchChallenges();
      } else {
        toast.error(result.error || 'Erro ao coletar recompensa');
      }
    } catch {
      toast.error('Erro ao coletar recompensa');
    } finally {
      setClaiming(null);
    }
  }, [userId, claiming, fetchChallenges]);

  const dailyChallenges = sortChallenges(challenges.filter(c => c.challenge.challenge_period === 'daily'));
  const weeklyChallenges = sortChallenges(challenges.filter(c => c.challenge.challenge_period === 'weekly'));

  return {
    challenges,
    dailyChallenges,
    weeklyChallenges,
    loading,
    claiming,
    claimReward,
    refetch: fetchChallenges,
    completedCount: challenges.filter(c => c.is_completed).length,
    totalCount: challenges.length,
    unclaimedCount: challenges.filter(c => c.is_completed && !c.xp_claimed).length,
  };
};