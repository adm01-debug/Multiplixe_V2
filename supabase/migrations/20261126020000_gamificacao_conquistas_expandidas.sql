-- GAME-004: motor de conquistas expandido.
-- Antes so total_xp, current_level, lessons_completed e courses_completed eram avaliados:
-- as 4 conquistas de pomodoro ja cadastradas nunca desbloqueavam e completar uma sessao
-- de foco nao disparava avaliacao nenhuma.

ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS requirement_category text;
ALTER TABLE public.achievements ADD COLUMN IF NOT EXISTS is_secret boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.check_and_award_achievements(p_user_id uuid)
 RETURNS SETOF public.user_achievements
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_xp INTEGER;
  v_current_level INTEGER;
  v_lessons_completed INTEGER;
  v_courses_completed INTEGER;
  v_pomodoro_sessions INTEGER;
  v_current_streak INTEGER;
  v_category_courses INTEGER;
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

  -- Count completed focus sessions (breaks do not count)
  SELECT COUNT(*)
  INTO v_pomodoro_sessions
  FROM public.pomodoro_sessions
  WHERE user_id = p_user_id AND session_type = 'work';

  -- Current streak
  SELECT COALESCE(current_streak, 0)
  INTO v_current_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;
  v_current_streak := COALESCE(v_current_streak, 0);

  -- Check each achievement
  FOR v_achievement IN SELECT * FROM public.achievements LOOP
    -- Skip if already unlocked
    IF EXISTS (
      SELECT 1 FROM public.user_achievements
      WHERE user_id = p_user_id AND achievement_id = v_achievement.id
    ) THEN
      CONTINUE;
    END IF;

    -- Completed courses inside one category, used by the category badges
    IF v_achievement.requirement_type = 'category_courses_completed'
       AND v_achievement.requirement_category IS NOT NULL THEN
      SELECT COUNT(*)
      INTO v_category_courses
      FROM public.user_course_progress ucp
      JOIN public.courses c ON c.id = ucp.course_id
      JOIN public.categories cat ON cat.id = c.category_id
      WHERE ucp.user_id = p_user_id
        AND ucp.progress_percentage = 100
        AND lower(cat.name) = lower(v_achievement.requirement_category);
    ELSE
      v_category_courses := 0;
    END IF;

    -- Check if requirement is met
    IF (v_achievement.requirement_type = 'total_xp' AND v_total_xp >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'current_level' AND v_current_level >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'lessons_completed' AND v_lessons_completed >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'courses_completed' AND v_courses_completed >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'pomodoro_sessions' AND v_pomodoro_sessions >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'streak_days' AND v_current_streak >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'category_courses_completed' AND v_category_courses >= v_achievement.requirement_value)
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
$function$;

-- Fechar o ciclo: concluir uma sessao de foco passa a avaliar as conquistas na hora,
-- sem depender de o usuario abrir o dashboard.
CREATE OR REPLACE FUNCTION public.complete_pomodoro_session(p_user_id uuid, p_session_type text, p_duration_minutes integer)
 RETURNS TABLE(session_id uuid, xp_earned integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_session_id UUID;
  v_xp_earned INTEGER;
BEGIN
  -- Calcular XP: 10 XP por sessão de trabalho, 0 para pausas
  IF p_session_type = 'work' THEN
    v_xp_earned := 10;
  ELSE
    v_xp_earned := 0;
  END IF;

  -- Inserir sessão
  INSERT INTO pomodoro_sessions (user_id, session_type, duration_minutes, xp_earned)
  VALUES (p_user_id, p_session_type, p_duration_minutes, v_xp_earned)
  RETURNING id INTO v_session_id;

  -- Adicionar XP se for sessão de trabalho
  IF v_xp_earned > 0 THEN
    PERFORM add_user_xp(p_user_id, v_xp_earned, 'pomodoro');
    PERFORM public.check_and_award_achievements(p_user_id);
  END IF;

  RETURN QUERY SELECT v_session_id, v_xp_earned;
END;
$function$;

-- Icones das conquistas de pomodoro estavam com nome de icone lucide ("Timer",
-- "Clock", "Target", "Zap") e a UI renderiza o campo como texto.
UPDATE public.achievements SET icon = '⏱️' WHERE slug = 'pomodoro_first';
UPDATE public.achievements SET icon = '🍅' WHERE slug = 'pomodoro_10';
UPDATE public.achievements SET icon = '🎖️' WHERE slug = 'pomodoro_50';
UPDATE public.achievements SET icon = '👑' WHERE slug = 'pomodoro_100';

-- Novas conquistas de milestone e badges por categoria
INSERT INTO public.achievements (slug, name, description, icon, category, xp_reward, requirement_type, requirement_value, gradient, requirement_category, is_secret)
VALUES
  ('courses_10', 'Dez Cursos', 'Conclua 10 cursos na plataforma', '🏆', 'learning', 500, 'courses_completed', 10, 'from-indigo-500 to-purple-500', NULL, false),
  ('lessons_100', 'Cem Aulas', 'Conclua 100 aulas na plataforma', '🎓', 'learning', 500, 'lessons_completed', 100, 'from-blue-500 to-cyan-500', NULL, false),
  ('streak_7', 'Sequência de 7 Dias', 'Estude 7 dias seguidos', '🔥', 'focus', 100, 'streak_days', 7, 'from-orange-500 to-red-500', NULL, false),
  ('streak_30', 'Mês de Foco', 'Estude 30 dias seguidos', '🌟', 'focus', 400, 'streak_days', 30, 'from-amber-500 to-orange-500', NULL, true),
  ('category_sales', 'Especialista em Vendas', 'Conclua 2 cursos da categoria Vendas', '🥇', 'learning', 300, 'category_courses_completed', 2, 'from-emerald-500 to-teal-500', 'Vendas', false),
  ('category_service', 'Referência em Atendimento', 'Conclua 1 curso da categoria Atendimento', '🎯', 'learning', 150, 'category_courses_completed', 1, 'from-teal-500 to-cyan-500', 'Atendimento', false),
  ('category_soft_skills', 'Mestre em Soft Skills', 'Conclua 2 cursos da categoria Soft Skills', '🚀', 'learning', 300, 'category_courses_completed', 2, 'from-purple-500 to-pink-500', 'Soft Skills', false)
ON CONFLICT (slug) DO NOTHING;