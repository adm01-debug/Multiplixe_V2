# Regras de domínio que o código não deixa óbvio — referência para agentes

Ler quando mexer em login, papéis, XP/gamificação, certificado, segurança ou rotas.

## Incidente resolvido — `migrate-helper` (segurança)

Existia `supabase/functions/migrate-helper/index.ts` com chave de acesso fixa no código (header
`x-access-key`), `action=credentials` devolvendo `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_DB_URL` para quem
acertasse a chave, `verify_jwt = false` e CORS `*`.

Histórico: `a124f9f` apagou a função; o commit seguinte do Lovable (`580966a`) **trouxe de volta**.

**Resolvido em 26/11/2026:**
- Verificado por Management API (lista de edge functions do projeto `ywsblgsikhiscvpmopkp`): a função
  **não estava publicada** — 13 funções ativas, nenhuma `migrate-helper`. O risco era latente (bastava um
  deploy), não ativo naquela data.
- Arquivo e pasta removidos do repo; bloco `[functions.migrate-helper]` removido de `supabase/config.toml`.
- Guard `scripts/ci/edge-funcoes-proibidas.unit.mjs` (roda em `npm run guards`) deixa a CI vermelha se a
  pasta ou o bloco de config voltarem — cobre a reintrodução pelo editor do Lovable.

Pendente do dono (não é código): se a função chegou a ser publicada antes de 26/11/2026 — **NÃO
VERIFICADO** —, rotacionar a `service_role` no Supabase. Nunca cite a chave antiga em chat, log ou PR.

## Login e acesso

- **Gate de domínio no banco (desde 26/11/2026):** o cadastro passa pelo auth hook `before_user_created`
  (`public.bloquear_cadastro_fora_do_dominio`, migration `20261129110000_gate_dominio_signup.sql`, declarado em
  `supabase/config.toml`), que recusa email fora de `platform_settings.allowed_email_domains`. Antes disso a regra
  existia **só** no formulário (`src/pages/Auth.tsx`, schema zod `createCorporateEmailSchema(allowedDomainsFrom(...))`)
  e a API pública de signup (`disable_signup = false`) aceitava qualquer email — com a policy
  "Authenticated users can view lessons" (`USING true`), qualquer conta recém-criada lia todo o conteúdo.
  Ao mexer em login, mantenha os dois lados: o do banco é o que vale.
- A lista de domínios aceitos agora vem do banco (`platform_settings`, chave `allowed_email_domains`), editável
  em Admin → Configurações; default `["promobrindes.com.br"]` em `src/lib/platformSettings.ts`. Por isso a
  policy `platform_settings_select_anon_dominios` libera a leitura dessa chave para `anon`: o login precisa
  validar antes de existir sessão. Trocar de provedor/e-mail corporativo é editar a chave, não o código.
- Antes do `signIn`, o front chama a RPC `check_login_allowed({ p_email })` (`src/pages/Auth.tsx:55`), e o
  fluxo de falha usa `record_failed_login` / `reset_login_attempts` (tabelas `login_attempts`,
  `blocked_ips`, `whitelisted_ips`, `rate_limit_config`, `rate_limit_logs`).
- OAuth social: `src/integrations/lovable/index.ts` (arquivo **gerado** — não editar) fala com o broker
  `@lovable.dev/cloud-auth-js`, cuja rota `/~oauth/initiate` **só existe na hospedagem do Lovable**. Por isso a
  decisão de como entrar com Google fica em `src/lib/socialLogin.ts`: broker em `*.lovable.app`/`*.lovable.dev`;
  fora daí, OAuth nativo (`supabase.auth.signInWithOAuth`) **somente** se `external.google` estiver ligado em
  `/auth/v1/settings`. Hoje está `false` (verificado 26/11/2026), então a produção Vercel **esconde** o botão em
  vez de mostrar um botão quebrado. O gate de domínio do banco vale para SSO também: conta Google fora do
  domínio é recusada no `before_user_created`.
- Papel: `user_roles` + RPC `has_role` (`src/hooks/useAdminRole.ts:19`). **Nunca** em `profiles`. Permissão
  fina em `permissions`/`role_permissions` com `has_permission`/`get_user_permissions`.
- Rota protegida = `<ProtectedRoute>`; rota de admin = `<ProtectedRoute requireAdmin>`
  (`src/App.tsx:128-129`). Rota nova sem isso nasce pública.
- Rotas públicas por design: `/` (landing), `/auth`, `/forgot-password`, `/reset-password`,
  `/verificar-certificado`.

## XP, nível e streak

- Concessão de XP acontece **no front**, em `src/pages/LessonPlayer.tsx:130-131`: `addXP(25, 'lesson')` por
  aula concluída e `addXP(100, 'course')` quando a última aula fecha o curso (com toast de +25/+100).
  `addXP` é `src/hooks/useUserXP.ts:75-85` → RPC `add_user_xp(p_user_id, p_amount, p_source)`.
- Quem muda regra de XP mexe em **dois lugares**: a chamada no front e a RPC no banco (que grava
  `user_xp` + `user_xp_history`). Como não há MCP de banco, mudança de RPC = chame o dono.
