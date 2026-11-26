-- FUNC-019: marcadores de tempo (capitulos) nas aulas
--
-- O aluno pula direto para o assunto que interessa e o player mostra onde
-- cada bloco comeca. O conteudo e autorado no painel do admin (LessonForm).

-- 1) Validador do JSONB: lista de { "title": texto, "start_seconds": inteiro >= 0 }
create or replace function public.chapters_validos(p_chapters jsonb)
returns boolean
language sql
immutable
set search_path = public
as $fn$
  select case
    when jsonb_typeof(p_chapters) is distinct from 'array' then false
    when jsonb_array_length(p_chapters) > 50 then false
    else coalesce((
      select bool_and(
        jsonb_typeof(item) = 'object'
        and case
          when jsonb_typeof(item -> 'title') is distinct from 'string' then false
          else length(btrim(item ->> 'title')) between 1 and 80
        end
        and case
          when jsonb_typeof(item -> 'start_seconds') is distinct from 'number' then false
          else (item ->> 'start_seconds')::numeric >= 0
               and (item ->> 'start_seconds')::numeric = trunc((item ->> 'start_seconds')::numeric)
        end
      )
      from jsonb_array_elements(p_chapters) as item
    ), true)
  end;
$fn$;

comment on function public.chapters_validos(jsonb) is
  'Valida a coluna lessons.chapters: array de ate 50 objetos {title (1-80 chars), start_seconds (inteiro >= 0)}.';

revoke all on function public.chapters_validos(jsonb) from public, anon;
grant execute on function public.chapters_validos(jsonb) to authenticated, service_role;

-- 2) Coluna
alter table public.lessons
  add column if not exists chapters jsonb not null default '[]'::jsonb;

alter table public.lessons
  drop constraint if exists lessons_chapters_validos;

alter table public.lessons
  add constraint lessons_chapters_validos check (public.chapters_validos(chapters));

comment on column public.lessons.chapters is
  'Capitulos da aula na ordem de reproducao: [{"title":"Introducao","start_seconds":0}, ...].';

notify pgrst, 'reload schema';