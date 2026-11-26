-- FUNC-009: flashcards de revisao com repeticao espacada (SRS)
-- Tabelas: flashcards (conteudo por curso) + user_flashcard_progress (estado SRS por aluno).

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  front text not null check (length(btrim(front)) > 0),
  back text not null check (length(btrim(back)) > 0),
  hint text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_flashcards_course on public.flashcards(course_id) where is_active;
create index if not exists idx_flashcards_lesson on public.flashcards(lesson_id);

create table if not exists public.user_flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flashcard_id uuid not null references public.flashcards(id) on delete cascade,
  ease_factor numeric(4,2) not null default 2.50 check (ease_factor >= 1.30 and ease_factor <= 3.20),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  last_grade smallint check (last_grade between 0 and 3),
  last_reviewed_at timestamptz,
  due_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, flashcard_id)
);

create index if not exists idx_user_flashcard_progress_due on public.user_flashcard_progress(user_id, due_at);

alter table public.flashcards enable row level security;
alter table public.user_flashcard_progress enable row level security;

drop policy if exists "Anyone can view active flashcards" on public.flashcards;
create policy "Anyone can view active flashcards" on public.flashcards
  for select to authenticated
  using (is_active or public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can manage flashcards" on public.flashcards;
create policy "Admins can manage flashcards" on public.flashcards
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role))
  with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Users can view own flashcard progress" on public.user_flashcard_progress;
create policy "Users can view own flashcard progress" on public.user_flashcard_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can insert own flashcard progress" on public.user_flashcard_progress;
create policy "Users can insert own flashcard progress" on public.user_flashcard_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own flashcard progress" on public.user_flashcard_progress;
create policy "Users can update own flashcard progress" on public.user_flashcard_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own flashcard progress" on public.user_flashcard_progress;
create policy "Users can delete own flashcard progress" on public.user_flashcard_progress
  for delete to authenticated using (auth.uid() = user_id);

drop trigger if exists update_flashcards_updated_at on public.flashcards;
create trigger update_flashcards_updated_at before update on public.flashcards
  for each row execute function public.update_updated_at_column();

drop trigger if exists update_user_flashcard_progress_updated_at on public.user_flashcard_progress;
create trigger update_user_flashcard_progress_updated_at before update on public.user_flashcard_progress
  for each row execute function public.update_updated_at_column();
-- ---------- SRS: revisao, fila e estatisticas ----------

