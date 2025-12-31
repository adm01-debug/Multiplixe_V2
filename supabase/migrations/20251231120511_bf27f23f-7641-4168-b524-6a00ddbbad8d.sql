-- =============================================
-- MÓDULO DE SEGURANÇA COMPLETO - MULTIPLIXE
-- =============================================

-- 1. RATE LIMITING
-- =============================================

-- Tabela de logs de rate limit
CREATE TABLE public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_rate_limit_ip ON public.rate_limit_logs(ip_address);
CREATE INDEX idx_rate_limit_window ON public.rate_limit_logs(window_start);
CREATE INDEX idx_rate_limit_endpoint ON public.rate_limit_logs(endpoint);

-- Tabela de IPs bloqueados
CREATE TABLE public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_permanent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de IPs na whitelist
CREATE TABLE public.whitelisted_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  description TEXT,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Configurações de rate limit
CREATE TABLE public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  max_requests INTEGER DEFAULT 100,
  window_seconds INTEGER DEFAULT 60,
  block_duration_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO public.rate_limit_config (endpoint, max_requests, window_seconds, block_duration_minutes) VALUES
  ('login', 5, 300, 30),
  ('signup', 3, 600, 60),
  ('password_reset', 3, 600, 60),
  ('api', 100, 60, 15),
  ('mfa_verify', 5, 300, 30);

-- 2. SESSÕES E DISPOSITIVOS
-- =============================================

CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info JSONB,
  ip_address INET,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active, expires_at);

-- 3. AUDIT LOGS (TRILHA DE AUDITORIA)
-- =============================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- 4. MFA (AUTENTICAÇÃO MULTI-FATOR)
-- =============================================

-- Status de MFA por usuário
CREATE TABLE public.user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  last_mfa_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. PERMISSÕES GRANULARES
-- =============================================

-- Recursos do sistema
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissões por role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Inserir permissões padrão
INSERT INTO public.permissions (name, description, resource, action) VALUES
  ('courses.view', 'Ver cursos', 'courses', 'view'),
  ('courses.create', 'Criar cursos', 'courses', 'create'),
  ('courses.edit', 'Editar cursos', 'courses', 'edit'),
  ('courses.delete', 'Deletar cursos', 'courses', 'delete'),
  ('users.view', 'Ver usuários', 'users', 'view'),
  ('users.edit', 'Editar usuários', 'users', 'edit'),
  ('users.delete', 'Deletar usuários', 'users', 'delete'),
  ('roles.manage', 'Gerenciar roles', 'roles', 'manage'),
  ('analytics.view', 'Ver analytics', 'analytics', 'view'),
  ('security.manage', 'Gerenciar segurança', 'security', 'manage'),
  ('settings.manage', 'Gerenciar configurações', 'settings', 'manage');

-- Atribuir permissões ao admin
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin', id FROM public.permissions;

-- Atribuir permissões básicas ao user
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'user', id FROM public.permissions WHERE name = 'courses.view';

-- 6. ALERTAS DE SEGURANÇA
-- =============================================

CREATE TABLE public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  description TEXT,
  ip_address INET,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_resolved ON public.security_alerts(is_resolved);

-- 7. TOKENS DE RECUPERAÇÃO DE SENHA
-- =============================================

CREATE TABLE public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_password_reset_token ON public.password_reset_tokens(token);

-- 8. FUNÇÕES DE SEGURANÇA
-- =============================================

