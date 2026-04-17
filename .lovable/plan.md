
Mantendo o foco no Sprint Apoteose já apresentado. Plano consolidado e enxuto:

# Sprint Apoteose — execução final rumo ao 10/10

## 1. IA no admin (QuizManager)
- Modal "Gerar quiz com IA" chamando `ai-quiz-generator` com preview/edição antes de salvar

## 2. CommandPalette com busca global real
- Substituir lista estática pelo `useGlobalSearch` (debounce, agrupado por tipo, navegação por teclado)

## 3. i18n na navegação
- Aplicar `useT()` em `Header` (landing), `MobileBottomNav`, `DashboardHeader`
- LanguageToggle no Header

## 4. Edição inline de comentários
- Botão lápis no `PlaybookComments`, mostra `updated_at`, hook `useUpdatePlaybookComment`

## 5. Métricas admin avançadas
- `AdminEngagementHeatmap` (dia × hora dos últimos 30 dias via audit_logs)
- `AdminCohortRetention` (retenção semanal de novos usuários)

## 6. Performance percebida
- Skeleton dedicado para `PlaybookDetail`
- Optimistic update em favoritar playbook/vídeo
- Blur placeholder no `LazyImage`

## 7. Notificação de novo comentário
- Trigger SQL: ao inserir comment, notifica autores anteriores do thread

## 8. Atalhos expandidos
- `g r` (recomendações), `g s` (busca), `n` (novo comentário em PlaybookDetail)
- Atualizar `KeyboardShortcutsModal`

## 9. Sitemap completo
- Estender `generate-sitemap` com vídeos públicos e trilhas publicadas

## 10. Testes + docs
- +25 testes (i18n, busca global, comentários CRUD, recommendations, IA mocks, command palette)
- Atualizar `DOCUMENTACAO.md` e `README.md` (rotas, atalhos, edge functions)
- Meta: **340+ testes**

## Padrões mantidos
≤400 linhas/arquivo, zero `any`/`console.*`, tokens semânticos, RLS com `has_role`, TanStack Query + invalidação, Lovable AI Gateway.

## Ordem de execução
1. Migration: trigger notify_new_playbook_comment + updated_at em comments
2. Modal IA no QuizManager
3. CommandPalette + useGlobalSearch
4. i18n em Header/MobileBottomNav/DashboardHeader + LanguageToggle no Header
5. Edição inline + hook update comment
6. AdminEngagementHeatmap + AdminCohortRetention + integração no Admin.tsx
7. Skeleton PlaybookDetail + optimistic favorites + blur LazyImage
8. Atalhos expandidos + KeyboardShortcutsModal atualizado
9. generate-sitemap estendido
10. +25 testes + docs atualizadas
