-- GAME-007: power-ups de estudo com efeito real.
-- Antes desta migration os itens de categoria power_up eram apenas enfeite: comprar
-- "Impulsionador de XP 2x" nao acelerava nenhum ganho e "Blindagem de Sequencia" nao
-- protegia sequencia nenhuma. Agora a compra vira uma unidade em user_powerups, o
-- impulsionador acelera o XP por tempo limitado e a blindagem e consumida
-- automaticamente no primeiro dia perdido.

-- 1) O efeito de cada item fica configurado no proprio catalogo.
alter table public.store_items
  add column if not exists powerup_kind text,
  add column if not exists powerup_multiplier numeric(4,2),
  add column if not exists powerup_duration_minutes integer;

alter table public.store_items drop constraint if exists store_items_powerup_kind_check;
alter table public.store_items add constraint store_items_powerup_kind_check
  check (powerup_kind is null or powerup_kind in ('xp_boost', 'streak_freeze'));

update public.store_items
   set powerup_kind = 'xp_boost', powerup_multiplier = 2, powerup_duration_minutes = 60
 where slug = 'xp-boost-2x' and powerup_kind is null;

update public.store_items
   set powerup_kind = 'streak_freeze', powerup_duration_minutes = 1440
 where slug = 'streak-freeze' and powerup_kind is null;

-- 2) Inventario de power-ups. Sem insert/update/delete para o cliente: so as funcoes
--    SECURITY DEFINER abaixo escrevem aqui.
create table if not exists public.user_powerups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('xp_boost', 'streak_freeze')),
  item_id uuid references public.store_items(id) on delete set null,
  purchase_id uuid references public.user_purchases(id) on delete set null,
  multiplier numeric(4,2),
  duration_minutes integer not null default 0,
  activated_at timestamptz,
  expires_at timestamptz,
  consumed_at timestamptz,
  source text not null default 'purchase',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_powerups_disponiveis
  on public.user_powerups (user_id, kind) where consumed_at is null;
create index if not exists idx_user_powerups_ativos
  on public.user_powerups (user_id, expires_at) where expires_at is not null;

drop trigger if exists update_user_powerups_updated_at on public.user_powerups;
create trigger update_user_powerups_updated_at
before update on public.user_powerups
for each row execute function public.update_updated_at_column();

alter table public.user_powerups enable row level security;

drop policy if exists "Aluno le os proprios power-ups" on public.user_powerups;
create policy "Aluno le os proprios power-ups"
on public.user_powerups for select
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'::public.app_role));

revoke all on public.user_powerups from anon;
revoke insert, update, delete on public.user_powerups from authenticated;
grant select on public.user_powerups to authenticated;

-- 3) Concessao da unidade (uso interno: compra e conquista).
create or replace function public.grant_powerup(
  p_user_id uuid,
  p_kind text,
  p_item_id uuid default null,
  p_purchase_id uuid default null,
  p_multiplier numeric default null,
  p_duration_minutes integer default 0,
  p_source text default 'purchase'
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  if p_user_id is null or p_kind not in ('xp_boost', 'streak_freeze') then
    raise exception 'power-up invalido' using errcode = '22023';
  end if;

  insert into public.user_powerups
    (user_id, kind, item_id, purchase_id, multiplier, duration_minutes, source)
  values
    (p_user_id, p_kind, p_item_id, p_purchase_id, p_multiplier, coalesce(p_duration_minutes, 0), coalesce(p_source, 'purchase'))
  returning id into v_id;

  return v_id;
end;
$function$;

-- 4) Leitura da carteira de power-ups do aluno.
create or replace function public.get_my_powerups()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_disponiveis jsonb := '[]'::jsonb;
  v_boost jsonb := null;
