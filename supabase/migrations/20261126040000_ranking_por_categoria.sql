-- GAME-011: ranking por categoria de curso
-- Métrica: cursos concluídos na categoria, desempate por aulas concluídas.
-- Admins ficam fora do ranking (não competem com alunos).

create or replace function public.get_category_leaderboard(
  p_category_id uuid default null,
  p_limit integer default 10
)
returns table(
  category_id uuid,
  category_name text,
  category_slug text,
  category_color text,
  user_id uuid,
  display_name text,
  avatar_url text,
  completed_courses bigint,
  completed_lessons bigint,
  rank bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  with course_agg as (
    select c.category_id, ucp.user_id, count(*)::bigint as completed_courses
    from public.user_course_progress ucp
    join public.courses c on c.id = ucp.course_id
    where ucp.completed_at is not null and c.category_id is not null
    group by 1, 2
  ),
  lesson_agg as (
    select c.category_id, ulp.user_id, count(*)::bigint as completed_lessons
    from public.user_lesson_progress ulp
    join public.courses c on c.id = ulp.course_id
    where ulp.is_completed and c.category_id is not null
    group by 1, 2
  ),
  activity as (
    select coalesce(ca.category_id, la.category_id) as category_id,
           coalesce(ca.user_id, la.user_id) as user_id,
           coalesce(ca.completed_courses, 0) as completed_courses,
           coalesce(la.completed_lessons, 0) as completed_lessons
    from course_agg ca
    full outer join lesson_agg la
      on la.category_id = ca.category_id and la.user_id = ca.user_id
  ),
  eligible as (
    -- admins não competem: precisam sair antes do rankeamento para não abrir buraco no ranking
    select a.*
    from activity a
    where not exists (
      select 1 from public.user_roles ur
      where ur.user_id = a.user_id and ur.role = 'admin'
    )
  ),
  ranked as (
    select a.*,
           row_number() over (
             partition by a.category_id
             order by a.completed_courses desc, a.completed_lessons desc, a.user_id
           ) as rnk
    from eligible a
  )
  select r.category_id,
         cat.name as category_name,
         cat.slug as category_slug,
         cat.color as category_color,
         r.user_id,
         coalesce(nullif(btrim(p.full_name), ''), 'Anônimo') as display_name,
         p.avatar_url,
         r.completed_courses,
         r.completed_lessons,
         r.rnk::bigint as rank
  from ranked r
  join public.categories cat on cat.id = r.category_id
  left join public.profiles p on p.user_id = r.user_id
  where (p_category_id is null or r.category_id = p_category_id)
    and r.rnk <= greatest(coalesce(p_limit, 10), 1)
  order by cat.name, r.rnk;
$$;

revoke all on function public.get_category_leaderboard(uuid, integer) from public;
revoke all on function public.get_category_leaderboard(uuid, integer) from anon;
grant execute on function public.get_category_leaderboard(uuid, integer) to authenticated;