import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  gradient: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
  achievements: Achievement;
}

interface NewAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  xp_reward: number;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<NewAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setUserAchievements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [achievementsRes, userAchievementsRes] = await Promise.all([
        supabase.from('achievements').select('*').order('requirement_value', { ascending: true }),
        supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', user.id)
          .order('unlocked_at', { ascending: false }),
      ]);

      if (achievementsRes.data) {
        setAchievements(achievementsRes.data);
      }

      if (userAchievementsRes.data) {
        setUserAchievements(userAchievementsRes.data as unknown as UserAchievement[]);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkAchievements = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('check_and_award_achievements', {
        p_user_id: user.id,
      });

      if (error) {
        return [];
      }

      if (data && data.length > 0) {
        // Fetch the full achievement details for new achievements
        const achievementIds = data.map((a: { achievement_id: string }) => a.achievement_id);
        const { data: newAchievementsData } = await supabase
          .from('achievements')
          .select('*')
          .in('id', achievementIds);

        if (newAchievementsData) {
          const newlyUnlocked: NewAchievement[] = newAchievementsData.map((a) => ({
            id: a.id,
            name: a.name,
            description: a.description,
            icon: a.icon,
            gradient: a.gradient,
            xp_reward: a.xp_reward,
          }));

          setNewAchievements(newlyUnlocked);
          
          // Refresh achievements list
          await fetchAchievements();
          
          return newlyUnlocked;
        }
      }

      return [];
    } catch {
      return [];
    }
  }, [user, fetchAchievements]);

  const markNotified = useCallback(async (achievementId: string) => {
    if (!user) return;

    await supabase
      .from('user_achievements')
      .update({ notified: true })
      .eq('user_id', user.id)
      .eq('achievement_id', achievementId);
  }, [user]);

  const clearNewAchievements = useCallback(() => {
    setNewAchievements([]);
  }, []);

  const dismissAchievement = useCallback((achievementId: string) => {
    setNewAchievements((prev) => prev.filter((a) => a.id !== achievementId));
    markNotified(achievementId);
  }, [markNotified]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievement_id));
  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return {
    achievements,
    userAchievements,
    newAchievements,
    unlockedCount,
    totalCount,
    loading,
    checkAchievements,
    clearNewAchievements,
    dismissAchievement,
    isUnlocked: (achievementId: string) => unlockedIds.has(achievementId),
    refetch: fetchAchievements,
  };
};
