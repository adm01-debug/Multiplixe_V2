-- =============================================================================
-- Hardening de privilégios de banco: view quiz_options_public e funções SECURITY DEFINER
--
-- Causa raiz
--
--   1) public.quiz_options_public é uma view SECURITY DEFINER (owner postgres, que
--      tem rolbypassrls) criada com GRANT ALL para anon e authenticated
--      (ACL: anon=arwdDxtm, authenticated=arwdDxtm). Como a view é definer, o SELECT
--      que ela contém roda como postgres e portanto NÃO passa pela RLS de quiz_options.
--      Qualquer visitante anônimo podia inserir, alterar, truncar e APAGAR as opções
--      de quiz de produção. Provado em transação revertida:
--        begin; set local role anon; delete from public.quiz_options_public; rollback;
--      => executou sem erro de permissão (68 linhas intactas apenas por causa do rollback).
--
--   2) As funções SECURITY DEFINER de public tinham EXECUTE para PUBLIC
--      (ACL "=X/postgres"), o que inclui anon. Isso deixava exposto, sem login,
--      tudo que estava marcado como definer: emissão de certificado
--      (issue_certificate), limpeza do bloqueio de brute force
--      (reset_login_attempts), concessão de XP a qualquer usuário (add_user_xp),
--      leitura das permissões de qualquer usuário (get_user_permissions), apagar
--      logs de segurança (cleanup_old_security_logs), spam de notificações e as
--      funções internas de trigger e de cron.
--
-- Correção
--
--   * quiz_options_public: apenas SELECT para authenticated. Escrita e acesso
--     anônimo revogados. A view continua SECURITY DEFINER de propósito: é o
--     mecanismo que expõe somente as 4 colunas seguras (id, question_id,
--     option_text, order_index) e esconde is_correct do aluno. Trocá-la para
--     security_invoker ou abrir política de SELECT na tabela base vazaria o
--     gabarito, então o definer é mantido e o acesso é que foi fechado.
--
--   * Funções SECURITY DEFINER: EXECUTE revogado de PUBLIC e de anon em massa
--     (bloqueia também qualquer função definer criada no futuro) e reconcedido
--     somente à superfície realmente usada:
--       - anon + authenticated ... pré-login e verificação pública de certificado
--       - authenticated .......... RPCs chamados pelo cliente e funções de trigger
--                                  (trigger roda com o privilégio de quem executa o
--                                  DML, logo o role precisa do EXECUTE)
--       - postgres / service_role  funções internas (cron, edge functions, trigger
--                                  de signup do GoTrue)
-- =============================================================================

-- 1) View pública de opções de quiz: leitura apenas, e só para usuário logado.
revoke all on public.quiz_options_public from public;
revoke all on public.quiz_options_public from anon;
revoke all on public.quiz_options_public from authenticated;
grant select on public.quiz_options_public to authenticated;

-- 2) Revoga EXECUTE de PUBLIC e de anon em todas as funções SECURITY DEFINER.
do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format('revoke execute on function %s from public', f.sig);
    execute format('revoke execute on function %s from anon', f.sig);
  end loop;
end $$;

-- 3) Funções internas (cron, tarefas de sistema, edge functions): nenhum usuário
--    logado pode chamar. Continuam disponíveis para postgres e service_role.
revoke execute on function public.check_rate_limit(inet, text, uuid) from authenticated;
revoke execute on function public.check_due_assessment_notifications() from authenticated;
revoke execute on function public.check_streak_risk_notifications() from authenticated;
revoke execute on function public.cleanup_old_security_logs() from authenticated;
revoke execute on function public.create_notification(uuid, text, text, text, text) from authenticated;
revoke execute on function public.get_user_permissions(uuid) from authenticated;
revoke execute on function public.has_permission(uuid, text) from authenticated;
revoke execute on function public.refresh_platform_stats() from authenticated;
revoke execute on function public.mcp_exec(text, integer) from authenticated;

-- 4) Superfície pública (páginas acessíveis sem login).
grant execute on function public.check_login_allowed(text) to anon, authenticated;
grant execute on function public.record_failed_login(text, inet) to anon, authenticated;
grant execute on function public.verify_certificate_by_code(text) to anon, authenticated;
grant execute on function public.verify_path_certificate_by_code(text) to anon, authenticated;
-- has_role é avaliada por 60 políticas de RLS; anon precisa do EXECUTE para que as
-- consultas anônimas continuem retornando vazio em vez de erro de permissão.
grant execute on function public.has_role(uuid, app_role) to anon, authenticated;

-- 5) RPCs efetivamente chamados pelo cliente (src/**), por usuário logado.
grant execute on function public.add_user_xp(uuid, integer, text) to authenticated;
grant execute on function public.check_and_award_achievements(uuid) to authenticated;
grant execute on function public.claim_daily_challenge_reward(uuid, uuid) to authenticated;
grant execute on function public.complete_pomodoro_session(uuid, text, integer) to authenticated;
grant execute on function public.create_audit_log(uuid, text, text, uuid, jsonb, jsonb, inet, jsonb) to authenticated;
grant execute on function public.get_department_leaderboard(integer) to authenticated;
grant execute on function public.get_due_assessments(uuid) to authenticated;
grant execute on function public.get_leaderboard(integer, text) to authenticated;
grant execute on function public.get_recommended_courses(uuid, integer) to authenticated;
grant execute on function public.get_smart_recommendations(uuid, integer) to authenticated;
grant execute on function public.get_user_rank(uuid) to authenticated;
grant execute on function public.get_xp_history(uuid, integer) to authenticated;
grant execute on function public.issue_learning_path_certificate(uuid, uuid, text, text) to authenticated;
grant execute on function public.register_playbook_view(uuid) to authenticated;
grant execute on function public.reset_login_attempts(text) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
grant execute on function public.update_user_streak(uuid) to authenticated;
-- issue_certificate é chamada pela edge function generate-certificate, que usa o
-- cliente com a chave anônima e o JWT do usuário, ou seja, roda como authenticated.
grant execute on function public.issue_certificate(uuid, uuid, text, text) to authenticated;

-- 6) Funções de trigger continuam acessíveis a quem dispara o DML.
grant execute on function public.handle_new_user() to authenticated, supabase_auth_admin;
grant execute on function public.audit_admin_changes() to authenticated;
grant execute on function public.audit_sales_enablement_changes() to authenticated;
grant execute on function public.notify_new_course() to authenticated;
grant execute on function public.notify_new_playbook_comment() to authenticated;
grant execute on function public.notify_onboarding_completion() to authenticated;
grant execute on function public.update_discussion_votes() to authenticated;
