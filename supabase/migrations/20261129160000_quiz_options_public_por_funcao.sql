-- A view quiz_options_public nao tinha security_invoker, entao rodava como a dona
-- (postgres) e ignorava a RLS de quiz_options: qualquer aluno autenticado lia as 68
-- opcoes, inclusive de quizzes que a RLS dele nao libera.
--
-- Postgres nao deixa marcar security_invoker numa view que expoe colunas ocultas da
-- tabela, e criar uma policy de SELECT em quiz_options para authenticated abriria o
-- is_correct (o gabarito). Por isso a leitura publica passa a ser por funcao
-- SECURITY DEFINER que devolve so as colunas de exibicao, e a view perde o acesso
-- (o admin continua usando a tabela, liberada pela RLS).
--
-- Ordem importa: sem revogar apos o grant, o GrantWizard do projeto reconcede.

create or replace function public.get_quiz_options_publicas(p_question_ids uuid[])
returns table (id uuid, question_id uuid, option_text text, order_index integer)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.question_id, o.option_text, o.order_index
  from public.quiz_options o
  where o.question_id = any(p_question_ids);
$$;

revoke all on function public.get_quiz_options_publicas(uuid[]) from public, anon;
grant execute on function public.get_quiz_options_publicas(uuid[]) to authenticated;

comment on function public.get_quiz_options_publicas(uuid[]) is
  'Opcoes de quiz para o aluno (sem is_correct). Usada por useQuizzes no lugar da view quiz_options_public.';

revoke all on public.quiz_options_public from anon, authenticated, public;