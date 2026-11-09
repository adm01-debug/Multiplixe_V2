# Contexto do Multiplixe V2 para agentes

> GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — nao editar a mao; sera sobrescrito.

Commit: `aa9184f368b80f0ceba46b04ae46cfdc0dd5f96d` · branch `claude/fix-workflow-gating-baseline-261109-1200` · 2026-11-09T00:37:42+00:00

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
| arquivos (codigo) | 478 (401) |
| linhas de codigo | 55249 |
| paginas / rotas | 24 / 24 |
| componentes / hooks | 218 / 99 |
| arquivos de teste | 36 |
| edge functions | 12 |
| tabelas / migrations | 61 / 49 |

## Divida medida

`: any`: 2 · `console.log`: 14 · `@ts-ignore`: 1 · `eslint-disable`: 2 · TODO/FIXME: 5 · arquivos > 500 linhas: 3

## Rotas

| URL | arquivo | protegida | entradas na UI | tabelas | edges |
|---|---|---|---|---|---|
| `*` | src/pages/NotFound.tsx | nao | — | 0 | — |
| `/` | src/pages/Index.tsx | nao | navegacao-no-codigo, prefetch | 32 | detect-new-device, export-user-data, generate-certificate |
| `/admin` | src/pages/Admin.tsx | admin | navegacao-no-codigo, prefetch | 26 | detect-new-device, weekly-admin-digest |
| `/admin/security` | src/pages/RateLimitDashboard.tsx | admin | prefetch | 5 | detect-new-device |
| `/auth` | src/pages/Auth.tsx | nao | navegacao-no-codigo, prefetch | 0 | detect-new-device |
| `/avaliacao/:id` | src/pages/AssessmentRunner.tsx | sim | — | 4 | detect-new-device |
| `/avaliacoes` | src/pages/SkillAssessments.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo | 2 | detect-new-device |
| `/biblioteca-videos` | src/pages/VideoLibrary.tsx | sim | atalho-teclado, command-palette | 2 | — |
| `/catalogo` | src/pages/Catalog.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo, prefetch | 31 | detect-new-device, export-user-data, generate-certificate |
| `/curso/:slug` | src/pages/CourseDetail.tsx | sim | — | 13 | detect-new-device |
| `/curso/:slug/aula/:lessonId` | src/pages/LessonPlayer.tsx | sim | — | 16 | detect-new-device, generate-certificate |
| `/dashboard` | src/pages/Dashboard.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo, prefetch | 38 | detect-new-device, export-user-data, generate-certificate |
| `/forgot-password` | src/pages/ForgotPassword.tsx | nao | navegacao-no-codigo, prefetch | 2 | — |
| `/onboarding` | src/pages/SalesOnboarding.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo | 2 | detect-new-device |
| `/onboarding/executar` | src/pages/OnboardingRuntime.tsx | sim | navegacao-no-codigo | 2 | detect-new-device |
| `/perfil` | src/pages/Profile.tsx | sim | command-palette, menu-mobile, navegacao-no-codigo, prefetch | 7 | detect-new-device, export-user-data, generate-certificate |
| `/playbook/:slug` | src/pages/PlaybookDetail.tsx | sim | — | 3 | ai-playbook-summarize, detect-new-device |
| `/playbooks` | src/pages/Playbooks.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo | 1 | — |
| `/ranking` | src/pages/Leaderboard.tsx | sim | atalho-teclado, command-palette, menu-mobile, navegacao-no-codigo, prefetch | 0 | detect-new-device |
| `/reset-password` | src/pages/ResetPassword.tsx | nao | prefetch | 0 | — |
| `/seguranca` | src/pages/SecurityDashboard.tsx | sim | command-palette, navegacao-no-codigo, prefetch | 9 | approve-password-reset, detect-new-device |
| `/trilha/:slug` | src/pages/LearningPathDetail.tsx | sim | — | 31 | detect-new-device, export-user-data, generate-certificate |
| `/trilhas` | src/pages/LearningPaths.tsx | sim | atalho-teclado, command-palette, navegacao-no-codigo, prefetch | 31 | detect-new-device, export-user-data, generate-certificate |
| `/verificar-certificado` | src/pages/VerifyCertificate.tsx | nao | prefetch | 1 | generate-certificate |