-- Função para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address INET,
  p_endpoint TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(is_allowed BOOLEAN, remaining_requests INTEGER, reset_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config rate_limit_config%ROWTYPE;
  v_current_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_is_blocked BOOLEAN;
  v_is_whitelisted BOOLEAN;
BEGIN
  -- Verificar whitelist
  SELECT EXISTS(SELECT 1 FROM whitelisted_ips WHERE ip_address = p_ip_address) INTO v_is_whitelisted;
  IF v_is_whitelisted THEN
    RETURN QUERY SELECT true, 999999, now() + interval '1 hour';
    RETURN;
  END IF;

  -- Verificar bloqueio
  SELECT EXISTS(
    SELECT 1 FROM blocked_ips 
    WHERE ip_address = p_ip_address 
    AND (is_permanent OR expires_at > now())
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN QUERY SELECT false, 0, (SELECT COALESCE(expires_at, now() + interval '999 years') FROM blocked_ips WHERE ip_address = p_ip_address LIMIT 1);
    RETURN;
  END IF;

  -- Obter configuração
  SELECT * INTO v_config FROM rate_limit_config WHERE endpoint = p_endpoint AND is_active = true;
  IF NOT FOUND THEN
    SELECT * INTO v_config FROM rate_limit_config WHERE endpoint = 'api' AND is_active = true;
  END IF;

  v_window_start := now() - (v_config.window_seconds || ' seconds')::interval;

  -- Contar requisições na janela
  SELECT COALESCE(SUM(request_count), 0) INTO v_current_count
  FROM rate_limit_logs
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND window_start > v_window_start;

  -- Registrar requisição
  INSERT INTO rate_limit_logs (ip_address, user_id, endpoint, request_count, window_start)
  VALUES (p_ip_address, p_user_id, p_endpoint, 1, now());

  -- Verificar limite
  IF v_current_count >= v_config.max_requests THEN
    -- Bloquear IP temporariamente
    INSERT INTO blocked_ips (ip_address, reason, expires_at)
    VALUES (p_ip_address, 'Rate limit exceeded on ' || p_endpoint, now() + (v_config.block_duration_minutes || ' minutes')::interval)
    ON CONFLICT (ip_address) DO UPDATE SET expires_at = EXCLUDED.expires_at;
    
    -- Criar alerta
    INSERT INTO security_alerts (alert_type, severity, title, description, ip_address)
    VALUES ('rate_limit', 'high', 'Rate limit exceeded', 'IP bloqueado por exceder limite em ' || p_endpoint, p_ip_address);
    
    RETURN QUERY SELECT false, 0, now() + (v_config.block_duration_minutes || ' minutes')::interval;
  ELSE
    RETURN QUERY SELECT true, v_config.max_requests - v_current_count - 1, v_window_start + (v_config.window_seconds || ' seconds')::interval;
  END IF;
END;
$$;

-- Função para registrar audit log
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, old_values, new_values, ip_address, metadata)
  VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values, p_ip_address, p_metadata)
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION public.has_permission(p_user_id UUID, p_permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role = rp.role
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.name = p_permission_name
  );
END;
$$;

-- Função para obter todas permissões do usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(p_user_id UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role = rp.role
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id;
END;
$$;

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar rate limit logs com mais de 7 dias
  DELETE FROM rate_limit_logs WHERE created_at < now() - interval '7 days';
  
  -- Limpar IPs bloqueados expirados
  DELETE FROM blocked_ips WHERE expires_at < now() AND NOT is_permanent;
  
  -- Limpar tokens de reset usados ou expirados
  DELETE FROM password_reset_tokens WHERE used_at IS NOT NULL OR expires_at < now();
  
  -- Limpar sessões expiradas
  DELETE FROM user_sessions WHERE expires_at < now();
END;
$$;

-- 9. RLS POLICIES
-- =============================================

-- Rate limit logs
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view rate limit logs" ON public.rate_limit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert rate limit logs" ON public.rate_limit_logs FOR INSERT WITH CHECK (true);

-- Blocked IPs
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Whitelisted IPs
ALTER TABLE public.whitelisted_ips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage whitelisted IPs" ON public.whitelisted_ips FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Rate limit config
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage rate limit config" ON public.rate_limit_config FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.user_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- User MFA settings
ALTER TABLE public.user_mfa_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own MFA settings" ON public.user_mfa_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own MFA settings" ON public.user_mfa_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own MFA settings" ON public.user_mfa_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permissions
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage permissions" ON public.permissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Role permissions
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Security alerts
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage security alerts" ON public.security_alerts FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Password reset tokens
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tokens" ON public.password_reset_tokens FOR SELECT USING (auth.uid() = user_id);

-- 10. REALTIME PARA ALERTAS
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_limit_logs;