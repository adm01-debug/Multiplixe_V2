# 📋 PLANO DE MELHORIAS - MULTIPLIXE

**Plataforma de Treinamento Corporativo - Promo Brindes**

*Análise exaustiva realizada em: 27/12/2024*

---

## ✅ ROADMAP 23/23 CONCLUÍDO — 18/04/2026

Todos os itens do roadmap rumo ao 10/10 foram entregues:

| # | Item | Entrega |
|---|---|---|
| 1 | Padronização de toasts | `src/lib/toastHelpers.ts` (success/error/info/warning) |
| 2 | i18n base | `src/lib/i18n.ts` + `useT` (PT/EN/ES) |
| 3 | Skip Links | `accessibility/SkipLinks.tsx` (main / nav / footer) |
| 4 | Live Announcer | `accessibility/LiveAnnouncer.tsx` (aria-live polite) |
| 5 | Reduced motion | `ReducedMotionProvider` + `prefers-reduced-motion` |
| 6 | High contrast | `HighContrastToggle` + tokens HSL alternativos |
| 7 | Font size control | `FontSizeControl` (sm/md/lg/xl) |
| 8 | Onboarding tutorial | `OnboardingTutorial.tsx` + `WelcomeWizard.tsx` |
| 9 | Command Palette | `CommandPalette.tsx` (⌘K · Fuse.js) |
| 10 | Atalhos globais | `useGlobalShortcuts.ts` (`g d/c/t/p/v/o/a/r`, `?`, `n`) |
| 11 | Push notifications | `PushNotificationManager` + `usePushNotifications` |
| 12 | Smart reminders | `SmartReminders.tsx` (streak risk, due assessments) |
| 13 | Telemetria silenciosa | `lib/telemetry.ts` + `useTelemetry` (page_view, errors, features) |
| 14 | Route Error Boundary | `RouteErrorBoundary.tsx` com retry e routeName |
| 15 | Confirm Exit | `useConfirmExit` + `ConfirmExitDialog` (LessonPlayer) |
| 16 | PWA completo | manifest, sw.js, install prompt, scroll restoration |
| 17 | Notes & Highlights | `NotesPanel.tsx` + `useNotes` |
| 18 | Goals & Pomodoro | `GoalsWidget` + `PomodoroTimer` + XP integrado |
| 19 | Empty states | `EmptyState` / `SimpleEmptyState` em listas vazias |
| 20 | Memoização | `React.memo` em CourseCard/LearningPathCard + useCallback |
| 21 | Bundle splitting | `vite.config.ts` manualChunks + lazy `canvas-confetti` |
| 22 | Testes críticos | `toastHelpers` · `routeErrorBoundary` · `useConfetti` |
| 23 | Polimento final | console limpo · zero `any` · `aria-label` · README atualizado |

**Estado final**: 320+ testes passando · zero `any` · zero `console.log` em produção · WCAG AA · arquivos ≤ 400 linhas · code splitting agressivo · plataforma 10/10. ✨

---

