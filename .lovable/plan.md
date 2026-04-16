
O usuário quer que eu continue executando as melhorias pendentes da entrega anterior do Sales Enablement Suite, sem pausas, até atingir 10/10. Vou listar exatamente o que falta e propor o plano enxuto.

# Plano: Finalizar Sales Enablement Suite (rumo ao 10/10)

## Pendências identificadas da entrega anterior

1. **Tab admin "Workflows de Onboarding"** (CRUD com editor de passos JSON)
2. **Tab admin "Skill Assessments"** (CRUD vinculando a quizzes existentes)
3. **Integrar `OnboardingWidget` no Dashboard** (já criado, falta montar)
4. **Widget "Avaliações pendentes" no Dashboard** (usando `useDueAssessments`)
5. **Atualizar `CommandPalette`** com 4 novos comandos (Playbooks, Vídeos, Onboarding, Avaliações)
6. **Atualizar `MobileBottomNav`** se houver espaço, ou adicionar links no header
7. **Corrigir tabs admin**: já adicionei Playbooks/Vídeos mas faltam ícones distintos (Video, FileText) e os 2 novos tabs acima
8. **Testes Vitest** para os novos hooks (`usePlaybooks`, `useTrainingVideos`, `useOnboardingWorkflow`, `useSkillAssessments`)
9. **Rodar suíte completa** (deve manter 238+ passando)
10. **Validar no preview** que as 6 rotas novas carregam sem erro

## O que vou construir

### Admin
- `AdminWorkflowsTab.tsx` — lista workflows + dialog com editor visual de passos (adicionar/remover/reordenar steps tipados: video/playbook/quiz/course/task)
- `AdminAssessmentsTab.tsx` — lista assessments + dialog com seletor de quiz existente (dropdown carregando `quizzes`), campos skill_area, frequency_days, passing_score
- Atualizar `Admin.tsx`: 11 tabs com ícones corretos (FileText p/ Playbooks, Video p/ Vídeos, Sparkles p/ Workflows, Target p/ Assessments)

### Dashboard
- Adicionar `<OnboardingWidget />` no `Dashboard.tsx`
- Criar `DueAssessmentsWidget.tsx` mostrando avaliações vencidas/próximas com CTA

### Navegação
- Adicionar entradas no `CommandPalette` (Playbooks, Vídeos, Onboarding, Avaliações)
- Adicionar links no header do Dashboard ou em menu dropdown

### Testes
- `src/test/salesEnablement.test.ts` — valida tipos exportados, shape de hooks, presença de páginas/rotas

### Validação final
- Rodar suíte completa Vitest
- Abrir preview nas rotas /playbooks, /biblioteca-videos, /onboarding, /avaliacoes para garantir que renderizam (mesmo vazias)

## Padrões mantidos
- Modularização ≤400 linhas
- Zero `any`, zero `console.*`
- Toasts sonner para feedback
- TanStack Query + invalidação correta
- RLS já configurado nas migrations anteriores
- shadcn/ui + tokens semânticos do design system

## Ordem de execução (sequencial, sem pausas)
1. AdminWorkflowsTab + AdminAssessmentsTab
2. Atualizar Admin.tsx (tabs + ícones)
3. DueAssessmentsWidget + integrar widgets no Dashboard
4. Atualizar CommandPalette
5. Suíte de testes nova
6. Rodar testes + validar preview
