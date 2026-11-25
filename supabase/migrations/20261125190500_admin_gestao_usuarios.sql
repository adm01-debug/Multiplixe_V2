-- ADMIN-002 | Gestão de usuários avançada
--
-- Por que existe: a aba "Usuários" do admin é uma tabela somente leitura (nome, nível, XP,
-- aulas, cursos). Não há como redefinir senha, desativar conta, dar/retirar admin nem abrir o
-- progresso detalhado. O e-mail nem chegava ao cliente porque mora em auth.users
-- (Admin.tsx preenchia `email: ''`). Esta migração cria a base de dados que a UI nova consome.
--
-- O que muda:
--   1. profiles ganha email / is_active / deactivated_at.
--   2. Backfill de email a partir de auth.users para as contas já existentes.
--   3. handle_new_user passa a gravar o email no cadastro (contas futuras).
--   4. Um trigger congela email / is_active / deactivated_at / user_id para quem não é admin.
--      A RLS de profiles permite "Users can update their own profile", então sem o trigger um
--      usuário desativado poderia voltar is_active = true sozinho. A trava de login real é o
--      ban no GoTrue (edge function admin-user-actions); o trigger é a trava de consistência.
--
-- Não mexe em: políticas existentes, grants de tabela, colunas antigas.
-- Não cria função SECURITY DEFINER (o trigger roda como invoker e chama has_role, que já é
-- SECURITY DEFINER e tem EXECUTE restrito desde 20261125184800).

-- 1) Identidade e status no perfil ------------------------------------------------

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists deactivated_at timestamptz;

comment on column public.profiles.email is
  'Cópia de auth.users.email. Mantida por handle_new_user (cadastro) e pelas ações de admin. auth.users não é acessível ao cliente, por isso a cópia existe.';
comment on column public.profiles.is_active is
  'false = conta desativada pelo admin. Espelho de conveniência do ban do GoTrue (auth.admin.updateUserById), que é o que de fato impede login.';
comment on column public.profiles.deactivated_at is
  'Quando o admin desativou a conta. NULL quando ativa.';

-- 2) Backfill do e-mail das contas existentes -------------------------------------

update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.user_id
   and p.email is distinct from u.email;

-- 3) Cadastro passa a gravar o e-mail --------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', new.email);
  RETURN new;
END;
$function$;

-- 4) Colunas administrativas só mudam por admin ----------------------------------

create or replace function public.protect_profile_admin_columns()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
BEGIN
  -- auth.uid() nulo = service_role (edge functions) ou execução de migration: libera.
  IF auth.uid() IS NULL OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN new;
  END IF;

  new.user_id        := old.user_id;
  new.email          := old.email;
  new.is_active      := old.is_active;
  new.deactivated_at := old.deactivated_at;
  RETURN new;
END;
$function$;

drop trigger if exists protect_profile_admin_columns on public.profiles;

create trigger protect_profile_admin_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_admin_columns();