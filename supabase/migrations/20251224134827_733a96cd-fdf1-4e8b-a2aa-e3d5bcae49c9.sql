-- Create achievements definition table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  gradient TEXT DEFAULT 'from-amber-500 to-orange-500',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" 
ON public.achievements FOR SELECT USING (true);

CREATE POLICY "Admins can manage achievements" 
ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements" 
ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (slug, name, description, icon, category, xp_reward, requirement_type, requirement_value, gradient) VALUES
('first_lesson', 'Primeira Aula', 'Complete sua primeira aula', '📚', 'learning', 25, 'lessons_completed', 1, 'from-blue-500 to-cyan-500'),
('first_course', 'Primeiro Curso', 'Complete seu primeiro curso', '🎓', 'learning', 100, 'courses_completed', 1, 'from-emerald-500 to-teal-500'),
('xp_100', 'Iniciante', 'Alcance 100 XP', '⭐', 'xp', 0, 'total_xp', 100, 'from-amber-500 to-yellow-500'),
('xp_500', 'Estudante Dedicado', 'Alcance 500 XP', '🌟', 'xp', 0, 'total_xp', 500, 'from-orange-500 to-red-500'),
('xp_1000', 'Especialista', 'Alcance 1000 XP', '💫', 'xp', 0, 'total_xp', 1000, 'from-purple-500 to-pink-500'),
('xp_2500', 'Mestre', 'Alcance 2500 XP', '👑', 'xp', 0, 'total_xp', 2500, 'from-rose-500 to-pink-500'),
('courses_3', 'Explorador', 'Complete 3 cursos', '🧭', 'learning', 150, 'courses_completed', 3, 'from-indigo-500 to-purple-500'),
('courses_5', 'Conquistador', 'Complete 5 cursos', '🏆', 'learning', 250, 'courses_completed', 5, 'from-amber-500 to-orange-500'),
('lessons_10', 'Persistente', 'Complete 10 aulas', '🔥', 'learning', 50, 'lessons_completed', 10, 'from-orange-500 to-red-500'),
('lessons_25', 'Incansável', 'Complete 25 aulas', '💪', 'learning', 100, 'lessons_completed', 25, 'from-rose-500 to-red-500'),
('level_5', 'Nível 5', 'Alcance o nível 5', '🎖️', 'level', 0, 'current_level', 5, 'from-teal-500 to-cyan-500'),
('level_10', 'Lenda', 'Alcance o nível 10', '🏅', 'level', 0, 'current_level', 10, 'from-yellow-500 to-amber-500');

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id UUID)
RETURNS SETOF public.user_achievements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_xp INTEGER;
  v_current_level INTEGER;
  v_lessons_completed INTEGER;
  v_courses_completed INTEGER;
  v_achievement RECORD;
  v_new_achievement public.user_achievements;
BEGIN
  -- Get user stats
  SELECT COALESCE(total_xp, 0), COALESCE(current_level, 1)
  INTO v_total_xp, v_current_level
  FROM public.user_xp
  WHERE user_id = p_user_id;

  -- Count completed lessons
  SELECT COUNT(*)
  INTO v_lessons_completed
  FROM public.user_lesson_progress
  WHERE user_id = p_user_id AND is_completed = true;

  -- Count completed courses
  SELECT COUNT(*)
  INTO v_courses_completed
  FROM public.user_course_progress
  WHERE user_id = p_user_id AND progress_percentage = 100;

  -- Check each achievement
  FOR v_achievement IN SELECT * FROM public.achievements LOOP
    -- Skip if already unlocked
    IF EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) THEN
      CONTINUE;
    END IF;

    -- Check if requirement is met
    IF (v_achievement.requirement_type = 'total_xp' AND v_total_xp >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'current_level' AND v_current_level >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'lessons_completed' AND v_lessons_completed >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'courses_completed' AND v_courses_completed >= v_achievement.requirement_value)
    THEN
      -- Award achievement
      INSERT INTO public.user_achievements (user_id, achievement_id)
      VALUES (p_user_id, v_achievement.id)
      RETURNING * INTO v_new_achievement;

      -- Award XP if applicable
      IF v_achievement.xp_reward > 0 THEN
        PERFORM public.add_user_xp(p_user_id, v_achievement.xp_reward, 'achievement');
      END IF;

      RETURN NEXT v_new_achievement;
    END IF;
  END LOOP;

  RETURN;
END;
$$;