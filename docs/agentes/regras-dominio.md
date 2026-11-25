# Regras de domínio que o código não deixa óbvio — referência para agentes

Ler quando mexer em login, papéis, XP/gamificação, certificado, segurança ou rotas.

## Incidente aberto — `migrate-helper` (segurança, prioridade)

`supabase/functions/migrate-helper/index.ts` existe no repo com:
- **chave de acesso fixa no código** (constante `ACCESS_KEY`, comparada com o header `x-access-key`);
- `action=credentials`, que devolve `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_DB_URL`
  (linhas 26-28) para quem acertar essa chave;
- `verify_jwt = false` em `supabase/config.toml` (sem autenticação de usuário) e CORS `*`;
- o próprio comentário do arquivo diz "Após a migração, remova esta função".

Histórico: o commit `a124f9f` (`security: remove migrate-helper edge function (exposes service_role key)`)
apagou a função; o commit seguinte do Lovable (`580966a`) **trouxe de volta**. Se ela estiver publicada no
projeto `ywsblgsikhiscvpmopkp`, qualquer um com a chave do arquivo lê o `service_role` — acesso total ao
banco, ignorando RLS. **Publicada ou não: NÃO VERIFICADO** (sem MCP deste projeto,
`docs/agentes/banco.md`).

Regra para o agente: **não é fix de oportunidade** — apagar o arquivo só no repo não resolve (o Lovable
reintroduz e a função continua publicada). O caminho é: dono remove a função no Lovable Cloud **e** rotaciona
a `service_role`, e só então o arquivo sai do repo. Enquanto não houver essa ordem, trate como pendência
conhecida; nunca cite a chave em chat, log ou PR.

## Login e acesso

- **Gate de domínio é só no cliente:** `src/pages/Auth.tsx:39-41` monta o schema zod com
  `createCorporateEmailSchema(allowedDomainsFrom(settings['allowed_email_domains']))`, validado em
  `src/pages/Auth.tsx:70`. Não é RLS nem trigger — é validação de formulário.
- A lista de domínios aceitos agora vem do banco (`platform_settings`, chave `allowed_email_domains`), editável
  em Admin → Configurações; default `["promobrindes.com.br"]` em `src/lib/platformSettings.ts`. Por isso a
  policy `platform_settings_select_anon_dominios` libera a leitura dessa chave para `anon`: o login precisa
  validar antes de existir sessão. Trocar de provedor/e-mail corporativo é editar a chave, não o código.
- Antes do `signIn`, o front chama a RPC `check_login_allowed({ p_email })` (`src/pages/Auth.tsx:55`), e o
  fluxo de falha usa `record_failed_login` / `reset_login_attempts` (tabelas `login_attempts`,
  `blocked_ips`, `whitelisted_ips`, `rate_limit_config`, `rate_limit_logs`).
- OAuth (Google/Apple) passa pelo Lovable: `src/integrations/lovable/index.ts` chama
  `@lovable.dev/cloud-auth-js` e só depois faz `supabase.auth.setSession`. Arquivo **gerado** — não editar.
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
