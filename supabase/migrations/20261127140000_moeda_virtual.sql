-- GAME-006: moeda virtual (coins), loja de itens e compras.
-- O aluno ganha moedas ao ganhar XP (1 a cada 10 XP), ao desbloquear conquista
-- e pode gastar na loja. Todo credito/debito passa por apply_coin_transaction,
-- que grava o extrato em coin_transactions.

alter table public.user_xp add column if not exists coins integer not null default 0;

create table if not exists public.coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  balance_after integer not null,
  source text not null default 'manual',
  description text,
  created_at timestamptz not null default now()
);

create index if not exists idx_coin_transactions_user_created
  on public.coin_transactions (user_id, created_at desc);

create table if not exists public.store_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category text not null default 'cosmetic'
    check (category in ('power_up', 'theme', 'avatar', 'cosmetic')),
  price_coins integer not null default 0 check (price_coins >= 0),
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.store_items(id) on delete restrict,
  price_paid integer not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_purchases_user on public.user_purchases (user_id, created_at desc);

-- Credito/debito central: cria a carteira se faltar, recusa saldo negativo e
-- registra o extrato. Uso interno (funcoes e triggers SECURITY DEFINER).
create or replace function public.apply_coin_transaction(
  p_user_id uuid,
  p_amount integer,
  p_source text default 'manual',
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_saldo integer;
begin
  if p_user_id is null then
    raise exception 'usuario obrigatorio' using errcode = '22004';
  end if;
  if coalesce(p_amount, 0) = 0 then
    select coins into v_saldo from public.user_xp where user_id = p_user_id;
    return jsonb_build_object('coins', coalesce(v_saldo, 0), 'amount', 0, 'source', p_source);
  end if;

  insert into public.user_xp (user_id, coins) values (p_user_id, 0)
  on conflict (user_id) do nothing;

  update public.user_xp
     set coins = coins + p_amount,
         updated_at = now()
   where user_id = p_user_id
  returning coins into v_saldo;

  if v_saldo < 0 then
    raise exception 'saldo de moedas insuficiente' using errcode = '23514';
  end if;

  insert into public.coin_transactions (user_id, amount, balance_after, source, description)
  values (p_user_id, p_amount, v_saldo, coalesce(p_source, 'manual'), p_description);

  return jsonb_build_object('coins', v_saldo, 'amount', p_amount, 'source', coalesce(p_source, 'manual'));
end;
$function$;

-- XP ganho vira moeda: 1 moeda a cada 10 XP.
create or replace function public.award_coins_from_xp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_coins integer;
begin
  if new.xp_amount is null or new.xp_amount <= 0 then
    return new;
  end if;

  v_coins := floor(new.xp_amount::numeric / 10)::int;
  if v_coins <= 0 then
    return new;
  end if;

  perform public.apply_coin_transaction(
    new.user_id,
    v_coins,
    'xp',
    'XP ganho: ' || new.xp_amount || coalesce(' (' || new.source || ')', '')
  );
  return new;
end;
$function$;

drop trigger if exists trg_award_coins_from_xp on public.user_xp_history;
create trigger trg_award_coins_from_xp
  after insert on public.user_xp_history
  for each row execute function public.award_coins_from_xp();

-- Conquista desbloqueada vira moeda: 20% do XP da conquista, minimo 5.
create or replace function public.award_coins_from_achievement()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_reward integer;
  v_coins integer;
begin
  select a.xp_reward into v_reward from public.achievements a where a.id = new.achievement_id;
  v_coins := greatest(5, floor(coalesce(v_reward, 0)::numeric / 5)::int);

  perform public.apply_coin_transaction(
    new.user_id,
    v_coins,
    'achievement',
    'Conquista desbloqueada'
  );
  return new;
end;
$function$;

drop trigger if exists trg_award_coins_from_achievement on public.user_achievements;
create trigger trg_award_coins_from_achievement
  after insert on public.user_achievements
  for each row execute function public.award_coins_from_achievement();

-- Carteira do aluno logado: saldo, totais da semana, extrato e colecao.
create or replace function public.get_my_wallet()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sessao obrigatoria' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'coins', coalesce((select coins from public.user_xp where user_id = v_uid), 0),
      'ganho_semana', coalesce((
        select sum(amount) from public.coin_transactions
        where user_id = v_uid and amount > 0 and created_at >= date_trunc('week', now())
      ), 0),
      'gasto_semana', coalesce((
        select -sum(amount) from public.coin_transactions
        where user_id = v_uid and amount < 0 and created_at >= date_trunc('week', now())
      ), 0),
      'total_ganho', coalesce((select sum(amount) from public.coin_transactions where user_id = v_uid and amount > 0), 0),
      'total_gasto', coalesce((select -sum(amount) from public.coin_transactions where user_id = v_uid and amount < 0), 0),
      'extrato', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', t.id, 'amount', t.amount, 'balance_after', t.balance_after,
          'source', t.source, 'description', t.description, 'created_at', t.created_at
        ) order by t.created_at desc)
        from (select * from public.coin_transactions where user_id = v_uid order by created_at desc limit 20) t
      ), '[]'::jsonb),
      'colecao', coalesce((
        select jsonb_agg(jsonb_build_object(
          'item_id', i.id, 'slug', i.slug, 'name', i.name, 'description', i.description,
          'category', i.category, 'icon', i.icon, 'quantidade', s.total, 'ultima_compra', s.ultima
        ) order by s.ultima desc)
        from (
          select item_id, sum(quantity)::int as total, max(created_at) as ultima
          from public.user_purchases where user_id = v_uid group by item_id
        ) s
        join public.store_items i on i.id = s.item_id
      ), '[]'::jsonb)
    )
  );
