-- FUNC-011: agenda de estudos (planejamento de horarios de estudo).
-- Cria public.study_schedule, que faltava para a Agenda de Estudos: cada linha e um
-- bloco de estudo que o proprio usuario agenda (data, hora, duracao e curso opcional).
-- RLS habilitado com acesso restrito ao dono da linha em todas as operacoes.
-- Nao altera tabelas, politicas, grants, funcoes ou triggers existentes.

create table if not exists public.study_schedule (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid references public.courses (id) on delete set null,
  scheduled_date date not null,
  scheduled_time time,
  duration_minutes int not null default 30,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.study_schedule is
  'Blocos de estudo agendados pelo usuario (FUNC-011). Cada linha pertence a um unico usuario.';

create index if not exists study_schedule_user_date_idx
  on public.study_schedule (user_id, scheduled_date);

alter table public.study_schedule enable row level security;

drop policy if exists study_schedule_select_own on public.study_schedule;
create policy study_schedule_select_own
  on public.study_schedule
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists study_schedule_insert_own on public.study_schedule;
create policy study_schedule_insert_own
  on public.study_schedule
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists study_schedule_update_own on public.study_schedule;
create policy study_schedule_update_own
  on public.study_schedule
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists study_schedule_delete_own on public.study_schedule;
create policy study_schedule_delete_own
  on public.study_schedule
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.study_schedule to authenticated;