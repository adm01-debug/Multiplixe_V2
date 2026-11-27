-- Web Push: ate aqui o aluno ligava o switch de notificacoes e nada chegava com o app
-- fechado (nenhum service worker registrado, nenhuma inscricao salva, nenhum envio).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz,
  failure_count integer not null default 0
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "Aluno gerencia as proprias inscricoes push"
  on public.push_subscriptions
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins veem as inscricoes push"
  on public.push_subscriptions
  for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- Chaves VAPID criadas dentro do banco: nenhuma chave privada passa pelo repositorio.
-- Trocar a chave invalida as inscricoes existentes, por isso ela e criada uma vez so.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'vapid_private_key') then
    perform vault.create_secret(
      '-Q9FvgGVnRLoZvYf6WevMH7dx1yxCxT7gOW9f7KUHuc',
      'vapid_private_key',
      'Chave privada VAPID (P-256, base64url) usada pela edge send-push. A publica fica em push_vapid_public_key().'
    );
  end if;
end $$;

create or replace function public.push_vapid_public_key()
returns text
language sql
immutable
security definer
set search_path = public
as $$
  -- Par fixo da chave privada acima (ponto publico P-256, 65 bytes sem compressao).
  select 'BFxrIQJ28-2QPIqNPNINFFTx5ZdsW2g7_MFKatpC2pwH4aKfWhVC5ivKXjlMLubhTPlD7fN2vSr-8g98tU2HfOs'::text;
$$;

revoke all on function public.push_vapid_public_key() from public, anon;
grant execute on function public.push_vapid_public_key() to authenticated;

comment on function public.push_vapid_public_key() is
  'Chave publica VAPID (base64url) do par guardado no Vault como vapid_private_key.';