begin
  if v_uid is null then
    return jsonb_build_object('disponiveis', '[]'::jsonb, 'boost', null);
  end if;

  with disp as (
    select p.kind,
           count(*) as quantidade,
           max(coalesce(si.name, case p.kind when 'xp_boost' then 'Impulsionador de XP 2x' else 'Blindagem de Sequencia' end)) as nome,
           max(si.icon) as icone,
           max(coalesce(p.multiplier, si.powerup_multiplier)) as multiplier,
           max(coalesce(nullif(p.duration_minutes, 0), si.powerup_duration_minutes, 0)) as duration_minutes,
           min(p.created_at) as desde
      from public.user_powerups p
      left join public.store_items si on si.id = p.item_id
     where p.user_id = v_uid and p.consumed_at is null
     group by p.kind
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'kind', d.kind,
           'quantidade', d.quantidade,
           'nome', d.nome,
           'icone', d.icone,
           'multiplier', d.multiplier,
           'duration_minutes', d.duration_minutes,
           'desde', d.desde) order by d.kind), '[]'::jsonb)
    into v_disponiveis
    from disp d;

  select jsonb_build_object(
           'multiplier', p.multiplier,
           'expires_at', p.expires_at,
           'restante_segundos', greatest(0, floor(extract(epoch from (p.expires_at - now()))))::int)
    into v_boost
    from public.user_powerups p
   where p.user_id = v_uid and p.kind = 'xp_boost' and p.expires_at > now()
   order by p.expires_at desc
   limit 1;

  return jsonb_build_object('disponiveis', v_disponiveis, 'boost', v_boost);
end;
$function$;

-- 5) Ativacao. A blindagem nao se ativa: ela e consumida sozinha quando o dia e perdido.
create or replace function public.activate_powerup(p_kind text default 'xp_boost')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_row public.user_powerups;
  v_mult text;
begin
  if v_uid is null then
    raise exception 'sessao obrigatoria' using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('xp_boost', 'streak_freeze') then
    return jsonb_build_object('ok', false, 'mensagem', 'Power-up desconhecido');
  end if;

  perform pg_advisory_xact_lock(hashtext('powerup:' || v_uid::text));

  if p_kind = 'streak_freeze' then
    return jsonb_build_object(
      'ok', false,
      'kind', p_kind,
      'mensagem', 'A blindagem de sequencia nao precisa ser ativada: ela e usada automaticamente no primeiro dia perdido.');
  end if;

  if exists (
    select 1 from public.user_powerups
     where user_id = v_uid and kind = 'xp_boost' and expires_at > now()
  ) then
    return jsonb_build_object('ok', false, 'kind', p_kind, 'mensagem', 'Voce ja tem um impulsionador de XP ativo.');
  end if;

  select * into v_row
    from public.user_powerups
   where user_id = v_uid and kind = p_kind and consumed_at is null
   order by created_at
   limit 1
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'kind', p_kind, 'mensagem', 'Voce nao tem impulsionador de XP disponivel.');
  end if;

  update public.user_powerups
     set activated_at = now(),
         consumed_at = now(),
         expires_at = now() + make_interval(mins => greatest(coalesce(v_row.duration_minutes, 60), 1))
   where id = v_row.id
   returning * into v_row;

  v_mult := trim(trailing '.' from trim(trailing '0' from to_char(v_row.multiplier, 'FM990.99')));

  return jsonb_build_object(
    'ok', true,
    'kind', v_row.kind,
    'multiplier', v_row.multiplier,
    'expires_at', v_row.expires_at,
    'mensagem', 'Impulsionador ativo: XP x' || v_mult || ' ate ' || to_char(v_row.expires_at, 'DD/MM HH24:MI') || '.'
  );
end;
$function$;

-- 6) Multiplicador vigente passa a somar o impulsionador ativo (teto 8x).
create or replace function public.active_xp_boost_multiplier(p_user_id uuid)
returns numeric
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(max(multiplier), 1)::numeric
    from public.user_powerups
   where user_id = p_user_id and kind = 'xp_boost' and expires_at > now();
$function$;

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
    ) * public.active_xp_boost_multiplier(p_user_id),
    8.0
  )::numeric;
$function$;

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
  v_mult numeric;
  v_label text;
