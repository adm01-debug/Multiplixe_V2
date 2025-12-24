
-- Function to notify all users about a new course
CREATE OR REPLACE FUNCTION public.notify_new_course()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
BEGIN
  -- Only trigger when course becomes published (either new insert with is_published=true, or update from false to true)
  IF (TG_OP = 'INSERT' AND NEW.is_published = true) OR 
     (TG_OP = 'UPDATE' AND OLD.is_published = false AND NEW.is_published = true) THEN
    
    -- Create notification for all users with XP (active users)
    FOR v_user IN 
      SELECT DISTINCT user_id FROM public.user_xp
    LOOP
      PERFORM public.create_notification(
        v_user.user_id,
        '📚 Novo curso disponível!',
        'O curso "' || NEW.title || '" acabou de ser lançado. Confira agora!',
        'new_course',
        '/curso/' || NEW.slug
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on courses table
DROP TRIGGER IF EXISTS trigger_notify_new_course ON public.courses;

CREATE TRIGGER trigger_notify_new_course
  AFTER INSERT OR UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_course();
