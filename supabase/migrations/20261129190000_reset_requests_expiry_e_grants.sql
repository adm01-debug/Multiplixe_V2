-- A solicitacao de reset fica com prazo (expires_at = +24h), mas a edge
-- approve-password-reset nao bloqueia pedido vencido e o CHECK da tabela so
-- aceita pending/approved/rejected: nao havia como marcar como expirado. Com
-- isso uma solicitacao de janeiro continuava "pendente" na tela de admin.
ALTER TABLE public.password_reset_requests
  DROP CONSTRAINT IF EXISTS password_reset_requests_status_check;
ALTER TABLE public.password_reset_requests
  ADD CONSTRAINT password_reset_requests_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text]));

-- Grants: anon e authenticated recebiam DELETE/TRUNCATE/UPDATE/REFERENCES/
-- TRIGGER na tabela. As policies ja restringem (so admin altera), mas
-- privilegio que nao e usado para nada nao deve existir.
REVOKE TRUNCATE, REFERENCES, TRIGGER, DELETE ON public.password_reset_requests FROM anon, authenticated;
REVOKE UPDATE ON public.password_reset_requests FROM anon;

-- Pedido sem usuario (form publico, antes do login) nao pode gravar o
-- sentinela 00000000-... em user_id: virar NULL libera a FK.
ALTER TABLE public.password_reset_requests ALTER COLUMN user_id DROP NOT NULL;
UPDATE public.password_reset_requests
   SET user_id = NULL
 WHERE user_id = '00000000-0000-0000-0000-000000000000';

UPDATE public.password_reset_requests
   SET status = 'expired'
 WHERE status = 'pending'
   AND expires_at < now();

CREATE INDEX IF NOT EXISTS idx_reset_requests_pending
  ON public.password_reset_requests (expires_at)
  WHERE status = 'pending';