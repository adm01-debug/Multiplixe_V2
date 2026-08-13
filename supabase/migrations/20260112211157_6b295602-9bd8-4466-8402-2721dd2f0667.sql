-- =====================================================
-- MELHORIAS #36-40: Favoritos, Notas, Metas, Recomendações
-- =====================================================

-- 1. TABELA: user_favorites - Favoritar Cursos
CREATE TABLE public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
ON public.user_favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
ON public.user_favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
ON public.user_favorites FOR DELETE
USING (auth.uid() = user_id);

-- 2. TABELA: user_notes - Notas nas Aulas
CREATE TABLE public.user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  timestamp_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
ON public.user_notes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
ON public.user_notes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
ON public.user_notes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
ON public.user_notes FOR DELETE
USING (auth.uid() = user_id);

-- 3. TABELA: user_goals - Metas de Aprendizado
CREATE TABLE public.user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('courses_month', 'hours_week', 'xp_day', 'lessons_week')),
  target_value INT NOT NULL,
  current_value INT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
ON public.user_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
ON public.user_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
ON public.user_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
ON public.user_goals FOR DELETE
USING (auth.uid() = user_id);

-- 4. FUNÇÃO: get_recommended_courses - Recomendações Personalizadas
CREATE OR REPLACE FUNCTION public.get_recommended_courses(p_user_id UUID, p_limit INT DEFAULT 6)
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_completed_courses AS (
    SELECT ucp.course_id
    FROM user_course_progress ucp
    WHERE ucp.user_id = p_user_id AND ucp.progress_percentage = 100
  ),
  user_categories AS (
    SELECT DISTINCT c.category_id
    FROM courses c
    INNER JOIN user_course_progress ucp ON ucp.course_id = c.id
    WHERE ucp.user_id = p_user_id AND ucp.progress_percentage > 0
  ),
  popular_courses AS (
    SELECT ucp.course_id, COUNT(*) as enrollments
    FROM user_course_progress ucp
    GROUP BY ucp.course_id
    ORDER BY enrollments DESC
    LIMIT 20
  )
  SELECT DISTINCT ON (c.id)
    c.id,
    c.title,
    c.slug,
    c.description,
    c.thumbnail_url,
    c.duration_minutes,
    c.level,
    c.instructor_name,
    c.total_lessons,
    c.category_id,
    c.is_featured,
    CASE 
      WHEN c.category_id IN (SELECT uc.category_id FROM user_categories uc) THEN 'Baseado no seu histórico'
      WHEN c.is_featured = true THEN 'Em destaque'
      WHEN c.id IN (SELECT pc.course_id FROM popular_courses pc) THEN 'Popular na plataforma'
      ELSE 'Sugestão para você'
    END as recommendation_reason
  FROM courses c
  WHERE c.is_published = true
    AND c.id NOT IN (SELECT ucc.course_id FROM user_completed_courses ucc)
    AND c.id NOT IN (
      SELECT ucp.course_id 
      FROM user_course_progress ucp 
      WHERE ucp.user_id = p_user_id AND ucp.progress_percentage > 0
    )
  ORDER BY c.id,
    CASE WHEN c.category_id IN (SELECT uc.category_id FROM user_categories uc) THEN 1
         WHEN c.is_featured = true THEN 2
         WHEN c.id IN (SELECT pc.course_id FROM popular_courses pc) THEN 3
         ELSE 4
    END,
    c.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 5. Criar bucket para avatares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 6. Policies para bucket de avatares
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Índices para performance
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX idx_user_favorites_course_id ON public.user_favorites(course_id);
CREATE INDEX idx_user_notes_user_id ON public.user_notes(user_id);
CREATE INDEX idx_user_notes_lesson_id ON public.user_notes(lesson_id);
CREATE INDEX idx_user_goals_user_id ON public.user_goals(user_id);
CREATE INDEX idx_user_goals_end_date ON public.user_goals(end_date);