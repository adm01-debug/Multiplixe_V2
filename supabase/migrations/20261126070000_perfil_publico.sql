-- GAME-010: perfil publico com badges
-- O perfil era 100% privado (RLS so deixa o dono e admin lerem `profiles`), entao nao existia
-- como compartilhar conquistas. O selo passa a ser uma coluna e os dados publicos saem por
-- uma funcao que respeita o selo e nunca devolve email.

alter table public.profiles
  add column if not exists is_public boolean not null default false;

create or replace function public.get_public_profile(p_user_id uuid)
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_profile record;
  v_xp record;
  v_streak record;
begin
  if p_user_id is null then
    return json_build_object('available', false, 'reason', 'invalid');
  end if;

  select user_id, full_name, department, avatar_url, created_at, is_public
  into v_profile
  from public.profiles
  where user_id = p_user_id and coalesce(is_active, true) = true;

  if not found then
    return json_build_object('available', false, 'reason', 'not_found');
  end if;

  if not coalesce(v_profile.is_public, false) then
    return json_build_object('available', false, 'reason', 'private');
  end if;

  select total_xp, current_level into v_xp from public.user_xp where user_id = p_user_id;
  select current_streak, longest_streak into v_streak from public.user_streaks where user_id = p_user_id;

  return json_build_object(
    'available', true,
    'profile', json_build_object(
      'user_id', v_profile.user_id,
      'full_name', v_profile.full_name,
      'department', v_profile.department,
      'avatar_url', v_profile.avatar_url,
      'member_since', v_profile.created_at
    ),
    'xp', json_build_object(
      'total_xp', coalesce(v_xp.total_xp, 0),
      'current_level', coalesce(v_xp.current_level, 1)
    ),
    'streak', json_build_object(
      'current', coalesce(v_streak.current_streak, 0),
      'longest', coalesce(v_streak.longest_streak, 0)
    ),
    'achievements', coalesce((
      select json_agg(json_build_object(
        'slug', a.slug,
        'name', a.name,
        'description', a.description,
        'icon', a.icon,
        'gradient', a.gradient,
        'xp_reward', a.xp_reward,
        'unlocked_at', ua.unlocked_at
      ) order by ua.unlocked_at desc)
      from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.user_id = p_user_id and coalesce(a.is_secret, false) = false
    ), '[]'::json),
    'completed_courses', coalesce((
      select json_agg(json_build_object(
        'title', c.title,
        'slug', c.slug,
        'completed_at', p.completed_at
      ) order by p.completed_at desc)
      from public.user_course_progress p
      join public.courses c on c.id = p.course_id
      where p.user_id = p_user_id and coalesce(p.progress_percentage, 0) >= 100
    ), '[]'::json),
    'certificates_count', coalesce((select count(*) from public.certificates where user_id = p_user_id), 0)::int
  );
end;
$$;

revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to anon;
grant execute on function public.get_public_profile(uuid) to authenticated;