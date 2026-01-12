import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface MFASettings {
  totp_enabled: boolean;
  sms_enabled: boolean;
  phone_number: string | null;
  phone_verified: boolean;
  backup_codes: string[] | null;
}

export const useMFA = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<MFASettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setSettings(data || {
        totp_enabled: false,
        sms_enabled: false,
        phone_number: null,
        phone_verified: false,
        backup_codes: null,
      });
    } catch {
      // Silent fail - default settings used
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Enrollar TOTP
  const enrollTOTP = async () => {
    if (!user) return null;
    setEnrolling(true);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'MULTIPLIXE Authenticator',
      });

      if (error) throw error;
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao configurar MFA',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setEnrolling(false);
    }
  };

  // Verificar código TOTP durante enrollment
  const verifyTOTPEnrollment = async (factorId: string, code: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) throw error;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: data.id,
        code,
      });

      if (verifyError) throw verifyError;

      // Atualizar configurações no banco
      await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user.id,
          totp_enabled: true,
          updated_at: new Date().toISOString(),
        });

      toast({
        title: 'MFA ativado!',
        description: 'Autenticação de dois fatores configurada com sucesso.',
      });

      await fetchSettings();
      return true;
    } catch (err: unknown) {
      void err; // Unused variable
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Desativar TOTP
  const disableTOTP = async () => {
    if (!user) return false;

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: totpFactor.id,
        });
        if (error) throw error;
      }

      await supabase
        .from('user_mfa_settings')
        .update({ totp_enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      toast({
        title: 'MFA desativado',
        description: 'Autenticação de dois fatores foi removida.',
      });

      await fetchSettings();
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao desativar MFA',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  // Gerar códigos de backup
  const generateBackupCodes = async (): Promise<string[] | null> => {
    if (!user) return null;

    try {
      const codes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user.id,
          backup_codes: codes,
          updated_at: new Date().toISOString(),
        });

      await fetchSettings();
      return codes;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao gerar códigos',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  // Verificar se MFA é necessário
  const checkMFARequired = async (): Promise<boolean> => {
    try {
      const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      return data?.currentLevel !== data?.nextLevel;
    } catch {
      return false;
    }
  };

  // Verificar código durante login
  const verifyMFACode = async (code: string): Promise<boolean> => {
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) return false;

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: totpFactor.id,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) throw verifyError;

      return true;
    } catch (err: unknown) {
      void err; // Unused variable
      toast({
        title: 'Código inválido',
        description: 'Verifique o código e tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    settings,
    loading,
    enrolling,
    enrollTOTP,
    verifyTOTPEnrollment,
    disableTOTP,
    generateBackupCodes,
    checkMFARequired,
    verifyMFACode,
    refetch: fetchSettings,
  };
};
