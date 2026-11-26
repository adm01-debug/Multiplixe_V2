-- FUNC-007: sistema de mentoria
--
-- Conecta quem ja domina um assunto a quem esta comecando. O aluno marca no
-- perfil que aceita mentorar e escolhe os temas; os colegas pedem mentoria, o
-- mentor recebe notificacao e aceita ou recusa, e o pedido anda por status ate
-- a conclusao.

-- 1) Perfil: disponibilidade para mentorar
alter table public.profiles
  add column if not exists is_mentor boolean not null default false,
  add column if not exists mentor_topics text[] not null default '{}',
  add column if not exists mentor_bio text;

alter table public.profiles drop constraint if exists profiles_mentor_bio_tamanho_check;
alter table public.profiles add constraint profiles_mentor_bio_tamanho_check
  check (mentor_bio is null or char_length(btrim(mentor_bio)) <= 1000);

alter table public.profiles drop constraint if exists profiles_mentor_topics_limite_check;
alter table public.profiles add constraint profiles_mentor_topics_limite_check
  check (array_length(mentor_topics, 1) is null or array_length(mentor_topics, 1) <= 8);

comment on column public.profiles.is_mentor is
  'Aluno disponivel para mentorar colegas (aparece na lista de mentores).';
comment on column public.profiles.mentor_topics is
  'Ate 8 assuntos em que o aluno aceita mentorar.';
comment on column public.profiles.mentor_bio is
  'Apresentacao curta do mentor, ate 1000 caracteres.';

-- 2) Tabela de solicitacoes
create table if not exists public.mentorship_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references auth.users(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (length(btrim(topic)) between 3 and 120),
  message text not null check (length(btrim(message)) between 10 and 2000),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  response_note text check (response_note is null or char_length(response_note) <= 1000),
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentorship_requests_self_check check (mentee_id <> mentor_id)
);

comment on table public.mentorship_requests is
  'Pedidos de mentoria entre alunos: pendente -> aceito/recusado -> concluido, ou cancelado por quem pediu.';

create index if not exists idx_mentorship_requests_mentor
  on public.mentorship_requests(mentor_id, status, created_at desc);
create index if not exists idx_mentorship_requests_mentee
  on public.mentorship_requests(mentee_id, status, created_at desc);

create unique index if not exists idx_mentorship_requests_pendente_unico
  on public.mentorship_requests(mentee_id, mentor_id)
  where status = 'pending';

drop trigger if exists update_mentorship_requests_updated_at on public.mentorship_requests;
create trigger update_mentorship_requests_updated_at before update on public.mentorship_requests
  for each row execute function public.update_updated_at_column();

-- 3) Mentor valido (SECURITY DEFINER: a policy de INSERT precisa ler o perfil
--    de outro usuario, e profiles so e visivel para o proprio dono)
create or replace function public.mentor_disponivel(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles p
    where p.user_id = p_user_id
      and p.is_mentor
      and coalesce(p.is_active, true)
  );
$fn$;

comment on function public.mentor_disponivel(uuid) is
  'Diz se o usuario pode receber pedidos de mentoria (is_mentor e ativo).';

revoke all on function public.mentor_disponivel(uuid) from public, anon;
grant execute on function public.mentor_disponivel(uuid) to authenticated, service_role;

-- 4) RLS
alter table public.mentorship_requests enable row level security;

drop policy if exists "Envolvidos veem a solicitacao de mentoria" on public.mentorship_requests;
create policy "Envolvidos veem a solicitacao de mentoria" on public.mentorship_requests
  for select to authenticated
  using (
    mentee_id = auth.uid()
    or mentor_id = auth.uid()
    or public.has_role(auth.uid(), 'admin'::public.app_role)
  );

drop policy if exists "Aluno pede mentoria para um mentor disponivel" on public.mentorship_requests;
create policy "Aluno pede mentoria para um mentor disponivel" on public.mentorship_requests
  for insert to authenticated
  with check (
    mentee_id = auth.uid()
    and status = 'pending'
    and mentor_id <> auth.uid()
    and public.mentor_disponivel(mentor_id)
  );

drop policy if exists "Mentor responde solicitacao de mentoria" on public.mentorship_requests;
create policy "Mentor responde solicitacao de mentoria" on public.mentorship_requests
  for update to authenticated
  using (mentor_id = auth.uid() and status in ('pending', 'accepted'))
  with check (mentor_id = auth.uid() and status in ('accepted', 'declined', 'completed'));

