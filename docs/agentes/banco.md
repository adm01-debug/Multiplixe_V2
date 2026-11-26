# Banco de dados — referência para agentes

Ler quando for rodar SQL, criar/aplicar migration ou entender a estrutura. Resumo das regras no
`AGENTS.md`; aqui está o detalhe.

## Onde se trabalha

| Situação | Banco | Como |
|---|---|---|
| Diagnóstico | **produção, só leitura** | **não há MCP nesta sessão** (ver abaixo) → leia `src/integrations/supabase/types.ts` e `supabase/migrations/`; dado ao vivo = chame o dono |
| DDL / migration nova | produção | **só o dono**, pelo Lovable Cloud → SQL Editor; o Lovable gera o arquivo em `supabase/migrations/` e commita |
| Teste de comportamento de banco | — | não existe harness de banco neste repo (sem CLI, sem Postgres descartável, sem CI) |
| Migration destrutiva, segredos, rotação de chave | **só com o dono** | — |

## Banco OFICIAL

| O que | Valor |
|---|---|
| Projeto | **`ywsblgsikhiscvpmopkp`** — `supabase/config.toml:1` (`project_id`) |
| Origem | **Lovable Cloud** (Supabase gerenciado pelo Lovable; Auth, Postgres+RLS, Storage, Edge Functions) |
| Credenciais do front | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — o `.env` **está versionado** e é gerenciado pelo Lovable; não edite à mão |
| Cliente | `src/integrations/supabase/client.ts` (gerado, com `persistSession` + `autoRefreshToken`) |
| Tipos | `src/integrations/supabase/types.ts` (gerado, 2.822 linhas) |
| MCP para SQL | **nenhum** |

### Não existe MCP para este banco

Checado nesta sessão: `SUPABASE - GESTÃO DE CLIENTES` → `pgxfvjmuubtbowutlide`;
`SUPABASE - GESTÃO DE PRODUTOS` → `doufsxqlfjyuvxuezpln`; `SUPABASE - ZAPP WEB V2 - MCP` →
`tnnnlkbymytvtqngbbqh`. Nenhum é `ywsblgsikhiscvpmopkp`. O plugin `rls-schema-explorer:supabase` não
conectou (`ERR_PROXY_TUNNEL`) e não foi possível saber para qual projeto aponta — **NÃO VERIFICADO**.

Consequências práticas:
1. O banco é acessível pela **Management API** do Supabase
   (`POST https://api.supabase.com/v1/projects/ywsblgsikhiscvpmopkp/database/query`, PAT do dono): dá para
   rodar `SELECT` de diagnóstico, conferir RLS ao vivo, ler o resultado de `EXPLAIN` e aplicar DDL.
   Afirmação sobre o banco sem essa consulta sai de arquivo versionado (`types.ts`, `migrations/`) e
   precisa ser marcada como "declarado no repo, não verificado ao vivo".
2. **Nunca** escreva nos bancos dos MCPs acima: são outros sistemas (CRM, Catálogo, Zapp Web V2). Nome
   parecido de MCP já causou escrita no banco errado em outro projeto — confira qual MCP carregou.
3. Precisa de dado real ou de DDL? Use a Management API do item 1 — ela cobre `SELECT`, estado de RLS e
   aplicação de migration sem depender de MCP. O painel do Lovable Cloud é só consulta manual.

## Migrations

- `supabase/migrations/` tem **73 arquivos** `.sql`. Os primeiros vieram do Lovable
  (`<timestamp>_<uuid>.sql`); os escritos por agente usam `<timestamp>_<assunto>.sql`. O arquivo é o
  **registro do que já foi aplicado**, não fila de entrada: criar arquivo novo não aplica nada.
- Não existe ledger consultável, `supabase/config.toml` só declara `project_id` e `verify_jwt` por função, e
  não há workflow de deploy. Ordem obrigatória: **dry-run em produção** (`begin; <DDL>; …; rollback;` e ler o
  resultado) → **aplicar de verdade** → **conferir o objeto** pela Management API → commitar o arquivo `.sql`
  junto do `src/integrations/supabase/types.ts` atualizado.
- Mudança de contrato de função/tabela usada pelo front (`REVOKE`, `DROP`, rename) exige o deploy do front
  **antes** — o Vercel só publica no merge da `main` (`docs/agentes/lovable-vercel.md`).

## Estrutura declarada (de `types.ts`)

- **61 tabelas**, **1 view** (`quiz_options_public`), **32 funções**, **1 enum**
  (`app_role: "admin" | "user" | "gestor"`, `types.ts:2690-2692` e `Constants.public.Enums`).
- Domínios: conteúdo (`courses`, `lessons`, `learning_paths`, `learning_path_courses`, `playbooks`,
  `training_videos`, `skill_assessments`, `quizzes`/`quiz_questions`/`quiz_options`), progresso
  (`user_course_progress`, `user_lesson_progress`, `user_learning_path_progress`, `user_quiz_attempts`,
  `user_assessment_results`), gamificação (`user_xp`, `user_xp_history`, `user_streaks`, `achievements`,
  `user_achievements`, `daily_challenges`, `user_daily_challenge_progress`, `user_goals`,
  `pomodoro_sessions`), certificados (`certificates`, `learning_path_certificates`), social
  (`course_discussions`, `discussion_replies`, `discussion_votes`, `playbook_comments`, `user_notes`,
  `user_favorites`), segurança (`user_roles`, `permissions`, `role_permissions`, `audit_logs`,
  `login_attempts`, `password_reset_requests`, `password_reset_tokens`, `rate_limit_config`,
  `rate_limit_logs`, `blocked_ips`, `whitelisted_ips`, `geo_blocking_config`, `geo_countries`,
  `known_devices`, `security_alerts`, `user_mfa_settings`, `webauthn_credentials`, `user_sessions`),
  plataforma (`profiles`, `notifications`, `platform_stats_cache`, `saved_filters`,
  `newsletter_subscriptions`, `onboarding_workflows`, `user_onboarding_progress`).
- RLS: as migrations têm **175 `CREATE POLICY`** e `ENABLE ROW LEVEL SECURITY` em 31 arquivos. Cobertura por
  tabela ao vivo: **NÃO VERIFICADO** (sem MCP).
- Papel **nunca** em `profiles`: `user_roles` + RPC `has_role(_user_id, _role)`
  (`src/hooks/useAdminRole.ts:19`), com `permissions`/`role_permissions` e `has_permission`/
  `get_user_permissions` para permissão fina.
- RPCs que o front usa como contrato (mudar = mudar os dois lados): `add_user_xp`,
  `check_and_award_achievements`, `update_user_streak`, `submit_quiz_attempt`, `issue_certificate`,
  `issue_learning_path_certificate`, `verify_certificate_by_code`, `verify_path_certificate_by_code`,
  `check_login_allowed`, `record_failed_login`, `reset_login_attempts`, `check_rate_limit`, `has_role`,
  `has_permission`, `get_user_permissions`, `get_leaderboard`, `get_department_leaderboard`, `get_user_rank`,
  `get_xp_history`, `get_platform_stats`, `refresh_platform_stats`, `get_recommended_courses`,
  `get_smart_recommendations`, `get_due_assessments`, `check_due_assessment_notifications`,
  `check_streak_risk_notifications`, `claim_daily_challenge_reward`, `complete_pomodoro_session`,
  `create_notification`, `create_audit_log`, `register_playbook_view`, `cleanup_old_security_logs`.
