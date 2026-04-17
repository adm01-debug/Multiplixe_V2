# Promo Brindes — Plataforma de Aprendizagem

Plataforma interna de capacitação com gamificação, trilhas, playbooks, vídeos e analytics.

## Stack
- React 18 + Vite + TypeScript + Tailwind + shadcn/ui
- Lovable Cloud (Supabase: Auth, Postgres, Storage, Edge Functions)
- TanStack Query, framer-motion, react-helmet-async, Fuse.js, Vitest

## Rotas principais (PT-BR)
- `/` landing · `/auth` login · `/dashboard`
- `/catalogo` · `/curso/:slug` · `/aula/:lessonId`
- `/trilhas` · `/trilhas/:slug`
- `/playbooks` · `/playbook/:slug`
- `/biblioteca-videos`
- `/avaliacoes` · `/avaliacao/:assessmentId`
- `/onboarding` · `/onboarding/executar`
- `/ranking` · `/perfil` · `/verificar-certificado/:code`
- `/admin` · `/seguranca` · `/rate-limit`

## Atalhos de teclado
- `?` — abre modal de atalhos
- `g d/c/t/p/v/o/a/r` — navega para Dashboard/Catálogo/Trilhas/Playbooks/Vídeos/Onboarding/Avaliações/Ranking
- `n` — foca o input de novo comentário (em PlaybookDetail)
- `⌘K` / `Ctrl K` — Command Palette (busca global)

## Edge Functions
- `ai-playbook-summarize` — resumo executivo via Lovable AI Gateway
- `ai-quiz-generator` — gera questões de quiz a partir de conteúdo
- `export-user-data` — LGPD: exportação completa de dados do usuário
- `generate-sitemap` — sitemap XML dinâmico (cursos, trilhas, vídeos, playbooks)
- `generate-certificate` · `approve-password-reset` · `cleanup-security-logs`
- `detect-new-device` · `send-security-alert`

## Comandos
```sh
npm i
npm run dev
npm test
```

## Qualidade
- 318+ testes (Vitest + Testing Library)
- Zero `any` / zero `console.*` em código de produção
- Arquivos ≤ 400 linhas
- WCAG AA · Semantic tokens HSL · Lazy loading · PWA
