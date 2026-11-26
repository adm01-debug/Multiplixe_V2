alter table public.lessons add column if not exists transcript text;

alter table public.lessons drop constraint if exists lessons_transcript_tamanho_check;
alter table public.lessons add constraint lessons_transcript_tamanho_check
  check (transcript is null or char_length(transcript) <= 200000);

comment on column public.lessons.transcript is 'Transcricao da aula: uma linha por trecho, opcionalmente prefixada por m:ss ou h:mm:ss. Consumida pelo painel de transcricao do player.';
