import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { toastError, toastSuccess } from '@/lib/toastHelpers';
import {
  settingsMapFrom,
  type PlatformSettingRow,
  type PlatformSettingsMap,
} from '@/lib/platformSettings';

const QUERY_KEY = ['platform-settings'] as const;

export function usePlatformSettings() {
  const {
    data: rows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from('platform_settings')
        .select('key, value, description, updated_at')
        .order('key');
      if (fetchError) throw fetchError;
      return (data ?? []) as PlatformSettingRow[];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const settings: PlatformSettingsMap = useMemo(() => settingsMapFrom(rows), [rows]);

  return { rows, settings, isLoading, error };
}

export interface PlatformSettingUpdate {
  key: string;
  value: Json;
  description?: string | null;
}

export function useUpdatePlatformSettings() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (updates: PlatformSettingUpdate[]) => {
      const { data: auth } = await supabase.auth.getUser();
      const payload = updates.map((update) => ({
        key: update.key,
        value: update.value,
        description: update.description ?? null,
        updated_by: auth.user?.id ?? null,
      }));
      const { error } = await supabase.from('platform_settings').upsert(payload, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toastSuccess('Configurações salvas');
    },
    onError: () => {
      toastError('Erro ao salvar configurações');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return { saveSettings: mutation.mutate, isSaving: mutation.isPending };
}
