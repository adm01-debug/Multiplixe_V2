import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
}

interface UserRank {
  rank: number;
  total_users: number;
}

export type LeaderboardPeriod = 'all' | 'week' | 'month';

export const useLeaderboard = (limit: number = 50, period: LeaderboardPeriod = 'all') => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<UserRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_leaderboard', { p_limit: limit, p_period: period });

      if (fetchError) {
        console.error('Error fetching leaderboard:', fetchError);
        setError(fetchError.message);
        return;
      }

      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error in fetchLeaderboard:', err);
      setError('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [limit, period]);

  const fetchUserRank = useCallback(async () => {
    if (!user) {
      setUserRank(null);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_user_rank', { p_user_id: user.id });

      if (fetchError) {
        console.error('Error fetching user rank:', fetchError);
        return;
      }

      if (data && data.length > 0) {
        setUserRank({
          rank: data[0].rank,
          total_users: data[0].total_users
        });
      }
    } catch (err) {
      console.error('Error in fetchUserRank:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [fetchLeaderboard, fetchUserRank]);

  return {
    leaderboard,
    userRank,
    loading,
    error,
    refetch: fetchLeaderboard
  };
};
