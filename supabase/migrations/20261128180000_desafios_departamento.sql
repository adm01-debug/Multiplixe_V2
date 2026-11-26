-- GAME-008: missoes colaborativas por departamento.
-- A gamificacao era individual: o ranking de departamento existia, mas nada dava ao
-- departamento um objetivo comum. Aqui entram as missoes coletivas: um alvo que soma o
-- esforco de todos os membros (profiles.department) dentro de uma janela, com bonus de XP
-- que cada membro resgata uma unica vez quando a meta e batida.

create table if not exists public.department_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  department text,
  metric text not null default 'xp',
  target_value integer not null check (target_value > 0),
  xp_reward integer not null default 0 check (xp_reward >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint department_challenges_metric_check check (metric in ('xp', 'lessons', 'courses')),
  constraint department_challenges_periodo_check check (ends_at > starts_at)
);

comment on table public.department_challenges is
  'Missao colaborativa de um departamento. department nulo = vale para todos.';
comment on column public.department_challenges.metric is
  'O que a missao soma no periodo: xp (XP ganho), lessons (aulas concluidas) ou courses (cursos concluidos).';

create index if not exists idx_department_challenges_ativos
  on public.department_challenges (is_active, ends_at desc);
create index if not exists idx_department_challenges_departamento
  on public.department_challenges (department);
create index if not exists idx_profiles_department
  on public.profiles (department) where department is not null;

drop trigger if exists update_department_challenges_updated_at on public.department_challenges;
create trigger update_department_challenges_updated_at
before update on public.department_challenges
for each row execute function public.update_updated_at_column();

-- Resgates: sem insert/update/delete para o cliente, so a funcao SECURITY DEFINER escreve.
create table if not exists public.department_challenge_claims (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.department_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  xp_earned integer not null default 0 check (xp_earned >= 0),
  claimed_at timestamptz not null default now(),
  constraint department_challenge_claims_unico unique (challenge_id, user_id)
);

create index if not exists idx_department_challenge_claims_user
  on public.department_challenge_claims (user_id);

alter table public.department_challenges enable row level security;
alter table public.department_challenge_claims enable row level security;

drop policy if exists "Missoes de departamento em andamento" on public.department_challenges;
create policy "Missoes de departamento em andamento"
on public.department_challenges for select
using (
  (is_active and now() between starts_at and ends_at)
  or public.has_role(auth.uid(), 'admin'::public.app_role)
);

drop policy if exists "Admin gerencia missoes de departamento" on public.department_challenges;
create policy "Admin gerencia missoes de departamento"
on public.department_challenges for all
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Aluno le os proprios resgates de missao" on public.department_challenge_claims;
create policy "Aluno le os proprios resgates de missao"
on public.department_challenge_claims for select
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

revoke all on public.department_challenges from anon;
revoke all on public.department_challenge_claims from anon;
grant select, insert, update, delete on public.department_challenges to authenticated;
grant select on public.department_challenge_claims to authenticated;
revoke insert, update, delete on public.department_challenge_claims from authenticated;

-- Progresso coletivo: soma o esforco de todos os membros do departamento na janela.
create or replace function public.department_challenge_progresso(p_challenge_id uuid)
returns table (progresso bigint, participantes bigint, membros bigint)
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_desafio public.department_challenges;
begin
  select * into v_desafio from public.department_challenges where id = p_challenge_id;

  if not found then
    return query select 0::bigint, 0::bigint, 0::bigint;
    return;
  end if;

  return query
  with membros as (
    select p.user_id
      from public.profiles p
     where v_desafio.department is null
        or p.department is not distinct from v_desafio.department
  ),
  contribuicao as (
    select m.user_id,
           case v_desafio.metric
             when 'lessons' then (
               select count(*)
                 from public.user_lesson_progress l
                where l.user_id = m.user_id
                  and l.is_completed
                  and l.completed_at >= v_desafio.starts_at
                  and l.completed_at <= v_desafio.ends_at
             )
             when 'courses' then (
               select count(*)
                 from public.user_course_progress c
                where c.user_id = m.user_id
                  and c.completed_at is not null
                  and c.completed_at >= v_desafio.starts_at
                  and c.completed_at <= v_desafio.ends_at
             )
             else (
               select coalesce(sum(h.xp_amount), 0)
                 from public.user_xp_history h
                where h.user_id = m.user_id
                  and h.created_at >= v_desafio.starts_at
                  and h.created_at <= v_desafio.ends_at
             )
           end::bigint as valor
      from membros m
  )
  select coalesce(sum(c.valor), 0)::bigint,
         count(*) filter (where c.valor > 0)::bigint,
         (select count(*) from membros)::bigint
    from contribuicao c;
end;
$function$;

comment on function public.department_challenge_progresso(uuid) is
  'Progresso coletivo de uma missao de departamento: total somado, membros que contribuiram e membros do departamento.';

-- Missoes que valem para o usuario do momento, ja com progresso e resgate.
create or replace function public.get_my_department_challenges()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_departamento text;
  v_resultado jsonb;
begin
  if v_user is null then
    return '[]'::jsonb;
  end if;

  select p.department into v_departamento
    from public.profiles p
   where p.user_id = v_user;

  select coalesce(jsonb_agg(item order by item ->> 'ends_at'), '[]'::jsonb)
    into v_resultado
    from (
      select jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'department', c.department,
        'metric', c.metric,
        'target_value', c.target_value,
        'xp_reward', c.xp_reward,
        'starts_at', c.starts_at,
        'ends_at', c.ends_at,
        'progresso', p.progresso,
        'participantes', p.participantes,
        'membros', p.membros,
        'concluido', p.progresso >= c.target_value,
        'resgatado', cl.claimed_at is not null,
        'resgatado_em', cl.claimed_at,
        'xp_resgatado', cl.xp_earned
      ) as item
        from public.department_challenges c
        cross join lateral public.department_challenge_progresso(c.id) p
        left join public.department_challenge_claims cl
               on cl.challenge_id = c.id and cl.user_id = v_user
       where c.is_active
         and now() between c.starts_at and c.ends_at
         and (c.department is null or c.department = v_departamento)
    ) t;

  return v_resultado;
