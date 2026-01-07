import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DepartmentRanking {
  department: string;
  total_xp: number;
  member_count: number;
  avg_xp: number;
  rank: number;
}

export const useDepartmentLeaderboard = (limit: number = 10) => {
  const [rankings, setRankings] = useState<DepartmentRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentLeaderboard = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_department_leaderboard', {
          p_limit: limit
        });

        if (error) throw error;

        setRankings((data || []) as DepartmentRanking[]);
      } catch (error) {
        console.error('Error fetching department leaderboard:', error);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentLeaderboard();
  }, [limit]);

  return { rankings, loading };
};
