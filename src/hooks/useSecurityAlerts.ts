import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import type { Json } from '@/integrations/supabase/types';

interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string | null;
  ip_address: unknown;
  user_id: string | null;
  metadata: Json | null;
  is_resolved: boolean;
  created_at: string;
}

export const useSecurityAlerts = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = useCallback(async () => {
    if (!user || !isAdmin) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.is_resolved).length || 0);
    } catch (err) {
      console.error('Error fetching security alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'security_alerts',
        },
        (payload) => {
          setAlerts(prev => [payload.new as SecurityAlert, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin]);

  const resolveAlert = async (alertId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('security_alerts')
        .update({
          is_resolved: true,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_resolved: true } : a
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('Error resolving alert:', err);
      return false;
    }
  };

  return {
    alerts,
    loading,
    unreadCount,
    resolveAlert,
    refetch: fetchAlerts,
  };
};
