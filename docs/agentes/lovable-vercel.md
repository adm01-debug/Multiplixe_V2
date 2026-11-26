# Lovable e Vercel (deploy, env, edge functions) — referência para agentes

Ler quando for confirmar um deploy, mexer em env var, domínio, secret ou edge function.

## Quem é dono de quê

| Camada | Dono | Consequência para o agente |
|---|---|---|
| Código do front e das edges | **Lovable** (editor visual, bot `gpt-engineer-app[bot]`) commita direto na `main` | nunca edite os arquivos gerados; remoção de arquivo pode voltar no commit seguinte do Lovable (`docs/agentes/github-ci.md`) |
| Banco, migrations, Auth, Storage | **Lovable Cloud** (projeto `ywsblgsikhiscvpmopkp`) | DDL e secret de edge só pelo dono (`docs/agentes/banco.md`) |
| Secrets das edge functions | **Lovable Cloud → Secrets** | nomes usados: `RESEND_API_KEY`, `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL` |
| Hospedagem do front | **Vercel**, projeto `multiplixe-v2` | merge na `main` = deploy de produção |

## Vercel — estado canônico (lido em 2026-11-08 via MCP `Vercel`)

| O que | Valor |
|---|---|
| Projeto | `multiplixe-v2` (`prj_bw8OHGc1S6P0UsffiZcvEpYnYRlp`) |
| Team | `juca1` (`team_QyN41X0q8hrqhW80AwokbFLv`) |
| Framework / Node | `vite` · Node **24.x** |
| Domínios | `multiplixe-v2.vercel.app` (homepage do repo), `multiplixe-v2-juca1.vercel.app`, `multiplixe-v2-git-main-juca1.vercel.app` — **nenhum domínio próprio** |
| Proteção | `ssoProtection: all_except_custom_domains` (URLs `.vercel.app` exigem login Vercel) · password protection off · trusted IPs off |
| Último deploy de produção (lido em 2026-11-08, depois do próprio merge que criou este arquivo) | `dpl_4s8C6igh…`, `READY`, da `main` `decacef2` (merge da PR que criou estes docs) |
| Histórico | **3 deploys de produção** desde a criação (2026-09-05, 2026-10-03, 2026-11-08) — número só cresce, cada merge na `main` soma 1. Não trate este valor como fixo: confira de novo com `mcp__Vercel__list_deployments(projectId, target: "production", limit: 1)`. |

- **Gatilho de deploy:** push na `main` vira deploy de **produção**; push em qualquer outra branch vira
  **preview** (`target: null`) — verificado em 2026-11-08: a branch `claude/chore-padrao-agentes-261108-2040`
  gerou `dpl_9oXf84r1…` (preview, `READY`) e o merge gerou `dpl_4s8C6igh…` (produção, `READY`, SHA
  `decacef`). Confirme o run depois do merge (`mcp__Vercel__list_deployments` com `projectId`) e reporte o
  estado — preview conta como prova de build, não de produção.
- `mcp__Vercel__get_project` com `teamId` explícito devolveu **404**; sem `teamId`, funciona. Use sem
  `teamId` (ou `idOrName: "multiplixe-v2"`).
- As duas URLs públicas (`multiplixe-v2.vercel.app` e a do Lovable) respondem `000` pelo proxy desta sessão
  — **NÃO VERIFICADO** por HTTP daqui; confirme o deploy pelo MCP, não por `curl`.

### Env vars do Vercel — estado atual

O projeto tem **16 env vars, todas em `production`, todas vindas de uma integração**
(`configurationId: icfg_l6F3AhnOcvXqyj1eMSD7Jpxb`), criadas junto com o projeto:
`POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_HOST`,
`POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

- **Este projeto não tem serverless nem SSR** (Vite + React puro, build estático em `dist/`): nada no build
  lê essas variáveis. `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_SECRET_KEY` e
  `POSTGRES_*` (10 vars no total) tiveram **valores zerados em 2026-11-09** via MCP Vercel — redução de
  superfície sem remover o vínculo da integração. As 6 vars públicas/anon (`SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) foram mantidas.
  Confirmação: `updatedAt` novo + `updatedBy: "Ieu7YwvvtAlt2uSDu3vA4kWS"` em cada ID (campo `value` sempre
  mascarado `""` para `type:sensitive`, não serve como prova — use `updatedAt`). Remoção permanente do
  vínculo de integração é "chame o dono" (toca settings do projeto Vercel).
- As `NEXT_PUBLIC_*` são resto de template Next.js; o Vite só lê `VITE_*`.
- **Não existe nenhuma `VITE_*` no Vercel:** o build usa o `.env` **versionado no repo**
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`). São chaves públicas
  (anon), mas a consequência é que trocar de projeto Supabase exige commit — não é mudança de dashboard.
- Regra: **nunca** adicionar segredo de servidor no Vercel; `VITE_*` entra no bundle e é público.

## Edge functions

12 funções em `supabase/functions/`, `verify_jwt` declarado em `supabase/config.toml`:

| Função | `verify_jwt` | Observação |
|---|---|---|
| `generate-certificate` · `approve-password-reset` · `cleanup-security-logs` · `send-security-alert` · `export-user-data` · `ai-playbook-summarize` · `ai-quiz-generator` · `admin-user-actions` | `true` | exige sessão |
| `detect-new-device` · `generate-sitemap` · `weekly-admin-digest` · `webhook-dispatch` | `false` | público por design (sitemap, digest agendado, device fingerprint, dispatcher por token assinado) |

- `ai-playbook-summarize` e `ai-quiz-generator` usam `LOVABLE_API_KEY` (Lovable AI Gateway);
  `approve-password-reset`, `weekly-admin-digest` e `detect-new-device` usam `RESEND_API_KEY` (e-mail).
- **O editor do Lovable commitar na `main` não publica edge:** não há workflow que faça deploy. Mas o agente
  **pode** publicar via Management API/CLI — provado em 26/11/2026 (`webhook-dispatch` v5,
  `weekly-admin-digest` v2, deploy de edge via `supabase functions deploy <slug> --use-api`). Então:
  mudança de edge que precisa entrar em produção = deploy explícito + prova da versão publicada na PR.

## Divergência de documentação

`README.md` aponta produção para `https://learn-flow-forge-37.lovable.app` e preview para
`https://id-preview--2f75e52e-….lovable.app`; o repo aponta `homepage` para
`https://multiplixe-v2.vercel.app`. **São duas trilhas de publicação do mesmo `main`** (Lovable e Vercel).
Antes de dizer "deploy confirmado", diga em qual trilha: o MCP Vercel só prova a dele.
