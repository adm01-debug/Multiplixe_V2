# Promo Brindes — Plataforma de Aprendizagem

Plataforma interna de capacitação corporativa com gamificação, trilhas, playbooks, biblioteca de vídeos e analytics.

> **Acesso restrito**: login apenas via e-mail `@promobrindes.com.br` ou Google OAuth.

## 🔗 Links

- **Produção**: https://multiplixe-v2.vercel.app
- **Local**: http://localhost:5173

## 🛠 Stack

- **Frontend**: React 18 · Vite 5 · TypeScript 5 · Tailwind CSS v3 · shadcn/ui
- **Backend**: Supabase (Auth, Postgres com RLS, Storage, Edge Functions)
- **Estado / Dados**: TanStack Query · Zustand
- **UX**: framer-motion · canvas-confetti (lazy) · Fuse.js · react-helmet-async
- **Qualidade**: Vitest · Testing Library · ESLint

## 📁 Estrutura

```
src/
├── components/      # UI (catalog, player, admin, ui/, accessibility/, ...)
├── pages/           # Rotas (PT-BR)
├── hooks/           # Hooks customizados (useAuth, useUserXP, useFavorites, ...)
├── lib/             # Utilitários (i18n, levelSystem, telemetry, toastHelpers)
├── integrations/    # Cliente Supabase auto-gerado
└── test/            # Suítes Vitest (320+ testes)
supabase/
├── functions/       # Edge functions (ai-quiz-generator, generate-certificate, ...)
└── migrations/      # Migrações SQL versionadas
```

## 🚀 Scripts

```sh
npm install       # instala dependências
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção
npm test          # roda a suíte de testes (Vitest)
npm run lint      # análise estática
```

## 🔐 Variáveis de ambiente

O arquivo `.env` é gerenciado automaticamente pelo Lovable Cloud:

- `VITE_SUPABASE_URL` — endpoint do backend
- `VITE_SUPABASE_PUBLISHABLE_KEY` — chave pública (anon)
- `VITE_SUPABASE_PROJECT_ID` — identificador do projeto

> Não edite manualmente. Secrets de edge functions são gerenciados em **Lovable Cloud → Secrets**.

## 🗺 Rotas (PT-BR)

| Rota | Descrição |
|---|---|
| `/` | Landing |
| `/auth` · `/esqueci-senha` · `/redefinir-senha` | Autenticação |
| `/dashboard` | Hub do aluno |
| `/catalogo` · `/curso/:slug` · `/aula/:lessonId` | Cursos |
| `/trilhas` · `/trilhas/:slug` | Trilhas de aprendizagem |
| `/playbooks` · `/playbook/:slug` | Playbooks de vendas |
| `/biblioteca-videos` | Vídeos de treinamento |
| `/avaliacoes` · `/avaliacao/:assessmentId` | Skill assessments |
| `/onboarding` · `/onboarding/executar` | Onboarding |
| `/ranking` · `/perfil` | Gamificação e perfil |
| `/verificar-certificado/:code` | Validação pública |
| `/admin` · `/seguranca` · `/rate-limit` | Painéis administrativos |

## ⌨️ Atalhos de teclado

- `?` — modal de atalhos
- `g d/c/t/p/v/o/a/r` — navegação rápida (Dashboard, Catálogo, Trilhas, Playbooks, Vídeos, Onboarding, Avaliações, Ranking)
- `n` — focar input de novo comentário (PlaybookDetail)
- `⌘K` / `Ctrl K` — Command Palette (busca global fuzzy)

## ⚡ Edge Functions

- `ai-playbook-summarize` — resumo executivo via Lovable AI Gateway
- `ai-quiz-generator` — geração de questões a partir de conteúdo
- `export-user-data` — exportação LGPD completa
- `generate-certificate` — emissão de certificado em PDF
- `generate-sitemap` — sitemap XML dinâmico
- `approve-password-reset` · `cleanup-security-logs` · `detect-new-device` · `send-security-alert`

## ✅ Qualidade

- **320+ testes** (Vitest + Testing Library)
- **Zero `any`** · **zero `console.log`** em produção
- Arquivos ≤ 400 linhas (regra arquitetural)
- WCAG AA · semantic tokens HSL · Skip Links · Live Announcer
- PWA (instalação, cache visual, scroll restoration)
- Code splitting agressivo (`react`, `ui`, `motion`, `chart`, `query`, `supabase` em chunks vendor separados)
- Lazy loading de `canvas-confetti`, gráficos e modais pesados

## 🎮 Gamificação

- XP: +25 por aula · +100 por curso · bônus de streak (10–60 XP)
- Streak diário com alertas preventivos
- Conquistas com confete (lazy via dynamic import)
- Certificados condicionados a quiz final ≥ 90%

## 🛡 Segurança

- RLS estrita em todas as tabelas sensíveis
- Roles via tabela `user_roles` (RBAC) — nunca em `profiles`
- Rate limiting · IP whitelist · Geo blocking · MFA · Passkeys
- Audit logs e telemetria silenciosa best-effort

---

Construído com ❤️ na **Lovable**.
