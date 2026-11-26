-- UI-009: preview de video no hover do card de curso.
-- Coluna opcional com um video curto (mp4/webm, sem audio) exibido quando o mouse
-- para sobre o card. Nulo = o card segue apenas com a thumbnail.
alter table public.courses
  add column if not exists video_preview_url text;

comment on column public.courses.video_preview_url is
  'URL https do video curto de preview exibido no hover do card (mp4/webm, sem audio).';

alter table public.courses
  drop constraint if exists courses_video_preview_url_https_check;

alter table public.courses
  add constraint courses_video_preview_url_https_check
  check (video_preview_url is null or video_preview_url ~* '^https://');