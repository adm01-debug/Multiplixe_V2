# Contexto do Multiplixe V2 para agentes

> GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — nao editar a mao; sera sobrescrito.

Commit: `4bad210177b6cb6c70c206d8c8506065c7f7e5f9` · branch `main` · 2026-11-28T13:08:17-03:00

## Como usar

| Pergunta | Onde responder |
|---|---|
| que rota existe, o que cada tela toca | `inventario/estado/rotas.json` |
| que edge function existe, quem a chama | `inventario/estado/edges.json` |
| tabela, RLS, policy, funcao, cron, bucket | `inventario/estado/schema-declarado.json` |
| estado real do banco (linhas, alertas) | `inventario/estado/banco.json` (so com token/consulta) |
| onde fica um componente, quem o usa | `inventario/ia/componentes.json` |
| que hook toca que tabela, quem usa | `inventario/ia/hooks.json` |
| ciclo de import, hub, arquivo orfao | `inventario/ia/grafo.json` |
| numeros do repo, divida, TODO, git | `inventario/ia/baseline.json` |

## Numeros

| | |
|---|---|
| arquivos (codigo) | 688 (559) |
| linhas de codigo | 79238 |
| paginas / rotas | 28 / 28 |
| componentes / hooks | 249 / 150 |
| arquivos de teste | 104 |
| edge functions | 13 |
| tabelas / migrations | 77 / 100 |

## Divida medida

`: any`: 2 · `console.log`: 14 · `@ts-ignore`: 1 · `eslint-disable`: 2 · TODO/FIXME: 5 · arquivos > 500 linhas: 7

## Rotas

| URL | arquivo | protegida | entradas na UI | tabelas | edges |
|---|---|---|---|---|---|
| `*` | src/pages/NotFound.tsx | nao | — | 0 | — |
| `/` | src/pages/Index.tsx | nao | navegacao-no-codigo, prefetch | 35 | detect-new-device, export-user-data, generate-certificate |
| `/admin` | src/pages/Admin.tsx | admin | navegacao-no-codigo, prefetch | 41 | admin-user-actions, approve-password-reset, detect-new-device, weekly-admin-digest |
| `/admin/security` | src/pages/RateLimitDashboard.tsx | admin | prefetch | 5 | detect-new-device |
| `/auth` | src/pages/Auth.tsx | nao | navegacao-no-codigo, prefetch | 1 | detect-new-device |
| `/avaliacao/:id` | src/pages/AssessmentRunner.tsx | sim | — | 4 | detect-new-device |
| `/avaliacoes` | src/pages/SkillAssessments.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo | 2 | detect-new-device |
| `/biblioteca-videos` | src/pages/VideoLibrary.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo | 2 | — |
| `/catalogo` | src/pages/Catalog.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo, prefetch | 35 | detect-new-device, export-user-data, generate-certificate |
| `/curso/:slug` | src/pages/CourseDetail.tsx | sim | — | 13 | detect-new-device |
| `/curso/:slug/aula/:lessonId` | src/pages/LessonPlayer.tsx | sim | prefetch | 16 | detect-new-device, generate-certificate |
| `/dashboard` | src/pages/Dashboard.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo, prefetch | 40 | detect-new-device, export-user-data, generate-certificate |
| `/flashcards` | src/pages/Flashcards.tsx | sim | command-palette, navegacao-no-codigo | 1 | detect-new-device |
| `/forgot-password` | src/pages/ForgotPassword.tsx | nao | navegacao-no-codigo, prefetch | 2 | — |
| `/loja` | src/pages/Store.tsx | sim | command-palette, menu-mobile, navegacao-no-codigo | 1 | detect-new-device |
| `/mentoria` | src/pages/Mentorship.tsx | sim | command-palette, navegacao-no-codigo | 2 | detect-new-device |
| `/onboarding` | src/pages/SalesOnboarding.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo | 2 | detect-new-device |
| `/onboarding/executar` | src/pages/OnboardingRuntime.tsx | sim | navegacao-no-codigo | 2 | detect-new-device |
| `/perfil` | src/pages/Profile.tsx | sim | command-palette, menu-mobile, navegacao-no-codigo, prefetch | 10 | detect-new-device, export-user-data, generate-certificate |
| `/playbook/:slug` | src/pages/PlaybookDetail.tsx | sim | — | 3 | ai-playbook-summarize, detect-new-device |
| `/playbooks` | src/pages/Playbooks.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo | 1 | — |
| `/ranking` | src/pages/Leaderboard.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo, prefetch | 0 | detect-new-device |
| `/reset-password` | src/pages/ResetPassword.tsx | nao | prefetch | 0 | — |
| `/seguranca` | src/pages/SecurityDashboard.tsx | sim | command-palette, navegacao-no-codigo, prefetch | 10 | approve-password-reset, detect-new-device |
| `/trilha/:slug` | src/pages/LearningPathDetail.tsx | sim | — | 34 | detect-new-device, export-user-data, generate-certificate |
| `/trilhas` | src/pages/LearningPaths.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo, prefetch | 34 | detect-new-device, export-user-data, generate-certificate |
| `/usuario/:id` | src/pages/PublicProfile.tsx | nao | — | 0 | — |
| `/verificar-certificado` | src/pages/VerifyCertificate.tsx | nao | prefetch | 1 | generate-certificate |

## Edge functions

