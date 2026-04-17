CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON public.audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created ON public.notifications (user_id, type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read, created_at DESC);