### Problemas de rota

- **entrada_ui_sem_rota** `/aula`: prefetch -> /aula: chave de prefetch que nenhuma rota alcanca (prefetchRouteChunk casa o caminho inteiro ou o 1o segmento) — nunca aquece nada

## Edge functions

| nome | linhas | segredos | chamada em | tabelas |
|---|---|---|---|---|
| `ai-playbook-summarize` | 76 | LOVABLE_API_KEY | 1 | — |
| `ai-quiz-generator` | 141 | LOVABLE_API_KEY, SUPABASE_ANON_KEY, SUPABASE_URL | 1 | — |
| `approve-password-reset` | 178 | RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 1 | password_reset_requests, user_roles |
| `cleanup-security-logs` | 40 | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | **ninguem** | — |
| `detect-new-device` | 266 | RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 1 | known_devices, security_alerts |
| `export-user-data` | 64 | SUPABASE_ANON_KEY, SUPABASE_URL | 1 | certificates, notifications, profiles, user_achievements, user_course_progress |
| `generate-certificate` | 211 | SUPABASE_ANON_KEY, SUPABASE_URL | 1 | user_course_progress, user_quiz_attempts |
| `generate-sitemap` | 72 | SUPABASE_ANON_KEY, SUPABASE_URL | **ninguem** | courses, learning_paths, playbooks, training_videos |
| `migrate-helper` | 35 | SUPABASE_DB_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | **ninguem** | — |
| `send-security-alert` | 121 | SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | **ninguem** | notifications, security_alerts, user_roles |
| `verify-mfa` | 96 | SUPABASE_ANON_KEY, SUPABASE_URL | **ninguem** | user_mfa_settings |
| `weekly-admin-digest` | 280 | RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL | 2 | courses, profiles, user_course_progress, user_lesson_progress, user_roles, user_streaks, user_xp_history |

## Banco (declarado pelo repo)

61 tabelas · 159 policies · 42 funcoes · 2 cron jobs · 1 bucket(s) · 49 migrations

> nada aqui prova o banco ao vivo: types.ts e uma foto do momento em que o Lovable o gerou e o replay e o que o repo pediu. Para o estado real: scripts/inventario/banco.sql + gerar-banco.mjs.

| alerta | o que |
|---|---|
| `tabela_so_no_types` | user_roles |
| `tabela_sem_uso_no_codigo` | password_reset_tokens, platform_stats_cache, playbook_views, saved_filters |
| `funcao_sem_uso_no_codigo` | check_due_assessment_notifications, check_rate_limit, check_streak_risk_notifications, get_user_permissions, has_permission, refresh_platform_stats, verify_path_certificate_by_code |
| `bucket_publico` | avatars |

### Cron

| job | agenda | chama edge |
|---|---|---|
| `refresh-platform-stats` | `0 * * * *` | — |
| `weekly-admin-digest` | `0 9 * * 1` | weekly-admin-digest |

## Hubs (mais importados)

- `src/components/ui/button.tsx` (118)
- `src/integrations/supabase/client.ts` (89)
- `src/lib/utils.ts` (62)
- `src/hooks/useAuth.tsx` (61)
- `src/components/ui/card.tsx` (56)
- `src/components/ui/badge.tsx` (50)
- `src/components/ui/input.tsx` (30)
- `src/components/ui/dialog.tsx` (29)
- `src/components/ui/label.tsx` (20)
- `src/components/ui/progress.tsx` (20)

## Mexido nos ultimos 90 dias

- `AGENTS.md` (3)
- `docs/agentes/lovable-vercel.md` (3)
- `docs/agentes/mapa-repo.md` (3)
- `inventario/ia/baseline.json` (3)
- `inventario/ia/INDEX.md` (3)
- `inventario/ia/manifest.json` (3)
- `scripts/ci/README.md` (3)
- `supabase/config.toml` (3)
- `.github/workflows/inventario-estado-semanal.yml` (2)
- `docs/agentes/banco.md` (2)

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

