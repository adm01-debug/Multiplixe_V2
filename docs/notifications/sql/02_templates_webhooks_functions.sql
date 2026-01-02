-- =====================================================
-- TEMPLATES DE NOTIFICAÇÃO
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system TEXT NOT NULL,
  event_type TEXT NOT NULL,
  channel TEXT NOT NULL, -- 'email', 'sms', 'whatsapp', 'push', 'in_app'
  
  -- Template
  title_template TEXT NOT NULL, -- "{{user_name}}, você tem uma nova aprovação"
  message_template TEXT NOT NULL,
  
  -- Metadata
  variables TEXT[], -- ['user_name', 'entity_id', 'entity_name']
  default_priority INT DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_template UNIQUE (system, event_type, channel)
);

-- =====================================================
-- WEBHOOKS
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  system TEXT NOT NULL,
  
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- Para HMAC validation
  
  -- Configuração
  events TEXT[] NOT NULL, -- ['notification.created', 'notification.read']
  is_active BOOLEAN DEFAULT true,
  
  -- Retry
  max_retries INT DEFAULT 3,
  retry_delay_seconds INT DEFAULT 60,
  
  -- Tracking
  last_triggered_at TIMESTAMPTZ,
  total_calls INT DEFAULT 0,
  failed_calls INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  
  status_code INT,
  response_body TEXT,
  success BOOLEAN,
  
  attempt_number INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook ON webhook_logs(webhook_id, created_at DESC);

-- =====================================================
-- FUNÇÕES AUXILIARES
-- =====================================================

-- Verifica se está em horário DND
CREATE OR REPLACE FUNCTION is_dnd_active(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_prefs RECORD;
  v_now TIME;
  v_day INT;
BEGIN
  SELECT * INTO v_prefs
  FROM notification_preferences
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR NOT v_prefs.dnd_enabled THEN
    RETURN false;
  END IF;
  
  v_now := CURRENT_TIME;
  v_day := EXTRACT(DOW FROM NOW()); -- 0=Dom, 6=Sáb
  
  -- Verifica dia da semana
  IF v_prefs.dnd_days IS NOT NULL AND v_day = ANY(v_prefs.dnd_days) THEN
    RETURN true;
  END IF;
  
  -- Verifica horário
  IF v_prefs.dnd_start_time IS NOT NULL AND v_prefs.dnd_end_time IS NOT NULL THEN
    IF v_prefs.dnd_start_time < v_prefs.dnd_end_time THEN
      RETURN v_now >= v_prefs.dnd_start_time OR v_now <= v_prefs.dnd_end_time;
    ELSE
      RETURN v_now >= v_prefs.dnd_start_time AND v_now <= v_prefs.dnd_end_time;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Marcar notificação como lida
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW(),
      updated_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marcar todas como lidas
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications
  SET is_read = true,
      read_at = NOW(),
      updated_at = NOW()
  WHERE user_id = auth.uid()
    AND NOT is_read;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Deletar notificações antigas (cleanup job)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
