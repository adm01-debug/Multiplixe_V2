-- Fecha o ciclo do Web Push: coluna de controle, leitura da chave no Vault, contador de
-- falhas e o job de cron que chama a edge send-push.

alter table public.notifications add column if not exists pushed_at timestamptz;

comment on column public.notifications.pushed_at is
  'Quando o Web Push desta notificacao foi entregue; null = ainda na fila da edge send-push.';

create index if not exists idx_notifications_nao_enviadas
  on public.notifications (created_at)
  where pushed_at is null;

-- Só a service_role (a edge) le a chave privada: nenhum grant para authenticated.
create or replace function public.push_chave_privada()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_private_key';
$$;

revoke all on function public.push_chave_privada() from public, anon, authenticated;

create or replace function public.registrar_falha_push(p_subscription_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  update public.push_subscriptions
     set failure_count = failure_count + 1
   where id = p_subscription_id
   returning failure_count;
$$;

revoke all on function public.registrar_falha_push(uuid) from public, anon, authenticated;

select cron.unschedule('send-push')
where exists (select 1 from cron.job where jobname = 'send-push');

select cron.schedule(
  'send-push',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://ywsblgsikhiscvpmopkp.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $cron$
);