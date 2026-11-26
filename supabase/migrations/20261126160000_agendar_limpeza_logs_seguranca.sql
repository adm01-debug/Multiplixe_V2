-- A funcao public.cleanup_old_security_logs() existe desde 20251231 mas nada a
-- chamava: nenhum job no pg_cron e a unica edge que a invoca
-- (cleanup-security-logs) nao tem chamador no app. Resultado: rate_limit_logs,
-- blocked_ips, password_reset_tokens e user_sessions cresciam sem limite.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup-security-logs');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'cleanup-security-logs',
  '20 3 * * *',
  $$SELECT public.cleanup_old_security_logs();$$
);