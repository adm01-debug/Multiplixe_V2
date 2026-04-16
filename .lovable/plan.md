
O usuário pediu funcionalidades de "Treinamento & Enablement" para vendas. Analisando o projeto atual, ele JÁ É um LMS completo com cursos, certificações, gamificação, quizzes, badges, vídeo player e onboarding. Vou mapear o que existe vs. o que falta:

**Já existe:**
- 🎓 LMS (cursos, certificações) ✅
- 🎮 Gamified learning (quizzes, badges, XP, níveis) ✅
- 🎬 Video library (player com VideoPlayer) ✅
- 📋 Onboarding (WelcomeWizard) ✅

**Falta implementar:**
- 📚 **Sales Playbook Hub** searchable (novo módulo de playbooks/artigos)
- 📋 **Onboarding workflows** específicos para novos vendedores (diferente do tutorial)
- 🏆 **Skill Assessments** periódicas (avaliações recorrentes diferentes dos quizzes de curso)
- Video library standalone (galeria de vídeos para training/demos fora de cursos)

Vou propor um plano enxuto focado no que falta.

# Plano: Sales Enablement Suite

## O que já existe (reaproveitar)
LMS, certificações, quizzes gamificados, badges, XP, player de vídeo, onboarding wizard — não precisam ser refeitos.

## O que vou construir

### 1. Sales Playbook Hub (novo)
Biblioteca pesquisável de playbooks de vendas (artigos estruturados: scripts, objeções, processos).

**Backend:**
- Tabela `playbooks` (id, title, slug, category, content markdown, tags[], author_id, is_published, view_count, created_at)
- Tabela `playbook_views` (rastreio de leitura)
- RLS: leitura para autenticados, escrita só admin
- Índice GIN para full-text search em title+content+tags

**Frontend:**
- `/playbooks` — lista + busca fuzzy (Fuse.js, padrão do projeto) + filtro por categoria/tag
- `/playbook/:slug` — visualização markdown com TOC
- Admin tab "Playbooks" no painel admin (CRUD)

### 2. Video Library (novo, standalone)
Galeria de vídeos curtos (demos, training rápido) separada dos cursos.

**Backend:**
- Tabela `training_videos` (id, title, description, video_url, thumbnail_url, category, duration_seconds, tags[], view_count, is_published)
- Tabela `video_views` (user_id, video_id, watched_seconds, completed)
- RLS padrão

**Frontend:**
- `/biblioteca-videos` — grid com filtros, busca, preview hover
- Modal player reaproveitando `VideoPlayer` existente
- Tab admin "Vídeos"

### 3. Sales Onboarding Workflow (novo)
Fluxo guiado multi-etapas para novos vendedores (diferente do tutorial geral): checklist com tarefas obrigatórias (assistir vídeo X, ler playbook Y, passar no quiz Z).

**Backend:**
- Tabela `onboarding_workflows` (id, name, role_target, steps jsonb [{type, resource_id, title, required}])
- Tabela `user_onboarding_progress` (user_id, workflow_id, current_step, completed_steps[], started_at, completed_at)
- Função `assign_onboarding_workflow(user_id, role)` ao signup

**Frontend:**
- Widget no Dashboard mostrando progresso do workflow
- `/onboarding` página dedicada com checklist visual
- Admin: criar/editar workflows com seletor de recursos

### 4. Skill Assessments periódicas (novo)
Avaliações recorrentes (mensais/trimestrais) que medem competência por área, geram relatório de gaps e recomendam treinamentos.

**Backend:**
- Tabela `skill_assessments` (id, title, skill_area, frequency_days, question_count, passing_score)
- Tabela `assessment_questions` (vincula a quiz_questions reutilizadas)
- Tabela `user_assessment_results` (user_id, assessment_id, score, completed_at, gaps jsonb, next_due_at)
- Função `get_due_assessments(user_id)` retorna avaliações pendentes

**Frontend:**
- `/avaliacoes` — lista com status (pendente/em dia/vencida)
- Player reutilizando `QuizPlayer` existente
- Tela de resultado: gráfico radar de competências (reaproveitar `SkillRadarChart`) + recomendações
- Notificação automática quando avaliação vence

## Detalhes técnicos

**Padrões a seguir (já no projeto):**
- Modularização ≤400 linhas por arquivo
- Hooks dedicados (`usePlaybooks`, `useTrainingVideos`, `useOnboardingWorkflow`, `useSkillAssessments`)
- TanStack Query com cache
- Validação Zod em todos os forms
- Busca fuzzy via `useFuzzySearch`
- shadcn/ui components
- RLS com `has_role(auth.uid(), 'admin'::app_role)` para escrita admin
- Toasts (sonner) para feedback, sem console.log
- Tipos específicos, sem `any`

**Navegação:**
- Adicionar entradas no `CommandPalette`
- Links no header/sidebar
- Mobile bottom nav atualizado

**Testes:**
- Adicionar suítes Vitest para hooks novos e validações
- Rodar suite completa (deve continuar 238+ passando)

## Ordem de execução
1. Migrations (4 conjuntos de tabelas + funções + RLS)
2. Hooks + tipos
3. Páginas públicas (Playbooks, Vídeos, Avaliações, Onboarding)
4. Telas admin (CRUD em tabs do painel admin)
5. Integração no Dashboard (widget onboarding + avaliações pendentes)
6. Testes + validação preview