drop policy if exists "Aluno cancela a propria solicitacao" on public.mentorship_requests;
create policy "Aluno cancela a propria solicitacao" on public.mentorship_requests
  for update to authenticated
  using (mentee_id = auth.uid() and status in ('pending', 'accepted'))
  with check (mentee_id = auth.uid() and status = 'cancelled');

revoke all on public.mentorship_requests from anon, authenticated;
grant select, insert, update on public.mentorship_requests to authenticated;
grant all on public.mentorship_requests to service_role;

-- 5) Notificacoes de ida e volta
create or replace function public.notificar_mentoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_nome text;
begin
  if tg_op = 'INSERT' then
    select coalesce(full_name, 'Um colega') into v_nome
      from public.profiles where user_id = new.mentee_id;
    insert into public.notifications (user_id, title, message, type, action_url)
    values (
      new.mentor_id,
      'Nova solicitacao de mentoria',
      v_nome || ' pediu sua mentoria sobre "' || new.topic || '".',
      'info',
      '/mentoria?aba=pedidos'
    );
    return null;
  end if;

  if new.status is not distinct from old.status then
    return null;
  end if;

  if new.status = 'accepted' then
    select coalesce(full_name, 'Seu mentor') into v_nome
      from public.profiles where user_id = new.mentor_id;
    insert into public.notifications (user_id, title, message, type, action_url)
    values (
      new.mentee_id,
      'Mentoria aceita',
      v_nome || ' aceitou seu pedido de mentoria sobre "' || new.topic || '".',
      'info',
      '/mentoria?aba=pedidos'
    );
  elsif new.status = 'declined' then
    select coalesce(full_name, 'Seu mentor') into v_nome
      from public.profiles where user_id = new.mentor_id;
    insert into public.notifications (user_id, title, message, type, action_url)
    values (
      new.mentee_id,
      'Mentoria nao aceita',
      v_nome || ' nao pode aceitar o pedido sobre "' || new.topic || '". Procure outro mentor no mesmo assunto.',
      'info',
      '/mentoria?aba=pedidos'
    );
  elsif new.status = 'completed' then
    insert into public.notifications (user_id, title, message, type, action_url)
    values (
      new.mentee_id,
      'Mentoria concluida',
      'A mentoria sobre "' || new.topic || '" foi marcada como concluida.',
      'info',
      '/mentoria?aba=pedidos'
    );
  elsif new.status = 'cancelled' then
    select coalesce(full_name, 'Um aluno') into v_nome
      from public.profiles where user_id = new.mentee_id;
    insert into public.notifications (user_id, title, message, type, action_url)
    values (
      new.mentor_id,
      'Pedido de mentoria cancelado',
      v_nome || ' cancelou o pedido de mentoria sobre "' || new.topic || '".',
      'info',
      '/mentoria?aba=pedidos'
    );
  end if;

  return null;
end;
$fn$;

comment on function public.notificar_mentoria() is
  'Avisa o mentor sobre pedido novo e o aluno sobre aceite, recusa, conclusao ou cancelamento.';

revoke all on function public.notificar_mentoria() from public, anon, authenticated;
grant execute on function public.notificar_mentoria() to service_role;

drop trigger if exists trg_notificar_mentoria on public.mentorship_requests;
create trigger trg_notificar_mentoria after insert or update on public.mentorship_requests
  for each row execute function public.notificar_mentoria();

