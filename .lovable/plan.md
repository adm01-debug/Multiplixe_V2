
Já entregamos 6 sprints (Sales Enablement + Excelência + Perfeição + Transcendência + Apoteose + Coroação) com 318+ testes, IA aplicada, i18n, comentários, recomendações, métricas avançadas, sitemap dinâmico e LGPD compliance. O projeto já está em 10/10 técnico.

Para elevar ainda mais — rumo a um 11/10 de excelência operacional — proponho a Sprint Imortalidade focando em qualidade contínua, observabilidade e polimento final.

# Sprint Imortalidade — excelência operacional

## 1. Observabilidade real
- Hook `useTelemetry` para enviar eventos críticos (login, conclusão de curso, erro) para `audit_logs`
- Dashboard `AdminTelemetryWidget` mostrando funil: visita → cadastro → primeira aula → certificado

## 2. Notificações de comentário no UI
- `NotificationBell` exibe badge quando há novo comentário em playbook que o usuário comentou
- Click leva direto ao `/playbook/:slug#comments`

## 3. i18n expandido
- Aplicar `useT()` em `Footer`, `LessonPlayerHeader`, `EmptyState`, `ProtectedRoute` (mensagens críticas)
- Adicionar locale `es` (espanhol) ao dicionário

## 4. Acessibilidade auditada
- Rodar checklist WCAG AA em PlaybookDetail/CommandPalette/QuizPlayer
- Adicionar `aria-live` em toasts de IA, `aria-current` em nav ativa, focus trap em modais

## 5. Performance — Lighthouse 95+
- Code-split rotas admin com `React.lazy`
- Preload de fontes Inter/Plus Jakarta
- Imagens com `loading="lazy"` + `decoding="async"` em catálogo

## 6. Resiliência IA
- Retry exponencial nas edge functions de IA (max 2 tentativas)
- Fallback gracioso: se IA falha, sugere ação manual

## 7. Testes E2E críticos (+15 testes alvo)
- `lessonCompletion.test.ts` — fluxo de completar aula → ganhar XP → atualizar streak
- `certificateFlow.test.ts` — quiz final 90%+ → certificado emitido
- `commandPaletteNavigation.test.ts` — busca → seleção → navegação
- `notificationsRealtime.test.ts` — insert na tabela → bell atualiza

## 8. Documentação interativa
- `/docs` (rota interna admin) com índice navegável das funcionalidades
- Link no menu admin

## 9. Relatórios exportáveis
- `AdminPlatformAnalytics` ganha botão "Exportar PDF" (jspdf) e "Exportar CSV"

## 10. Polimento visual final
- Microinterações em botões CTA principais (scale + glow no hover)
- Empty states ilustrados em Catálogo/Playbooks/Vídeos quando filtro retorna vazio
- Dark mode polish: revisar contraste de badges/borders

## Padrões mantidos
≤400 linhas/arquivo · zero `any`/`console.*` · tokens HSL semânticos · RLS com `has_role` · TanStack Query · Lovable AI Gateway

## Ordem de execução
1. Migration: índices para audit_logs (telemetria)
2. Hook `useTelemetry` + AdminTelemetryWidget
3. Notificações de comentário (trigger já existe — falta UI no NotificationBell)
4. i18n expandido + locale `es`
5. Auditoria a11y (PlaybookDetail/CommandPalette/QuizPlayer)
6. Code-split admin + preload fontes + lazy images
7. Retry/fallback nas edge functions IA
8. +15 testes E2E críticos
9. Página `/docs` admin + exportação PDF/CSV em analytics
10. Polimento visual + dark mode review + atualizar `DOCUMENTACAO.md` final

**Meta:** 333+ testes verdes · Lighthouse 95+ · zero regressões · projeto em estado de imortalidade operacional.