end;
$function$;

-- Compra de item da loja: lock por usuario, confere saldo e item ativo,
-- debita as moedas e registra a compra na colecao do aluno.
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
begin
  if v_uid is null then
    raise exception 'sessao obrigatoria' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtext('coins:' || v_uid::text));

  select * into v_item from public.store_items where id = p_item_id and is_active = true;
  if not found then
    return jsonb_build_object('ok', false, 'mensagem', 'Item indisponivel na loja');
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
  values (v_uid, v_item.id, v_item.price_coins, 1);

  return jsonb_build_object(
    'ok', true,
    'item', to_jsonb(v_item),
    'coins', v_res->'coins',
    'mensagem', v_item.name || ' adicionado a sua colecao'
  );
end;
$function$;

-- Admin credita (ou estorna) moedas manualmente.
create or replace function public.admin_grant_coins(
  p_user_id uuid,
  p_amount integer,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_res jsonb;
begin
  if not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'apenas administradores' using errcode = '42501';
  end if;
  if p_user_id is null or coalesce(p_amount, 0) = 0 then
    raise exception 'usuario e quantidade obrigatorios' using errcode = '22004';
  end if;

  v_res := public.apply_coin_transaction(
    p_user_id,
    p_amount,
    'admin',
    coalesce(nullif(trim(p_reason), ''), 'Ajuste manual do administrador')
  );
  return v_res || jsonb_build_object('user_id', p_user_id);
end;
$function$;

-- RLS
alter table public.coin_transactions enable row level security;
alter table public.store_items enable row level security;
alter table public.user_purchases enable row level security;

drop policy if exists "Aluno ve seu extrato de moedas" on public.coin_transactions;
create policy "Aluno ve seu extrato de moedas" on public.coin_transactions
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Aluno ve suas compras" on public.user_purchases;
create policy "Aluno ve suas compras" on public.user_purchases
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Itens ativos visiveis" on public.store_items;
create policy "Itens ativos visiveis" on public.store_items
  for select to authenticated
  using (is_active = true or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins gerenciam itens da loja" on public.store_items;
create policy "Admins gerenciam itens da loja" on public.store_items
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop trigger if exists update_store_items_updated_at on public.store_items;
create trigger update_store_items_updated_at
  before update on public.store_items
  for each row execute function public.update_updated_at_column();

-- Grants
revoke all on function public.apply_coin_transaction(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.award_coins_from_xp() from public, anon, authenticated;
revoke all on function public.award_coins_from_achievement() from public, anon, authenticated;

revoke all on function public.get_my_wallet() from public, anon;
grant execute on function public.get_my_wallet() to authenticated;

revoke all on function public.purchase_store_item(uuid) from public, anon;
grant execute on function public.purchase_store_item(uuid) to authenticated;

revoke all on function public.admin_grant_coins(uuid, integer, text) from public, anon;
grant execute on function public.admin_grant_coins(uuid, integer, text) to authenticated;

grant select on public.coin_transactions to authenticated;
grant select on public.user_purchases to authenticated;
grant select, insert, update, delete on public.store_items to authenticated;

-- Catalogo inicial da loja.
insert into public.store_items (slug, name, description, category, price_coins, icon, sort_order)
values
  ('xp-boost-2x', 'Impulsionador de XP 2x', 'Dobra o XP que voce ganhar por 1 hora de estudo.', 'power_up', 150, 'Zap', 10),
  ('streak-freeze', 'Blindagem de Sequencia', 'Protege sua sequencia de estudo por 1 dia sem perder o progresso.', 'power_up', 200, 'Snowflake', 20),
  ('tema-neon', 'Tema Neon', 'Paleta escura com destaque neon para o painel.', 'theme', 300, 'Palette', 30),
  ('tema-papel', 'Tema Papel', 'Paleta clara e suave, pensada para leitura longa.', 'theme', 300, 'Palette', 40),
  ('avatar-astronauta', 'Avatar Astronauta', 'Moldura de astronauta para o seu avatar.', 'avatar', 80, 'Rocket', 50),
  ('avatar-mentor', 'Avatar Mentor', 'Moldura de mentor para o seu avatar.', 'avatar', 120, 'GraduationCap', 60),
  ('avatar-campeao', 'Avatar Campeao', 'Moldura dourada de campeao para o seu avatar.', 'avatar', 250, 'Crown', 70),
  ('selo-explorador', 'Selo Explorador', 'Selo de perfil para quem explorou o catalogo inteiro.', 'cosmetic', 100, 'Compass', 80),
  ('selo-veterano', 'Selo Veterano', 'Selo de perfil para alunos com longa jornada.', 'cosmetic', 180, 'Medal', 90),
  ('moldura-certificado', 'Moldura de Certificado Premium', 'Aplica a moldura premium aos seus certificados.', 'cosmetic', 400, 'Award', 100)
on conflict (slug) do nothing;