begin
  if v_uid is null then
    return json_build_object('multiplier', 1, 'streak_multiplier', 1, 'weekend_multiplier', 1, 'streak', 0, 'boost_multiplier', 1, 'boost_expires_at', null, 'label', '');
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

  v_streak_mult := case when v_streak >= 30 then 2.0 when v_streak >= 7 then 1.5 else 1.0 end;
  v_weekend_mult := case when v_dow in (0, 5, 6) then 2.0 else 1.0 end;
  v_mult := least(public.xp_multiplier_for(v_streak, v_dow) * v_boost_mult, 8.0);

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

  return json_build_object(
    'multiplier', v_mult,
    'streak', v_streak,
    'streak_multiplier', v_streak_mult,
    'weekend_multiplier', v_weekend_mult,
    'boost_multiplier', v_boost_mult,
    'boost_expires_at', v_boost_expires,
    'label', v_label
  );
end;
$function$;

-- 7) Blindagem de sequencia: consulta e consumo (uso interno).
create or replace function public.has_streak_freeze(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1 from public.user_powerups
     where user_id = p_user_id and kind = 'streak_freeze' and consumed_at is null
  );
$function$;

create or replace function public.consume_streak_freeze(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
begin
  update public.user_powerups
     set consumed_at = now(),
         activated_at = coalesce(activated_at, now())
   where id = (
     select id from public.user_powerups
      where user_id = p_user_id and kind = 'streak_freeze' and consumed_at is null
      order by created_at
      limit 1
   )
   returning id into v_id;

  return v_id;
end;
$function$;

-- 8) update_user_streak: o dia perdido e coberto pela blindagem (1 dia exato).
drop function if exists public.update_user_streak(uuid);

create or replace function public.update_user_streak(p_user_id uuid)
returns table(
  streak_updated boolean,
  new_streak integer,
  xp_awarded integer,
  is_new_record boolean,
  freeze_used boolean
)
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_user_streak public.user_streaks;
  v_today DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  v_streak_updated BOOLEAN := FALSE;
  v_new_streak INTEGER := 0;
  v_xp_awarded INTEGER := 0;
  v_is_new_record BOOLEAN := FALSE;
  v_freeze_used BOOLEAN := FALSE;
BEGIN
  -- GAME-007: a blindagem so pode ser usada a favor de quem esta chamando a funcao.
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Nao autorizado a atualizar a sequencia de outro usuario' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_user_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  IF v_user_streak IS NULL THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_started_at, total_streak_days)
    VALUES (p_user_id, 1, 1, v_today, now(), 1)
    RETURNING * INTO v_user_streak;

    v_streak_updated := TRUE;
    v_new_streak := 1;
    v_xp_awarded := 10;
    v_is_new_record := TRUE;
  ELSIF v_user_streak.last_activity_date = v_today THEN
    v_streak_updated := FALSE;
    v_new_streak := v_user_streak.current_streak;
  ELSIF v_user_streak.last_activity_date = v_yesterday THEN
    v_new_streak := v_user_streak.current_streak + 1;
    v_is_new_record := v_new_streak > v_user_streak.longest_streak;

    UPDATE public.user_streaks
    SET
      current_streak = v_new_streak,
      longest_streak = GREATEST(longest_streak, v_new_streak),
      last_activity_date = v_today,
      total_streak_days = total_streak_days + 1,
      updated_at = now()
    WHERE user_id = p_user_id;

    v_streak_updated := TRUE;
    v_xp_awarded := LEAST(10 + (v_new_streak * 5), 60);
  ELSE
    -- GAME-007: um unico dia perdido (last_activity_date = hoje - 2) e coberto pela blindagem.
    IF v_user_streak.last_activity_date = v_today - 2 AND public.has_streak_freeze(p_user_id) THEN
      PERFORM public.consume_streak_freeze(p_user_id);

      v_freeze_used := TRUE;
      v_new_streak := v_user_streak.current_streak + 1;
      v_is_new_record := v_new_streak > v_user_streak.longest_streak;

      UPDATE public.user_streaks
      SET
        current_streak = v_new_streak,
        longest_streak = GREATEST(longest_streak, v_new_streak),
        last_activity_date = v_today,
        total_streak_days = total_streak_days + 1,
        updated_at = now()
      WHERE user_id = p_user_id;

      v_streak_updated := TRUE;
      v_xp_awarded := LEAST(10 + (v_new_streak * 5), 60);
    ELSE
      v_new_streak := 1;

      UPDATE public.user_streaks
      SET
        current_streak = 1,
        last_activity_date = v_today,
        streak_started_at = now(),
        total_streak_days = total_streak_days + 1,
        updated_at = now()
      WHERE user_id = p_user_id;

      v_streak_updated := TRUE;
      v_xp_awarded := 10;
    END IF;
  END IF;

  IF v_streak_updated AND v_xp_awarded > 0 THEN
    PERFORM public.add_user_xp(p_user_id, v_xp_awarded, 'streak');
  END IF;

  RETURN QUERY SELECT v_streak_updated, v_new_streak, v_xp_awarded, v_is_new_record, v_freeze_used;
