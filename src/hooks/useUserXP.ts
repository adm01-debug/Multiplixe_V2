import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_from_lessons: number;
  xp_from_courses: number;
  xp_from_streaks: number;
  xp_from_achievements: number;
  last_xp_earned_at: string | null;
  created_at: string;
  updated_at: string;
}

type XPSource = 'lesson' | 'course' | 'streak' | 'achievement' | 'general';

export const useUserXP = () => {
  const { user } = useAuth();
  const [userXP, setUserXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserXP = useCallback(async () => {
    if (!user) {
      setUserXP(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching user XP:', fetchError);
        setError(fetchError.message);
        return;
      }

      // If no XP record exists, create one with initial values
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_xp')
          .insert({
            user_id: user.id,
            total_xp: 0,
            current_level: 1,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user XP record:', insertError);
          setError(insertError.message);
          return;
        }

        setUserXP(newData);
      } else {
        setUserXP(data);
      }
    } catch (err) {
      console.error('Error in fetchUserXP:', err);
      setError('Failed to fetch XP data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addXP = useCallback(async (amount: number, source: XPSource = 'general') => {
    if (!user) return null;

    try {
      const { data, error: rpcError } = await supabase
        .rpc('add_user_xp', {
          p_user_id: user.id,
          p_amount: amount,
          p_source: source,
        });

      if (rpcError) {
        console.error('Error adding XP:', rpcError);
        return null;
      }

      // Refresh user XP after adding
      await fetchUserXP();
      return data;
    } catch (err) {
      console.error('Error in addXP:', err);
      return null;
    }
  }, [user, fetchUserXP]);

  useEffect(() => {
    fetchUserXP();
  }, [fetchUserXP]);

  return {
    userXP,
    totalXP: userXP?.total_xp ?? 0,
    currentLevel: userXP?.current_level ?? 1,
    loading,
    error,
    addXP,
    refetch: fetchUserXP,
  };
};