- Níveis em `src/lib/levelSystem.ts` (tabela fixa: nível 1 "Novato" 0-100 XP, nível 2 "Aprendiz"
  100-250 XP, …). Mudar faixa muda rank e badge em toda a UI (`LevelProgress`, `RankBadge`, leaderboard).
- Streak: RPC `update_user_streak` (`src/hooks/useStreaks.ts:60`), tabela `user_streaks`; o bônus de XP por
  streak é calculado no banco — **não há** valor de bônus no front (o "10-60 XP" do README é
  **NÃO VERIFICADO**).
- Conquistas: RPC `check_and_award_achievements` chamada após progresso; confete é `canvas-confetti`
  carregado por `import()` dinâmico (`src/hooks/useConfetti.ts`) — não importe estático.

## Certificado

- Emissão é da edge `generate-certificate`: confere `user_course_progress` (curso concluído, linha 63) e o
  **último** `user_quiz_attempts`; exige `score/total_questions >= 90%` (linhas 91-94, mensagem de erro em
  PT-BR) e só então chama a RPC `issue_certificate` (linha 99). O front **não** chama `issue_certificate`.
- O corte de 90% é **hardcode na edge**, não é o `passing_score` da tabela: no admin, o default de quiz é
  `passing_score: 90` (`src/components/admin/QuizManager.tsx:46`) e o de skill assessment é `70`
  (`src/components/admin/AdminAssessmentsTab.tsx:21`). Mexer em um não mexe no outro — mudar o critério de
  certificado é mudar a edge (deploy pelo Lovable, `docs/agentes/lovable-vercel.md`).
- Verificação pública: `/verificar-certificado` → `verify_certificate_by_code`
  (`src/hooks/useCertificates.ts:75`); trilha tem par próprio (`issue_learning_path_certificate`,
  `verify_path_certificate_by_code`).

## UI e i18n

- i18n é caseiro em `src/lib/i18n.ts`: `Locale = "pt-BR" | "en" | "es"`, default `"pt-BR"` (linha 106).
  Texto novo entra nos três dicionários ou aparece sem tradução.
- `src/components/ui/` é shadcn gerado — não reescreva componente base para resolver um caso; componha.
- Arquivos **gerados** (não editar à mão, o Lovable sobrescreve): `.env`,
  `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`,
  `src/integrations/lovable/index.ts`, `.lovable/plan.md`, `supabase/migrations/*`.

## Segurança

- **CSRF: não se aplica, e a razão precisa ficar registrada.** A sessão vive em `localStorage`
  (`src/integrations/supabase/client.ts`, `auth.storage: localStorage`) e o token vai em
  `Authorization: Bearer` colocado pelo JS do app — nenhuma credencial é enviada automaticamente
  pelo navegador. Um site terceiro que faça `fetch` para o Supabase ou para uma edge function não
  carrega o token do usuário e recebe `401`, então não existe requisição "autenticada por ambiente"
  para forjar. Só há um cookie no app, `sidebar_state` (`src/components/ui/sidebar.tsx`), que guarda
  preferência visual, é escrito (nunca lido) pelo cliente e não é consultado por servidor nenhum:
  vazá-lo ou forjá-lo não muda permissão. Se algum dia a sessão passar a usar cookie, essa conclusão
  cai e é preciso token anti-CSRF (`SameSite` + double-submit) antes de qualquer outra coisa.
- **Headers HTTP de segurança**: definidos em `vercel.json` (`headers` em `/(.*)`) e já no ar —
  `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`,
  `Cross-Origin-Opener-Policy`. Alterar a CSP exige conferir o app publicado: o `connect-src` lista
  `https://*.supabase.co` e `wss://*.supabase.co` (realtime); domínio novo de API só funciona depois
  de entrar na lista.
- **Validação de formulário**: Zod. `src/lib/salesEnablementSchemas.ts` (playbooks, vídeos,
  onboarding, assessments), `src/lib/schemas.ts` (quiz — descarta opções em branco, exige 2 opções
  preenchidas, 1 correta, limites de título/XP/cooldown), `zodResolver` em `CourseForm`/`LessonForm`
  e Zod direto em `Auth`/`ForgotPassword`/`ResetPassword`. Tela nova que grava no banco entra com
  schema — a validação do `handleSave` é a última linha, não a única.
- **Edge function que escreve com `service_role`**: exige JWT do usuário e confere o papel em
  `user_roles` antes de agir (padrão em `approve-password-reset` e `admin-user-actions`); `CORS` é
  `*` porque a chamada é autenticada por header, não por cookie.
- **2FA só existe de verdade com gate no login**: quando a conta tem TOTP verificado o Supabase abre a
  sessão em `aal1` e anuncia `aal2` como próximo nível. `src/components/security/MFAChallengeGate.tsx`
  (montado dentro do `AuthProvider` em `src/App.tsx`) bloqueia o app enquanto os níveis divergem e só
  libera após `mfa.verify`; a regra fica em `src/lib/mfaGate.ts`, coberta por `src/test/mfaGate.test.ts`.
  Sem o gate o TOTP é decorativo: a senha já abriria todas as telas. A edge `verify-mfa` **não** eleva a
  sessão do navegador (o nível AAL mora nos tokens do cliente), então a verificação do login é feita pelo
  SDK e o carimbo em `user_mfa_settings.last_mfa_at` é gravado pelo próprio gate.