END;
$function$;

-- 9) Conquista de sequencia passa a dar blindagem (streak_7 -> 1, streak_30 -> 2).
create or replace function public.award_powerup_on_achievement()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_slug text;
  v_qtd integer;
  i integer;
begin
  select slug into v_slug from public.achievements where id = new.achievement_id;

  v_qtd := case v_slug
    when 'streak_7' then 1
    when 'streak_30' then 2
    else 0
  end;

  if v_qtd > 0 then
    for i in 1..v_qtd loop
      PERFORM public.grant_powerup(new.user_id, 'streak_freeze', null, null, null, 1440, 'achievement');
    end loop;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_award_powerup_on_achievement on public.user_achievements;
create trigger trg_award_powerup_on_achievement
after insert on public.user_achievements
for each row execute function public.award_powerup_on_achievement();

-- 10) Compra de power-up cria a unidade no inventario.
create or replace function public.purchase_store_item(p_item_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_item public.store_items;
  v_coins integer;
  v_res jsonb;
  v_purchase_id uuid;
  v_mensagem text;
begin
  if v_uid is null then
    raise exception 'sessao obrigatoria' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('coins:' || v_uid::text));

  select * into v_item from public.store_items where id = p_item_id and is_active = true;
  if not found then
    return jsonb_build_object('ok', false, 'mensagem', 'Item indisponivel na loja');
  end if;

  if v_item.category = 'power_up' and v_item.powerup_kind is null then
    return jsonb_build_object(
      'ok', false,
      'mensagem', 'Este power-up esta sem configuracao na loja (tipo ausente). Nada foi cobrado; avise o suporte.'
    );
  end if;

  select coalesce(coins, 0) into v_coins from public.user_xp where user_id = v_uid;
  v_coins := coalesce(v_coins, 0);

  if v_coins < v_item.price_coins then
    return jsonb_build_object(
      'ok', false,
      'mensagem', 'Moedas insuficientes',
      'coins', v_coins,
      'preco', v_item.price_coins,
      'faltam', v_item.price_coins - v_coins
    );
  end if;

  v_res := public.apply_coin_transaction(v_uid, -v_item.price_coins, 'purchase', 'Compra: ' || v_item.name);

  insert into public.user_purchases (user_id, item_id, price_paid, quantity)
  values (v_uid, v_item.id, v_item.price_coins, 1)
  returning id into v_purchase_id;

  v_mensagem := v_item.name || ' adicionado a sua colecao';

  if v_item.category = 'power_up' and v_item.powerup_kind is not null then
    PERFORM public.grant_powerup(
      v_uid,
      v_item.powerup_kind,
      v_item.id,
      v_purchase_id,
      v_item.powerup_multiplier,
      v_item.powerup_duration_minutes,
      'purchase'
    );

    v_mensagem := case v_item.powerup_kind
      when 'xp_boost' then v_item.name || ' pronto: ative na aba Power-ups da loja.'
      else v_item.name || ' pronta: sera usada automaticamente no primeiro dia perdido.'
    end;
  end if;

  return jsonb_build_object(
    'ok', true,
    'item', to_jsonb(v_item),
    'coins', v_res->'coins',
    'purchase_id', v_purchase_id,
    'mensagem', v_mensagem
  );
