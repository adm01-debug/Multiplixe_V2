# Mapa do repositório — referência para agentes

Ler quando precisar saber onde fica algo **antes** de buscar por texto. Não há grafo de código aqui
(`AGENTS.md` > Grafo de código): este arquivo é o índice.

## Onde olhar primeiro

| Precisa de | Leia |
|---|---|
| Regras de trabalho (git, PR, banco, comunicação) | `AGENTS.md` (+ `CLAUDE.md`, que só importa ele) |
| Qual banco, migration, estrutura de tabelas/RPC | `docs/agentes/banco.md` |
| Deploy, env var, secret, edge function | `docs/agentes/lovable-vercel.md` |
| Perímetro do GitHub, commit, merge | `docs/agentes/github-ci.md` |
| Regra de negócio que o código não deixa óbvio | `docs/agentes/regras-dominio.md` |
| O que a sessão anterior fez | `progress.txt` (raiz) — escreva no fim da sua |
| Contexto histórico (não é fonte de verdade) | `README.md`, `DOCUMENTACAO.md` (22 KB), `PLANO_MELHORIAS.md` (40 KB), `PLANO_IMPLEMENTACAO_PENDENTES.md` (33 KB), `.lovable/plan.md`, `.hermes.md` |

## Mapa rápido

| Onde | O que tem |
|---|---|
| `src/App.tsx` (153 linhas) | **todas as rotas** (`<Route path=…>`, linhas 116-140), providers (React Query, Helmet, Theme, Tooltip), `ProtectedRoute` e `RouteErrorBoundary` por rota |
| `src/pages/` | 24 telas: `Index` (landing), `Auth`, `ForgotPassword`, `ResetPassword`, `Dashboard`, `Catalog`, `CourseDetail`, `LessonPlayer`, `LearningPaths`, `LearningPathDetail`, `Playbooks`, `PlaybookDetail`, `VideoLibrary`, `SkillAssessments`, `AssessmentRunner`, `SalesOnboarding`, `OnboardingRuntime`, `Leaderboard`, `Profile`, `Admin`, `RateLimitDashboard`, `SecurityDashboard`, `VerifyCertificate`, `NotFound` |
| `src/components/` | 39 pastas por domínio: `catalog`, `course`, `player`, `quiz`, `learning-paths`, `playbooks`, `onboarding`, `gamification`, `leaderboard`, `dashboard`, `admin`, `analytics`, `security`, `rate-limit`, `notifications`, `discussions`, `social`, `share`, `goals`, `notes`, `favorites`, `calendar`, `pomodoro`, `recommendations`, `stats`, `activity`, `export`, `feedback`, `landing`, `navigation`, `profile`, `pwa`, `seo`, `skeletons`, `accessibility`, `command`, `dialogs`, `auth`, `ui` (shadcn, não editar sem motivo) |
| `src/hooks/` | 53 hooks, 1 arquivo por assunto (`useAuth`, `useAdminRole`, `useUserXP`, `useXPHistory`, `useStreaks`, `useAchievements`, `useCertificates`, `useQuizzes`, `useLearningPaths`, `usePlaybooks`, `useSkillAssessments`, `useOnboardingWorkflow`, `useRateLimitLogs`, `useMFA`, `usePasskeys`, `useSecurityAlerts`, `useTelemetry`…) |
| `src/lib/` | `i18n.ts`, `levelSystem.ts` (níveis/XP), `queryClient.ts`, `queryPersister.ts`, `routePrefetch.ts`, `continueLearning.ts`, `salesEnablementSchemas.ts` (zod), `shareImage.ts`, `telemetry.ts`, `toastHelpers.ts`, `utils.ts` |
| `src/integrations/` | **gerado pelo Lovable, não editar:** `supabase/client.ts`, `supabase/types.ts` (2.822 linhas), `lovable/index.ts` (OAuth Google/Apple via `@lovable.dev/cloud-auth-js`) |
| `src/test/` | 35 arquivos, **299 casos** (`it`/`test`), Vitest + jsdom, setup em `src/test/setup.ts`; inclui `security.test.ts`, `edgeFunctionSecurity.test.ts`, `accessibility.test.tsx`, `componentArchitecture.test.ts`, `designSystem.test.ts` |
| `supabase/functions/` | 12 edge functions Deno (ver `docs/agentes/lovable-vercel.md`) |
| `supabase/migrations/` | 49 `.sql` aplicados pelo Lovable (ver `docs/agentes/banco.md`) |
| `scripts/ci/` | `check-claude-md-integrity.mjs` (guard destas instruções) — ver `scripts/ci/README.md` |
| `public/` | PWA (`manifest`, ícones), `favicon.ico`, assets da landing |

## Comandos

Node 24 / npm (há `package-lock.json`). `bun.lock` e `bun.lockb` também estão versionados — herança do
import; **não troque de gerenciador numa PR de outro assunto**.

- dependências: `npm install` (o repo chega sem `node_modules`);
- testes do que você tocou: `npx vitest run src/test/<arquivo>.test.ts` — **`npm test` não existe**
  (`package.json` só tem `dev`, `build`, `build:dev`, `lint`, `preview`);
- typecheck: `npx tsc --noEmit -p tsconfig.app.json` — `strict: false`, `noImplicitAny: false`,
  `noUnusedLocals: false`: o config perdoa muito, erro que aparecer é real;
- lint: `npx eslint <arquivos>` (`npm run lint` varre o repo; `@typescript-eslint/no-unused-vars` está `off`);
- build: `npm run build` (saída em `dist/`);
- guard das instruções: `node scripts/ci/check-claude-md-integrity.mjs`;
- **não há** E2E (`@playwright/test` está em `dependencies`, mas não existe `e2e/` nem
  `playwright.config.*`), nem hook de git (`.husky/` não existe), nem workflow de CI.

## Onde o `README.md` está errado (não copie dele)

| README diz | Realidade |
|---|---|
| rotas `/esqueci-senha`, `/redefinir-senha` | `/forgot-password`, `/reset-password` (`src/App.tsx:118-119`) |
| `/aula/:lessonId` | `/curso/:slug/aula/:lessonId` (`src/App.tsx:123`) |
| `/trilhas/:slug` | `/trilha/:slug` (`src/App.tsx:127`) |
| `/verificar-certificado/:code` | `/verificar-certificado` **sem parâmetro** (`src/App.tsx:131`) |
| `/rate-limit` | `/admin/security` (`RateLimitDashboard`) e `/seguranca` (`SecurityDashboard`) |
| `npm test` | script não existe |
| Estado com **Zustand** | não há `zustand` no `package.json`; estado é React Query + hooks |
| "320+ testes" | 299 casos em 35 arquivos (`grep` por `it(`/`test(`) |
| "Arquivos ≤ 400 linhas (regra arquitetural)" | `src/components/skeletons/PageSkeletons.tsx` tem 675 e `ui/sidebar.tsx` 637; nada cobra o limite |

Corrigir o `README.md` é tarefa própria, não "aproveitei e também" — anote em "Próximos passos".
