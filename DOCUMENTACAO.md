# 📚 Levantamento Completo: MULTIPLIXE - Plataforma de Treinamento Corporativo

> Documentação técnica exaustiva de todas as funcionalidades implementadas e ferramentas utilizadas.

---

## 📋 Índice

1. [Stack Base](#1-stack-base)
2. [Autenticação e Segurança](#2-autenticação-e-segurança)
3. [Gestão de Cursos](#3-gestão-de-cursos)
4. [Player de Vídeo/Aulas](#4-player-de-vídeoaulas)
5. [Trilhas de Aprendizado](#5-trilhas-de-aprendizado)
6. [Sistema de Gamificação](#6-sistema-de-gamificação)
7. [Sistema de Quizzes](#7-sistema-de-quizzes)
8. [Modo Foco (Pomodoro)](#8-modo-foco-pomodoro)
9. [Certificados](#9-certificados)
10. [Notificações](#10-notificações)
11. [Perfil do Usuário](#11-perfil-do-usuário)
12. [Painel Administrativo](#12-painel-administrativo)
13. [UI/UX Components](#13-uiux-components)
14. [Gráficos e Visualizações](#14-gráficos-e-visualizações)
15. [Utilitários](#15-utilitários)
16. [Estrutura do Banco de Dados](#16-estrutura-do-banco-de-dados)
17. [Funções RPC do Supabase](#17-funções-rpc-do-supabase)

---

## 1. Stack Base

| Funcionalidade | Ferramenta/Biblioteca | Versão | Arquivo Principal |
|----------------|----------------------|--------|-------------------|
| Framework Frontend | React | ^18.3.1 | `src/main.tsx` |
| Linguagem | TypeScript | - | `tsconfig.json` |
| Build Tool | Vite | - | `vite.config.ts` |
| Estilização | Tailwind CSS | - | `tailwind.config.ts`, `src/index.css` |
| Componentes UI | shadcn/ui + Radix UI | Múltiplas | `src/components/ui/*` |
| Roteamento | react-router-dom | ^6.30.1 | `src/App.tsx` |
| Estado do Servidor | @tanstack/react-query | ^5.83.0 | `src/App.tsx` |
| Backend (BaaS) | Supabase | ^2.89.0 | `src/integrations/supabase/*` |
| SEO | react-helmet-async | ^2.0.5 | `src/App.tsx` |
| Temas (Dark/Light) | next-themes | ^0.3.0 | `src/App.tsx`, `src/components/ThemeToggle.tsx` |

---

## 2. Autenticação e Segurança

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Login/Cadastro | Supabase Auth | `src/hooks/useAuth.tsx` |
| Sessões Persistentes | Supabase Auth | `onAuthStateChange()` |
| Proteção de Rotas | React Context | `AuthProvider` em `useAuth.tsx` |
| Row Level Security (RLS) | Supabase Policies | Migrations SQL |
| Controle de Roles (Admin) | Supabase RPC | `has_role()` function |
| Auto-confirm Email | Supabase Auth Config | `supabase/config.toml` |

### Arquivos Relacionados:
- `src/hooks/useAuth.tsx` - Hook principal de autenticação
- `src/pages/Auth.tsx` - Página de login/cadastro
- `src/hooks/useAdminRole.ts` - Verificação de role admin

---

## 3. Gestão de Cursos

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| CRUD de Cursos | Supabase + React Query | `src/pages/Admin.tsx` |
| Listagem com Filtros | React State | `src/pages/Catalog.tsx` |
| Busca por Texto | JavaScript filter() | `src/components/catalog/SearchInput.tsx` |
| Filtro por Categoria | Supabase Query | `src/components/catalog/CategoryFilter.tsx` |
| Filtro por Nível | React State | `src/components/catalog/LevelFilter.tsx` |
| Slugs para URLs | Supabase Column | Campo `slug` na tabela `courses` |
| Cursos em Destaque | Supabase Boolean | Campo `featured` |
| Publicar/Despublicar | Supabase Update | Campo `published` |

### Arquivos Relacionados:
- `src/pages/Catalog.tsx` - Catálogo público
- `src/pages/CourseDetail.tsx` - Detalhes do curso
- `src/components/catalog/*` - Componentes do catálogo
- `src/components/admin/CourseForm.tsx` - Formulário admin

---

## 4. Player de Vídeo/Aulas

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Player de Vídeo | HTML5 Video + React | `src/components/player/VideoPlayer.tsx` |
| Rastreamento de Progresso | Supabase | Tabela `user_lesson_progress` |
| Continuar de Onde Parou | Supabase Query | `watched_seconds` column |
| Lista de Aulas | React Component | `src/components/player/LessonList.tsx` |
| Navegação entre Aulas | react-router-dom | Links dinâmicos |
| Marcação de Conclusão | Supabase Update | `completed = true` |

### Arquivos Relacionados:
- `src/pages/LessonPlayer.tsx` - Página do player
- `src/components/player/VideoPlayer.tsx` - Componente do player
- `src/components/player/LessonList.tsx` - Lista lateral

---

## 5. Trilhas de Aprendizado

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| CRUD de Trilhas | Supabase | Tabela `learning_paths` |
| Associação Curso-Trilha | Supabase | Tabela `learning_path_courses` |
| Ordenação de Cursos | Supabase | Campo `order_index` |
| Progresso da Trilha | Supabase | Tabela `user_learning_path_progress` |
| Certificado de Trilha | Supabase RPC | `issue_learning_path_certificate()` |
| Listagem de Trilhas | React Query | `src/hooks/useLearningPaths.ts` |

### Arquivos Relacionados:
- `src/pages/LearningPaths.tsx` - Listagem de trilhas
- `src/pages/LearningPathDetail.tsx` - Detalhes da trilha
- `src/hooks/useLearningPaths.ts` - Hook de dados
- `src/components/learning-paths/LearningPathCard.tsx` - Card de trilha
- `src/components/admin/LearningPathsManager.tsx` - Gerenciador admin

---

## 6. Sistema de Gamificação

### 6.1 Sistema de XP

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Adicionar XP | Supabase RPC | `add_user_xp(amount, source)` |
| Cálculo de Nível | JavaScript | `src/lib/levelSystem.ts` |
| Histórico de XP | Supabase | Tabela `xp_history` |
| XP por Fonte | Supabase JSON | Campo `xp_breakdown` em `user_xp` |

### 6.2 Sistema de Níveis

| Nível | Nome | XP Necessário | Ícone |
|-------|------|---------------|-------|
| 1 | Novato | 0 | 🌱 |
| 2 | Aprendiz | 100 | 📚 |
| 3 | Estudante | 300 | ✏️ |
| 4 | Praticante | 600 | 🎯 |
| 5 | Conhecedor | 1000 | 💡 |
| 6 | Especialista | 1500 | ⭐ |
| 7 | Mestre | 2500 | 🏆 |
| 8 | Grão-Mestre | 4000 | 👑 |
| 9 | Lenda | 6000 | 🌟 |

### 6.3 Conquistas

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Definição de Conquistas | Supabase | Tabela `achievements` |
| Verificação Automática | Supabase RPC | `check_and_award_achievements()` |
| Desbloqueio | Supabase | Tabela `user_achievements` |
| Celebração Visual | canvas-confetti | `src/hooks/useConfetti.ts` |
| Modal de Conquista | React + Framer | `src/components/AchievementUnlocked.tsx` |

### 6.4 Streaks (Sequências)

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Rastreamento Diário | Supabase | Tabela `user_streaks` |
| Atualização de Streak | Supabase RPC | `update_user_streak()` |
| Streak Máximo | Supabase Column | `longest_streak` |
| Alerta de Risco | Supabase | `streak_at_risk` boolean |
| Celebração de Streak | canvas-confetti | `src/components/StreakCelebration.tsx` |

### 6.5 Leaderboard (Ranking)

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Ranking Global | Supabase RPC | `get_leaderboard(limit, period)` |
| Posição do Usuário | Supabase RPC | `get_user_rank(user_id)` |
| Filtro por Período | React State | `week`, `month`, `all` |
| Badges de Rank | React Component | `src/components/RankBadge.tsx` |

### Arquivos Relacionados:
- `src/hooks/useUserXP.ts` - Gerenciamento de XP
- `src/hooks/useAchievements.ts` - Conquistas
- `src/hooks/useStreaks.ts` - Streaks
- `src/hooks/useLeaderboard.ts` - Ranking
- `src/hooks/useLevelUp.ts` - Detecção de level up
- `src/hooks/useConfetti.ts` - Efeitos visuais
- `src/hooks/useXPHistory.ts` - Histórico
- `src/lib/levelSystem.ts` - Cálculos de nível
- `src/components/LevelProgress.tsx` - Barra de progresso
- `src/components/XPEvolutionChart.tsx` - Gráfico de evolução
- `src/components/AchievementsGrid.tsx` - Grid de conquistas
- `src/components/StreakDisplay.tsx` - Display de streak
- `src/pages/Leaderboard.tsx` - Página de ranking

---

## 7. Sistema de Quizzes

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| CRUD de Quizzes | Supabase | Tabela `quizzes` |
| Perguntas | Supabase | Tabela `quiz_questions` |
| Opções de Resposta | Supabase | Tabela `quiz_options` |
| Tentativas do Usuário | Supabase | Tabela `user_quiz_attempts` |
| XP por Aprovação | Supabase Trigger | +50 XP ao passar |
| Player de Quiz | React Component | `src/components/quiz/QuizPlayer.tsx` |
| Modal de Quiz | React Dialog | `src/components/quiz/CourseQuizModal.tsx` |
| Cooldown entre Tentativas | JavaScript | Verificação de tempo |
| Estatísticas | React Component | `src/components/admin/QuizStats.tsx` |

### Arquivos Relacionados:
- `src/hooks/useQuizzes.ts` - Hook de quizzes
- `src/components/quiz/QuizPlayer.tsx` - Player
- `src/components/quiz/QuizCard.tsx` - Card de quiz
- `src/components/quiz/CourseQuizModal.tsx` - Modal
- `src/components/admin/QuizManager.tsx` - Gerenciador admin

---

## 8. Modo Foco (Pomodoro)

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Timer 25/5 min | React State + setInterval | `src/hooks/usePomodoro.ts` |
| Sessões Persistentes | Supabase | Tabela `pomodoro_sessions` |
| XP por Sessão | Supabase RPC | `complete_pomodoro_session()` |
| Botão Flutuante Global | React Component | `src/components/pomodoro/FloatingPomodoroButton.tsx` |
| Timer Compacto | React Component | `src/components/pomodoro/PomodoroTimer.tsx` |
| Overlay de Foco | CSS + React | Fundo semi-transparente |
| Som de Notificação | HTML5 Audio | `/notification.mp3` |
| Estatísticas | Supabase Query | Sessões completadas hoje |

### Conquistas de Pomodoro:
- 🍅 Primeiro Foco - Complete 1 sessão
- 🔥 Foco Intenso - Complete 5 sessões
- ⚡ Mestre do Foco - Complete 25 sessões
- 🧘 Zen Master - Complete 100 sessões

### Arquivos Relacionados:
- `src/hooks/usePomodoro.ts` - Lógica do timer
- `src/components/pomodoro/PomodoroTimer.tsx` - Componente visual
- `src/components/pomodoro/FloatingPomodoroButton.tsx` - Botão global

---

## 9. Certificados

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Geração de Certificado | Supabase RPC | `issue_certificate()` |
| Código de Verificação | MD5 Hash | Campo `verification_code` |
| Download PDF | jsPDF | `src/pages/Profile.tsx` |
| Verificação Pública | React Page | `src/pages/VerifyCertificate.tsx` |
| Listagem de Certificados | React Query | `src/hooks/useCertificates.ts` |

### Arquivos Relacionados:
- `src/hooks/useCertificates.ts` - Hook de certificados
- `src/pages/VerifyCertificate.tsx` - Página de verificação
- `src/components/CertificateCard.tsx` - Card de certificado
- `supabase/functions/generate-certificate/index.ts` - Edge function

---

## 10. Notificações

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Armazenamento | Supabase | Tabela `notifications` |
| Criação de Notificação | Supabase RPC | `create_notification()` |
| Alerta de Streak em Risco | Supabase Trigger | Automático |
| Novos Cursos | Supabase Trigger | Automático |
| Sino de Notificações | React Component | `src/components/NotificationBell.tsx` |
| Marcar como Lida | Supabase Update | `read = true` |
| Toast Notifications | Sonner + shadcn | `src/components/ui/sonner.tsx` |

### Arquivos Relacionados:
- `src/hooks/useNotifications.ts` - Hook de notificações
- `src/components/NotificationBell.tsx` - Componente do sino
- `src/components/ui/toast.tsx` - Toasts
- `src/components/ui/sonner.tsx` - Sonner integration

---

## 11. Perfil do Usuário

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Dados do Perfil | Supabase | Tabela `profiles` |
| Avatar | Supabase Storage | Campo `avatar_url` |
| Departamento | Supabase Column | Campo `department` |
| Criação Automática | Supabase Trigger | `handle_new_user()` |
| Edição de Perfil | React Form | `src/pages/Profile.tsx` |
| Grid de Conquistas | React Component | `src/components/AchievementsGrid.tsx` |

### Arquivos Relacionados:
- `src/pages/Profile.tsx` - Página de perfil
- `src/components/AchievementsGrid.tsx` - Conquistas do usuário

---

## 12. Painel Administrativo

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Dashboard Admin | React Page | `src/pages/Admin.tsx` |
| Gerenciar Cursos | React Component | `src/components/admin/CourseForm.tsx` |
| Gerenciar Aulas | React Component | `src/components/admin/LessonsManager.tsx` |
| Gerenciar Trilhas | React Component | `src/components/admin/LearningPathsManager.tsx` |
| Gerenciar Quizzes | React Component | `src/components/admin/QuizManager.tsx` |
| Estatísticas | Supabase Queries | Agregações |
| Controle de Acesso | Supabase RPC | `has_role('admin')` |

### Arquivos Relacionados:
- `src/pages/Admin.tsx` - Página principal
- `src/components/admin/*` - Componentes administrativos
- `src/hooks/useAdminRole.ts` - Verificação de role

---

## 13. UI/UX Components

### shadcn/ui Components Utilizados:

| Componente | Uso Principal | Arquivo |
|------------|---------------|---------|
| Accordion | FAQ, Listas expansíveis | `accordion.tsx` |
| Alert Dialog | Confirmações destrutivas | `alert-dialog.tsx` |
| Avatar | Fotos de perfil | `avatar.tsx` |
| Badge | Tags, Status | `badge.tsx` |
| Button | Ações | `button.tsx` |
| Card | Containers | `card.tsx` |
| Carousel | Slides | `carousel.tsx` |
| Checkbox | Formulários | `checkbox.tsx` |
| Command | Paleta de comandos | `command.tsx` |
| Dialog | Modais | `dialog.tsx` |
| Dropdown Menu | Menus | `dropdown-menu.tsx` |
| Form | Formulários | `form.tsx` |
| Input | Campos de texto | `input.tsx` |
| Label | Labels | `label.tsx` |
| Popover | Tooltips ricos | `popover.tsx` |
| Progress | Barras de progresso | `progress.tsx` |
| Radio Group | Seleção única | `radio-group.tsx` |
| Scroll Area | Scroll customizado | `scroll-area.tsx` |
| Select | Dropdowns | `select.tsx` |
| Separator | Divisores | `separator.tsx` |
| Sheet | Sidebars móveis | `sheet.tsx` |
| Skeleton | Loading states | `skeleton.tsx` |
| Slider | Ranges | `slider.tsx` |
| Switch | Toggles | `switch.tsx` |
| Table | Tabelas | `table.tsx` |
| Tabs | Navegação em abas | `tabs.tsx` |
| Textarea | Texto longo | `textarea.tsx` |
| Toast | Notificações | `toast.tsx` |
| Tooltip | Dicas | `tooltip.tsx` |

### Bibliotecas UI Adicionais:

| Biblioteca | Versão | Uso |
|------------|--------|-----|
| Embla Carousel | ^8.6.0 | Carrosséis |
| cmdk | ^1.1.1 | Command Palette |
| Vaul | ^0.9.9 | Drawer mobile |
| react-day-picker | ^8.10.1 | Calendário |
| input-otp | ^1.4.2 | Campos OTP |
| react-resizable-panels | ^2.1.9 | Painéis redimensionáveis |

---

## 14. Gráficos e Visualizações

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Gráficos de Linha/Área | Recharts | `src/components/XPEvolutionChart.tsx` |
| Confetti | canvas-confetti | `src/hooks/useConfetti.ts` |
| Chart Container | shadcn/ui | `src/components/ui/chart.tsx` |

### Arquivos Relacionados:
- `src/components/XPEvolutionChart.tsx` - Evolução de XP
- `src/components/ui/chart.tsx` - Wrapper de charts
- `src/hooks/useConfetti.ts` - Efeitos de celebração

---

## 15. Utilitários

| Funcionalidade | Ferramenta | Implementação |
|----------------|------------|---------------|
| Class Merging | clsx + tailwind-merge | `src/lib/utils.ts` |
| Variantes de Componentes | class-variance-authority | Componentes UI |
| Formatação de Datas | date-fns | ^3.6.0 |
| Validação de Forms | Zod + react-hook-form | Formulários |
| Detecção de Mobile | Custom Hook | `src/hooks/use-mobile.tsx` |

### Arquivos Relacionados:
- `src/lib/utils.ts` - Função `cn()` para classes
- `src/hooks/use-mobile.tsx` - Hook de detecção mobile

---

## 16. Estrutura do Banco de Dados

### Tabelas Principais:

| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `profiles` | Dados de perfil do usuário | ✅ |
| `courses` | Cursos disponíveis | ✅ |
| `lessons` | Aulas dos cursos | ✅ |
| `categories` | Categorias de cursos | ✅ |
| `user_lesson_progress` | Progresso em aulas | ✅ |
| `user_course_progress` | Progresso em cursos | ✅ |
| `user_xp` | XP total do usuário | ✅ |
| `xp_history` | Histórico de XP ganho | ✅ |
| `achievements` | Definições de conquistas | ✅ |
| `user_achievements` | Conquistas desbloqueadas | ✅ |
| `user_streaks` | Sequências de estudo | ✅ |
| `certificates` | Certificados emitidos | ✅ |
| `learning_paths` | Trilhas de aprendizado | ✅ |
| `learning_path_courses` | Cursos em trilhas | ✅ |
| `user_learning_path_progress` | Progresso em trilhas | ✅ |
| `learning_path_certificates` | Certificados de trilhas | ✅ |
| `quizzes` | Quizzes dos cursos | ✅ |
| `quiz_questions` | Perguntas dos quizzes | ✅ |
| `quiz_options` | Opções de resposta | ✅ |
| `user_quiz_attempts` | Tentativas de quiz | ✅ |
| `notifications` | Notificações do sistema | ✅ |
| `pomodoro_sessions` | Sessões de foco | ✅ |
| `user_roles` | Roles de usuário (admin) | ✅ |

---

## 17. Funções RPC do Supabase

| Função | Parâmetros | Retorno | Descrição |
|--------|------------|---------|-----------|
| `add_user_xp` | `p_amount`, `p_source` | `void` | Adiciona XP ao usuário |
| `check_and_award_achievements` | - | `achievements[]` | Verifica e concede conquistas |
| `update_user_streak` | - | `user_streaks` | Atualiza streak do usuário |
| `get_leaderboard` | `p_limit`, `p_period` | `leaderboard[]` | Retorna ranking |
| `get_user_rank` | `p_user_id` | `rank_info` | Retorna posição do usuário |
| `issue_certificate` | `p_course_id`, `p_user_name`, `p_course_title` | `certificate` | Emite certificado |
| `issue_learning_path_certificate` | `p_path_id`, `p_user_name`, `p_path_title` | `certificate` | Emite certificado de trilha |
| `complete_pomodoro_session` | `p_session_type`, `p_duration_minutes` | `void` | Completa sessão pomodoro |
| `create_notification` | `p_user_id`, `p_title`, `p_message`, `p_type` | `notification` | Cria notificação |
| `has_role` | `p_role` | `boolean` | Verifica role do usuário |
| `get_course_by_slug` | `p_slug` | `course` | Busca curso por slug |
| `get_user_stats` | - | `stats` | Retorna estatísticas do usuário |
| `calculate_course_progress` | `p_course_id` | `progress` | Calcula progresso no curso |

---

## 📁 Estrutura de Pastas

```
src/
├── components/
│   ├── admin/           # Componentes administrativos
│   ├── catalog/         # Componentes do catálogo
│   ├── landing/         # Componentes da landing page
│   ├── learning-paths/  # Componentes de trilhas
│   ├── player/          # Componentes do player de vídeo
│   ├── pomodoro/        # Componentes do modo foco
│   ├── quiz/            # Componentes de quizzes
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom hooks
├── integrations/        # Integrações (Supabase)
├── lib/                 # Utilitários e helpers
├── pages/               # Páginas da aplicação
└── assets/              # Assets estáticos
```

---

## 🔧 Configurações Importantes

| Arquivo | Descrição |
|---------|-----------|
| `tailwind.config.ts` | Configuração do Tailwind CSS |
| `src/index.css` | Variáveis CSS e tokens de design |
| `vite.config.ts` | Configuração do Vite |
| `supabase/config.toml` | Configuração do Supabase |
| `tsconfig.json` | Configuração do TypeScript |

---

## 📊 Métricas do Projeto

- **Total de Componentes:** ~50+
- **Total de Hooks Customizados:** 15+
- **Total de Páginas:** 12
- **Tabelas no Banco:** 23
- **Funções RPC:** 13
- **Conquistas Disponíveis:** 15+

---

## 🚀 Próximas Funcionalidades Planejadas

Consulte o arquivo `PLANO_MELHORIAS.md` para a lista completa de melhorias planejadas.

---

> **Última atualização:** Dezembro 2024
> **Versão:** 1.0.0

---

# Sprint Coroação — Fechamento 10/10

## IA aplicada (Lovable AI Gateway, sem API key do usuário)
- `ai-playbook-summarize` — resumo executivo de playbooks longos (botão Sparkles em PlaybookDetail)
- `ai-quiz-generator` — admin gera questões de quiz a partir de transcrição/conteúdo (modal em QuizManager)

## Comentários em Playbooks
- CRUD completo via `usePlaybookComments` / `useAddPlaybookComment` / `useUpdatePlaybookComment` / `useDeletePlaybookComment`
- Edição inline com botão de lápis · exibe `updated_at` quando editado
- Trigger SQL `notify_new_playbook_comment` cria notificação para autores anteriores do thread
- Atalho `n` foca o textarea (via `data-comment-input`)

## Recomendações
- `useSmartRecommendations` — sugestões baseadas em progresso/categoria/nível
- Widget `SmartRecommendations` integrado no Dashboard
- Atalho `g r` navega para área de recomendações

## Internacionalização (i18n)
- `src/lib/i18n.ts` — store leve com PT-BR e EN, persistência em `localStorage` (`app.locale`)
- Hook `useT()` reativo · função `t(path)` para uso fora de componentes
- `LanguageToggle` no Header da landing · aplicado em Header / DashboardHeader / MobileBottomNav

## Métricas avançadas (Admin)
- `AdminEngagementHeatmap` — heatmap dia × hora dos últimos 30 dias (audit_logs)
- `AdminCohortRetention` — retenção semanal de novos usuários (4 coortes)
- `PlatformAnalytics` continua como visão geral de KPIs

## Sitemap dinâmico
- `generate-sitemap` agora inclui:
  - rotas estáticas públicas
  - cursos publicados (`/curso/:slug`)
  - trilhas publicadas (`/trilhas/:slug`)
  - vídeos publicados (`/biblioteca-videos`)
  - playbooks publicados (`/playbook/:slug`)

## Atalhos globais
- `g d/c/t/p/v/o/a/r` navegação · `n` comentário · `?` ajuda · `⌘K` Command Palette
- `KeyboardShortcutsModal` lista todos via `SHORTCUTS_LIST`

## Performance percebida
- `PlaybookDetailSkeleton` durante carregamento
- Optimistic updates em favoritos (rollback automático em erro)
- `LazyImage` com placeholder · prefetch de rotas

## Qualidade
- **318+ testes** (Vitest) · zero `any` · zero `console.*`
- Arquivos ≤ 400 linhas · tokens HSL semânticos · WCAG AA
- RLS com `has_role(auth.uid(), 'admin')` em todas as tabelas sensíveis
