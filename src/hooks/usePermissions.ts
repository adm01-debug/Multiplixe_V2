import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Permission {
  permission_name: string;
  resource: string;
  action: string;
}

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_permissions', { p_user_id: user.id });

      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((permissionName: string): boolean => {
    return permissions.some(p => p.permission_name === permissionName);
  }, [permissions]);

  const hasAnyPermission = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name));
  }, [hasPermission]);

  const canAccess = useCallback((resource: string, action: string): boolean => {
    return permissions.some(p => p.resource === resource && p.action === action);
  }, [permissions]);

  return {
    permissions,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    refetch: fetchPermissions,
  };
};
