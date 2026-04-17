-- Tabela de comentários em playbooks
CREATE TABLE public.playbook_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.playbook_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view comments on published playbooks"
  ON public.playbook_comments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.playbooks p
      WHERE p.id = playbook_comments.playbook_id
        AND (p.is_published = true OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Users can insert own comments"
  ON public.playbook_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.playbook_comments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.playbook_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON public.playbook_comments FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_playbook_comments_playbook ON public.playbook_comments(playbook_id, created_at DESC);
CREATE INDEX idx_playbook_comments_user ON public.playbook_comments(user_id);

CREATE TRIGGER trg_playbook_comments_updated_at
  BEFORE UPDATE ON public.playbook_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função de recomendações inteligentes
CREATE OR REPLACE FUNCTION public.get_smart_recommendations(p_user_id UUID, p_limit INT DEFAULT 6)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  description TEXT,
  thumbnail_url TEXT,
  duration_minutes INT,
  level TEXT,
  instructor_name TEXT,
  total_lessons INT,
  category_id UUID,
  is_featured BOOLEAN,
  recommendation_reason TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_categories AS (
    SELECT DISTINCT c.category_id
    FROM public.user_course_progress ucp
    JOIN public.courses c ON c.id = ucp.course_id
    WHERE ucp.user_id = p_user_id AND c.category_id IS NOT NULL
  ),
  excluded AS (
    SELECT course_id FROM public.user_course_progress WHERE user_id = p_user_id
  )
  SELECT 
    c.id, c.title, c.slug, c.description, c.thumbnail_url,
    c.duration_minutes, c.level, c.instructor_name, c.total_lessons,
    c.category_id, c.is_featured,
    CASE
      WHEN c.category_id IN (SELECT category_id FROM user_categories) THEN 'Baseado nos seus interesses'
      WHEN c.is_featured THEN 'Em destaque'
      ELSE 'Sugestão para você'
    END AS recommendation_reason
  FROM public.courses c
  WHERE c.is_published = true
    AND c.id NOT IN (SELECT course_id FROM excluded)
  ORDER BY 
    (c.category_id IN (SELECT category_id FROM user_categories)) DESC,
    c.is_featured DESC NULLS LAST,
    c.created_at DESC
  LIMIT p_limit;
$$;