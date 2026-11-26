-- GAME-006 - a sobra de XP (coins_xp_remainder) tambem e estado do banco: sem a
-- guarda, o aluno poderia inflar a sobra e cunhar moedas na proxima atividade.
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
    if coalesce(new.coins, 0) <> 0 or coalesce(new.coins_xp_remainder, 0) <> 0 then
      raise exception 'saldo de moedas so muda por compra ou credito' using errcode = '42501';
    end if;
    return new;
  end if;

  if new.coins is distinct from old.coins
     or new.coins_xp_remainder is distinct from old.coins_xp_remainder then
    raise exception 'saldo de moedas so muda por compra ou credito' using errcode = '42501';
  end if;

  return new;
end;
$function$;