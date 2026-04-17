
Já entregamos: Sales Enablement Suite + Sprint Excelência + Sprint Perfeição (292 testes, 10/10 técnico). Agora foco em frentes que elevam o produto além do técnico: experiência premium, internacionalização, IA aplicada e operações.

# Sprint Transcendência — 10 frentes

## 1. IA aplicada (Lovable AI Gateway)
- Edge function `ai-playbook-summarize`: gera resumo executivo de playbooks longos (gemini-2.5-flash)
- Edge function `ai-quiz-generator`: admin gera questões a partir de transcrição/conteúdo
- Botão "Resumir com IA" no `PlaybookDetail`, "Gerar quiz com IA" no `QuizManager`

## 2. Busca global unificada
- `useGlobalSearch` hook: busca cross-entity (cursos, playbooks, vídeos, trilhas) via single query
- Integrar no `CommandPalette` substituindo navegação estática por resultados reais com debounce

## 3. Internacionalização (i18n leve)
- `src/lib/i18n.ts`: dicionário pt-BR/en com hook `useT()`
- Aplicar em `Header`, `MobileBottomNav`, `Dashboard` (strings críticas)
- Toggle no `Profile`

## 4. Onboarding workflow runtime
- Página `/onboarding/:workflowId` que executa passos sequencialmente
- Marca progresso por step, dispara notificação ao concluir
- Integra com hook `useOnboardingWorkflow` existente

## 5. Comentários em playbooks
- Tabela `playbook_comments` (user_id, playbook_id, content, created_at)
- RLS: leitura authenticated, escrita own + admin delete
- UI no final do `PlaybookDetail`

## 6. Recomendações personalizadas (regra)
- View SQL `user_recommendations` baseada em: cursos da mesma categoria já iniciados, playbooks populares não vistos
- Widget `SmartRecommendations` no Dashboard

## 7. Exportação de dados
- Botão "Exportar meus dados" no `Profile` → JSON com cursos, certificados, XP, notas (LGPD compliance)
- Edge function `export-user-data` consolidando

## 8. Métricas de admin avançadas
- `AdminEngagementHeatmap`: heatmap dia × hora de acessos (últimos 30 dias)
- `AdminCohortRetention`: retenção semanal de novos usuários

## 9. Performance percebida
- Skeleton específico para `PlaybookDetail` e `VideoLibrary`
- Optimistic updates em favoritar playbook/vídeo
- Image lazy loading com blur placeholder em `LazyImage`

## 10. Testes + docs finais
- +25 testes (i18n, busca global, comentários, IA mock)
- Atualizar `DOCUMENTACAO.md` e `README.md` com tudo
- Meta: 317+ testes passando

## Padrões mantidos
- ≤400 linhas/arquivo, zero `any`, zero `console.*`
- Lovable AI Gateway (sem API key do usuário)
- RLS com `has_role`
- Tokens semânticos do design system

## Ordem de execução
1. Migration: `playbook_comments` + view recommendations + índices
2. Edge functions IA (summarize + quiz-gen) + secrets check
3. i18n base + aplicação em nav
4. Busca global + integração CommandPalette
5. Comentários playbook (UI + hook)
6. SmartRecommendations widget
7. Onboarding runtime page
8. Exportação dados (edge fn + UI)
9. AdminEngagementHeatmap + Cohort
10. Skeletons + optimistic + +25 testes + docs