| nome | linhas | segredos | chamada em | tabelas |
|---|---|---|---|---|
| `admin-user-actions` | 156 | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 1 | profiles, user_roles |
| `ai-playbook-summarize` | 76 | LOVABLE_API_KEY | 1 | — |
| `ai-quiz-generator` | 141 | LOVABLE_API_KEY, SUPABASE_ANON_KEY, SUPABASE_URL | 1 | — |
| `approve-password-reset` | 187 | RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 2 | password_reset_requests, user_roles |
| `cleanup-security-logs` | 67 | SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | **ninguem** | user_roles |
| `detect-new-device` | 287 | RESEND_API_KEY, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 1 | known_devices, security_alerts |
| `export-user-data` | 64 | SUPABASE_ANON_KEY, SUPABASE_URL | 1 | certificates, notifications, profiles, user_achievements, user_course_progress |
| `generate-certificate` | 211 | APP_PUBLIC_URL, SUPABASE_ANON_KEY, SUPABASE_URL | 1 | user_course_progress, user_quiz_attempts |
| `generate-sitemap` | 72 | APP_PUBLIC_URL, SUPABASE_ANON_KEY, SUPABASE_URL | **ninguem** | courses, learning_paths, playbooks, training_videos |
| `send-push` | 72 | PUSH_VAPID_SUBJECT, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 1 | notifications, push_subscriptions |
| `send-security-alert` | 166 | SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | **ninguem** | notifications, security_alerts, user_roles |
| `webhook-dispatch` | 221 | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 2 | webhook_deliveries |
| `weekly-admin-digest` | 285 | RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 3 | courses, profiles, user_course_progress, user_lesson_progress, user_roles, user_streaks, user_xp_history |

## Banco (declarado pelo repo)

77 tabelas · 215 policies · 116 funcoes · 9 cron jobs · 1 bucket(s) · 100 migrations

> nada aqui prova o banco ao vivo: types.ts e uma foto do momento em que o Lovable o gerou e o replay e o que o repo pediu. Para o estado real: scripts/inventario/banco.sql + gerar-banco.mjs.

| alerta | o que |
|---|---|
| `tabela_so_nas_migrations` | push_subscriptions |
| `tabela_sem_uso_no_codigo` | coin_transactions, daily_challenges, department_challenge_claims, platform_stats_cache, playbook_views, user_daily_challenge_progress, user_flashcard_progress, user_leagues, user_powerups, user_purchases |
| `funcao_sem_uso_no_codigo` | apply_coin_transaction, atualizar_reputacao, calcular_reputacao, check_due_assessment_notifications, check_rate_limit, check_streak_risk_notifications, department_challenge_progresso, get_recommended_courses, get_user_permissions, has_permission, mcp_exec, mentor_disponivel, recalcular_reputacao_perfil, refresh_platform_stats |
| `bucket_publico` | avatars |

### Cron

| job | agenda | chama edge |
|---|---|---|
| `avisar-avaliacoes-vencendo` | `0 11 * * *` | — |
| `avisar-risco-de-sequencia` | `0 21 * * *` | — |
| `cleanup-security-logs` | `20 3 * * *` | — |
| `reconciliar-segundo-fator` | `*/15 * * * *` | — |
| `refresh-platform-stats` | `0 * * * *` | — |
| `send-push` | `* * * * *` | send-push |
| `webhook-dispatch` | `* * * * *` | webhook-dispatch |
| `weekly-admin-digest` | `0 9 * * 1` | weekly-admin-digest |
| `weekly-ranking-webhook` | `0 9 * * 1` | — |

## Hubs (mais importados)

- `src/components/ui/button.tsx` (146)
- `src/integrations/supabase/client.ts` (116)
- `src/hooks/useAuth.tsx` (77)
- `src/components/ui/card.tsx` (73)
- `src/lib/utils.ts` (70)
- `src/components/ui/badge.tsx` (66)
- `src/components/ui/input.tsx` (43)
- `src/components/ui/dialog.tsx` (39)
- `src/components/ui/label.tsx` (29)
- `src/components/ui/progress.tsx` (25)

## Mexido nos ultimos 90 dias

- `PLANO_IMPLEMENTACAO_PENDENTES.md` (60)
- `inventario/estado/schema-declarado.json` (33)
- `src/integrations/supabase/types.ts` (29)
- `docs/agentes/regras-dominio.md` (20)
- `inventario/estado/rotas.json` (20)
- `inventario/ia/baseline.json` (19)
- `inventario/ia/componentes.json` (19)
- `inventario/ia/INDEX.md` (19)
- `inventario/ia/manifest.json` (19)
- `inventario/ia/grafo.json` (18)

## Scripts npm

- `npm run build` → `vite build`
- `npm run build:dev` → `vite build --mode development`
- `npm run contexto:ia` → `node scripts/ai-context/gerar.mjs`
- `npm run dev` → `vite`
- `npm run guard:supabase` → `node scripts/ci/supabase-usage-guard.mjs`
- `npm run guards` → `node --test scripts/ci/*.unit.mjs`
- `npm run inventario` → `node scripts/inventario/gerar-rotas.mjs && node scripts/inventario/gerar-repo.mjs < /dev/null && node scripts/inventario/gerar-schema.mjs && node scripts/ai-context/gerar.mjs`
- `npm run inventario:check` → `node scripts/inventario/gerar-rotas.mjs --check && node scripts/inventario/gerar-repo.mjs --check && node scripts/inventario/gerar-schema.mjs --check`
- `npm run lint` → `eslint .`
- `npm run preview` → `vite preview`

