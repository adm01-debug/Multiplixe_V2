-- GAME-012 (endurecimento): a marcacao de "resposta aceita" passa a ser de quem
-- abriu a discussao, e o recalculo da reputacao espera votos concorrentes.

-- 1) Policy: quem abriu a discussao modera as respostas dela. Antes so o autor
--    da resposta escrevia na propria linha, o que entregava a marcacao de
--    resposta aceita (e os +5 de reputacao) a quem respondeu.
drop policy if exists "Donos da discussao moderam respostas" on public.discussion_replies;
create policy "Donos da discussao moderam respostas"
  on public.discussion_replies
  for update
  to public
  using (
    exists (
      select 1 from public.course_discussions d
      where d.id = discussion_replies.discussion_id and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.course_discussions d
      where d.id = discussion_replies.discussion_id and d.user_id = auth.uid()
    )
  );

-- 2) Trigger: so o dono da discussao muda is_answer; o autor da resposta nao
--    auto-aceita, e o dono nao reescreve conteudo nem autoria de terceiros.
create or replace function public.proteger_marcacao_resposta()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_dono uuid;
begin
  -- auth.uid() nulo = service_role (edge functions) ou migration.
  if v_uid is null or public.has_role(v_uid, 'admin'::public.app_role) then
    return new;
  end if;

  select d.user_id into v_dono
    from public.course_discussions d
   where d.id = old.discussion_id;

  if v_dono is not distinct from v_uid then
    if old.user_id is distinct from v_uid
       and (new.content is distinct from old.content
            or new.user_id is distinct from old.user_id
            or new.discussion_id is distinct from old.discussion_id) then
      raise exception 'Quem abriu a discussao so pode marcar ou desmarcar a resposta aceita.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if old.user_id = v_uid and new.is_answer is distinct from old.is_answer then
    raise exception 'Apenas quem abriu a discussao pode marcar a resposta como aceita.'
      using errcode = '42501';
  end if;

  return new;
end;
$fn$;

comment on function public.proteger_marcacao_resposta() is
  'Restringe a marcacao de resposta aceita a quem abriu a discussao.';

revoke all on function public.proteger_marcacao_resposta() from public, anon;
grant execute on function public.proteger_marcacao_resposta() to authenticated, service_role;

drop trigger if exists trigger_proteger_marcacao_resposta on public.discussion_replies;
create trigger trigger_proteger_marcacao_resposta
  before update on public.discussion_replies
  for each row execute function public.proteger_marcacao_resposta();

-- 3) Votos concorrentes: dois votos simultaneos liam o mesmo retrato antigo e o
--    ultimo gravava um total desatualizado. O bloqueio da linha do perfil
--    serializa o recalculo e o update seguinte ja le os votos confirmados.
create or replace function public.atualizar_reputacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_ids uuid[] := '{}';
  v_dono uuid;
  v_id uuid;
begin
  if tg_table_name = 'discussion_votes' then
    if tg_op in ('INSERT', 'UPDATE') then
      if new.discussion_id is not null then
        select user_id into v_dono from public.course_discussions where id = new.discussion_id;
        if v_dono is not null then v_ids := array_append(v_ids, v_dono); end if;
      end if;
      if new.reply_id is not null then
        select user_id into v_dono from public.discussion_replies where id = new.reply_id;
        if v_dono is not null then v_ids := array_append(v_ids, v_dono); end if;
      end if;
    end if;
    if tg_op in ('UPDATE', 'DELETE') then
      if old.discussion_id is not null then
        select user_id into v_dono from public.course_discussions where id = old.discussion_id;
        if v_dono is not null then v_ids := array_append(v_ids, v_dono); end if;
      end if;
      if old.reply_id is not null then
        select user_id into v_dono from public.discussion_replies where id = old.reply_id;
        if v_dono is not null then v_ids := array_append(v_ids, v_dono); end if;
      end if;
    end if;
  elsif tg_table_name = 'discussion_replies' then
    if tg_op in ('INSERT', 'UPDATE') and new.user_id is not null then
      v_ids := array_append(v_ids, new.user_id);
    end if;
    if tg_op in ('UPDATE', 'DELETE') and old.user_id is not null then
      v_ids := array_append(v_ids, old.user_id);
    end if;
  elsif tg_table_name = 'course_discussions' then
    if tg_op = 'DELETE' and old.user_id is not null then
      v_ids := array_append(v_ids, old.user_id);
    end if;
  end if;

  foreach v_id in array v_ids loop
    perform 1 from public.profiles where user_id = v_id for update;
    update public.profiles
       set reputation = public.calcular_reputacao(v_id)
     where user_id = v_id;
  end loop;

  return null;
end;
$fn$;

comment on function public.atualizar_reputacao() is
  'Recalcula a reputacao de quem foi afetado por voto, resposta ou remocao de discussao, serializando por perfil.';

-- 4) Fecha o historico: nenhuma reputacao gravada antes da trava.
update public.profiles
   set reputation = public.calcular_reputacao(user_id);
