import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { mapPerformanceComparison, type PerformanceMetrics } from '@/lib/performanceComparison';

export const usePerformanceComparison = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.rpc('get_performance_comparison');

      if (fetchError) {
        setMetrics(null);
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      setMetrics(mapPerformanceComparison(row as Record<string, unknown> | null));
    } catch {
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
};