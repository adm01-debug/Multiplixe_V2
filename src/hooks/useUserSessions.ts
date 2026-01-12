import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address: string | null;
  user_agent: string | null;
  device_info: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  last_activity_at: string | null;
  expires_at: string;
}

export const useUserSessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      
      setSessions((data || []).map(session => ({
        ...session,
        ip_address: session.ip_address as string | null,
        device_info: session.device_info as Record<string, unknown> | null
      })));
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const revokeSession = async (sessionId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      return true;
    } catch {
      return false;
      return false;
    }
  };

  const revokeAllOtherSessions = async (currentSessionToken: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .delete()
        .eq('user_id', user?.id)
        .neq('session_token', currentSessionToken);

      if (error) throw error;
      
      setSessions(prev => prev.filter(s => s.session_token === currentSessionToken));
      return true;
    } catch {
      return false;
      return false;
    }
  };

  return {
    sessions,
    loading,
    revokeSession,
    revokeAllOtherSessions,
    refetch: fetchSessions
  };
};
