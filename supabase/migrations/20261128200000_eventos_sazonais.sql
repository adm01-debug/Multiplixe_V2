-- GAME-009: eventos sazonais (janela tematica com bonus de XP)
-- Antes desta migration o multiplicador vinha so de sequencia, fim de semana e impulsionador:
-- nao havia como promover um periodo tematico (semana do produto, black friday, volta as aulas).

create table if not exists public.seasonal_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  emoji text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  xp_multiplier numeric(4,2) not null default 1.5,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasonal_events_periodo_check check (ends_at > starts_at),
  constraint seasonal_events_multiplier_check check (xp_multiplier >= 1 and xp_multiplier <= 4),
  constraint seasonal_events_title_check check (length(btrim(title)) between 3 and 120),
  constraint seasonal_events_slug_check check (length(btrim(slug)) between 3 and 60)
);

comment on table public.seasonal_events is 'Periodos tematicos com bonus de XP (GAME-009)';

create index if not exists idx_seasonal_events_janela
  on public.seasonal_events (is_active, ends_at desc);

alter table public.seasonal_events enable row level security;

drop policy if exists "Eventos sazonais visiveis" on public.seasonal_events;
create policy "Eventos sazonais visiveis"
  on public.seasonal_events
  for select
  to authenticated
  using (is_active or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admin gerencia eventos sazonais" on public.seasonal_events;
create policy "Admin gerencia eventos sazonais"
  on public.seasonal_events
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

revoke all on public.seasonal_events from anon;
grant select, insert, update, delete on public.seasonal_events to authenticated;
grant all on public.seasonal_events to service_role;

create or replace function public.set_seasonal_events_updated_at()
returns trigger
language plpgsql
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists trg_seasonal_events_updated_at on public.seasonal_events;
create trigger trg_seasonal_events_updated_at
  before update on public.seasonal_events
  for each row
  execute function public.set_seasonal_events_updated_at();

-- Multiplicador vigente no instante atual (1 quando nao ha evento aberto).
create or replace function public.active_seasonal_multiplier()
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(max(xp_multiplier), 1)::numeric
    from public.seasonal_events
   where is_active
     and starts_at <= now()
     and ends_at > now();
$function$;

-- Multiplicador final passa a considerar o evento sazonal (teto continua 8x).
create or replace function public.get_xp_multiplier(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select least(
    public.xp_multiplier_for(
      (select coalesce(max(current_streak), 0) from public.user_streaks where user_id = p_user_id),
      extract(dow from current_date)::int
    ) * public.active_xp_boost_multiplier(p_user_id) * public.active_seasonal_multiplier(),
    8.0
  )::numeric;
$function$;

-- Painel do aluno: evento aberto (cartaz) ou null.
create or replace function public.get_active_seasonal_event()
returns json
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_evento record;
begin
  select id, slug, title, description, emoji, starts_at, ends_at, xp_multiplier
    into v_evento
    from public.seasonal_events
   where is_active
     and starts_at <= now()
     and ends_at > now()
   order by xp_multiplier desc, ends_at asc
   limit 1;

  if not found then
    return null;
  end if;

  return json_build_object(
    'id', v_evento.id,
    'slug', v_evento.slug,
    'title', v_evento.title,
    'description', v_evento.description,
    'emoji', v_evento.emoji,
    'xp_multiplier', v_evento.xp_multiplier,
    'starts_at', v_evento.starts_at,
    'ends_at', v_evento.ends_at,
    'days_left', greatest(0, ceil(extract(epoch from (v_evento.ends_at - now())) / 86400)::int)
  );
end;
$function$;

-- get_my_xp_multiplier passa a expor o evento no cartaz e no rotulo.
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

  v_label := case
    when v_weekend_mult > 1 and v_streak_mult > 1 then 'Fim de semana em dobro + sequencia de ' || v_streak || ' dias: XP x' || v_mult
    when v_weekend_mult > 1 then 'Fim de semana: XP em dobro'
    when v_streak_mult > 1 then 'Sequencia de ' || v_streak || ' dias: XP x' || v_streak_mult
    else ''
  end;

  if v_boost_mult > 1 then
    v_label := trim(both ' ' from trim(both ':' from v_label) || ' + Impulsionador XP x' || v_boost_mult);
    if v_label like '+ Impulsionador%' then
      v_label := 'Impulsionador ativo: XP x' || v_mult;
    else
      v_label := v_label || ': XP x' || v_mult;
    end if;
  end if;

  if v_event_mult > 1 then
    v_label := trim(both ' ' from trim(both ':' from v_label) || ' + ' || coalesce(v_event_title, 'Evento') || ' XP x' || v_event_mult);
    if v_label like '+ %' then
      v_label := coalesce(v_event_title, 'Evento sazonal') || ': XP x' || v_mult;
    else
      v_label := v_label || ': XP x' || v_mult;
    end if;
  end if;

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

revoke all on function public.active_seasonal_multiplier() from public;
revoke all on function public.active_seasonal_multiplier() from anon;
revoke all on function public.active_seasonal_multiplier() from authenticated;
grant execute on function public.active_seasonal_multiplier() to service_role;

revoke all on function public.get_xp_multiplier(uuid) from public;
revoke all on function public.get_xp_multiplier(uuid) from anon;
revoke all on function public.get_xp_multiplier(uuid) from authenticated;
grant execute on function public.get_xp_multiplier(uuid) to service_role;

revoke all on function public.get_active_seasonal_event() from public;
revoke all on function public.get_active_seasonal_event() from anon;
grant execute on function public.get_active_seasonal_event() to authenticated;
grant execute on function public.get_active_seasonal_event() to service_role;

revoke all on function public.get_my_xp_multiplier() from public;
revoke all on function public.get_my_xp_multiplier() from anon;
grant execute on function public.get_my_xp_multiplier() to authenticated;
grant execute on function public.get_my_xp_multiplier() to service_role;

revoke all on function public.set_seasonal_events_updated_at() from public;
revoke all on function public.set_seasonal_events_updated_at() from anon;
revoke all on function public.set_seasonal_events_updated_at() from authenticated;