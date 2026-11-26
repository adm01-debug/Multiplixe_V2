import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface XpMultiplier {
  multiplier: number;
  streak: number;
  streak_multiplier: number;
  weekend_multiplier: number;
  label: string;
}

const DEFAULT_MULTIPLIER: XpMultiplier = {
  multiplier: 1,
  streak: 0,
  streak_multiplier: 1,
  weekend_multiplier: 1,
  label: '',
};

export const useXpMultiplier = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [xpMultiplier, setXpMultiplier] = useState<XpMultiplier>(DEFAULT_MULTIPLIER);
  const [loading, setLoading] = useState(true);

  const fetchMultiplier = useCallback(async () => {
    if (!userId) {
      setXpMultiplier(DEFAULT_MULTIPLIER);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.rpc('get_my_xp_multiplier');

    if (error) {
      setXpMultiplier(DEFAULT_MULTIPLIER);
      setLoading(false);
      return;
    }

    const parsed = (data ?? {}) as Partial<XpMultiplier> & Record<string, unknown>;
    const multiplier = Number(parsed.multiplier);

    setXpMultiplier({
      multiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
      streak: Number(parsed.streak) || 0,
      streak_multiplier: Number(parsed.streak_multiplier) || 1,
      weekend_multiplier: Number(parsed.weekend_multiplier) || 1,
      label: typeof parsed.label === 'string' ? parsed.label : '',
    });
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchMultiplier();
  }, [fetchMultiplier]);

  useEffect(() => {
    window.addEventListener('focus', fetchMultiplier);
    return () => window.removeEventListener('focus', fetchMultiplier);
  }, [fetchMultiplier]);

  const applyMultiplier = useCallback(
    (xp: number) => Math.round(xp * xpMultiplier.multiplier),
    [xpMultiplier.multiplier],
  );

  return {
    xpMultiplier,
    multiplier: xpMultiplier.multiplier,
    label: xpMultiplier.label,
    loading,
    applyMultiplier,
    refetch: fetchMultiplier,
  };
};