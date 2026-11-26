-- FUNC-014: comparativo de desempenho do aluno contra a média dos alunos com atividade.
-- Só agregados saem da função (nunca dado individual) e contas administrativas
-- ficam fora do cálculo para nao distorcer a média.

create or replace function public.get_performance_comparison()
returns table (
  xp_total integer,
  xp_average integer,
  lessons_completed integer,
  lessons_average integer,
  courses_completed integer,
  courses_average integer,
  hours_studied numeric,
  hours_average numeric,
  streak_current integer,
  streak_average numeric,
  student_count integer
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as uid
  ),
  cohort as (
    select distinct t.id
    from (
      select user_id as id from public.user_xp
      union all select user_id from public.user_streaks
      union all select user_id from public.user_course_progress
      union all select user_id from public.user_lesson_progress
    ) t
    where t.id is not null
      and not exists (
        select 1
        from public.user_roles ur
        where ur.user_id = t.id
          and ur.role::text in ('admin', 'super_admin')
      )
  ),
  metrics as (
    select
      c.id,
      coalesce(x.total_xp, 0)::numeric as xp,
      coalesce(s.current_streak, 0)::numeric as streak,
      (select count(*) from public.user_lesson_progress lp
        where lp.user_id = c.id and lp.is_completed)::numeric as lessons,
      (select count(*) from public.user_course_progress cp
        where cp.user_id = c.id and cp.completed_at is not null)::numeric as courses,
      coalesce((select sum(lp.watched_seconds) from public.user_lesson_progress lp
        where lp.user_id = c.id), 0)::numeric / 3600.0 as hours
    from cohort c
    left join public.user_xp x on x.user_id = c.id
    left join public.user_streaks s on s.user_id = c.id
  ),
  totals as (
    select
      coalesce(round(avg(xp)), 0) as xp_avg,
      coalesce(round(avg(lessons)), 0) as lessons_avg,
      coalesce(round(avg(courses)), 0) as courses_avg,
      round(coalesce(avg(hours), 0), 1) as hours_avg,
      round(coalesce(avg(streak), 0), 1) as streak_avg,
      count(*)::int as total
    from metrics
  )
  select
    coalesce((select round(x.total_xp) from public.user_xp x where x.user_id = (select uid from me)), 0)::int,
    (select xp_avg from totals)::int,
    (select count(*) from public.user_lesson_progress lp
      where lp.user_id = (select uid from me) and lp.is_completed)::int,
    (select lessons_avg from totals)::int,
    (select count(*) from public.user_course_progress cp
      where cp.user_id = (select uid from me) and cp.completed_at is not null)::int,
    (select courses_avg from totals)::int,
    round(coalesce((select sum(lp.watched_seconds) from public.user_lesson_progress lp
      where lp.user_id = (select uid from me)), 0)::numeric / 3600.0, 1),
    (select hours_avg from totals),
    coalesce((select s.current_streak from public.user_streaks s
      where s.user_id = (select uid from me)), 0)::int,
    (select streak_avg from totals),
    greatest((select total from totals), 1);
$$;

comment on function public.get_performance_comparison() is
  'Comparativo do aluno logado com a media dos alunos com atividade, sem contas administrativas (FUNC-014). Retorna apenas agregados.';

revoke all on function public.get_performance_comparison() from public;
grant execute on function public.get_performance_comparison() to authenticated;