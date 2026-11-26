import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicAchievement {
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  gradient: string;
  xp_reward: number;
  unlocked_at: string;
}

export interface PublicCompletedCourse {
  title: string;
  slug: string;
  completed_at: string | null;
}

export interface PublicProfileData {
  available: boolean;
  reason?: 'private' | 'not_found' | 'invalid';
  profile?: {
    user_id: string;
    full_name: string | null;
    department: string | null;
    avatar_url: string | null;
    member_since: string;
  };
  xp?: { total_xp: number; current_level: number };
  streak?: { current: number; longest: number };
  achievements?: PublicAchievement[];
  completed_courses?: PublicCompletedCourse[];
  certificates_count?: number;
}

export const usePublicProfile = (userId?: string) => {
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    supabase
      .rpc('get_public_profile', { p_user_id: userId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError(rpcError.message);
          setProfile(null);
        } else {
          setProfile((data ?? { available: false, reason: 'not_found' }) as unknown as PublicProfileData);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { profile, loading, error };
};