-- 6) Resposta do mentor / cancelamento do aluno, com transicoes validas
create or replace function public.respond_mentorship_request(
  p_id uuid,
  p_status text,
  p_nota text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_req public.mentorship_requests;
  v_novo text := lower(btrim(coalesce(p_status, '')));
  v_nota text := nullif(btrim(coalesce(p_nota, '')), '');
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;

  if v_novo not in ('accepted', 'declined', 'completed', 'cancelled') then
    raise exception 'status invalido: use accepted, declined, completed ou cancelled';
  end if;

  if v_nota is not null and char_length(v_nota) > 1000 then
    raise exception 'nota muito longa (maximo 1000 caracteres)';
  end if;

  select * into v_req
    from public.mentorship_requests r
   where r.id = p_id
   for update;

  if v_req.id is null then
    raise exception 'solicitacao de mentoria inexistente' using errcode = 'P0002';
  end if;

  if v_novo = 'cancelled' then
    if v_req.mentee_id <> v_uid then
      raise exception 'apenas quem pediu pode cancelar a solicitacao' using errcode = '42501';
    end if;
    if v_req.status not in ('pending', 'accepted') then
      raise exception 'solicitacao ja finalizada (%): nao da para cancelar', v_req.status;
    end if;
  else
    if v_req.mentor_id <> v_uid then
      raise exception 'apenas o mentor pode responder a solicitacao' using errcode = '42501';
    end if;
    if v_novo in ('accepted', 'declined') and v_req.status <> 'pending' then
      raise exception 'solicitacao ja respondida (%)', v_req.status;
    end if;
    if v_novo = 'completed' and v_req.status <> 'accepted' then
      raise exception 'so da para concluir uma mentoria aceita (status atual: %)', v_req.status;
    end if;
  end if;

  update public.mentorship_requests
     set status = v_novo,
         response_note = case
           when v_novo in ('accepted', 'declined') then v_nota
           else response_note
         end,
         responded_at = case
           when v_novo in ('accepted', 'declined') then now()
           else responded_at
         end
   where id = p_id;

  return jsonb_build_object('id', p_id, 'status', v_novo);
end;
$fn$;

comment on function public.respond_mentorship_request(uuid, text, text) is
  'Mentor aceita/recusa/conclui e o aluno cancela, validando quem pode fazer o que em cada status.';

revoke all on function public.respond_mentorship_request(uuid, text, text) from public, anon;
grant execute on function public.respond_mentorship_request(uuid, text, text) to authenticated, service_role;

-- 7) Lista de mentores disponiveis (profiles so e legivel pelo proprio dono)
create or replace function public.get_mentors(p_busca text default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce(jsonb_agg(to_jsonb(m) order by lower(m.full_name)), '[]'::jsonb)
  from (
    select p.user_id,
           coalesce(p.full_name, 'Colega') as full_name,
           p.department,
           p.avatar_url,
           coalesce(to_jsonb(p.mentor_topics), '[]'::jsonb) as topics,
           p.mentor_bio as bio,
           (select r.status
              from public.mentorship_requests r
             where r.mentee_id = auth.uid()
               and r.mentor_id = p.user_id
             order by r.created_at desc
             limit 1) as meu_status
      from public.profiles p
     where p.is_mentor
       and coalesce(p.is_active, true)
       and p.user_id is distinct from auth.uid()
       and (
         nullif(btrim(coalesce(p_busca, '')), '') is null
         or p.full_name ilike '%' || btrim(p_busca) || '%'
         or p.department ilike '%' || btrim(p_busca) || '%'
         or p.mentor_bio ilike '%' || btrim(p_busca) || '%'
         or exists (
           select 1 from unnest(p.mentor_topics) as t
            where t ilike '%' || btrim(p_busca) || '%'
         )
       )
  ) m;
$fn$;

comment on function public.get_mentors(text) is
  'Lista os alunos disponiveis para mentorar (nome, area, temas, bio) e o status do ultimo pedido do usuario logado.';

revoke all on function public.get_mentors(text) from public, anon;
grant execute on function public.get_mentors(text) to authenticated, service_role;

-- 8) Painel do aluno: meu perfil de mentor + pedidos enviados e recebidos
create or replace function public.get_my_mentorship()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_perfil public.profiles;
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;

  select * into v_perfil from public.profiles p where p.user_id = v_uid;

  return jsonb_build_object(
    'sou_mentor', coalesce(v_perfil.is_mentor, false),
    'topics', coalesce(to_jsonb(v_perfil.mentor_topics), '[]'::jsonb),
    'bio', v_perfil.mentor_bio,
    'recebidos', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select r.id, r.topic, r.message, r.status, r.response_note,
               r.created_at, r.responded_at, r.mentee_id as pessoa_id,
               coalesce(pe.full_name, 'Colega') as pessoa_nome,
               pe.department as pessoa_area,
               pe.avatar_url as pessoa_avatar
          from public.mentorship_requests r
          left join public.profiles pe on pe.user_id = r.mentee_id
         where r.mentor_id = v_uid
      ) x
    ), '[]'::jsonb),
    'enviados', coalesce((
      select jsonb_agg(to_jsonb(y) order by y.created_at desc)
      from (
        select r.id, r.topic, r.message, r.status, r.response_note,
               r.created_at, r.responded_at, r.mentor_id as pessoa_id,
               coalesce(pm.full_name, 'Colega') as pessoa_nome,
               pm.department as pessoa_area,
               pm.avatar_url as pessoa_avatar
          from public.mentorship_requests r
          left join public.profiles pm on pm.user_id = r.mentor_id
         where r.mentee_id = v_uid
      ) y
    ), '[]'::jsonb)
  );
end;
$fn$;

comment on function public.get_my_mentorship() is
  'Painel de mentoria do usuario logado: se aceita mentorar, temas, bio, pedidos recebidos e enviados.';

revoke all on function public.get_my_mentorship() from public, anon;
grant execute on function public.get_my_mentorship() to authenticated, service_role;

notify pgrst, 'reload schema';