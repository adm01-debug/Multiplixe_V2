-- 1. Índices de performance para queries quentes
CREATE INDEX IF NOT EXISTS idx_playbooks_published_views
  ON public.playbooks (is_published, view_count DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_training_videos_published_category
  ON public.training_videos (is_published, category)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_user_assessment_results_user_due
  ON public.user_assessment_results (user_id, next_due_at);

CREATE INDEX IF NOT EXISTS idx_playbook_views_user_playbook_time
  ON public.playbook_views (user_id, playbook_id, viewed_at DESC);

-- 2. Função genérica de auditoria para tabelas de Sales Enablement
CREATE OR REPLACE FUNCTION public.audit_sales_enablement_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_resource_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
    v_resource_id := OLD.id;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    v_resource_id := NEW.id;
  ELSE
    v_old := NULL;
    v_new := to_jsonb(NEW);
    v_resource_id := NEW.id;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, old_values, new_values)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_resource_id, v_old, v_new);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Triggers de auditoria
DROP TRIGGER IF EXISTS audit_playbooks ON public.playbooks;
CREATE TRIGGER audit_playbooks
AFTER INSERT OR UPDATE OR DELETE ON public.playbooks
FOR EACH ROW EXECUTE FUNCTION public.audit_sales_enablement_changes();

DROP TRIGGER IF EXISTS audit_training_videos ON public.training_videos;
CREATE TRIGGER audit_training_videos
AFTER INSERT OR UPDATE OR DELETE ON public.training_videos
FOR EACH ROW EXECUTE FUNCTION public.audit_sales_enablement_changes();

DROP TRIGGER IF EXISTS audit_onboarding_workflows ON public.onboarding_workflows;
CREATE TRIGGER audit_onboarding_workflows
AFTER INSERT OR UPDATE OR DELETE ON public.onboarding_workflows
FOR EACH ROW EXECUTE FUNCTION public.audit_sales_enablement_changes();

DROP TRIGGER IF EXISTS audit_skill_assessments ON public.skill_assessments;
CREATE TRIGGER audit_skill_assessments
AFTER INSERT OR UPDATE OR DELETE ON public.skill_assessments
FOR EACH ROW EXECUTE FUNCTION public.audit_sales_enablement_changes();

-- 4. Aprimora register_playbook_view com rate limit por usuário (1 view/min)
CREATE OR REPLACE FUNCTION public.register_playbook_view(p_playbook_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_recent_count int;
BEGIN
  IF v_user IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_recent_count
  FROM public.playbook_views
  WHERE user_id = v_user
    AND playbook_id = p_playbook_id
    AND viewed_at > now() - INTERVAL '1 minute';

  IF v_recent_count > 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.playbook_views (playbook_id, user_id)
  VALUES (p_playbook_id, v_user);

  UPDATE public.playbooks
  SET view_count = view_count + 1
  WHERE id = p_playbook_id;
END;
$$;