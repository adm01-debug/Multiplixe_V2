-- Edges de cron passam a exigir segredo.
--
-- webhook-dispatch e weekly-admin-digest rodam com verify_jwt = false e a anon key vai no bundle
-- do site, então qualquer visitante podia disparar entregas de webhook (a edge usa service role
-- internamente) e o envio do digest semanal por e-mail. As duas agora só respondem quando o
-- header Authorization traz o segredo `cron_secret`, guardado no Vault: sem ele devolvem 401
-- (e 500 quando a variável CRON_SECRET não estiver configurada na edge, ou seja, falham fechadas).
-- O valor é gerado aqui, no banco, e nunca entra no repositório.

do $$
declare
  v_cmd text;
  v_job bigint;
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'cron_secret',
      'Bearer das edges de cron (webhook-dispatch, weekly-admin-digest)'
    );
  end if;

  v_cmd := $cmd$
  SELECT net.http_post(
    url := 'https://ywsblgsikhiscvpmopkp.supabase.co/functions/v1/webhook-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 5000
  );
  $cmd$;

  select jobid into v_job from cron.job where jobname = 'webhook-dispatch';
  if v_job is not null then
    perform cron.alter_job(v_job, command := v_cmd);
  end if;

  v_cmd := $cmd$
  SELECT net.http_post(
    url := 'https://ywsblgsikhiscvpmopkp.supabase.co/functions/v1/weekly-admin-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cmd$;

  select jobid into v_job from cron.job where jobname = 'weekly-admin-digest';
  if v_job is not null then
    perform cron.alter_job(v_job, command := v_cmd);
  end if;
end $$;