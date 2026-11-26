-- Gate de domínio no cadastro.
--
-- A restrição a email corporativo existia apenas no formulário de login
-- (src/pages/Auth.tsx). Com `disable_signup = false`, a API pública de signup
-- (/auth/v1/signup) aceitava qualquer email e a policy
-- "Authenticated users can view lessons" (USING true) entregava todo o conteúdo
-- para quem criasse uma conta com email pessoal.
--
-- Esta função é o auth hook "Before User Created" do Supabase Auth: ela roda
-- antes do INSERT em auth.users e recusa o cadastro fora dos domínios de
-- platform_settings.allowed_email_domains (default: promobrindes.com.br).

create or replace function public.bloquear_cadastro_fora_do_dominio(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  email text := lower(coalesce(event -> 'user' ->> 'email', ''));
  dominio text := nullif(split_part(email, '@', 2), '');
  permitidos text[];
begin
  select array_agg(lower(ltrim(btrim(item), '@')))
    into permitidos
  from platform_settings p
  cross join lateral jsonb_array_elements_text(
    case when jsonb_typeof(p.value) = 'array' then p.value else '[]'::jsonb end
  ) as item
  where p.key = 'allowed_email_domains';

  if permitidos is null or array_length(permitidos, 1) is null then
    permitidos := array['promobrindes.com.br'];
  end if;

  if dominio is null or not (dominio = any (permitidos)) then
    raise exception 'Cadastro restrito a email corporativo (%).', array_to_string(permitidos, ', ');
  end if;

  return '{}'::jsonb;
end;
$$;

comment on function public.bloquear_cadastro_fora_do_dominio(jsonb) is
  'Auth hook Before User Created: recusa cadastro cujo email não esteja em platform_settings.allowed_email_domains.';

revoke all on function public.bloquear_cadastro_fora_do_dominio(jsonb) from public, anon, authenticated;
grant execute on function public.bloquear_cadastro_fora_do_dominio(jsonb) to supabase_auth_admin;

select public.bloquear_cadastro_fora_do_dominio('{"user":{"email":"x@promobrindes.com.br"}}'::jsonb) as corporativo_ok;