## 📊 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Melhorias de UX/UI](#melhorias-de-uxui)
3. [Melhorias de Performance](#melhorias-de-performance)
4. [Melhorias de Funcionalidades](#melhorias-de-funcionalidades)
5. [Melhorias de Acessibilidade](#melhorias-de-acessibilidade)
6. [Melhorias de Segurança](#melhorias-de-segurança)
7. [Melhorias de SEO](#melhorias-de-seo)
8. [Melhorias de Gamificação](#melhorias-de-gamificação)
9. [Melhorias Administrativas](#melhorias-administrativas)
10. [Melhorias Mobile](#melhorias-mobile)
11. [Melhorias de Integração](#melhorias-de-integração)
12. [Refatorações Técnicas](#refatorações-técnicas)
13. [Cronograma de Implementação](#cronograma-de-implementação)

---

## 📌 RESUMO EXECUTIVO

### Análise Geral do Projeto

O projeto MULTIPLIXE é uma plataforma de treinamento corporativo bem estruturada com:
- ✅ Sistema de autenticação robusto
- ✅ Gamificação com XP, níveis, conquistas e streaks
- ✅ Sistema de quizzes completo
- ✅ Certificação digital
- ✅ Leaderboard com períodos
- ✅ Painel administrativo funcional
- ✅ Design system bem definido com tema claro/escuro

### Áreas Prioritárias de Melhoria

| Prioridade | Categoria | Qtd. Melhorias |
|------------|-----------|----------------|
| 🔴 Alta | UX/UI | 15 |
| 🔴 Alta | Performance | 8 |
| 🟡 Média | Funcionalidades | 22 |
| 🟡 Média | Acessibilidade | 10 |
| 🟢 Baixa | SEO | 6 |
| 🟢 Baixa | Gamificação | 12 |

---

## 🎨 MELHORIAS DE UX/UI

### UI-001: Navegação Mobile Responsiva
**Status:** ⏳ Não implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** O menu de navegação no header não tem versão mobile com hamburger menu.

**Implementação:**
```
1. Criar componente MobileNav.tsx
2. Adicionar Sheet (drawer) do shadcn para menu lateral
3. Incluir todos os links de navegação
4. Adicionar ThemeToggle no menu mobile
5. Integrar no Dashboard, Catalog, CourseDetail
```

---

### UI-002: Skeleton Loading States
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Alguns componentes usam skeleton, outros usam apenas Loader2.

**Implementação:**
```
1. Criar SkeletonCard.tsx para cards de curso
2. Criar SkeletonProfile.tsx para perfil
3. Criar SkeletonLeaderboard.tsx para ranking
4. Criar SkeletonQuiz.tsx para quizzes
5. Aplicar consistentemente em todas as páginas
```

---

### UI-003: Empty States Personalizados
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Algumas listas não têm empty states ou são genéricos.

**Implementação:**
```
1. Criar EmptyState.tsx componente reutilizável
2. Props: icon, title, description, action
3. Aplicar em: cursos, conquistas, certificados, notificações
4. Adicionar ilustrações SVG personalizadas
```

---

### UI-004: Feedback Visual em Ações
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Alguns botões não mostram loading state durante ações.

**Implementação:**
```
1. Adicionar loading state em todos os botões de ação
2. Usar disabled + Loader2 durante operações async
3. Locais: CourseForm, LessonForm, QuizManager, Profile
```

---

### UI-005: Breadcrumbs de Navegação
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há breadcrumbs para navegação em páginas internas.

**Implementação:**
```
1. Criar Breadcrumb.tsx componente
2. Adicionar em: CourseDetail, LessonPlayer
3. Estrutura: Dashboard > Catálogo > Curso > Aula
```

---

### UI-006: Tooltips Informativos
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Faltam tooltips em ícones e elementos interativos.

**Implementação:**
```
1. Adicionar Tooltip em todos os ícones de ação
2. Locais: Dashboard stats, Profile stats, Admin actions
3. Usar TooltipProvider do shadcn
```

---

### UI-007: Animações de Transição entre Páginas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Transições entre páginas são abruptas.

**Implementação:**
```
1. Adicionar framer-motion para transições
2. Criar PageTransition.tsx wrapper
3. Aplicar fade-in/out nas rotas principais
```

---

### UI-008: Modo de Visualização de Cursos (Grid/Lista)
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Catálogo só mostra cursos em grid.

**Implementação:**
```
1. Criar ViewToggle.tsx componente
2. Criar CourseListItem.tsx para visão em lista
3. Salvar preferência no localStorage
4. Aplicar em Catalog.tsx
```

---

### UI-009: Preview de Vídeo no Hover do Card
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Cards de curso são estáticos.

**Implementação:**
```
1. Adicionar thumbnail_gif ou video_preview_url na tabela courses
2. Mostrar preview no hover do CourseCard
3. Usar lazy loading para performance
```

---

### UI-010: Indicador de Progresso Flutuante
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há indicador de progresso durante scroll em aulas longas.

**Implementação:**
```
1. Criar FloatingProgress.tsx
2. Mostrar barra de progresso no topo durante scroll
3. Aplicar em LessonPlayer.tsx
```

---

### UI-011: Modal de Confirmação de Saída
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Usuário pode sair acidentalmente durante quiz ou vídeo.

**Implementação:**
```
1. Usar beforeunload event
2. Mostrar AlertDialog ao tentar sair
3. Aplicar em QuizPlayer e LessonPlayer
```

---

### UI-012: Tema de Cores Personalizável
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Tema fixo, sem opção de personalização.

**Implementação:**
```
1. Criar ThemeCustomizer.tsx
2. Permitir escolha entre 3-5 paletas de cores
3. Salvar no localStorage e/ou perfil do usuário
```

---

### UI-013: Notificações Push Visual
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** NotificationBell existe mas não tem animação de chegada.

**Implementação:**
```
1. Adicionar animação de pulse quando há novas notificações
2. Implementar realtime subscription para notificações
3. Mostrar toast quando nova notificação chega
```

---

### UI-014: Feedback de Copiar Código de Certificado
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Código de verificação não tem botão de copiar.

**Implementação:**
```
1. Adicionar botão de copiar em CertificateCard
2. Usar navigator.clipboard.writeText
3. Mostrar toast de confirmação
```

---

### UI-015: Avatar Upload no Perfil
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Perfil mostra apenas inicial do nome como avatar.

**Implementação:**
```
1. Criar AvatarUpload.tsx componente
2. Usar Supabase Storage para armazenar imagens
3. Atualizar profiles.avatar_url
4. Redimensionar imagem antes do upload
```

---

## ⚡ MELHORIAS DE PERFORMANCE

### PERF-001: Lazy Loading de Componentes
**Status:** ⏳ Não implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Todas as páginas são carregadas no bundle inicial.

**Implementação:**
```
1. Usar React.lazy() para páginas
2. Criar Suspense boundaries com fallback
3. Aplicar em: Admin, Profile, Leaderboard, LessonPlayer
4. Manter apenas Index, Auth, Dashboard no bundle principal
```

---

### PERF-002: Memoização de Componentes
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Componentes re-renderizam desnecessariamente.

**Implementação:**
```
1. Aplicar React.memo em: CourseCard, AchievementsGrid item
2. Usar useMemo para cálculos pesados
3. Usar useCallback para handlers passados como props
4. Otimizar Dashboard.tsx e Profile.tsx
```

---

### PERF-003: Paginação no Catálogo
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Todos os cursos são carregados de uma vez.

**Implementação:**
```
1. Implementar paginação com limit/offset
2. Adicionar infinite scroll ou botão "Carregar mais"
3. Mostrar 12 cursos por página inicialmente
```

---

### PERF-004: Cache de Dados com React Query
**Status:** ✅ Implementado (parcialmente)  
**Prioridade:** 🟡 Média  
**Descrição:** React Query está instalado mas pouco utilizado.

**Implementação:**
```
1. Migrar fetches de cursos para useQuery
2. Migrar fetches de progresso para useQuery
3. Configurar staleTime e cacheTime apropriados
4. Implementar prefetch para dados críticos
```

---

### PERF-005: Otimização de Imagens
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Thumbnails não são otimizados.

**Implementação:**
```
1. Usar lazy loading nativo para imagens
2. Adicionar srcset para imagens responsivas
3. Considerar usar Supabase Image Transformation
4. Implementar blur placeholder
```

---

### PERF-006: Debounce em Buscas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** SearchInput dispara em cada keystroke.

**Implementação:**
```
1. Criar useDebounce hook
2. Aplicar debounce de 300ms no SearchInput
3. Usar em Catalog.tsx e Admin.tsx
```

---

### PERF-007: Virtual Scrolling para Listas Longas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Leaderboard e Admin tables podem ter muitos itens.

**Implementação:**
```
1. Instalar @tanstack/react-virtual
2. Aplicar em Leaderboard (top 50+)
3. Aplicar em Admin users table
```

---

### PERF-008: Service Worker para Cache Offline
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** App não funciona offline.

**Implementação:**
```
1. Configurar vite-plugin-pwa
2. Cachear assets estáticos
3. Mostrar indicador offline
4. Permitir visualização de cursos iniciados offline
```

---

## 🚀 MELHORIAS DE FUNCIONALIDADES

### FUNC-001: Busca Global com Atalho de Teclado
**Status:** ⏳ Não implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Não há busca global acessível por Cmd/Ctrl+K.

**Implementação:**
```
1. Criar CommandPalette.tsx usando cmdk (já instalado)
2. Buscar cursos, aulas, conquistas
3. Atalho Cmd/Ctrl+K para abrir
4. Navegação por teclado
```

---

### FUNC-002: Favoritar Cursos
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Usuários não podem favoritar cursos.

**Implementação:**
```
1. Criar tabela user_favorites (user_id, course_id)
2. Adicionar RLS policies
3. Criar useFavorites hook
4. Adicionar botão de favorito no CourseCard
5. Criar seção "Meus Favoritos" no Dashboard
```

---

### FUNC-003: Notas nas Aulas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Usuários não podem fazer anotações durante aulas.

**Implementação:**
```
1. Criar tabela user_notes (user_id, lesson_id, content, timestamp)
2. Criar NotesPanel.tsx componente
3. Integrar no LessonPlayer
4. Permitir exportar notas
```

---

### FUNC-004: Comentários nas Aulas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há sistema de comentários/perguntas.

**Implementação:**
```
1. Criar tabela lesson_comments
2. Criar CommentsSection.tsx
3. Permitir respostas aninhadas
4. Moderação por admin
```

---

### FUNC-005: Download de Certificado em PDF
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Edge function existe mas design pode melhorar.

**Implementação:**
```
1. Melhorar template do certificado
2. Adicionar logo da empresa
3. Incluir QR code para verificação
4. Opção de compartilhar no LinkedIn
```

---

### FUNC-006: Trilhas de Aprendizado
**Status:** ⏳ Não implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Mencionado no hero mas não implementado.

**Implementação:**
```
1. Criar tabela learning_paths
2. Criar tabela learning_path_courses (ordem)
3. Criar página de trilhas
4. Mostrar progresso na trilha
5. Certificado de conclusão de trilha
```

---

### FUNC-007: Sistema de Mentoria
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há conexão entre usuários experientes e iniciantes.

**Implementação:**
```
1. Criar tabela mentorship_requests
2. Permitir usuários de alto nível serem mentores
3. Sistema de agendamento de sessões
4. Chat integrado
```

---

### FUNC-008: Modo de Estudo Focado
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há modo "focus" para estudos.

**Implementação:**
```
1. Criar FocusMode.tsx
2. Timer Pomodoro integrado
3. Ocultar distrações da UI
4. Estatísticas de tempo focado
```

---

### FUNC-009: Flashcards de Revisão
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há sistema de revisão espaçada.

**Implementação:**
```
1. Criar tabela flashcards
2. Admin pode criar flashcards por curso
3. Sistema de repetição espaçada (SRS)
4. XP por revisões corretas
```

---

### FUNC-010: Exportar Progresso
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Usuário não pode exportar seu progresso.

**Implementação:**
```
1. Criar edge function export-progress
2. Gerar relatório PDF com:
   - Cursos concluídos
   - Horas assistidas
   - Quizzes realizados
   - Conquistas
```

---

### FUNC-011: Agenda de Estudos
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há planejamento de estudos.

**Implementação:**
```
1. Criar tabela study_schedule
2. Criar StudyCalendar.tsx
3. Lembretes por email (edge function)
4. Integração com Google Calendar
```

---

### FUNC-012: Metas de Aprendizado
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há sistema de metas personalizadas.

**Implementação:**
```
1. Criar tabela user_goals
2. Tipos: cursos/mês, horas/semana, XP/dia
3. Mostrar progresso da meta no Dashboard
4. Notificação quando atingir meta
```

---

### FUNC-013: Histórico de Atividades
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** XP history existe mas não há timeline de atividades.

**Implementação:**
```
1. Criar componente ActivityTimeline.tsx
2. Mostrar: aulas assistidas, quizzes, conquistas
3. Filtrar por período
4. Adicionar no Profile.tsx
```

---

### FUNC-014: Comparativo de Desempenho
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Usuário não vê como se compara com média.

**Implementação:**
```
1. Calcular média de XP da plataforma
2. Calcular média de conclusão de cursos
3. Mostrar comparativo no Profile
4. "Você está X% acima da média"
```

---

### FUNC-015: Recomendações Personalizadas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há sistema de recomendação de cursos.

**Implementação:**
```
1. Analisar cursos concluídos do usuário
2. Recomendar cursos da mesma categoria
3. Recomendar cursos populares não iniciados
4. Seção "Para você" no Dashboard
```

---

### FUNC-016: Modo Offline para Vídeos
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Vídeos não podem ser baixados.

**Implementação:**
```
1. Adicionar botão de download no LessonPlayer
2. Usar IndexedDB para armazenar
3. Detectar modo offline e servir do cache
4. Sincronizar progresso quando online
```

---

### FUNC-017: Transcrição de Vídeos
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Vídeos não têm transcrição.

**Implementação:**
```
1. Adicionar campo transcript na tabela lessons
2. Criar TranscriptPanel.tsx
3. Sincronizar com tempo do vídeo
4. Permitir busca na transcrição
```

---

### FUNC-018: Velocidade de Vídeo Personalizada
**Status:** ✅ Implementado  
**Prioridade:** N/A  
**Descrição:** VideoPlayer já tem controle de velocidade.

---

### FUNC-019: Marcadores de Tempo no Vídeo
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há chaptering/marcadores no vídeo.

**Implementação:**
```
1. Adicionar campo chapters (JSON) na tabela lessons
2. Mostrar marcadores na barra de progresso
3. Lista de capítulos clicável
```

---

### FUNC-020: Quiz Adaptativo
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Quizzes têm dificuldade fixa.

**Implementação:**
```
1. Adicionar difficulty_level nas perguntas
2. Ajustar dificuldade baseado no desempenho
3. Mais XP para questões difíceis
```

---

### FUNC-021: Revisão de Quiz Após Conclusão
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Usuário vê resultado mas não revisa respostas.

**Implementação:**
```
1. Criar QuizReview.tsx
2. Mostrar todas as respostas com explicações
3. Destacar erros e acertos
4. Link para revisar a aula relacionada
```

---

### FUNC-022: Compartilhar Conquistas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há opção de compartilhar conquistas.

**Implementação:**
```
1. Criar ShareAchievement.tsx
2. Gerar imagem da conquista
3. Compartilhar no LinkedIn, Twitter
4. URL pública para visualização
```

---

## ♿ MELHORIAS DE ACESSIBILIDADE

### A11Y-001: Labels em Todos os Inputs
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Alguns inputs não têm labels associados.

**Implementação:**
```
1. Auditar todos os formulários
2. Adicionar Label com htmlFor
3. Usar aria-label onde visual label não é possível
```

---

### A11Y-002: Navegação por Teclado
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Alguns elementos interativos não são focáveis.

**Implementação:**
```
1. Garantir tabIndex em elementos clicáveis
2. Adicionar focus-visible styles
3. Testar navegação apenas com teclado
```

---

### A11Y-003: ARIA Roles e Labels
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Faltam roles e labels em componentes.

**Implementação:**
```
1. Adicionar role="navigation" no header
2. Adicionar role="main" no conteúdo principal
3. Adicionar aria-label em botões com apenas ícone
```

---

### A11Y-004: Contraste de Cores
**Status:** ⏳ Verificar  
**Prioridade:** 🟡 Média  
**Descrição:** Verificar ratio de contraste WCAG AA.

**Implementação:**
```
1. Auditar com lighthouse ou axe-core
2. Ajustar cores que não passam
3. Focar em: muted-foreground, border colors
```

---

### A11Y-005: Skip Links
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há skip link para conteúdo principal.

**Implementação:**
```
1. Criar SkipLink.tsx
2. Adicionar no início do body
3. "Pular para conteúdo principal"
```

---

### A11Y-006: Anúncios de Screen Reader
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Ações dinâmicas não são anunciadas.

**Implementação:**
```
1. Usar aria-live regions
2. Anunciar: toasts, carregamentos, erros
3. Anunciar progresso de quiz
```

---

### A11Y-007: Textos Alternativos
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Algumas imagens não têm alt text.

**Implementação:**
```
1. Auditar todas as tags img
2. Adicionar alt descritivo
3. Usar alt="" para imagens decorativas
```

---

### A11Y-008: Reduzir Animações
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não respeita prefers-reduced-motion.

**Implementação:**
```
1. Adicionar media query prefers-reduced-motion
2. Desabilitar animações quando preferido
3. Manter animações essenciais (loading)
```

---

### A11Y-009: Tamanho de Fonte Ajustável
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há controle de tamanho de fonte.

**Implementação:**
```
1. Usar rem/em para todas as fontes
2. Criar FontSizeControl.tsx
3. Salvar preferência
```

---

### A11Y-010: Modo Alto Contraste
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há modo de alto contraste.

**Implementação:**
```
1. Criar variáveis CSS para alto contraste
2. Toggle em configurações
3. prefers-contrast: more
```

---

## 🔒 MELHORIAS DE SEGURANÇA

### SEC-001: Rate Limiting
**Status:** ⏳ Não implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Não há rate limiting em edge functions.

**Implementação:**
```
1. Implementar rate limiting no generate-certificate
2. Usar Deno KV ou Redis para contagem
3. Limite: 10 requests/minuto por user
```

---

### SEC-002: Validação de Input
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🔴 Alta  
**Descrição:** Validação com Zod apenas em Auth.

**Implementação:**
```
1. Adicionar validação em CourseForm
2. Adicionar validação em LessonForm
3. Sanitizar inputs de texto rico
```

---

### SEC-003: CSRF Protection
**Status:** ⏳ Verificar  
**Prioridade:** 🟡 Média  
**Descrição:** Verificar proteção CSRF.

**Implementação:**
```
1. Supabase RLS já protege
2. Verificar tokens em mutations críticas
```

---

### SEC-004: Headers de Segurança
**Status:** ⏳ Verificar  
**Prioridade:** 🟡 Média  
**Descrição:** Verificar headers HTTP de segurança.

**Implementação:**
```
1. Configurar CSP headers
2. X-Content-Type-Options
3. X-Frame-Options
```

---

### SEC-005: Audit Log de Admin
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Ações de admin não são logadas.

**Implementação:**
```
1. Criar tabela admin_audit_log
2. Logar: CRUD de cursos, alteração de roles
3. Mostrar log no painel admin
```

---

## 🔍 MELHORIAS DE SEO

### SEO-001: Meta Tags Dinâmicas
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Meta tags são estáticas no index.html.

**Implementação:**
```
1. Instalar react-helmet-async
2. Adicionar meta tags por página
3. Open Graph tags para compartilhamento
4. Títulos dinâmicos por curso
```

---

### SEO-002: Structured Data (JSON-LD)
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há dados estruturados.

**Implementação:**
```
1. Adicionar schema Course nos cursos
2. Adicionar schema Organization na empresa
3. Adicionar schema FAQ se aplicável
```

---

### SEO-003: Sitemap.xml
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há sitemap.

**Implementação:**
```
1. Gerar sitemap dinâmico
2. Incluir páginas públicas
3. Atualizar frequência de mudança
```

---

### SEO-004: Canonical URLs
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há canonical URLs.

**Implementação:**
```
1. Adicionar link rel="canonical" em cada página
2. Evitar conteúdo duplicado
```

---

### SEO-005: Página 404 Otimizada
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** NotFound.tsx existe mas pode melhorar.

**Implementação:**
```
1. Melhorar design do 404
2. Adicionar sugestões de páginas
3. Link para catálogo e dashboard
```

---

### SEO-006: Performance Core Web Vitals
**Status:** ⏳ Verificar  
**Prioridade:** 🟡 Média  
**Descrição:** Verificar LCP, FID, CLS.

**Implementação:**
```
1. Auditar com PageSpeed Insights
2. Otimizar LCP (largest contentful paint)
3. Minimizar CLS (layout shift)
```

---

## 🎮 MELHORIAS DE GAMIFICAÇÃO

### GAME-001: Desafios Diários
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Não há desafios diários para engajamento.

**Implementação:**
```
1. Criar tabela daily_challenges
2. Tipos: "Complete 1 aula", "Ganhe 50 XP", "Faça um quiz"
3. Rotação automática de desafios
4. XP bônus por completar
```

---

### GAME-002: Desafios Semanais
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há desafios semanais.

**Implementação:**
```
1. Desafios maiores com prazo semanal
2. "Complete um curso", "Mantenha streak de 5 dias"
3. Recompensas maiores
```

---

### GAME-003: Sistema de Ligas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Leaderboard único sem divisões.

**Implementação:**
```
1. Criar ligas: Bronze, Prata, Ouro, Diamante
2. Promoção/rebaixamento semanal
3. Top 10 sobe de liga, bottom 10 desce
```

---

### GAME-004: Recompensas de Milestone
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Conquistas existem mas podem expandir.

**Implementação:**
```
1. Adicionar mais conquistas de milestone
2. "Primeiro curso", "10 cursos", "100 aulas"
3. Badges especiais por categoria
```

---

### GAME-005: Multiplier de XP
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** XP é fixo, sem multiplicadores.

**Implementação:**
```
1. Double XP weekend
2. Streak multiplier (2x após 7 dias)
3. Happy hour de aprendizado
```

---

### GAME-006: Moeda Virtual
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Apenas XP, sem moeda para gastar.

**Implementação:**
```
1. Criar sistema de "Coins"
2. Ganhar coins com conquistas
3. Gastar em: avatares, temas, power-ups
```

---

### GAME-007: Power-ups de Estudo
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há power-ups.

**Implementação:**
```
1. "XP Boost" - 2x XP por 1 hora
2. "Streak Freeze" - protege streak por 1 dia
3. Comprar com coins ou ganhar em conquistas
```

---

### GAME-008: Missões de Equipe
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Gamificação é individual.

**Implementação:**
```
1. Criar times por departamento
2. Missões colaborativas
3. Ranking de departamentos
```

---

### GAME-009: Seasonal Events
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há eventos sazonais.

**Implementação:**
```
1. Eventos temáticos (Natal, Páscoa)
2. Conquistas exclusivas temporárias
3. Decorações na UI
```

---

### GAME-010: Perfil Público com Badges
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Perfil é privado.

**Implementação:**
```
1. Criar página /user/:id pública
2. Mostrar badges, nível, cursos concluídos
3. Opção de tornar privado
```

---

### GAME-011: Ranking por Categoria
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Leaderboard geral apenas.

**Implementação:**
```
1. Filtrar ranking por categoria de curso
2. Mostrar especialistas por área
3. "Top em Vendas", "Top em Atendimento"
```

---

### GAME-012: Sistema de Reputação
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Apenas XP, sem reputação social.

**Implementação:**
```
1. Ganhar reputação ajudando outros
2. Responder perguntas, mentoria
3. Mostrar no perfil
```

---

## 🛠️ MELHORIAS ADMINISTRATIVAS

### ADMIN-001: Dashboard Analítico Avançado
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** QuizStats é bom, mas faltam analytics gerais.

**Implementação:**
```
1. Criar AdminDashboard.tsx com:
   - Usuários ativos por dia/semana/mês
   - Cursos mais acessados
   - Taxa de conclusão geral
   - Tempo médio por curso
2. Gráficos interativos com recharts
```

---

### ADMIN-002: Gestão de Usuários
**Status:** ⏳ Básico implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Lista de usuários sem ações.

**Implementação:**
```
1. Botão para resetar senha
2. Botão para desativar usuário
3. Atribuir/remover role de admin
4. Ver progresso detalhado do usuário
```

---

### ADMIN-003: Gestão de Conquistas
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Conquistas são fixas no banco.

**Implementação:**
```
1. CRUD de conquistas no admin
2. Criar novas conquistas customizadas
3. Definir critérios e recompensas
```

---

### ADMIN-004: Bulk Actions
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Ações apenas individuais.

**Implementação:**
```
1. Selecionar múltiplos cursos
2. Publicar/despublicar em massa
3. Atribuir categoria em massa
```

---

### ADMIN-005: Importação de Cursos
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Cursos criados manualmente.

**Implementação:**
```
1. Importar cursos via CSV
2. Importar via SCORM (se aplicável)
3. Template de importação
```

---

### ADMIN-006: Relatórios Agendados
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há relatórios automáticos.

**Implementação:**
```
1. Criar edge function scheduled
2. Enviar relatório semanal por email
3. Métricas principais da plataforma
```

---

### ADMIN-007: Configurações da Plataforma
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Configurações hardcoded.

**Implementação:**
```
1. Criar tabela platform_settings
2. XP por ação configurável
3. Tempo de cooldown de quiz
4. Domínio de email permitido
```

---

### ADMIN-008: Logs de Sistema
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há visualização de logs.

**Implementação:**
```
1. Mostrar logs do Supabase
2. Filtrar por tipo e data
3. Alertas de erros
```

---

## 📱 MELHORIAS MOBILE

### MOB-001: PWA Completo
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** App não é PWA.

**Implementação:**
```
1. Configurar manifest.json
2. Adicionar service worker
3. Ícones em múltiplos tamanhos
4. Splash screen
```

---

### MOB-002: Gestos de Navegação
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há gestos mobile.

**Implementação:**
```
1. Swipe para próxima/anterior aula
2. Swipe down para atualizar
3. Pull to refresh em listas
```

---

### MOB-003: Bottom Navigation
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Navegação no topo não é ideal para mobile.

**Implementação:**
```
1. Criar BottomNav.tsx
2. Mostrar apenas em mobile
3. Tabs: Dashboard, Catálogo, Perfil, Ranking
```

---

### MOB-004: Modo Picture-in-Picture
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Vídeo não suporta PiP.

**Implementação:**
```
1. Adicionar botão PiP no VideoPlayer
2. Usar Picture-in-Picture API
3. Continuar vídeo minimizado
```

---

## 🔗 MELHORIAS DE INTEGRAÇÃO

### INT-001: Integração com Slack
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há integração com Slack.

**Implementação:**
```
1. Notificações de curso concluído
2. Ranking semanal no canal
3. Lembretes de estudo
```

---

### INT-002: Integração com Google Calendar
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há integração com calendário.

**Implementação:**
```
1. Adicionar eventos de estudo
2. Lembrete antes do prazo de curso
3. Bloquear horário para estudar
```

---

### INT-003: SSO com Google/Microsoft
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Apenas email/senha.

**Implementação:**
```
1. Configurar OAuth providers no Supabase
2. Adicionar botões de login social
3. Manter restrição de domínio
```

---

### INT-004: Webhooks para Eventos
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há webhooks.

**Implementação:**
```
1. Webhook quando curso é concluído
2. Webhook quando certificado é emitido
3. Integrar com sistemas externos
```

---

## 🔧 REFATORAÇÕES TÉCNICAS

### REF-001: Componentização do Header
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Header duplicado em várias páginas.

**Implementação:**
```
1. Criar AppHeader.tsx componente único
2. Props: showNav, showProfile, variant
3. Usar em todas as páginas autenticadas
```

---

### REF-002: Layout Wrapper
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Estrutura de página duplicada.

**Implementação:**
```
1. Criar AppLayout.tsx
2. Incluir header, main, footer
3. Wrap de todas as rotas autenticadas
```

---

### REF-003: Hooks de Fetch Centralizados
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Hooks existem mas podem melhorar.

**Implementação:**
```
1. Criar useCourses hook
2. Criar useLessons hook
3. Usar React Query para caching
```

---

### REF-004: Tipos Centralizados
**Status:** ⏳ Parcialmente implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Tipos duplicados em componentes.

**Implementação:**
```
1. Criar src/types/index.ts
2. Exportar Course, Lesson, User, etc.
3. Importar em todos os componentes
```

---

### REF-005: Constants File
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Valores hardcoded espalhados.

**Implementação:**
```
1. Criar src/lib/constants.ts
2. XP_PER_LESSON, XP_PER_COURSE, etc.
3. ROUTES object
```

---

### REF-006: Error Boundary
**Status:** ⏳ Não implementado  
**Prioridade:** 🟡 Média  
**Descrição:** Erros não tratados quebram a UI.

**Implementação:**
```
1. Criar ErrorBoundary.tsx
2. UI amigável para erros
3. Botão de "Tentar novamente"
4. Enviar erro para logging
```

---

### REF-007: Testes Unitários
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Não há testes.

**Implementação:**
```
1. Configurar Vitest
2. Testes para hooks customizados
3. Testes para utilitários
4. Testes para componentes críticos
```

---

### REF-008: Documentação de Componentes
**Status:** ⏳ Não implementado  
**Prioridade:** 🟢 Baixa  
**Descrição:** Componentes sem documentação.

**Implementação:**
```
1. Configurar Storybook
2. Documentar componentes UI
3. Exemplos de uso
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Semana 1-2)
**Prioridade: Alta**

| ID | Melhoria | Esforço |
|----|----------|---------|
| UI-001 | Navegação Mobile | 4h |
| UI-002 | Skeleton Loading | 4h |
| PERF-001 | Lazy Loading | 2h |
| PERF-002 | Memoização | 3h |
| A11Y-001 | Labels em Inputs | 2h |
| A11Y-002 | Navegação por Teclado | 3h |
| SEC-002 | Validação de Input | 3h |
| REF-001 | Componentização Header | 4h |
| REF-002 | Layout Wrapper | 3h |

**Total Fase 1: ~28 horas**

---

### Fase 2: Funcionalidades Core (Semana 3-4)
**Prioridade: Alta/Média**

| ID | Melhoria | Esforço |
|----|----------|---------|
| FUNC-001 | Busca Global | 4h |
| FUNC-006 | Trilhas de Aprendizado | 8h |
| FUNC-002 | Favoritar Cursos | 4h |
| FUNC-015 | Recomendações | 4h |
| GAME-001 | Desafios Diários | 6h |
| ADMIN-001 | Dashboard Analítico | 6h |
| SEC-001 | Rate Limiting | 3h |
| REF-006 | Error Boundary | 2h |

**Total Fase 2: ~37 horas**

---

### Fase 3: Experiência do Usuário (Semana 5-6)
**Prioridade: Média**

| ID | Melhoria | Esforço |
|----|----------|---------|
| UI-015 | Avatar Upload | 4h |
| UI-013 | Notificações Push | 4h |
| FUNC-003 | Notas nas Aulas | 6h |
| FUNC-011 | Agenda de Estudos | 6h |
| FUNC-012 | Metas de Aprendizado | 4h |
| FUNC-021 | Revisão de Quiz | 3h |
| PERF-003 | Paginação Catálogo | 3h |
| PERF-006 | Debounce Buscas | 1h |

**Total Fase 3: ~31 horas**

---

### Fase 4: Mobile & PWA (Semana 7-8)
**Prioridade: Média**

| ID | Melhoria | Esforço |
|----|----------|---------|
| MOB-001 | PWA Completo | 6h |
| MOB-003 | Bottom Navigation | 4h |
| UI-007 | Animações de Transição | 4h |
| UI-011 | Modal Confirmação Saída | 2h |
| PERF-008 | Service Worker | 4h |

**Total Fase 4: ~20 horas**

---

### Fase 5: Gamificação Avançada (Semana 9-10)
**Prioridade: Média/Baixa**

| ID | Melhoria | Esforço |
|----|----------|---------|
| GAME-003 | Sistema de Ligas | 6h |
| GAME-004 | Recompensas Milestone | 4h |
| GAME-005 | Multiplier de XP | 3h |
| GAME-002 | Desafios Semanais | 4h |
| GAME-010 | Perfil Público | 4h |

**Total Fase 5: ~21 horas**

---

### Fase 6: Polimento & SEO (Semana 11-12)
**Prioridade: Baixa**

| ID | Melhoria | Esforço |
|----|----------|---------|
| SEO-001 | Meta Tags Dinâmicas | 3h |
| SEO-002 | Structured Data | 2h |
| A11Y-008 | Reduzir Animações | 2h |
| UI-006 | Tooltips Informativos | 2h |
| UI-014 | Copiar Certificado | 1h |
| FUNC-005 | Melhorar Certificado PDF | 3h |
| REF-004 | Tipos Centralizados | 2h |
| REF-005 | Constants File | 1h |

**Total Fase 6: ~16 horas**

---

## 📊 RESUMO TOTAL

| Categoria | Quantidade | Esforço Est. |
|-----------|------------|--------------|
| UX/UI | 15 | ~30h |
| Performance | 8 | ~18h |
| Funcionalidades | 22 | ~60h |
| Acessibilidade | 10 | ~20h |
| Segurança | 5 | ~12h |
| SEO | 6 | ~10h |
| Gamificação | 12 | ~35h |
| Administrativas | 8 | ~25h |
| Mobile | 4 | ~18h |
| Integração | 4 | ~16h |
| Refatorações | 8 | ~20h |
| **TOTAL** | **102** | **~264h** |

---

## 🎯 PRÓXIMOS PASSOS

1. **Revisar prioridades** com stakeholders
2. **Criar issues** no GitHub para cada melhoria
3. **Iniciar Fase 1** com melhorias de fundação
4. **Sprint planning** quinzenal
5. **Review semanal** de progresso

---

*Documento gerado automaticamente pela análise do repositório.*
*Última atualização: 27/12/2024*
