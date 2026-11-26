-- FUNC-012: progresso real das metas de estudo.
-- Antes desta funcao, user_goals.current_value nunca era atualizado: toda meta ficava
-- travada em 0 (o hook updateGoalProgress existia no front mas nao era chamado em lugar
-- nenhum). Agora o valor e derivado dos dados que o aluno ja produz.
-- Fontes: user_xp_history (xp do dia), user_lesson_progress (aulas e horas da semana),
-- user_course_progress (cursos concluidos no mes).
-- Nao altera tabelas, colunas, politicas, grants, indices ou triggers existentes.

create or replace function public.recalculate_user_goals(p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user uuid := coalesce(p_user_id, auth.uid());
  v_goal record;
  v_value integer;
  v_done boolean;
begin
  if v_user is null then
    return;
  end if;

  if auth.uid() is not null and auth.uid() <> v_user then
    raise exception 'sem permissao para recalcular metas de outro usuario';
  end if;

  for v_goal in
    select id, goal_type, target_value, current_value, start_date, end_date, completed
    from public.user_goals
    where user_id = v_user
  loop
    v_value := 0;

    case v_goal.goal_type
      when 'xp_day' then
        select coalesce(sum(h.xp_amount), 0)::int
          into v_value
          from public.user_xp_history h
         where h.user_id = v_user
           and h.created_at >= v_goal.start_date::timestamptz
           and h.created_at < (v_goal.end_date + 1)::timestamptz;
      when 'lessons_week' then
        select count(*)::int
          into v_value
          from public.user_lesson_progress l
         where l.user_id = v_user
           and l.is_completed
           and l.completed_at >= v_goal.start_date::timestamptz
           and l.completed_at < (v_goal.end_date + 1)::timestamptz;
      when 'hours_week' then
        select (coalesce(sum(l.watched_seconds), 0) / 3600)::int
          into v_value
          from public.user_lesson_progress l
         where l.user_id = v_user
           and l.updated_at >= v_goal.start_date::timestamptz
           and l.updated_at < (v_goal.end_date + 1)::timestamptz;
      when 'courses_month' then
        select count(distinct c.course_id)::int
          into v_value
          from public.user_course_progress c
         where c.user_id = v_user
           and c.completed_at is not null
           and c.completed_at >= v_goal.start_date::timestamptz
           and c.completed_at < (v_goal.end_date + 1)::timestamptz;
      else
        v_value := v_goal.current_value;
    end case;

    v_done := v_value >= v_goal.target_value;

    update public.user_goals
       set current_value = v_value,
           completed = v_done,
           completed_at = case when v_done then coalesce(completed_at, now()) else null end,
           updated_at = now()
     where id = v_goal.id
       and (current_value is distinct from v_value
            or completed is distinct from v_done);
  end loop;
end;
$$;

comment on function public.recalculate_user_goals(uuid) is
  'Recalcula current_value/completed das metas do usuario a partir do progresso real (FUNC-012).';

-- Mantem as metas atualizadas quando o aluno estuda, sem depender do front.
create or replace function public.trg_recalculate_user_goals()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  begin
    perform public.recalculate_user_goals(coalesce(new.user_id, old.user_id));
  exception
    when others then
      -- meta nunca pode derrubar o salvamento do progresso da aula
      null;
  end;
  return null;
end;
$$;

drop trigger if exists trg_goals_after_lesson_progress on public.user_lesson_progress;
create trigger trg_goals_after_lesson_progress
  after insert or update on public.user_lesson_progress
  for each row execute function public.trg_recalculate_user_goals();

drop trigger if exists trg_goals_after_course_progress on public.user_course_progress;
create trigger trg_goals_after_course_progress
  after insert or update on public.user_course_progress
  for each row execute function public.trg_recalculate_user_goals();

drop trigger if exists trg_goals_after_xp_history on public.user_xp_history;
create trigger trg_goals_after_xp_history
  after insert on public.user_xp_history
  for each row execute function public.trg_recalculate_user_goals();

revoke all on function public.recalculate_user_goals(uuid) from public;
grant execute on function public.recalculate_user_goals(uuid) to authenticated, service_role;