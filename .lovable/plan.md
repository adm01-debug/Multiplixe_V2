
O usuário quer continuar evoluindo o projeto rumo ao 10/10. Já entregamos Sales Enablement Suite completo (254 testes). Vou consultar o roadmap pendente e definir o próximo lote de melhorias com maior impacto.

Pelo PLANO_IMPLEMENTACAO_PENDENTES.md (56 melhorias em 4 fases) e considerando o que já está pronto, vou focar em **Performance + Acessibilidade + Resiliência + UX Mobile** — itens que movem o ponteiro de 9/10 para 10/10.

# Plano: Sprint Excelência — 10 melhorias críticas

## 1. Performance & Memoização
- **React.memo + useMemo** em listas pesadas: `LessonList`, `LearningPathCourseItem`, `QuizQuestionCard`, `CertificateCard`
- **Code splitting agressivo**: lazy load de `Admin.tsx` por tab (já parcial, completar para PlatformAnalytics, QuizStats)
- **Prefetch inteligente**: `PrefetchLink` nas rotas mais acessadas do header

## 2. Acessibilidade WCAG AA+
- **ARIA labels** em todos botões icon-only do projeto (varredura)
- **Focus visible** consistente com ring tokens semânticos
- **Skip link** funcional na nova página `/playbooks`, `/biblioteca-videos`, `/onboarding`, `/avaliacoes`
- **Keyboard navigation** no modal de vídeo da biblioteca (Esc fecha, setas controlam)

## 3. Resiliência & Error Handling
- **ErrorBoundary** por rota lazy-loaded (envolve Suspense)
- **Retry automático** TanStack Query com backoff exponencial (já parcial, padronizar `retry: 2`)
- **Toast de erro padronizado** em todas mutations (varrer hooks novos)
- **Estados vazios consistentes** com `SimpleEmptyState` em todas listas

## 4. UX Mobile
- **MobileBottomNav**: adicionar atalho para Playbooks ou Onboarding (escolher 1 dos 5 slots)
- **Touch targets ≥44px** em controles do player de vídeo
- **Sheet drawer** para filtros do `VideoLibrary` em mobile

## 5. SEO & Metadata
- **DynamicSEO** nas 6 novas páginas (title, description, og:image)
- **Sitemap dinâmico** incluindo playbooks publicados

## 6. Validação Zod expandida
- Schemas em `AdminWorkflowsTab` e `AdminAssessmentsTab` (faltou validação client-side)
- Validação de URL de vídeo no `AdminVideosTab`

## 7. Notificações inteligentes
- Trigger de notificação quando avaliação vence em 7 dias
- Notificação ao completar workflow de onboarding

## 8. Analytics & Insights
- Widget "Top Playbooks" no dashboard admin (mais lidos)
- Widget "Engajamento de Vídeos" (taxa de conclusão)

## 9. Testes
- +20 testes cobrindo: ErrorBoundary, validações Zod novas, memoização, ARIA

## 10. Documentação
- Atualizar `DOCUMENTACAO.md` com Sales Enablement Suite
- README com novas rotas

## Padrões mantidos
- Modularização ≤400 linhas
- Zero `any`, zero `console.*`
- Tokens semânticos do design system
- TanStack Query + invalidação correta
- Toasts sonner

## Ordem de execução (sequencial, sem pausas)
1. Validações Zod nos forms admin novos
2. Memoização + ErrorBoundary por rota lazy
3. ARIA labels + skip links + keyboard nav
4. DynamicSEO nas 6 novas páginas
5. MobileBottomNav + touch targets
6. Notificações automáticas (trigger SQL)
7. Widgets analytics admin
8. +20 testes
9. Documentação atualizada
10. Rodar suíte completa (alvo 274+ testes)
