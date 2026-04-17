
Já entregamos: Sales Enablement Suite completo + Sprint Excelência (280 testes). Agora vou focar em fechar os gaps que ainda separam o projeto de 10/10: observabilidade real, segurança avançada, performance percebida, i18n leve, e cobertura de testes E2E.

# Sprint Perfeição — 10 frentes finais

## 1. Observabilidade & Telemetria
- `src/lib/telemetry.ts`: wrapper para registrar erros e eventos críticos (page view, mutation failure) na tabela `audit_logs` existente
- Integrar no `ErrorBoundary` (capturar stack) e em `queryClient` (onError global de mutations)

## 2. Memoização de listas pesadas
- `React.memo` em: `LessonList`, `LearningPathCourseItem`, `QuizQuestionCard`, `CertificateCard`, `CourseCard`
- `useMemo` para filtros derivados em `Catalog`, `Playbooks`, `VideoLibrary`

## 3. Prefetch inteligente
- `usePrefetchRoute` hook usando `queryClient.prefetchQuery` em hover/focus de links principais (Dashboard → Catálogo, Trilhas, Playbooks)
- Aplicar em `DashboardHeader` e `MobileBottomNav`

## 4. Acessibilidade WCAG AA+ (varredura final)
- ARIA labels em todos botões icon-only sem label das novas páginas
- `aria-current="page"` no `MobileBottomNav` ativo
- `aria-live="polite"` no contador de resultados das buscas (Playbooks, VideoLibrary)
- `role="status"` em todos loaders

## 5. Estados vazios & loading consistentes
- Substituir Skeleton solto por `<PageSkeletons.List />` ou variants já existentes
- `SimpleEmptyState` em todas listas com 0 items

## 6. Segurança backend
- Migration: criar índices ausentes para queries quentes (`playbooks(is_published, view_count)`, `training_videos(is_published, category)`, `user_assessment_results(user_id, next_due_at)`)
- Auditoria: trigger `audit_logs` em INSERT/UPDATE/DELETE de `playbooks`, `training_videos`, `onboarding_workflows`, `skill_assessments`
- Rate limit por IP em `/playbook/:slug` view counter (função `register_playbook_view` com check de janela de 1 min)

## 7. Atalhos de teclado globais
- `useGlobalShortcuts`: `g d` → Dashboard, `g c` → Catálogo, `g p` → Playbooks, `g v` → Vídeos, `?` → exibir lista
- Componente `KeyboardShortcutsModal` invocado pelo `?`

## 8. Sitemap & robots dinâmicos
- Edge function `generate-sitemap`: lê playbooks publicados + rotas estáticas, retorna XML
- Atualizar `public/robots.txt` para referenciar sitemap

## 9. PWA polish
- Adicionar shortcuts no `manifest.json` (Dashboard, Playbooks, Onboarding)
- Cache strategy no `sw.js` para rotas estáticas dos novos módulos

## 10. Testes E2E críticos + documentação
- `src/test/e2e/criticalFlows.test.tsx`: smoke renderiza Playbooks/VideoLibrary/SkillAssessments/SalesOnboarding com mocks
- `src/test/memoization.test.tsx`: garante que componentes memoizados não re-renderizam com props iguais
- `src/test/telemetry.test.ts`: valida wrapper
- Atualizar `DOCUMENTACAO.md` com Sales Enablement Suite + Sprint Perfeição
- Atualizar `README.md` com novas rotas e atalhos

## Padrões mantidos
- ≤400 linhas por arquivo, zero `any`, zero `console.*`
- Tokens semânticos do design system
- TanStack Query + invalidação correta
- RLS com `has_role(auth.uid(), 'admin'::app_role)`
- Toasts sonner

## Ordem de execução (sequencial, sem pausas)
1. Migration: índices + triggers de auditoria + função view counter com rate limit
2. `telemetry.ts` + integração ErrorBoundary/queryClient
3. Memoização nos 5 componentes de lista
4. Hook `usePrefetchRoute` + integração nav
5. Varredura ARIA + aria-current/live/status
6. `useGlobalShortcuts` + `KeyboardShortcutsModal`
7. Edge function `generate-sitemap` + `robots.txt`
8. PWA: manifest shortcuts + sw.js cache
9. +30 testes (E2E smoke, memoização, telemetria)
10. Rodar suíte completa (alvo 310+ testes) + atualizar docs

**Meta:** 310+ testes passando, zero regressões, projeto cravado em 10/10.
