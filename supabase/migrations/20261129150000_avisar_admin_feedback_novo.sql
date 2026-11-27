-- O feedback do aluno passa a gravar (tabela public.feedback), mas ninguem ficava sabendo:
-- o admin so descobria abrindo a aba Feedback. Este trigger avisa todos os admins
-- pela central de notificacoes, com link direto para a aba.

CREATE OR REPLACE FUNCTION public.tg_notificar_admin_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rotulo TEXT;
  v_admin UUID;
BEGIN
  v_rotulo := CASE NEW.tipo
    WHEN 'bug' THEN 'Bug'
    WHEN 'idea' THEN 'Sugestao'
    WHEN 'question' THEN 'Duvida'
    ELSE 'Feedback'
  END;

  FOR v_admin IN
    SELECT ur.user_id FROM public.user_roles ur
    WHERE ur.role = 'admin'
  LOOP
    PERFORM public.create_notification(
      v_admin,
      v_rotulo || ' de aluno',
      left(NEW.mensagem, 180),
      'info',
      '/admin?tab=feedback'
    );
  END LOOP;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.tg_notificar_admin_feedback() IS
  'Avisa os admins na central de notificacoes quando um aluno envia feedback.';

DROP TRIGGER IF EXISTS trg_notificar_admin_feedback ON public.feedback;
CREATE TRIGGER trg_notificar_admin_feedback
  AFTER INSERT ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.tg_notificar_admin_feedback();