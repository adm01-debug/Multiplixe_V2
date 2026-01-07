-- Criar tabela saved_filters
CREATE TABLE public.saved_filters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, name)
);

-- Enable RLS
ALTER TABLE public.saved_filters ENABLE ROW LEVEL SECURITY;

-- Users can view their own filters and public filters
CREATE POLICY "Users can view own and public filters"
ON public.saved_filters
FOR SELECT
USING (auth.uid() = user_id OR is_public = true);

-- Users can insert their own filters
CREATE POLICY "Users can insert own filters"
ON public.saved_filters
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own filters
CREATE POLICY "Users can update own filters"
ON public.saved_filters
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own filters
CREATE POLICY "Users can delete own filters"
ON public.saved_filters
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_filters_updated_at
BEFORE UPDATE ON public.saved_filters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================
-- ATUALIZAR POLÍTICAS RLS DA LOGIN_ATTEMPTS
-- Remover políticas existentes e criar políticas restritivas
-- =====================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Service role can manage login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow insert for login tracking" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow select for login check" ON public.login_attempts;

-- A tabela login_attempts NÃO deve ter políticas SELECT/INSERT/UPDATE/DELETE para usuários normais
-- Apenas funções SECURITY DEFINER podem acessar (check_login_allowed, record_failed_login, reset_login_attempts)
-- Isso significa que não precisamos de políticas RLS - o acesso é bloqueado para todos exceto funções do sistema

-- Criar política vazia que bloqueia tudo (RLS está habilitado, sem políticas = sem acesso)
-- Admins podem ver para auditoria
CREATE POLICY "Only admins can view login attempts for audit"
ON public.login_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));