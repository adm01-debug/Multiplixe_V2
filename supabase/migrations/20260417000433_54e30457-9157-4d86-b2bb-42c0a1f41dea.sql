-- Notification: due skill assessments (run daily via cron)
CREATE OR REPLACE FUNCTION public.check_due_assessment_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row RECORD;
  v_today DATE := CURRENT_DATE;
BEGIN
  FOR v_row IN
    SELECT
      uar.user_id,
      sa.title,
      uar.next_due_at
    FROM public.user_assessment_results uar
    JOIN public.skill_assessments sa ON sa.id = uar.assessment_id
    WHERE sa.is_active = true
      AND uar.next_due_at IS NOT NULL
      AND uar.next_due_at::date BETWEEN v_today AND v_today + INTERVAL '7 days'
      AND uar.id = (
        SELECT id FROM public.user_assessment_results
        WHERE user_id = uar.user_id AND assessment_id = uar.assessment_id
        ORDER BY completed_at DESC LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = uar.user_id
          AND n.type = 'assessment_due'
          AND n.message LIKE '%' || sa.title || '%'
          AND DATE(n.created_at) = v_today
      )
  LOOP
    PERFORM public.create_notification(
      v_row.user_id,
      '🎯 Avaliação próxima do vencimento',
      'A avaliação "' || v_row.title || '" vence em ' || GREATEST(0, EXTRACT(DAY FROM v_row.next_due_at - now())::int) || ' dia(s).',
      'assessment_due',
      '/avaliacoes'
    );
  END LOOP;
END;
$$;

-- Trigger: notify when onboarding workflow is completed (100%)
CREATE OR REPLACE FUNCTION public.notify_onboarding_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.progress_percentage = 100
     AND (OLD IS NULL OR COALESCE(OLD.progress_percentage, 0) < 100) THEN
    PERFORM public.create_notification(
      NEW.user_id,
      '🎉 Onboarding concluído!',
      'Parabéns! Você concluiu seu plano de onboarding com sucesso.',
      'onboarding_complete',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_onboarding_completion ON public.user_onboarding_progress;
CREATE TRIGGER trg_notify_onboarding_completion
AFTER INSERT OR UPDATE ON public.user_onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.notify_onboarding_completion();