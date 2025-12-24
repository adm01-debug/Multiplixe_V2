import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_started_at: string | null;
  total_streak_days: number;
}

interface StreakUpdateResult {
  streak_updated: boolean;
  new_streak: number;
  xp_awarded: number;
  is_new_record: boolean;
}

export const useStreaks = () => {
  const { user } = useAuth();
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreak = useCallback(async () => {
    if (!user) {
      setUserStreak(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching streak:', fetchError);
        setError(fetchError.message);
        return;
      }

      setUserStreak(data);
    } catch (err) {
      console.error('Error in fetchStreak:', err);
      setError('Failed to fetch streak data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateStreak = useCallback(async (): Promise<StreakUpdateResult | null> => {
    if (!user) return null;

    try {
      const { data, error: rpcError } = await supabase.rpc('update_user_streak', {
        p_user_id: user.id,
      });

      if (rpcError) {
        console.error('Error updating streak:', rpcError);
        return null;
      }

      // Refresh streak data after update
      await fetchStreak();

      // Return the first result from the function
      if (data && data.length > 0) {
        return data[0] as StreakUpdateResult;
      }

      return null;
    } catch (err) {
      console.error('Error in updateStreak:', err);
      return null;
    }
  }, [user, fetchStreak]);

  useEffect(() => {
    fetchStreak();
  }, [fetchStreak]);

  // Check if streak is at risk (last activity was yesterday)
  const isStreakAtRisk = useCallback(() => {
    if (!userStreak?.last_activity_date) return false;
    
    const lastActivity = new Date(userStreak.last_activity_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    lastActivity.setHours(0, 0, 0, 0);
    
    const diffTime = today.getTime() - lastActivity.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays === 1;
  }, [userStreak]);

  // Check if user has studied today
  const hasStudiedToday = useCallback(() => {
    if (!userStreak?.last_activity_date) return false;
    
    const lastActivity = new Date(userStreak.last_activity_date);
    const today = new Date();
    
    return lastActivity.toDateString() === today.toDateString();
  }, [userStreak]);

  return {
    userStreak,
    currentStreak: userStreak?.current_streak ?? 0,
    longestStreak: userStreak?.longest_streak ?? 0,
    totalStreakDays: userStreak?.total_streak_days ?? 0,
    loading,
    error,
    updateStreak,
    isStreakAtRisk: isStreakAtRisk(),
    hasStudiedToday: hasStudiedToday(),
    refetch: fetchStreak,
  };
};
