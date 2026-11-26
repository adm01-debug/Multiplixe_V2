-- GAME-002: desafios semanais + motor de progresso dos desafios
-- Antes desta migration o progresso dos desafios só existia se o cliente gravasse a linha
-- (nenhum componente chamava essa gravação e a tabela não tinha a chave de conflito usada pelo front),
-- então os desafios apareciam sempre com 0/N. Agora o progresso é derivado do histórico real
-- do aluno no banco, por período (dia ou semana).

alter table public.daily_challenges
  add column if not exists challenge_period text not null default 'daily';

alter table public.daily_challenges
  drop constraint if exists daily_challenges_challenge_period_check;

alter table public.daily_challenges
  add constraint daily_challenges_challenge_period_check
  check (challenge_period in ('daily', 'weekly'));

create unique index if not exists user_daily_challenge_progress_unique_idx
  on public.user_daily_challenge_progress (user_id, challenge_id, challenge_date);

create or replace function public.challenge_bucket(p_period text)
returns date
language sql
stable
as $$
  select case
           when coalesce(p_period, 'daily') = 'weekly'
             then date_trunc('week', current_date)::date
             else current_date
         end;
$$;

create or replace function public.refresh_challenge_progress(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_today date := current_date;
  v_week_start date := date_trunc('week', current_date)::date;
begin
  if p_user_id is null then
    return;
  end if;

  with applicable as (
    select c.id as challenge_id,
           c.challenge_type,
           c.target_value,
           public.challenge_bucket(c.challenge_period) as bucket,
           case when c.challenge_period = 'weekly' then v_week_start else v_today end as bucket_start,
           case when c.challenge_period = 'weekly' then v_week_start + 7 else v_today + 1 end as bucket_end
    from public.daily_challenges c
    where c.is_active
      and (
        c.challenge_period = 'weekly'
        or c.day_of_week is null
        or c.day_of_week = extract(dow from v_today)::int
      )
  ),
  measured as (
    select a.challenge_id,
           a.bucket,
           a.target_value,
           least(
             greatest(
               coalesce(
                 case a.challenge_type
                   when 'watch_lessons' then (
                     select count(*) from public.user_lesson_progress p
                     where p.user_id = p_user_id and p.is_completed
                       and p.completed_at >= a.bucket_start and p.completed_at < a.bucket_end
                   )
                   when 'complete_lessons' then (
                     select count(*) from public.user_lesson_progress p
                     where p.user_id = p_user_id and p.is_completed
                       and p.completed_at >= a.bucket_start and p.completed_at < a.bucket_end
                   )
                   when 'study_minutes' then (
                     (select (coalesce(sum(p.watched_seconds), 0) / 60.0)::int
                      from public.user_lesson_progress p
                      where p.user_id = p_user_id and p.is_completed
                        and p.completed_at >= a.bucket_start and p.completed_at < a.bucket_end)
                     + (select coalesce(sum(ps.duration_minutes), 0)::int
                        from public.pomodoro_sessions ps
                        where ps.user_id = p_user_id
                          and ps.completed_at >= a.bucket_start and ps.completed_at < a.bucket_end)
                   )
                   when 'earn_xp' then (
                     select coalesce(sum(h.xp_amount), 0)::int
                     from public.user_xp_history h
                     where h.user_id = p_user_id
                       and h.created_at >= a.bucket_start and h.created_at < a.bucket_end
                   )
                   when 'complete_quiz' then (
                     select count(*) from public.user_quiz_attempts q
                     where q.user_id = p_user_id and q.passed
                       and q.completed_at >= a.bucket_start and q.completed_at < a.bucket_end
                   )
                   when 'quiz_perfect_score' then (
                     select count(*) from public.user_quiz_attempts q
                     where q.user_id = p_user_id and q.score >= 100
                       and q.completed_at >= a.bucket_start and q.completed_at < a.bucket_end
                   )
                   when 'start_course' then (
                     select count(*) from public.user_course_progress cp
                     where cp.user_id = p_user_id
                       and cp.started_at >= a.bucket_start and cp.started_at < a.bucket_end
                   )
                   when 'complete_course' then (
                     select count(*) from public.user_course_progress cp
                     where cp.user_id = p_user_id
                       and cp.completed_at >= a.bucket_start and cp.completed_at < a.bucket_end
                   )
                   when 'complete_pomodoro' then (
                     select count(*) from public.pomodoro_sessions ps
                     where ps.user_id = p_user_id
                       and ps.completed_at >= a.bucket_start and ps.completed_at < a.bucket_end
                   )
                   when 'earn_achievement' then (
                     select count(*) from public.user_achievements ua
                     where ua.user_id = p_user_id
                       and ua.unlocked_at >= a.bucket_start and ua.unlocked_at < a.bucket_end
                   )
                   when 'streak_days' then (
                     select coalesce(max(s.current_streak), 0)::int
                     from public.user_streaks s
                     where s.user_id = p_user_id
                   )
                   else 0
                 end,
                 0
               ),
               0
             ),
             a.target_value
           )::int as progress
    from applicable a
  )
  insert into public.user_daily_challenge_progress as prog (
    user_id, challenge_id, challenge_date, current_progress, is_completed, completed_at, updated_at
  )
  select p_user_id,
         m.challenge_id,
         m.bucket,
         m.progress,
         m.progress >= m.target_value,
         case when m.progress >= m.target_value then now() else null end,
         now()
  from measured m
  on conflict (user_id, challenge_id, challenge_date) do update
    set current_progress = excluded.current_progress,
        is_completed = excluded.is_completed,
        completed_at = coalesce(prog.completed_at, excluded.completed_at),
        updated_at = now();
end;
$$;

create or replace function public.get_my_challenges()
returns table(
  progress_id uuid,
  challenge_id uuid,
  title text,
  description text,
  challenge_type text,
  target_value integer,
  xp_reward integer,
  challenge_period text,
  challenge_date date,
  current_progress integer,
  is_completed boolean,
  xp_claimed boolean,
  ends_at timestamp with time zone
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return;
  end if;

  perform public.refresh_challenge_progress(v_uid);

  return query
  select p.id,
         c.id,
         c.title,
         c.description,
         c.challenge_type,
         c.target_value,
         c.xp_reward,
         c.challenge_period,
         p.challenge_date,
         p.current_progress,
         p.is_completed,
         p.xp_claimed,
         (
           public.challenge_bucket(c.challenge_period)
           + case when c.challenge_period = 'weekly' then 7 else 1 end
         )::timestamptz
  from public.daily_challenges c
  join public.user_daily_challenge_progress p
    on p.challenge_id = c.id
   and p.user_id = v_uid
   and p.challenge_date = public.challenge_bucket(c.challenge_period)
  where c.is_active
  order by c.challenge_period, c.day_of_week nulls first, c.xp_reward;
end;
$$;

create or replace function public.trg_refresh_challenge_progress()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  perform public.refresh_challenge_progress(coalesce(new.user_id, old.user_id));
  return null;
end;
$$;

drop trigger if exists refresh_challenges_after_lesson_progress on public.user_lesson_progress;
create trigger refresh_challenges_after_lesson_progress
  after insert or update of is_completed on public.user_lesson_progress
  for each row execute function public.trg_refresh_challenge_progress();

drop trigger if exists refresh_challenges_after_quiz_attempt on public.user_quiz_attempts;
create trigger refresh_challenges_after_quiz_attempt
  after insert or update of passed on public.user_quiz_attempts
  for each row execute function public.trg_refresh_challenge_progress();

drop trigger if exists refresh_challenges_after_pomodoro on public.pomodoro_sessions;
create trigger refresh_challenges_after_pomodoro
  after insert on public.pomodoro_sessions
  for each row execute function public.trg_refresh_challenge_progress();

revoke all on function public.refresh_challenge_progress(uuid) from public;
revoke all on function public.refresh_challenge_progress(uuid) from anon;
revoke all on function public.refresh_challenge_progress(uuid) from authenticated;
revoke all on function public.get_my_challenges() from public;
revoke all on function public.get_my_challenges() from anon;
grant execute on function public.get_my_challenges() to authenticated;

-- 4 desafios semanais (recompensas maiores, reset na segunda-feira)
insert into public.daily_challenges (title, description, challenge_type, target_value, xp_reward, is_active, day_of_week, challenge_period)
select 'Semana de Foco', 'Conclua 10 aulas até domingo', 'complete_lessons', 10, 200, true, null, 'weekly'
where not exists (select 1 from public.daily_challenges where title = 'Semana de Foco');

insert into public.daily_challenges (title, description, challenge_type, target_value, xp_reward, is_active, day_of_week, challenge_period)
select 'Caçador de Cursos', 'Conclua 1 curso nesta semana', 'complete_course', 1, 300, true, null, 'weekly'
where not exists (select 1 from public.daily_challenges where title = 'Caçador de Cursos');

insert into public.daily_challenges (title, description, challenge_type, target_value, xp_reward, is_active, day_of_week, challenge_period)
select 'Chama Acesa', 'Mantenha uma sequência de 5 dias', 'streak_days', 5, 250, true, null, 'weekly'
where not exists (select 1 from public.daily_challenges where title = 'Chama Acesa');

insert into public.daily_challenges (title, description, challenge_type, target_value, xp_reward, is_active, day_of_week, challenge_period)
select 'Quiz Master da Semana', 'Passe em 3 quizzes até domingo', 'complete_quiz', 3, 200, true, null, 'weekly'
where not exists (select 1 from public.daily_challenges where title = 'Quiz Master da Semana');