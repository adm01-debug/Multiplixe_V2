import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useToast } from '@/hooks/use-toast';

interface RateLimitLog {
  id: string;
  ip_address: unknown;
  user_id: string | null;
  endpoint: string;
  request_count: number;
  window_start: string;
  created_at: string;
}

interface BlockedIP {
  id: string;
  ip_address: unknown;
  reason: string | null;
  blocked_at: string;
  expires_at: string | null;
  is_permanent: boolean;
}

interface WhitelistedIP {
  id: string;
  ip_address: unknown;
  description: string | null;
  created_at: string;
}

interface RateLimitConfig {
  id: string;
  endpoint: string;
  max_requests: number;
  window_seconds: number;
  block_duration_minutes: number;
  is_active: boolean;
}

export const useRateLimitLogs = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState<RateLimitLog[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [whitelistedIPs, setWhitelistedIPs] = useState<WhitelistedIP[]>([]);
  const [config, setConfig] = useState<RateLimitConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !isAdmin) {
      setLoading(false);
      return;
    }

    try {
      const [logsRes, blockedRes, whitelistRes, configRes] = await Promise.all([
        supabase.from('rate_limit_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('blocked_ips').select('*').order('blocked_at', { ascending: false }),
        supabase.from('whitelisted_ips').select('*').order('created_at', { ascending: false }),
        supabase.from('rate_limit_config').select('*').order('endpoint'),
      ]);

      setLogs(logsRes.data || []);
      setBlockedIPs(blockedRes.data || []);
      setWhitelistedIPs(whitelistRes.data || []);
      setConfig(configRes.data || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates
  useEffect(() => {
    if (!user || !isAdmin) return;

    const channel = supabase
      .channel('rate-limit-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rate_limit_logs' },
        (payload) => {
          setLogs(prev => [payload.new as RateLimitLog, ...prev.slice(0, 499)]);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_ips' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAdmin, fetchData]);

  const blockIP = async (ipAddress: string, reason: string, permanent: boolean = false, durationMinutes: number = 60) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('blocked_ips').insert({
        ip_address: ipAddress,
        reason,
        blocked_by: user.id,
        is_permanent: permanent,
        expires_at: permanent ? null : new Date(Date.now() + durationMinutes * 60000).toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'IP bloqueado',
        description: `${ipAddress} foi bloqueado com sucesso.`,
      });

      await fetchData();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro ao bloquear IP',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const unblockIP = async (ipId: string) => {
    try {
      const { error } = await supabase.from('blocked_ips').delete().eq('id', ipId);
      if (error) throw error;

      toast({
        title: 'IP desbloqueado',
        description: 'O IP foi removido da lista de bloqueio.',
      });

      await fetchData();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro ao desbloquear IP',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const whitelistIP = async (ipAddress: string, description: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('whitelisted_ips').insert({
        ip_address: ipAddress,
        description,
        added_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'IP adicionado à whitelist',
        description: `${ipAddress} foi adicionado com sucesso.`,
      });

      await fetchData();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro ao adicionar IP',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeFromWhitelist = async (ipId: string) => {
    try {
      const { error } = await supabase.from('whitelisted_ips').delete().eq('id', ipId);
      if (error) throw error;

      toast({
        title: 'IP removido',
        description: 'O IP foi removido da whitelist.',
      });

      await fetchData();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro ao remover IP',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const updateConfig = async (configId: string, updates: Partial<RateLimitConfig>) => {
    try {
      const { error } = await supabase
        .from('rate_limit_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', configId);

      if (error) throw error;

      toast({
        title: 'Configuração atualizada',
        description: 'As configurações de rate limit foram salvas.',
      });

      await fetchData();
      return true;
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    logs,
    blockedIPs,
    whitelistedIPs,
    config,
    loading,
    blockIP,
    unblockIP,
    whitelistIP,
    removeFromWhitelist,
    updateConfig,
    refetch: fetchData,
  };
};
