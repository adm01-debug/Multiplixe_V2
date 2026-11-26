-- GAME-006 - endurecimento: o saldo so muda por compra, credito de admin ou
-- conversao de XP/conquista; o aluno nao pode editar a carteira nem inventar
-- conquistas. Corrige tambem a conversao de XP (nao perde moeda quebrada).

-- 1) Guarda do saldo: escrita direta na coluna e recusada. As funcoes internas
--    (SECURITY DEFINER, donas postgres) continuam passando.
create or replace function public.guard_user_xp_coins()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.coins, 0) <> 0 then
      raise exception 'saldo de moedas so muda por compra ou credito' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.coins is distinct from old.coins then
    raise exception 'saldo de moedas so muda por compra ou credito' using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_guard_user_xp_coins on public.user_xp;
create trigger trg_guard_user_xp_coins
  before insert or update on public.user_xp
  for each row execute function public.guard_user_xp_coins();

-- 2) Conversao de XP sem perder moeda quebrada entre ganhos (25 + 25 = 5).
create or replace function public.award_coins_from_xp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_total integer;
  v_pago integer;
  v_coins integer;
begin
  if new.xp_amount is null or new.xp_amount <= 0 then
    return new;
  end if;

  select coalesce(sum(h.xp_amount), 0) into v_total
    from public.user_xp_history h where h.user_id = new.user_id;
  select coalesce(sum(t.amount), 0) into v_pago
    from public.coin_transactions t where t.user_id = new.user_id and t.source = 'xp';

  v_coins := floor(v_total::numeric / 10)::int - v_pago;
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

-- 3) Conquista so entra pelo banco (check_and_award_achievements e afins).
revoke insert, delete on public.user_achievements from authenticated, anon;
drop policy if exists "Users can insert their own achievements" on public.user_achievements;