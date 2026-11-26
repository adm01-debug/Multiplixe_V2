-- GAME-005: multiplicador de XP (streak alta + fim de semana)
-- Antes desta migration todo XP era concedido com o valor nominal: nenhum ganho era acelerado
-- por sequencia de estudo nem por periodo, e o `user_xp` nem guardava o multiplicador vigente.

alter table public.user_xp
  add column if not exists xp_multiplier numeric(4,2) not null default 1;

-- Regra pura e testavel (sem depender de relogio): sequencia + fim de semana, teto de 4x.
create or replace function public.xp_multiplier_for(p_streak integer, p_dow integer)
returns numeric
language sql
immutable
as $$
  select least(
    (case
       when coalesce(p_streak, 0) >= 30 then 2.0
       when coalesce(p_streak, 0) >= 7 then 1.5
       else 1.0
     end)
    * (case when p_dow in (0, 5, 6) then 2.0 else 1.0 end),
    4.0
  )::numeric(4,2);
$$;

create or replace function public.get_xp_multiplier(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $$
  select public.xp_multiplier_for(
    (select coalesce(max(current_streak), 0) from public.user_streaks where user_id = p_user_id),
    extract(dow from current_date)::int
  );
$$;

create or replace function public.get_my_xp_multiplier()
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_streak integer;
  v_dow integer := extract(dow from current_date)::int;
  v_streak_mult numeric;
  v_weekend_mult numeric;
  v_mult numeric;
begin
  if v_uid is null then
    return json_build_object('multiplier', 1, 'streak_multiplier', 1, 'weekend_multiplier', 1, 'streak', 0, 'label', '');
  end if;

  select coalesce(max(current_streak), 0) into v_streak
  from public.user_streaks where user_id = v_uid;

  v_streak_mult := case when v_streak >= 30 then 2.0 when v_streak >= 7 then 1.5 else 1.0 end;
  v_weekend_mult := case when v_dow in (0, 5, 6) then 2.0 else 1.0 end;
  v_mult := public.xp_multiplier_for(v_streak, v_dow);

  return json_build_object(
    'multiplier', v_mult,
    'streak', v_streak,
    'streak_multiplier', v_streak_mult,
    'weekend_multiplier', v_weekend_mult,
    'label', case
      when v_weekend_mult > 1 and v_streak_mult > 1 then 'Fim de semana em dobro + sequencia de ' || v_streak || ' dias: XP x' || v_mult
      when v_weekend_mult > 1 then 'Fim de semana: XP em dobro'
      when v_streak_mult > 1 then 'Sequencia de ' || v_streak || ' dias: XP x' || v_streak_mult
      else ''
    end
  );
end;
$$;

-- add_user_xp passa a conceder o XP ja multiplicado e a guardar o multiplicador vigente.
create or replace function public.add_user_xp(p_user_id uuid, p_amount integer, p_source text DEFAULT 'general'::text)
returns public.user_xp
language plpgsql
security definer
set search_path to 'public'
as $$
DECLARE
  v_user_xp public.user_xp;
  v_mult numeric(4,2);
  v_awarded integer;
BEGIN
  if p_user_id is null then
    raise exception 'p_user_id obrigatorio';
  end if;

  v_mult := public.get_xp_multiplier(p_user_id);
  v_awarded := case
    when p_amount is null or p_amount < 0 then coalesce(p_amount, 0)
    else round(p_amount * v_mult)::int
  end;

  INSERT INTO public.user_xp (user_id, total_xp, last_xp_earned_at, xp_multiplier)
  VALUES (p_user_id, v_awarded, now(), v_mult)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_xp.total_xp + v_awarded,
    last_xp_earned_at = now(),
    xp_multiplier = v_mult,
    xp_from_lessons = CASE WHEN p_source = 'lesson' THEN user_xp.xp_from_lessons + v_awarded ELSE user_xp.xp_from_lessons END,
    xp_from_courses = CASE WHEN p_source = 'course' THEN user_xp.xp_from_courses + v_awarded ELSE user_xp.xp_from_courses END,
    xp_from_streaks = CASE WHEN p_source = 'streak' THEN user_xp.xp_from_streaks + v_awarded ELSE user_xp.xp_from_streaks END,
    xp_from_achievements = CASE WHEN p_source = 'achievement' THEN user_xp.xp_from_achievements + v_awarded ELSE user_xp.xp_from_achievements END
  RETURNING * INTO v_user_xp;

  INSERT INTO public.user_xp_history (user_id, xp_amount, total_xp_after, source)
  VALUES (p_user_id, v_awarded, v_user_xp.total_xp, p_source);

  UPDATE public.user_xp
  SET current_level = CASE
    WHEN total_xp >= 5200 THEN 10
    WHEN total_xp >= 3800 THEN 9
    WHEN total_xp >= 2700 THEN 8
    WHEN total_xp >= 1900 THEN 7
    WHEN total_xp >= 1300 THEN 6
    WHEN total_xp >= 850 THEN 5
    WHEN total_xp >= 500 THEN 4
    WHEN total_xp >= 250 THEN 3
    WHEN total_xp >= 100 THEN 2
    ELSE 1
  END
  WHERE user_id = p_user_id
  RETURNING * INTO v_user_xp;

  RETURN v_user_xp;
END;
$$;

-- O resgate de desafio passa a devolver o XP realmente creditado (com multiplicador).
create or replace function public.claim_daily_challenge_reward(p_user_id uuid, p_progress_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
DECLARE
  v_progress RECORD;
  v_challenge RECORD;
  v_awarded integer;
BEGIN
  SELECT * INTO v_progress
  FROM user_daily_challenge_progress
  WHERE id = p_progress_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Progress not found');
  END IF;

  IF v_progress.xp_claimed THEN
    RETURN json_build_object('success', false, 'error', 'Already claimed');
  END IF;

  IF NOT v_progress.is_completed THEN
    RETURN json_build_object('success', false, 'error', 'Challenge not completed');
  END IF;

  SELECT * INTO v_challenge
  FROM daily_challenges
  WHERE id = v_progress.challenge_id;

  v_awarded := round(v_challenge.xp_reward * public.get_xp_multiplier(p_user_id))::int;

  UPDATE user_daily_challenge_progress
  SET xp_claimed = true, updated_at = now()
  WHERE id = p_progress_id;

  PERFORM add_user_xp(p_user_id, v_challenge.xp_reward, 'daily_challenge');

  RETURN json_build_object(
    'success', true,
    'xp_earned', v_awarded,
    'challenge_title', v_challenge.title
  );
END;
$$;

revoke all on function public.xp_multiplier_for(integer, integer) from public;
revoke all on function public.xp_multiplier_for(integer, integer) from anon;
grant execute on function public.xp_multiplier_for(integer, integer) to authenticated;

revoke all on function public.get_xp_multiplier(uuid) from public;
revoke all on function public.get_xp_multiplier(uuid) from anon;
revoke all on function public.get_xp_multiplier(uuid) from authenticated;

revoke all on function public.get_my_xp_multiplier() from public;
revoke all on function public.get_my_xp_multiplier() from anon;
grant execute on function public.get_my_xp_multiplier() to authenticated;