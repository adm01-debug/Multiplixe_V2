-- O multiplicador vigente era lido em add_user_xp numa variavel numeric(4,2), o que arredondava o
-- valor antes de calcular o XP. Com o encadeamento de fatores (sequencia x fim de semana x
-- impulsionador x evento sazonal) o multiplicador tem mais de duas casas - 1,5 x 1,33 = 1,995 - e o
-- XP creditado podia ficar 1 ponto abaixo do valor anunciado ao aluno por
-- claim_daily_challenge_reward, que calcula com o multiplicador cheio.
--
-- Aqui o calculo passa a usar o multiplicador cheio; as duas casas continuam apenas no que fica
-- gravado em user_xp.xp_multiplier, que e exibicao.

create or replace function public.add_user_xp(p_user_id uuid, p_amount integer, p_source text DEFAULT 'general'::text)
returns public.user_xp
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_user_xp public.user_xp;
  v_mult numeric;
  v_mult_exibicao numeric;
  v_awarded integer;
BEGIN
  if p_user_id is null then
    raise exception 'p_user_id obrigatorio';
  end if;

  v_mult := public.get_xp_multiplier(p_user_id);
  v_mult_exibicao := round(v_mult, 2);
  v_awarded := case
    when p_amount is null or p_amount < 0 then coalesce(p_amount, 0)
    else round(p_amount * v_mult)::int
  end;

  INSERT INTO public.user_xp (user_id, total_xp, last_xp_earned_at, xp_multiplier)
  VALUES (p_user_id, v_awarded, now(), v_mult_exibicao)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_xp = user_xp.total_xp + v_awarded,
    last_xp_earned_at = now(),
    xp_multiplier = v_mult_exibicao,
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
$function$;

-- As permissoes sao mantidas como estao (postgres, authenticated, service_role): o app chama
-- add_user_xp direto em useUserXP e WeeklyGoalTracker, e as rotinas internas chamam como owner.
-- create or replace preserva a ACL existente, por isso nenhum grant e repetido aqui.-- O rotulo vinha com o multiplicador em 6 casas ("XP x1.995000") e, quando havia impulsionador e
-- evento ao mesmo tempo, repetia a frase. Agora o rotulo lista cada fator com duas casas e fecha no
-- multiplicador final.
create or replace function public.get_my_xp_multiplier()
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_streak integer;
  v_dow integer := extract(dow from current_date)::int;
  v_streak_mult numeric;
  v_weekend_mult numeric;
  v_boost_mult numeric := 1;
  v_boost_expires timestamptz;
  v_event_mult numeric := 1;
  v_event_title text;
  v_mult numeric;
  v_partes text[] := array[]::text[];
  v_label text;
begin
  if v_uid is null then
    return json_build_object('multiplier', 1, 'streak_multiplier', 1, 'weekend_multiplier', 1, 'streak', 0, 'boost_multiplier', 1, 'boost_expires_at', null, 'event_multiplier', 1, 'event_title', null, 'label', '');
  end if;

  select coalesce(max(current_streak), 0) into v_streak
  from public.user_streaks where user_id = v_uid;

  select b.multiplier, b.expires_at into v_boost_mult, v_boost_expires
  from (
    select multiplier, expires_at
      from public.user_powerups
     where user_id = v_uid and kind = 'xp_boost' and expires_at > now()
     order by expires_at desc
     limit 1
  ) b;

  v_boost_mult := coalesce(v_boost_mult, 1);

  select e.xp_multiplier, e.title into v_event_mult, v_event_title
  from public.seasonal_events e
  where e.is_active and e.starts_at <= now() and e.ends_at > now()
  order by e.xp_multiplier desc, e.ends_at asc
  limit 1;

  v_event_mult := coalesce(v_event_mult, 1);

  v_streak_mult := case when v_streak >= 30 then 2.0 when v_streak >= 7 then 1.5 else 1.0 end;
  v_weekend_mult := case when v_dow in (0, 5, 6) then 2.0 else 1.0 end;
  v_mult := least(public.xp_multiplier_for(v_streak, v_dow) * v_boost_mult * v_event_mult, 8.0);

  if v_streak_mult > 1 then
    v_partes := v_partes || ('Sequencia de ' || v_streak || ' dias XP x' || public.xp_display(v_streak_mult));
  end if;
  if v_weekend_mult > 1 then
    v_partes := v_partes || ('Fim de semana XP x' || public.xp_display(v_weekend_mult));
  end if;
  if v_boost_mult > 1 then
    v_partes := v_partes || ('Impulsionador XP x' || public.xp_display(v_boost_mult));
  end if;
  if v_event_mult > 1 then
    v_partes := v_partes || (coalesce(v_event_title, 'Evento sazonal') || ' XP x' || public.xp_display(v_event_mult));
  end if;

  v_label := case
    when cardinality(v_partes) = 0 then ''
    else array_to_string(v_partes, ' + ') || ': XP x' || public.xp_display(v_mult)
  end;

  return json_build_object(
    'multiplier', v_mult,
    'streak', v_streak,
    'streak_multiplier', v_streak_mult,
    'weekend_multiplier', v_weekend_mult,
    'boost_multiplier', v_boost_mult,
    'boost_expires_at', v_boost_expires,
    'event_multiplier', v_event_mult,
    'event_title', v_event_title,
    'label', v_label
  );
end;
$function$;

create or replace function public.xp_display(p_valor numeric)
returns text
language sql
immutable
as $function$
  select rtrim(rtrim(round(p_valor, 2)::text, '0'), '.');
$function$;

revoke all on function public.xp_display(numeric) from public;
revoke all on function public.xp_display(numeric) from anon;
revoke all on function public.xp_display(numeric) from authenticated;
grant execute on function public.xp_display(numeric) to service_role;

grant execute on function public.get_my_xp_multiplier() to authenticated;
