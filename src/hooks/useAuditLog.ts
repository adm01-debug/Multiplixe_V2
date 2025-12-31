import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

type AuditAction = 
  | 'login'
  | 'logout'
  | 'password_change'
  | 'mfa_enable'
  | 'mfa_disable'
  | 'profile_update'
  | 'course_create'
  | 'course_update'
  | 'course_delete'
  | 'lesson_complete'
  | 'certificate_issued'
  | 'role_change'
  | 'settings_change'
  | 'ip_block'
  | 'ip_unblock'
  | 'security_alert';

interface AuditLogParams {
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export const useAuditLog = () => {
  const { user } = useAuth();

  const log = useCallback(async ({
    action,
    resourceType,
    resourceId,
    oldValues,
    newValues,
    metadata,
  }: AuditLogParams) => {
    if (!user) return;

    try {
      await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_action: action,
        p_resource_type: resourceType || null,
        p_resource_id: resourceId || null,
        p_old_values: oldValues || null,
        p_new_values: newValues || null,
        p_metadata: metadata || null,
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  }, [user]);

  return { log };
};
