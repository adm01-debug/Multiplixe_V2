-- Permissões: funções internas deixam de ser executáveis pelo anon.
--
-- Causa (provada em produção com a chave publicável que vai no bundle do site):
--  - recalculate_user_goals(p_user_id => <outra conta>) devolvia 204 para anônimo, ou seja,
--    qualquer visitante escrevia nas metas de outro usuário: a guarda interna só compara
--    auth.uid() quando ele existe, e para anon auth.uid() é NULL, então a checagem era pulada.
--  - get_performance_comparison() devolvia 200 para anônimo, expondo médias da turma e a
--    contagem de alunos (student_count).
--
-- Escopo mínimo, verificado antes de aplicar: nenhuma política RLS, default de coluna ou
-- constraint referencia essas duas funções, e nenhuma tela as chama antes do login
-- (useGoals/GoalsWidget no Dashboard e usePerformanceComparison/Profile, ambos autenticados).
-- has_role NÃO é revogada de propósito: ela é avaliada dentro de políticas RLS abertas ao
-- anon (achievements, quizzes, quiz_questions, learning_paths, profiles...), então revogá-la
-- quebraria a leitura pública desses catálogos.

revoke execute on function public.recalculate_user_goals(uuid) from anon;
revoke execute on function public.get_performance_comparison() from anon;