-- Legado sem uso, removido depois de auditar referencias no codigo e no banco:
--  * a tabela public.password_reset_tokens nasceu no template inicial, tem 0 linhas e
--    nunca recebeu INSERT (nenhuma funcao, edge ou tela escreve nela). O fluxo vivo de
--    reset e public.password_reset_requests + edge approve-password-reset.
--  * a edge verify-mfa e duplicata do login TOTP que o app faz pelo SDK
--    (src/hooks/useMFA.ts + src/components/security/MFAChallengeGate.tsx) e nao eleva a
--    sessao do navegador; nenhuma tela a chama.
-- A funcao de limpeza do cron precisa perder o DELETE antes do DROP, senao o job
-- cleanup-security-logs passa a falhar de hora em hora.
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM rate_limit_logs WHERE created_at < now() - interval '7 days';

  DELETE FROM blocked_ips WHERE expires_at < now() AND NOT is_permanent;

  DELETE FROM user_sessions WHERE expires_at < now();
END;
$function$;

DROP TABLE IF EXISTS public.password_reset_tokens;