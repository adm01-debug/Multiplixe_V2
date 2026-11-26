-- GAME-009 (item 3): conquistas exclusivas temporarias.
-- Antes: toda conquista valia para sempre. Agora a conquista pode ter janela propria
-- (starts_at/ends_at) e/ou estar amarrada a um evento sazonal; fora da janela ela nao e
-- concedida por check_and_award_achievements (quem ja desbloqueou mantem a conquista).

alter table public.achievements add column if not exists starts_at timestamptz;
alter table public.achievements add column if not exists ends_at timestamptz;
alter table public.achievements add column if not exists seasonal_event_id uuid;

do $do$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'achievements_janela_check' and conrelid = 'public.achievements'::regclass
  ) then
    alter table public.achievements
      add constraint achievements_janela_check
      check (ends_at is null or starts_at is null or ends_at > starts_at);
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'achievements_seasonal_event_fk' and conrelid = 'public.achievements'::regclass
  ) then
    alter table public.achievements
      add constraint achievements_seasonal_event_fk
      foreign key (seasonal_event_id) references public.seasonal_events(id) on delete set null;
  end if;
end
$do$;

create index if not exists idx_achievements_seasonal_event on public.achievements (seasonal_event_id);

-- Regra unica de disponibilidade, usada pela concessao automatica e pelo painel.
create or replace function public.conquista_disponivel(p_achievement_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce((
    select (a.starts_at is null or now() >= a.starts_at)
       and (a.ends_at is null or now() <= a.ends_at)
       and (
         a.seasonal_event_id is null
         or exists (
           select 1 from public.seasonal_events e
            where e.id = a.seasonal_event_id
              and e.is_active
              and now() between e.starts_at and e.ends_at
         )
       )
      from public.achievements a
     where a.id = p_achievement_id
  ), false);
$function$;

revoke all on function public.conquista_disponivel(uuid) from public;
revoke all on function public.conquista_disponivel(uuid) from anon;
revoke all on function public.conquista_disponivel(uuid) from authenticated;
grant execute on function public.conquista_disponivel(uuid) to service_role;

create or replace function public.check_and_award_achievements(p_user_id uuid)
 returns setof public.user_achievements
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
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

    -- Conquista exclusiva fora da janela (ou com evento desligado) nao e concedida
    IF NOT public.conquista_disponivel(v_achievement.id) THEN
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