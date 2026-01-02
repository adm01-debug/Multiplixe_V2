-- =====================================================
-- SISTEMA UNIFICADO DE NOTIFICAÇÕES
-- Data: 2026-01-02
-- Autor: Agente IA BPM
-- Sistemas: 16 sistemas empresariais
-- =====================================================

-- TABELA PRINCIPAL DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Identificação
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'urgent'
  category TEXT, -- 'approval', 'alert', 'reminder', 'system', 'social'
  
  -- Fonte
  source_system TEXT NOT NULL, -- 'compras', 'wms', 'dp', etc.
  source_entity_type TEXT, -- 'pedido', 'colaborador', 'task'
  source_entity_id UUID,
  
  -- Canais
  channels TEXT[] DEFAULT ARRAY['in_app'], -- ['in_app', 'email', 'push', 'sms', 'whatsapp']
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Agrupamento
  group_key TEXT, -- Para agrupar notificações similares
  is_grouped BOOLEAN DEFAULT false,
  group_count INT DEFAULT 1,
  
  -- Ações
  action_url TEXT, -- Deep link para ação
  action_label TEXT, -- Ex: "Aprovar", "Ver detalhes"
  action_data JSONB, -- Dados extras para ação
  
  -- Prioridade e timing
  priority INT DEFAULT 0, -- 0=baixa, 1=normal, 2=alta, 3=urgente
  scheduled_for TIMESTAMPTZ, -- Para agendamento
  expires_at TIMESTAMPTZ, -- Notificações temporárias
  
  -- Tracking
  delivered_at TIMESTAMPTZ,
  delivery_status JSONB, -- Status por canal: {email: 'sent', push: 'failed'}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices otimizados
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_group ON notifications(group_key) WHERE group_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_system, source_entity_type, source_entity_id);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Systems can create notifications" ON notifications;
CREATE POLICY "Systems can create notifications"
ON notifications FOR INSERT
WITH CHECK (true); -- Edge functions usam service_role

-- PREFERÊNCIAS DO USUÁRIO
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Canais habilitados
  email_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  
  -- Preferências por categoria
  preferences JSONB DEFAULT '{
    "approval": {"channels": ["in_app", "email", "push"], "priority": 3},
    "alert": {"channels": ["in_app", "push", "sms"], "priority": 2},
    "reminder": {"channels": ["in_app", "email"], "priority": 1},
    "system": {"channels": ["in_app"], "priority": 0},
    "social": {"channels": ["in_app"], "priority": 0}
  }'::jsonb,
  
  -- Do Not Disturb
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_start_time TIME, -- Ex: '22:00:00'
  dnd_end_time TIME,   -- Ex: '08:00:00'
  dnd_days INT[], -- Array de dias da semana: [0,6] = Sáb/Dom
  
  -- Digest
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly'
  digest_time TIME DEFAULT '09:00:00',
  digest_days INT[], -- Para weekly: [1] = Segunda
  
  -- Agrupamento
  grouping_enabled BOOLEAN DEFAULT true,
  grouping_window_minutes INT DEFAULT 5,
  
  -- Contatos
  phone_number TEXT,
  whatsapp_number TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own preferences" ON notification_preferences;
CREATE POLICY "Users can manage own preferences"
ON notification_preferences FOR ALL
USING (auth.uid() = user_id);

-- Função para criar preferências padrão
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_user_created_preferences ON auth.users;
CREATE TRIGGER on_user_created_preferences
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();
