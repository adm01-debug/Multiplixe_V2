-- A landing publica (/) lista os cursos publicados sem sessao
-- (src/components/landing/FeaturedCoursesPreview.tsx). A RLS de `courses` so
-- tinha SELECT para `authenticated`, entao o visitante anonimo recebia 0 linhas
-- e a secao "Cursos em destaque" nunca aparecia para quem ainda nao entrou.
drop policy if exists "Public can view published courses" on public.courses;

create policy "Public can view published courses"
  on public.courses
  for select
  to anon
  using (is_published = true);