end;
$function$;

-- 10.1) Conversao retroativa: compra de power-up feita por uma versao anterior desta
--       migration (sem criacao de unidade) passa a ter a unidade correspondente na mochila.
--       Idempotente: conta as unidades ja ligadas ao mesmo purchase_id.
with compras as (
  select up.id, up.user_id, up.item_id, si.powerup_kind, si.powerup_multiplier, si.powerup_duration_minutes,
         greatest(coalesce(up.quantity, 1) - (select count(*) from public.user_powerups x where x.purchase_id = up.id), 0) as faltando
    from public.user_purchases up
    join public.store_items si on si.id = up.item_id
   where si.category = 'power_up' and si.powerup_kind is not null
),
serie as (
  select c.*, g.i
    from compras c
    cross join lateral generate_series(1, c.faltando) as g(i)
)
insert into public.user_powerups (user_id, kind, item_id, purchase_id, multiplier, duration_minutes, source)
select user_id, powerup_kind, item_id, id, powerup_multiplier, coalesce(powerup_duration_minutes, 0), 'purchase'
  from serie;

-- 11) Permissoes: so o aluno autenticado le a propria carteira e ativa o proprio boost.
revoke all on function public.grant_powerup(uuid, text, uuid, uuid, numeric, integer, text) from public;
revoke all on function public.grant_powerup(uuid, text, uuid, uuid, numeric, integer, text) from anon;
revoke all on function public.grant_powerup(uuid, text, uuid, uuid, numeric, integer, text) from authenticated;

revoke all on function public.has_streak_freeze(uuid) from public;
revoke all on function public.has_streak_freeze(uuid) from anon;
revoke all on function public.has_streak_freeze(uuid) from authenticated;

revoke all on function public.consume_streak_freeze(uuid) from public;
revoke all on function public.consume_streak_freeze(uuid) from anon;
revoke all on function public.consume_streak_freeze(uuid) from authenticated;

revoke all on function public.active_xp_boost_multiplier(uuid) from public;
revoke all on function public.active_xp_boost_multiplier(uuid) from anon;
revoke all on function public.active_xp_boost_multiplier(uuid) from authenticated;

revoke all on function public.get_xp_multiplier(uuid) from public;
revoke all on function public.get_xp_multiplier(uuid) from anon;
revoke all on function public.get_xp_multiplier(uuid) from authenticated;

revoke all on function public.get_my_xp_multiplier() from public;
revoke all on function public.get_my_xp_multiplier() from anon;
grant execute on function public.get_my_xp_multiplier() to authenticated;

revoke all on function public.get_my_powerups() from public;
revoke all on function public.get_my_powerups() from anon;
grant execute on function public.get_my_powerups() to authenticated;

revoke all on function public.activate_powerup(text) from public;
revoke all on function public.activate_powerup(text) from anon;
grant execute on function public.activate_powerup(text) to authenticated;

revoke all on function public.update_user_streak(uuid) from public;
revoke all on function public.update_user_streak(uuid) from anon;
grant execute on function public.update_user_streak(uuid) to authenticated;

revoke all on function public.purchase_store_item(uuid) from public;
revoke all on function public.purchase_store_item(uuid) from anon;
grant execute on function public.purchase_store_item(uuid) to authenticated;
-- 12) TRUNCATE nao respeita RLS: o padrao do Supabase concede ALL em tabela nova,
--     entao sobrava TRUNCATE para o cliente. Fecha tambem REFERENCES e TRIGGER.
revoke truncate, references, trigger on public.user_powerups from anon;
revoke truncate, references, trigger on public.user_powerups from authenticated;