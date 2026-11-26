-- As funcoes public.check_due_assessment_notifications() e
-- public.check_streak_risk_notifications() estavam completas (SECURITY DEFINER, idempotentes
-- por dia, inserindo via public.create_notification) mas nenhum cron nem edge as chamava:
-- os avisos de "avaliacao vencendo" e "sequencia em risco" nunca saiam.
-- Aqui elas passam a rodar uma vez por dia.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('avisar-avaliacoes-vencendo');
    PERFORM cron.unschedule('avisar-risco-de-sequencia');
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'avisar-avaliacoes-vencendo',
  '0 11 * * *',
  $$SELECT public.check_due_assessment_notifications();$$
);

SELECT cron.schedule(
  'avisar-risco-de-sequencia',
  '0 21 * * *',
  $$SELECT public.check_streak_risk_notifications();$$
);

COMMENT ON FUNCTION public.check_due_assessment_notifications() IS
  'Avisa o aluno quando uma avaliacao ativa vence nos proximos 7 dias. Rodada diaria pelo cron avisar-avaliacoes-vencendo.';

COMMENT ON FUNCTION public.check_streak_risk_notifications() IS
  'Avisa o aluno que a sequencia esta em risco (ultima atividade ontem, sequencia > 0). Rodada diaria pelo cron avisar-risco-de-sequencia.';