create or replace function public.review_flashcard(p_flashcard_id uuid, p_grade smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_exists uuid;
  v_prog public.user_flashcard_progress;
  v_q integer;
  v_ef numeric(4,2);
  v_reps integer;
  v_interval integer;
  v_lapses integer;
  v_due timestamptz;
  v_xp integer;
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;
  if p_grade is null or p_grade < 0 or p_grade > 3 then
    raise exception 'p_grade invalido (0=errei, 1=dificil, 2=bom, 3=facil)';
  end if;

  select f.id into v_exists from public.flashcards f where f.id = p_flashcard_id and f.is_active;
  if v_exists is null then
    raise exception 'flashcard inexistente ou inativo' using errcode = 'P0002';
  end if;

  select * into v_prog
  from public.user_flashcard_progress p
  where p.user_id = v_uid and p.flashcard_id = p_flashcard_id;

  v_q := case p_grade when 0 then 2 when 1 then 3 when 2 then 4 else 5 end;
  v_ef := coalesce(v_prog.ease_factor, 2.50)::numeric(4,2)
          + (0.1 - (5 - v_q) * (0.08 + (5 - v_q) * 0.02));
  v_ef := greatest(1.30, least(3.20, round(v_ef, 2)));

  if p_grade = 0 then
    v_reps := 0;
    v_interval := 0;
    v_lapses := coalesce(v_prog.lapses, 0) + 1;
    v_due := now() + interval '10 minutes';
  else
    v_reps := coalesce(v_prog.repetitions, 0) + 1;
    v_interval := case
      when v_reps = 1 then 1
      when v_reps = 2 then 6
      else greatest(1, round(greatest(coalesce(v_prog.interval_days, 1), 1) * v_ef)::integer)
    end;
    v_lapses := coalesce(v_prog.lapses, 0);
    v_due := now() + make_interval(days => v_interval);
  end if;

  insert into public.user_flashcard_progress as ufp
    (user_id, flashcard_id, ease_factor, interval_days, repetitions, lapses, last_grade, last_reviewed_at, due_at)
  values
    (v_uid, p_flashcard_id, v_ef, v_interval, v_reps, v_lapses, p_grade, now(), v_due)
  on conflict (user_id, flashcard_id) do update set
    ease_factor = excluded.ease_factor,
    interval_days = excluded.interval_days,
    repetitions = excluded.repetitions,
    lapses = excluded.lapses,
    last_grade = excluded.last_grade,
    last_reviewed_at = excluded.last_reviewed_at,
    due_at = excluded.due_at,
    updated_at = now()
  returning * into v_prog;

  v_xp := case p_grade when 0 then 0 when 1 then 3 when 2 then 5 else 7 end;
  if v_xp > 0 then
    perform public.add_user_xp(v_uid, v_xp, 'flashcard');
  end if;

  return jsonb_build_object(
    'flashcard_id', p_flashcard_id,
    'grade', p_grade,
    'ease_factor', v_prog.ease_factor,
    'interval_days', v_prog.interval_days,
    'repetitions', v_prog.repetitions,
    'lapses', v_prog.lapses,
    'due_at', v_prog.due_at,
    'xp_awarded', v_xp,
    'mastered', (v_prog.repetitions >= 5)
  );
end;
$fn$;

create or replace function public.get_due_flashcards(p_course_id uuid default null, p_limit integer default 20)
returns table (
  id uuid,
  course_id uuid,
  lesson_id uuid,
  front text,
  back text,
  hint text,
  due_at timestamptz,
  repetitions integer,
  interval_days integer,
  ease_factor numeric,
  is_new boolean
)
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_limit integer := greatest(1, least(coalesce(p_limit, 20), 100));
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;

  return query
  select f.id,
         f.course_id,
         f.lesson_id,
         f.front,
         f.back,
         f.hint,
         coalesce(p.due_at, now()) as due_at,
         coalesce(p.repetitions, 0) as repetitions,
         coalesce(p.interval_days, 0) as interval_days,
         coalesce(p.ease_factor, 2.50) as ease_factor,
         (p.id is null) as is_new
  from public.flashcards f
  left join public.user_flashcard_progress p
    on p.flashcard_id = f.id and p.user_id = v_uid
  where f.is_active
    and (p_course_id is null or f.course_id = p_course_id)
    and (p.id is null or p.due_at <= now())
  order by (p.id is null), coalesce(p.due_at, now()), f.created_at
  limit v_limit;
end;
$fn$;

create or replace function public.get_flashcard_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_uid uuid := auth.uid();
  v_decks jsonb;
  v_total integer;
  v_due integer;
  v_new integer;
  v_mastered integer;
begin
  if v_uid is null then
    raise exception 'nao autenticado' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(d order by d->>'titulo'), '[]'::jsonb) into v_decks
  from (
    select jsonb_build_object(
             'course_id', f.course_id,
             'titulo', c.title,
             'slug', c.slug,
             'total', count(*),
             'pendentes', count(*) filter (
               where p.id is null or p.due_at <= now()
             ),
             'dominados', count(*) filter (
               where p.repetitions >= 5
             )
           ) as d
    from public.flashcards f
    join public.courses c on c.id = f.course_id
    left join public.user_flashcard_progress p
      on p.flashcard_id = f.id and p.user_id = v_uid
    where f.is_active
    group by f.course_id, c.title, c.slug
  ) s;

  select count(*),
         count(*) filter (where p.id is null or p.due_at <= now()),
         count(*) filter (where p.id is null),
         count(*) filter (where p.repetitions >= 5)
    into v_total, v_due, v_new, v_mastered
  from public.flashcards f
  left join public.user_flashcard_progress p
    on p.flashcard_id = f.id and p.user_id = v_uid
  where f.is_active;

  return jsonb_build_object(
    'decks', v_decks,
    'total', coalesce(v_total, 0),
    'pendentes', coalesce(v_due, 0),
    'novos', coalesce(v_new, 0),
    'dominados', coalesce(v_mastered, 0)
  );
end;
$fn$;

revoke all on function public.review_flashcard(uuid, smallint) from public;
revoke all on function public.review_flashcard(uuid, smallint) from anon;
grant execute on function public.review_flashcard(uuid, smallint) to authenticated;

revoke all on function public.get_due_flashcards(uuid, integer) from public;
revoke all on function public.get_due_flashcards(uuid, integer) from anon;
grant execute on function public.get_due_flashcards(uuid, integer) to authenticated;

revoke all on function public.get_flashcard_overview() from public;
revoke all on function public.get_flashcard_overview() from anon;
grant execute on function public.get_flashcard_overview() to authenticated;

grant select on public.flashcards to authenticated;
grant select, insert, update, delete on public.user_flashcard_progress to authenticated;
grant insert, update, delete on public.flashcards to authenticated;