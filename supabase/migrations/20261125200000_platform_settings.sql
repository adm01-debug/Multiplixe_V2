-- ADMIN-007: configurações da plataforma (regras de negócio editáveis sem deploy)
--
-- Cria public.platform_settings (key/value JSONB) com RLS:
--   * admin (public.has_role) escreve;
--   * qualquer usuário autenticado lê todas as chaves;
--   * anon lê somente a chave allowed_email_domains, porque a tela de login precisa
--     validar o domínio de e-mail antes de existir sessão.
-- Não altera tabelas, políticas, grants, funções ou triggers existentes.

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

comment on table public.platform_settings is
  'Configurações de negócio editáveis pelo admin (ADMIN-007). Value é JSONB livre; o app valida o formato de cada chave.';

alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_select_authenticated on public.platform_settings;
create policy platform_settings_select_authenticated
  on public.platform_settings
  for select
  to authenticated
  using (true);

drop policy if exists platform_settings_select_anon_dominios on public.platform_settings;
create policy platform_settings_select_anon_dominios
  on public.platform_settings
  for select
  to anon
  using (key = 'allowed_email_domains');

drop policy if exists platform_settings_write_admin on public.platform_settings;
create policy platform_settings_write_admin
  on public.platform_settings
  for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop trigger if exists platform_settings_updated_at on public.platform_settings;
create trigger platform_settings_updated_at
  before update on public.platform_settings
  for each row
  execute function public.update_updated_at_column();

grant select on table public.platform_settings to anon, authenticated;
grant insert, update, delete on table public.platform_settings to authenticated;

insert into public.platform_settings (key, value, description) values
  (
    'allowed_email_domains',
    '["promobrindes.com.br"]'::jsonb,
    'Domínios de e-mail aceitos no login e no cadastro'
  ),
  (
    'quiz_defaults',
    '{"passing_score": 90, "xp_reward": 50, "cooldown_hours": 24, "time_limit_seconds": null}'::jsonb,
    'Valores iniciais de um quiz novo'
  ),
  (
    'xp_rewards',
    '{"lesson_completed": 25, "course_completed": 100}'::jsonb,
    'XP concedido por ação concluída'
  )
on conflict (key) do nothing;
