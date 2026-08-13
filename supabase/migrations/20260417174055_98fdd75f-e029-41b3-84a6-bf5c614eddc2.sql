-- Generic audit trigger function for admin tables
CREATE OR REPLACE FUNCTION public.audit_admin_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_resource_id uuid;
  v_action text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_resource_id := OLD.id;
    v_action := TG_TABLE_NAME || '_delete';
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_resource_id := NEW.id;
    v_action := TG_TABLE_NAME || '_update';
  ELSE
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_resource_id := NEW.id;
    v_action := TG_TABLE_NAME || '_create';
  END IF;

  -- Only log if there's an authenticated user (skip system operations)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      user_id, action, resource_type, resource_id, old_values, new_values
    )
    VALUES (
      auth.uid(), v_action, TG_TABLE_NAME, v_resource_id, v_old, v_new
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach to courses
DROP TRIGGER IF EXISTS audit_courses_changes ON public.courses;
CREATE TRIGGER audit_courses_changes
AFTER INSERT OR UPDATE OR DELETE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

-- Attach to lessons
DROP TRIGGER IF EXISTS audit_lessons_changes ON public.lessons;
CREATE TRIGGER audit_lessons_changes
AFTER INSERT OR UPDATE OR DELETE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

-- Attach to learning_paths
DROP TRIGGER IF EXISTS audit_learning_paths_changes ON public.learning_paths;
CREATE TRIGGER audit_learning_paths_changes
AFTER INSERT OR UPDATE OR DELETE ON public.learning_paths
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

-- Attach to user_roles (critical for security)
DROP TRIGGER IF EXISTS audit_user_roles_changes ON public.user_roles;
CREATE TRIGGER audit_user_roles_changes
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

-- Attach to quizzes
DROP TRIGGER IF EXISTS audit_quizzes_changes ON public.quizzes;
CREATE TRIGGER audit_quizzes_changes
AFTER INSERT OR UPDATE OR DELETE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

-- Attach to onboarding_workflows
DROP TRIGGER IF EXISTS audit_onboarding_workflows_changes ON public.onboarding_workflows;
CREATE TRIGGER audit_onboarding_workflows_changes
AFTER INSERT OR UPDATE OR DELETE ON public.onboarding_workflows
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();