CREATE OR REPLACE FUNCTION public.notify_new_playbook_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prev_user uuid;
  v_playbook_title text;
  v_playbook_slug text;
BEGIN
  SELECT title, slug INTO v_playbook_title, v_playbook_slug
  FROM public.playbooks WHERE id = NEW.playbook_id;

  FOR v_prev_user IN
    SELECT DISTINCT user_id
    FROM public.playbook_comments
    WHERE playbook_id = NEW.playbook_id
      AND user_id <> NEW.user_id
      AND id <> NEW.id
  LOOP
    PERFORM public.create_notification(
      v_prev_user,
      '💬 Nova resposta em playbook',
      'Um novo comentário foi publicado em "' || COALESCE(v_playbook_title, 'um playbook') || '".',
      'playbook_comment',
      '/playbook/' || COALESCE(v_playbook_slug, '')
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_playbook_comment ON public.playbook_comments;
CREATE TRIGGER trg_notify_new_playbook_comment
AFTER INSERT ON public.playbook_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_playbook_comment();

DROP TRIGGER IF EXISTS trg_playbook_comments_updated_at ON public.playbook_comments;
CREATE TRIGGER trg_playbook_comments_updated_at
BEFORE UPDATE ON public.playbook_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();