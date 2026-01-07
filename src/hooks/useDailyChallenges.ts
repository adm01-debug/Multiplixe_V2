import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
}

interface ChallengeProgress {
  id: string;
  challenge_id: string;
  current_progress: number;
  is_completed: boolean;
  xp_claimed: boolean;
  challenge: DailyChallenge;
}

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<ChallengeProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;

    try {
      // Get active challenges
      const { data: activeChallenges, error: challengesError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('is_active', true);

      if (challengesError) throw challengesError;

      // Get user's progress for today
      const today = new Date().toISOString().split('T')[0];
      const { data: progressData, error: progressError } = await supabase
        .from('user_daily_challenge_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('challenge_date', today);

      if (progressError) throw progressError;

      // Map challenges with their progress
      const challengesWithProgress: ChallengeProgress[] = (activeChallenges || []).map(challenge => {
        const progress = progressData?.find(p => p.challenge_id === challenge.id);
        return {
          id: progress?.id || `temp-${challenge.id}`,
          challenge_id: challenge.id,
          current_progress: progress?.current_progress || 0,
          is_completed: progress?.is_completed || false,
          xp_claimed: progress?.xp_claimed || false,
          challenge,
        };
      });

      setChallenges(challengesWithProgress);
    } catch (error) {
      console.error('Error fetching daily challenges:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const updateProgress = useCallback(async (
    challengeType: string,
    incrementBy: number = 1
  ) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    // Find matching challenges
    const matchingChallenges = challenges.filter(
      c => c.challenge.challenge_type === challengeType && !c.is_completed
    );

    for (const challengeProgress of matchingChallenges) {
      const newProgress = challengeProgress.current_progress + incrementBy;
      const isCompleted = newProgress >= challengeProgress.challenge.target_value;

      try {
        // Upsert progress
        const { error } = await supabase
          .from('user_daily_challenge_progress')
          .upsert({
            user_id: user.id,
            challenge_id: challengeProgress.challenge_id,
            challenge_date: today,
            current_progress: Math.min(newProgress, challengeProgress.challenge.target_value),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,challenge_id,challenge_date',
          });

        if (error) throw error;

        if (isCompleted) {
          toast.success(`🎯 Desafio "${challengeProgress.challenge.title}" completo!`, {
            description: `Clique para coletar ${challengeProgress.challenge.xp_reward} XP`,
          });
        }
      } catch (error) {
        console.error('Error updating challenge progress:', error);
      }
    }

    // Refresh challenges
    fetchChallenges();
  }, [user, challenges, fetchChallenges]);

  const claimReward = useCallback(async (progressId: string) => {
    if (!user || claiming) return;

    setClaiming(progressId);

    try {
      const { data, error } = await supabase
        .rpc('claim_daily_challenge_reward', {
          p_user_id: user.id,
          p_progress_id: progressId,
        });

      if (error) throw error;

      const result = data as { success: boolean; xp_earned?: number; challenge_title?: string; error?: string };

      if (result.success) {
        toast.success(`🎉 +${result.xp_earned} XP conquistado!`, {
          description: `Desafio "${result.challenge_title}" recompensado!`,
        });
        fetchChallenges();
      } else {
        toast.error(result.error || 'Erro ao coletar recompensa');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Erro ao coletar recompensa');
    } finally {
      setClaiming(null);
    }
  }, [user, claiming, fetchChallenges]);

  const completedCount = challenges.filter(c => c.is_completed).length;
  const totalCount = challenges.length;
  const unclaimedCount = challenges.filter(c => c.is_completed && !c.xp_claimed).length;

  return {
    challenges,
    loading,
    claiming,
    updateProgress,
    claimReward,
    refetch: fetchChallenges,
    completedCount,
    totalCount,
    unclaimedCount,
  };
};