end;
$function$;

comment on function public.get_my_department_challenges() is
  'Missoes de departamento em andamento para o usuario logado, com progresso coletivo e resgate.';

-- Resgate do bonus: uma vez por membro, so com a meta batida e dentro do periodo.
create or replace function public.resgatar_desafio_departamento(p_challenge_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_desafio public.department_challenges;
  v_departamento text;
  v_progresso bigint;
  v_xp integer;
begin
  if v_user is null then
    raise exception 'precisa estar autenticado' using errcode = '42501';
  end if;

  select * into v_desafio
    from public.department_challenges
   where id = p_challenge_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'not_found');
  end if;

  select p.department into v_departamento
    from public.profiles p
   where p.user_id = v_user;

  if not v_desafio.is_active
     or now() < v_desafio.starts_at
     or now() > v_desafio.ends_at then
    return jsonb_build_object('success', false, 'error', 'period');
  end if;

  if v_desafio.department is not null
     and v_desafio.department is distinct from v_departamento then
    return jsonb_build_object('success', false, 'error', 'other_department');
  end if;

  if exists (
    select 1 from public.department_challenge_claims
     where challenge_id = p_challenge_id and user_id = v_user
  ) then
    return jsonb_build_object('success', false, 'error', 'already_claimed');
  end if;

  select p.progresso into v_progresso
    from public.department_challenge_progresso(p_challenge_id) p;

  if coalesce(v_progresso, 0) < v_desafio.target_value then
    return jsonb_build_object('success', false, 'error', 'not_completed');
  end if;

  v_xp := coalesce(v_desafio.xp_reward, 0);

  insert into public.department_challenge_claims (challenge_id, user_id, xp_earned)
  values (p_challenge_id, v_user, v_xp)
  on conflict (challenge_id, user_id) do nothing;

  if not found then
    return jsonb_build_object('success', false, 'error', 'already_claimed');
  end if;

  if v_xp > 0 then
    perform public.add_user_xp(v_user, v_xp, 'department');
  end if;

  return jsonb_build_object(
    'success', true,
    'xp_earned', v_xp,
    'challenge_title', v_desafio.title
  );
end;
$function$;

comment on function public.resgatar_desafio_departamento(uuid) is
  'Resgata o bonus de uma missao de departamento concluida (uma vez por membro).';

-- A funcao de progresso e interna: so as duas de baixo chamam.
revoke all on function public.department_challenge_progresso(uuid) from public, anon, authenticated;
grant execute on function public.department_challenge_progresso(uuid) to service_role;

revoke all on function public.get_my_department_challenges() from public, anon;
grant execute on function public.get_my_department_challenges() to authenticated, service_role;

revoke all on function public.resgatar_desafio_departamento(uuid) from public, anon;
grant execute on function public.resgatar_desafio_departamento(uuid) to authenticated, service_role;

-- Duas missoes iniciais para a area nao nascer vazia (idempotente por titulo).
insert into public.department_challenges
  (title, description, department, metric, target_value, xp_reward, starts_at, ends_at, is_active)
select 'Missao coletiva: 500 XP em equipe',
       'Ganhe 500 XP em conjunto, contando todo o time, ate o fim da semana.',
       null, 'xp', 500, 100,
       date_trunc('week', now()), date_trunc('week', now()) + interval '7 days', true
 where not exists (
   select 1 from public.department_challenges where title = 'Missao coletiva: 500 XP em equipe'
 );

insert into public.department_challenges
  (title, description, department, metric, target_value, xp_reward, starts_at, ends_at, is_active)
select 'Missao coletiva: 20 aulas concluidas',
       'O time inteiro soma 20 aulas concluidas na semana para liberar o bonus.',
       null, 'lessons', 20, 75,
       date_trunc('week', now()), date_trunc('week', now()) + interval '7 days', true
 where not exists (
   select 1 from public.department_challenges where title = 'Missao coletiva: 20 aulas concluidas'
 );
-- Painel do admin: todas as missoes (ativas, encerradas e inativas) com o progresso do time.
create or replace function public.get_admin_department_challenges()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_resultado jsonb;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'somente admin' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(item order by item ->> 'ends_at' desc), '[]'::jsonb)
    into v_resultado
    from (
      select jsonb_build_object(
        'id', c.id,
        'title', c.title,
        'description', c.description,
        'department', c.department,
        'metric', c.metric,
        'target_value', c.target_value,
        'xp_reward', c.xp_reward,
        'starts_at', c.starts_at,
        'ends_at', c.ends_at,
        'is_active', c.is_active,
        'progresso', p.progresso,
        'participantes', p.participantes,
        'membros', p.membros,
        'resgates', (select count(*) from public.department_challenge_claims cl where cl.challenge_id = c.id)
      ) as item
        from public.department_challenges c
        cross join lateral public.department_challenge_progresso(c.id) p
    ) t;

  return v_resultado;
end;
$function$;

comment on function public.get_admin_department_challenges() is
  'Lista todas as missoes de departamento com progresso coletivo, para o painel do admin.';

revoke all on function public.get_admin_department_challenges() from public, anon;
grant execute on function public.get_admin_department_challenges() to authenticated, service_role;