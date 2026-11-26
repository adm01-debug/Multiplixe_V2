-- GAME-003: ligas semanais (bronze -> prata -> ouro -> platina -> diamante)
-- Tabela: user_leagues (liga atual de cada aluno + semana de referencia).
-- Duas RPCs: refresh_leagues() aplica promocao/rebaixamento da semana fechada;
-- get_my_league() devolve a liga do aluno, a posicao e o ranking da liga.

create table if not exists public.user_leagues (
  user_id uuid primary key references auth.users(id) on delete cascade,
  league text not null default 'bronze' check (league in ('bronze', 'prata', 'ouro', 'platina', 'diamante')),
  week_start date not null default (date_trunc('week', now())::date),
  last_change text check (last_change in ('promovido', 'rebaixado', 'mantido')),
  last_change_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_leagues_league on public.user_leagues(league, week_start);

alter table public.user_leagues enable row level security;

drop policy if exists "Users can view own league" on public.user_leagues;
create policy "Users can view own league" on public.user_leagues
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Admins can manage leagues" on public.user_leagues;
create policy "Admins can manage leagues" on public.user_leagues
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop trigger if exists update_user_leagues_updated_at on public.user_leagues;
create trigger update_user_leagues_updated_at
  before update on public.user_leagues
  for each row execute function public.update_updated_at_column();

-- Aplica o resultado da semana fechada: top p_zone sobe de liga, ultimos p_zone descem.
-- Idempotente: roda uma vez por semana por aluno (week_start controla o que ja foi processado).
-- p_zone/p_min_jogadores tem default de producao (10 / 20) e existem para permitir teste e ajuste.
create or replace function public.refresh_leagues(p_zone integer default 10, p_min_jogadores integer default 20)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tiers constant text[] := array['bronze', 'prata', 'ouro', 'platina', 'diamante'];
  v_week date := date_trunc('week', now())::date;
  v_novos integer := 0;
  v_processados integer := 0;
  v_promovidos integer := 0;
  v_rebaixados integer := 0;
begin
  if p_zone is null or p_zone < 1 or p_min_jogadores is null or p_min_jogadores < 1 then
    raise exception 'parametros invalidos para refresh_leagues' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(918273645);

  insert into public.user_leagues (user_id)
  select ux.user_id from public.user_xp ux where ux.total_xp > 0
  on conflict (user_id) do nothing;
  get diagnostics v_novos = row_count;

  with stale as (
    select user_id, league, week_start from public.user_leagues where week_start < v_week
  ), prev as (
    select s.user_id, s.league, coalesce(sum(h.xp_amount), 0)::integer as prev_xp
    from stale s
    left join public.user_xp_history h
      on h.user_id = s.user_id
     and h.created_at >= s.week_start
     and h.created_at < (s.week_start + 7)
    group by s.user_id, s.league
  ), ranked as (
    select user_id, league, prev_xp,
      row_number() over (partition by league order by prev_xp desc, user_id) as pos,
      count(*) over (partition by league) as total
    from prev
  ), decided as (
    select user_id, league,
      case
        when total >= p_min_jogadores and pos <= p_zone then 'promovido'
        when total >= p_min_jogadores and pos > total - p_zone then 'rebaixado'
        else 'mantido'
      end as mudanca
    from ranked
  ), upd as (
    update public.user_leagues ul
       set league = case d.mudanca
                      when 'promovido' then coalesce(v_tiers[array_position(v_tiers, d.league) + 1], d.league)
                      when 'rebaixado' then coalesce(v_tiers[array_position(v_tiers, d.league) - 1], d.league)
                      else d.league
                    end,
           week_start = v_week,
           last_change = d.mudanca,
           last_change_at = now(),
           updated_at = now()
      from decided d
     where d.user_id = ul.user_id
    returning d.mudanca as mudanca
  )
  select count(*),
         count(*) filter (where mudanca = 'promovido'),
         count(*) filter (where mudanca = 'rebaixado')
    into v_processados, v_promovidos, v_rebaixados
    from upd;

  return jsonb_build_object(
    'semana', v_week,
    'novos_participantes', v_novos,
    'processados', v_processados,
    'promovidos', v_promovidos,
    'rebaixados', v_rebaixados,
    'por_liga', coalesce((
      select jsonb_object_agg(league, n)
      from (select league, count(*) as n from public.user_leagues group by league) x
    ), '{}'::jsonb)
  );
end;
$function$;

-- Liga do aluno logado, posicao e ranking da liga na semana corrente.
create or replace function public.get_my_league()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tiers constant text[] := array['bronze', 'prata', 'ouro', 'platina', 'diamante'];
  v_uid uuid := auth.uid();
  v_week date := date_trunc('week', now())::date;
  v_liga text;
begin
  if v_uid is null then
    raise exception 'sessao obrigatoria' using errcode = '42501';
  end if;

  insert into public.user_leagues (user_id) values (v_uid) on conflict (user_id) do nothing;
  select league into v_liga from public.user_leagues where user_id = v_uid;

  return (
    with wk as (
      select ul.user_id,
             coalesce(sum(h.xp_amount) filter (
               where h.created_at >= v_week and h.created_at < (v_week + 7)
             ), 0)::integer as xp
      from public.user_leagues ul
      left join public.user_xp_history h on h.user_id = ul.user_id
      where ul.league = v_liga
      group by ul.user_id
    ), ranked as (
      select user_id, xp,
        row_number() over (order by xp desc, user_id) as pos,
        count(*) over () as total
      from wk
    )
    select jsonb_build_object(
      'liga', v_liga,
      'nivel', array_position(v_tiers, v_liga),
      'proxima_liga', v_tiers[array_position(v_tiers, v_liga) + 1],
      'xp_semana', coalesce((select xp from ranked where user_id = v_uid), 0),
      'posicao', coalesce((select pos from ranked where user_id = v_uid), 1),
      'total_jogadores', coalesce((select total from ranked where user_id = v_uid), 1),
      'zona_promocao', 10,
      'zona_rebaixamento', 10,
      'minimo_jogadores', 20,
      'semana_inicio', v_week,
      'semana_fim', v_week + 6,
      'atualiza_em', v_week + 7,
      'ranking', coalesce((
        select jsonb_agg(jsonb_build_object(
          'posicao', r.pos,
          'user_id', r.user_id,
          'nome', coalesce(p.full_name, 'Anônimo'),
          'avatar_url', p.avatar_url,
          'xp_semana', r.xp,
          'eu', r.user_id = v_uid
        ) order by r.pos)
        from (select * from ranked order by pos limit 30) r
        left join public.profiles p on p.user_id = r.user_id
      ), '[]'::jsonb),
      'ultima_mudanca', (
        select jsonb_build_object('tipo', last_change, 'em', last_change_at)
        from public.user_leagues
        where user_id = v_uid and last_change is not null
      )
    )
  );
end;
$function$;

revoke all on function public.refresh_leagues(integer, integer) from public;
revoke all on function public.refresh_leagues(integer, integer) from anon;
grant execute on function public.refresh_leagues(integer, integer) to authenticated;

revoke all on function public.get_my_league() from public;
revoke all on function public.get_my_league() from anon;
grant execute on function public.get_my_league() to authenticated;