-- GAME-012: sistema de reputacao
--
-- XP mede o quanto o aluno estuda; reputacao mede o quanto ele ajuda os
-- colegas. A coluna em profiles e um cache derivado: quem manda sao os votos
-- recebidos e as respostas dadas em discussoes de outras pessoas. Toda escrita
-- em profiles recalcula o valor, entao ninguem consegue inflar a propria
-- reputacao editando o perfil, e interacoes consigo mesmo nao contam.

-- 1) Coluna em profiles
alter table public.profiles add column if not exists reputation integer not null default 0;

alter table public.profiles drop constraint if exists profiles_reputation_nao_negativa;
alter table public.profiles add constraint profiles_reputation_nao_negativa
  check (reputation >= 0);

comment on column public.profiles.reputation is
  'Reputacao social (cache): votos recebidos de outros colegas, respostas dadas e respostas aceitas.';

-- 2) Composicao da reputacao (fonte unica do calculo)
--    +1 por voto a favor recebido, -1 por voto contra, +2 por resposta dada e
--    +5 quando a resposta e aceita. Votos do proprio autor e respostas na
--    propria discussao ficam de fora. O piso e zero.
create or replace function public.detalhar_reputacao(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $fn$
  with votos as (
    select
      count(*) filter (where v.vote_type = 'up') as positivos,
      count(*) filter (where v.vote_type = 'down') as negativos
    from public.discussion_votes v
    where p_user_id is not null
      and v.user_id <> p_user_id
      and (
        exists (
          select 1 from public.course_discussions d
          where d.id = v.discussion_id and d.user_id = p_user_id
        )
        or exists (
          select 1 from public.discussion_replies r
          where r.id = v.reply_id and r.user_id = p_user_id
        )
      )
  ), respostas as (
    select
      count(*) as total,
      count(*) filter (where coalesce(r.is_answer, false)) as aceitas
    from public.discussion_replies r
    join public.course_discussions d on d.id = r.discussion_id
    where p_user_id is not null
      and r.user_id = p_user_id
      and d.user_id <> p_user_id
  )
  select jsonb_build_object(
    'total', greatest(0,
      coalesce(v.positivos, 0) - coalesce(v.negativos, 0)
      + 2 * coalesce(r.total, 0)
      + 5 * coalesce(r.aceitas, 0)),
    'votos_recebidos', coalesce(v.positivos, 0),
    'votos_negativos', coalesce(v.negativos, 0),
    'respostas', coalesce(r.total, 0),
    'respostas_aceitas', coalesce(r.aceitas, 0)
  )
  from votos v cross join respostas r;
$fn$;

comment on function public.detalhar_reputacao(uuid) is
  'Abre a reputacao do usuario em votos recebidos, respostas e respostas aceitas, com o total ja calculado.';

create or replace function public.calcular_reputacao(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $fn$
  select coalesce((public.detalhar_reputacao(p_user_id) ->> 'total')::integer, 0);
$fn$;

comment on function public.calcular_reputacao(uuid) is
  'Total de reputacao do usuario (mesma conta de detalhar_reputacao, sem o detalhe).';

-- 3) A coluna nunca guarda um valor inventado: qualquer update em profiles
--    recalcula. Roda depois de protect_profile_admin_columns (ordem alfabetica
--    dos triggers BEFORE) e antes de update_profiles_updated_at.
create or replace function public.recalcular_reputacao_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  new.reputation := public.calcular_reputacao(new.user_id);
  return new;
end;
$fn$;

comment on function public.recalcular_reputacao_perfil() is
  'Mantem profiles.reputation coerente com votos e respostas a cada escrita no perfil.';

drop trigger if exists trigger_recalcular_reputacao on public.profiles;
create trigger trigger_recalcular_reputacao
  before update on public.profiles
  for each row execute function public.recalcular_reputacao_perfil();

-- 4) Coleta: quem ganha ou perde reputacao quando o colega vota, responde ou
--    quando a resposta e aceita.
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
    update public.profiles
       set reputation = public.calcular_reputacao(v_id)
     where user_id = v_id;
  end loop;

  return null;
end;
$fn$;

comment on function public.atualizar_reputacao() is
  'Recalcula a reputacao de quem foi afetado por voto, resposta ou remocao de discussao.';

drop trigger if exists trigger_reputacao_votos on public.discussion_votes;
create trigger trigger_reputacao_votos
  after insert or update or delete on public.discussion_votes
  for each row execute function public.atualizar_reputacao();

