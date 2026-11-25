-- ============================================================================
-- CORREÇÃO CRÍTICA DE SEGURANÇA
--
-- public.mcp_exec(sql text, max_rows integer) é SECURITY DEFINER e executa
-- SQL arbitrário recebido como texto. Estava com EXECUTE concedido ao role
-- `authenticated`, ou seja, qualquer usuário logado podia chamar
--   POST /rest/v1/rpc/mcp_exec  { "sql": "select * from auth.users" }
-- e ler/escrever qualquer tabela do banco como o owner da função,
-- ignorando RLS por completo.
--
-- Correção: remove a execução de `public`, `anon` e `authenticated` e mantém
-- apenas `service_role` (usado por ferramentas administrativas/MCP).
-- Também fixa o search_path para eliminar o risco de sequestro de resolução
-- de nomes dentro da função.
-- ============================================================================

do $$
declare
  f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'mcp_exec'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
    execute format('alter function %s set search_path = public, pg_catalog', f.sig);
  end loop;
end $$;