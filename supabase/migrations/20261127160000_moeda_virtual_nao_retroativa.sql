-- GAME-006 - ajuste: a conversao de XP passa a carregar o resto entre ganhos, em
-- vez de olhar todo o historico. Assim XP ganho antes da loja existir nao vira
-- moeda retroativa (aluno antigo recebia centenas de moedas no primeiro ganho).
alter table public.user_xp add column if not exists coins_xp_remainder integer not null default 0;

create or replace function public.award_coins_from_xp()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_resto integer;
  v_total integer;
  v_coins integer;
begin
  if new.xp_amount is null or new.xp_amount <= 0 then
    return new;
  end if;

  select x.coins_xp_remainder into v_resto
    from public.user_xp x
   where x.user_id = new.user_id
     for update;

  if v_resto is null then
    insert into public.user_xp (user_id, coins_xp_remainder) values (new.user_id, 0)
    on conflict (user_id) do nothing;
    v_resto := 0;
  end if;

  v_total := v_resto + new.xp_amount;
  v_coins := v_total / 10;

  update public.user_xp
     set coins_xp_remainder = v_total % 10
   where user_id = new.user_id;

  if v_coins > 0 then
    perform public.apply_coin_transaction(
      new.user_id,
      v_coins,
      'xp',
      'XP ganho: ' || new.xp_amount || coalesce(' (' || new.source || ')', '')
    );
  end if;

  return new;
end;
$function$;