-- A tabela de respostas tem dois gatilhos separados porque o de update so
-- precisa acordar quando a resposta muda de dono ou passa a ser aceita; o
-- update de upvotes (feito por update_discussion_votes) nao mexe na reputacao.
drop trigger if exists trigger_reputacao_respostas on public.discussion_replies;
create trigger trigger_reputacao_respostas
  after insert or delete on public.discussion_replies
  for each row execute function public.atualizar_reputacao();

drop trigger if exists trigger_reputacao_resposta_aceita on public.discussion_replies;
create trigger trigger_reputacao_resposta_aceita
  after update of is_answer, user_id on public.discussion_replies
  for each row execute function public.atualizar_reputacao();

drop trigger if exists trigger_reputacao_discussao_removida on public.course_discussions;
create trigger trigger_reputacao_discussao_removida
  after delete on public.course_discussions
  for each row execute function public.atualizar_reputacao();

-- 5) Backfill: fecha o historico ja existente
update public.profiles
   set reputation = public.calcular_reputacao(user_id);

-- 6) Perfil publico passa a divulgar a reputacao (junto com XP, sequencia e
--    conquistas). Criado a partir da definicao vigente, com uma coluna e uma
--    chave novas.
create or replace function public.get_public_profile(p_user_id uuid)
returns json
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare
  v_profile record;
  v_xp record;
  v_streak record;
begin
  if p_user_id is null then
    return json_build_object('available', false, 'reason', 'invalid');
  end if;

  select user_id, full_name, department, avatar_url, created_at, is_public, reputation
  into v_profile
  from public.profiles
  where user_id = p_user_id and coalesce(is_active, true) = true;

  if not found then
    return json_build_object('available', false, 'reason', 'not_found');
  end if;

  if not coalesce(v_profile.is_public, false) then
    return json_build_object('available', false, 'reason', 'private');
  end if;

  select total_xp, current_level into v_xp from public.user_xp where user_id = p_user_id;
  select current_streak, longest_streak into v_streak from public.user_streaks where user_id = p_user_id;

  return json_build_object(
    'available', true,
    'profile', json_build_object(
      'user_id', v_profile.user_id,
      'full_name', v_profile.full_name,
      'department', v_profile.department,
      'avatar_url', v_profile.avatar_url,
      'member_since', v_profile.created_at,
      'reputation', coalesce(v_profile.reputation, 0)
    ),
    'xp', json_build_object(
      'total_xp', coalesce(v_xp.total_xp, 0),
      'current_level', coalesce(v_xp.current_level, 1)
    ),
    'streak', json_build_object(
      'current', coalesce(v_streak.current_streak, 0),
      'longest', coalesce(v_streak.longest_streak, 0)
    ),
    'achievements', coalesce((
      select json_agg(json_build_object(
        'slug', a.slug,
        'name', a.name,
        'description', a.description,
        'icon', a.icon,
        'gradient', a.gradient,
        'xp_reward', a.xp_reward,
        'unlocked_at', ua.unlocked_at
      ) order by ua.unlocked_at desc)
      from public.user_achievements ua
      join public.achievements a on a.id = ua.achievement_id
      where ua.user_id = p_user_id and coalesce(a.is_secret, false) = false
    ), '[]'::json),
    'completed_courses', coalesce((
      select json_agg(json_build_object(
        'title', c.title,
        'slug', c.slug,
        'completed_at', p.completed_at
      ) order by p.completed_at desc)
      from public.user_course_progress p
      join public.courses c on c.id = p.course_id
      where p.user_id = p_user_id and coalesce(p.progress_percentage, 0) >= 100
    ), '[]'::json),
    'certificates_count', coalesce((select count(*) from public.certificates where user_id = p_user_id), 0)::int
  );
end;
$function$;

-- 7) Permissoes: as funcoes novas so servem para o app logado; nada aberto para
--    anon e nenhuma delas executavel por PUBLIC (padrao das outras funcoes de
--    discussao do projeto).
revoke all on function public.detalhar_reputacao(uuid) from public, anon;
grant execute on function public.detalhar_reputacao(uuid) to authenticated, service_role;

revoke all on function public.calcular_reputacao(uuid) from public, anon;
grant execute on function public.calcular_reputacao(uuid) to authenticated, service_role;

revoke all on function public.atualizar_reputacao() from public, anon;
grant execute on function public.atualizar_reputacao() to authenticated, service_role;

revoke all on function public.recalcular_reputacao_perfil() from public, anon;
grant execute on function public.recalcular_reputacao_perfil() to authenticated, service_role;

notify pgrst, 'reload schema';
