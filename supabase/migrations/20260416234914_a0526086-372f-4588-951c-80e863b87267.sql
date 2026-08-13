
-- ============ 1. PLAYBOOKS ============
CREATE TABLE public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  summary TEXT,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_playbooks_category ON public.playbooks(category);
CREATE INDEX idx_playbooks_tags ON public.playbooks USING GIN(tags);
CREATE INDEX idx_playbooks_search ON public.playbooks USING GIN(to_tsvector('portuguese', title || ' ' || COALESCE(summary,'') || ' ' || content));

ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published playbooks" ON public.playbooks
  FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins can view all playbooks" ON public.playbooks
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert playbooks" ON public.playbooks
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update playbooks" ON public.playbooks
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete playbooks" ON public.playbooks
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_playbooks_updated_at BEFORE UPDATE ON public.playbooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.playbook_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_playbook_views_user ON public.playbook_views(user_id);
CREATE INDEX idx_playbook_views_playbook ON public.playbook_views(playbook_id);

ALTER TABLE public.playbook_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own views" ON public.playbook_views
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own views" ON public.playbook_views
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all views" ON public.playbook_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to register view + increment counter
CREATE OR REPLACE FUNCTION public.register_playbook_view(p_playbook_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.playbook_views (playbook_id, user_id)
  VALUES (p_playbook_id, auth.uid());
  
  UPDATE public.playbooks
  SET view_count = view_count + 1
  WHERE id = p_playbook_id;
END;
$$;

-- ============ 2. TRAINING VIDEOS ============
CREATE TABLE public.training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  duration_seconds INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  view_count INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_training_videos_category ON public.training_videos(category);
CREATE INDEX idx_training_videos_tags ON public.training_videos USING GIN(tags);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view published videos" ON public.training_videos
  FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins can view all videos" ON public.training_videos
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert videos" ON public.training_videos
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update videos" ON public.training_videos
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete videos" ON public.training_videos
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_training_videos_updated_at BEFORE UPDATE ON public.training_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.training_video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.training_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);

ALTER TABLE public.training_video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own video views" ON public.training_video_views
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all video views" ON public.training_video_views
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_training_video_views_updated_at BEFORE UPDATE ON public.training_video_views
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 3. ONBOARDING WORKFLOWS ============
CREATE TABLE public.onboarding_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  role_target TEXT NOT NULL DEFAULT 'sales',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active workflows" ON public.onboarding_workflows
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage workflows" ON public.onboarding_workflows
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_onboarding_workflows_updated_at BEFORE UPDATE ON public.onboarding_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workflow_id UUID NOT NULL REFERENCES public.onboarding_workflows(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  completed_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, workflow_id)
);

ALTER TABLE public.user_onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding progress" ON public.user_onboarding_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all onboarding progress" ON public.user_onboarding_progress
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_onboarding_progress_updated_at BEFORE UPDATE ON public.user_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ 4. SKILL ASSESSMENTS ============
CREATE TABLE public.skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  skill_area TEXT NOT NULL,
  frequency_days INTEGER NOT NULL DEFAULT 90,
  passing_score INTEGER NOT NULL DEFAULT 70,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active assessments" ON public.skill_assessments
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage assessments" ON public.skill_assessments
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_skill_assessments_updated_at BEFORE UPDATE ON public.skill_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  assessment_id UUID NOT NULL REFERENCES public.skill_assessments(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  gaps JSONB DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_due_at TIMESTAMPTZ
);

CREATE INDEX idx_user_assessment_results_user ON public.user_assessment_results(user_id);
CREATE INDEX idx_user_assessment_results_due ON public.user_assessment_results(next_due_at);

ALTER TABLE public.user_assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own results" ON public.user_assessment_results
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all results" ON public.user_assessment_results
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Function: get assessments due for a user
CREATE OR REPLACE FUNCTION public.get_due_assessments(p_user_id UUID)
RETURNS TABLE(
  assessment_id UUID,
  title TEXT,
  skill_area TEXT,
  frequency_days INTEGER,
  passing_score INTEGER,
  quiz_id UUID,
  last_completed_at TIMESTAMPTZ,
  next_due_at TIMESTAMPTZ,
  status TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.id,
    sa.title,
    sa.skill_area,
    sa.frequency_days,
    sa.passing_score,
    sa.quiz_id,
    lr.completed_at AS last_completed_at,
    lr.next_due_at AS next_due_at,
    CASE
      WHEN lr.id IS NULL THEN 'pending'
      WHEN lr.next_due_at < now() THEN 'overdue'
      WHEN lr.next_due_at < now() + INTERVAL '7 days' THEN 'due_soon'
      ELSE 'on_track'
    END AS status
  FROM public.skill_assessments sa
  LEFT JOIN LATERAL (
    SELECT uar.id, uar.completed_at, uar.next_due_at
    FROM public.user_assessment_results uar
    WHERE uar.user_id = p_user_id AND uar.assessment_id = sa.id
    ORDER BY uar.completed_at DESC
    LIMIT 1
  ) lr ON true
  WHERE sa.is_active = true
  ORDER BY
    CASE
      WHEN lr.id IS NULL THEN 0
      WHEN lr.next_due_at < now() THEN 1
      ELSE 2
    END,
    lr.next_due_at NULLS FIRST;
END;
$$;
