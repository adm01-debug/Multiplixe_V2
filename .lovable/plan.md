
Onda 1 já entregou as correções críticas de segurança (PII certificates, gabaritos quiz, login_attempts). Agora executo o restante da Onda 1 + Onda 2 + Onda 3 em sequência, uma melhoria por vez.

# Execução Completa — Ondas 1, 2 e 3

## Onda 1 — Quick Wins restantes (segurança + performance)
1. **Realtime hardening** — RLS em `realtime.messages` para `security_alerts`/`notifications`
2. **Lazy images** — `loading="lazy"` + `decoding="async"` em CourseCard, LearningPathCard, CertificateCard, LazyImage
3. **Preload fontes** — Inter/Plus Jakarta no `index.html` com `<link rel="preload">`
4. **Headers de segurança** — CSP/HSTS/X-Frame-Options no `index.html` (meta tags) e edge functions

## Onda 2 — Sprint 1 (auth + observabilidade + docs)
5. **MFA funcional** — completar fluxo TOTP em `useMFA` + UI de enrollment em `SecurityDashboard`
6. **HIBP password check** — habilitar via `configure_auth` (leaked password protection)
7. **Logging estruturado** — helper `logger.ts` com níveis + correlação requestId nas edge functions
8. **Retry exponencial IA** — helper `retryWithBackoff` em `ai-quiz-generator` e `ai-playbook-summarize`
9. **Zod validation** — schemas em todas as 9 edge functions (input validation server-side)
10. **ADRs** — criar `docs/adr/` com 5 decisões-chave (Supabase, RLS, Feature Slicing, i18n, Lovable AI)
11. **ER Diagram** — `docs/database-schema.md` com diagrama Mermaid das 41 tabelas
12. **Runbook operacional** — `docs/runbook.md` (deploy, rollback, incidentes, troubleshooting)
13. **Dicionário de dados** — `docs/data-dictionary.md` mapeando entidades de negócio → tabelas

## Onda 3 — Sprint 2 (arquitetura + testes + qualidade)
14. **Feature Slicing inicial** — migrar `auth/`, `quiz/`, `certificates/` para `src/features/`
15. **TypeScript strict** — habilitar `strict: true` no `tsconfig.app.json` + corrigir erros
16. **Zod runtime validation** — schemas para respostas de API críticas (auth, quiz, certificate)
17. **Optimistic locking** — coluna `version` em `playbooks` + check no UPDATE
18. **Idempotência** — `idempotency_key` em `submit_quiz_attempt` e edge functions de mutação
19. **Audit log expandido** — trigger automático em UPDATE/DELETE de tabelas críticas (courses, quizzes, profiles)
20. **+15 testes E2E críticos**:
    - `lessonCompletion.test.ts`
    - `certificateFlow.test.ts`
    - `commandPaletteNavigation.test.ts`
    - `notificationsRealtime.test.ts`
    - `mfaEnrollment.test.ts`
    - `quizSecureSubmit.test.ts`
    - `certificateRpcVerify.test.ts`
    - `loginAttemptsHardened.test.ts`
    - `retryBackoff.test.ts`
    - `loggerStructured.test.ts`
    - `zodEdgeFunctions.test.ts`
    - `optimisticLocking.test.ts`
    - `idempotencyKey.test.ts`
    - `auditTriggers.test.ts`
    - `featureSlicing.test.ts`
21. **Páginas de docs interna** — `/admin/docs` com índice navegável (ADRs, Runbook, ER, Dicionário)
22. **Polimento visual final** — microinterações CTAs + empty states ilustrados + dark mode review
23. **DOCUMENTACAO.md final** — atualizar com tudo entregue + scorecard pós-execução

## Padrões mantidos
≤400 linhas/arquivo · zero `any`/`console.*` · tokens HSL semânticos · RLS com `has_role` · TanStack Query · Lovable AI Gateway · WCAG AA

## Ordem de execução estrita
Executo 1 melhoria por mensagem na sequência acima (1 → 23). Cada entrega inclui código + migration (se aplicável) + commit message contextualizado. Sem pausas, sem perguntas — apenas execução até atingir 10/10 em todas as 22 dimensões.

**Meta final:** 348+ testes verdes · scorecard ponderado ≥9.5/10 · zero gaps críticos restantes.
