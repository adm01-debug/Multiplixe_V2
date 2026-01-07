-- #76 Discussion Forums - Tables for course Q&A
CREATE TABLE public.course_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.discussion_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discussion_id UUID NOT NULL REFERENCES public.course_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_answer BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.discussion_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  discussion_id UUID REFERENCES public.course_discussions(id) ON DELETE CASCADE,
  reply_id UUID REFERENCES public.discussion_replies(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, discussion_id),
  UNIQUE(user_id, reply_id)
);

-- Enable RLS
ALTER TABLE public.course_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_discussions
CREATE POLICY "Anyone can view discussions" ON public.course_discussions FOR SELECT USING (true);
CREATE POLICY "Users can create discussions" ON public.course_discussions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own discussions" ON public.course_discussions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own discussions" ON public.course_discussions FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussion_replies
CREATE POLICY "Anyone can view replies" ON public.discussion_replies FOR SELECT USING (true);
CREATE POLICY "Users can create replies" ON public.discussion_replies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON public.discussion_replies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON public.discussion_replies FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for discussion_votes
CREATE POLICY "Anyone can view votes" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "Users can vote" ON public.discussion_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can change vote" ON public.discussion_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can remove vote" ON public.discussion_votes FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_discussions_course ON public.course_discussions(course_id);
CREATE INDEX idx_discussions_lesson ON public.course_discussions(lesson_id);
CREATE INDEX idx_replies_discussion ON public.discussion_replies(discussion_id);

-- Function to update upvotes count
CREATE OR REPLACE FUNCTION public.update_discussion_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.discussion_id IS NOT NULL THEN
      UPDATE public.course_discussions 
      SET upvotes = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM public.discussion_votes WHERE discussion_id = NEW.discussion_id
      )
      WHERE id = NEW.discussion_id;
    END IF;
    IF NEW.reply_id IS NOT NULL THEN
      UPDATE public.discussion_replies 
      SET upvotes = (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down')
        FROM public.discussion_votes WHERE reply_id = NEW.reply_id
      )
      WHERE id = NEW.reply_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.discussion_id IS NOT NULL THEN
      UPDATE public.course_discussions 
      SET upvotes = (
        SELECT COALESCE(COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down'), 0)
        FROM public.discussion_votes WHERE discussion_id = OLD.discussion_id
      )
      WHERE id = OLD.discussion_id;
    END IF;
    IF OLD.reply_id IS NOT NULL THEN
      UPDATE public.discussion_replies 
      SET upvotes = (
        SELECT COALESCE(COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down'), 0)
        FROM public.discussion_votes WHERE reply_id = OLD.reply_id
      )
      WHERE id = OLD.reply_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_discussion_votes
AFTER INSERT OR UPDATE OR DELETE ON public.discussion_votes
FOR EACH ROW EXECUTE FUNCTION public.update_discussion_votes();

-- #46 Team Leaderboards - Function for department leaderboard
CREATE OR REPLACE FUNCTION public.get_department_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  department TEXT,
  total_xp BIGINT,
  member_count BIGINT,
  avg_xp NUMERIC,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.department, 'Sem Departamento') as department,
    SUM(ux.total_xp)::BIGINT as total_xp,
    COUNT(DISTINCT p.user_id)::BIGINT as member_count,
    ROUND(AVG(ux.total_xp), 0) as avg_xp,
    ROW_NUMBER() OVER (ORDER BY SUM(ux.total_xp) DESC)::BIGINT as rank
  FROM public.profiles p
  JOIN public.user_xp ux ON p.user_id = ux.user_id
  GROUP BY COALESCE(p.department, 'Sem Departamento')
  ORDER BY total_xp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;