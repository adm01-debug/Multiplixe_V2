import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface XPHistoryEntry {
  date: string;
  daily_xp: number;
  cumulative_xp: number;
}

export const useXPHistory = (days: number = 30) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<XPHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_xp_history', { p_user_id: user.id, p_days: days });

      if (fetchError) {
        console.error('Error fetching XP history:', fetchError);
        setError(fetchError.message);
        return;
      }

      setHistory(data || []);
    } catch (err) {
      console.error('Error in fetchHistory:', err);
      setError('Failed to fetch XP history');
    } finally {
      setLoading(false);
    }
  }, [user, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory
  };
};
