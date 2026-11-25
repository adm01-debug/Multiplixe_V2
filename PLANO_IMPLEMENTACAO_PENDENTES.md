# 📋 PLANO DE IMPLEMENTAÇÃO - MELHORIAS PENDENTES

**MULTIPLIXE - Plataforma de Treinamento Corporativo**  
*Análise atualizada em: 12/01/2026*

---

## 📊 RESUMO EXECUTIVO

### Status Atual do Projeto

Após análise exaustiva do repositório, identifiquei **102 melhorias** no plano original (27/12/2024). Muitas já foram implementadas com sucesso. Este documento lista apenas as **PENDENTES**.

### ✅ Melhorias JÁ IMPLEMENTADAS (46)

| ID | Melhoria | Status |
|----|----------|--------|
| UI-001 | Navegação Mobile (MobileBottomNav) | ✅ Implementado |
| UI-002 | Skeleton Loading States (PageSkeletons) | ✅ Implementado |
| UI-003 | Empty States Personalizados (EmptyState.tsx) | ✅ Implementado |
| UI-005 | Breadcrumbs de Navegação (Breadcrumb.tsx) | ✅ Implementado |
| UI-007 | Animações de Transição (PageTransition.tsx) | ✅ Implementado |
| UI-010 | Indicador de Progresso Flutuante (FloatingProgress.tsx) | ✅ Implementado |
| UI-013 | Notificações Push (PushNotificationManager) | ✅ Implementado |
| PERF-001 | Lazy Loading de Componentes (React.lazy em App.tsx) | ✅ Implementado |
| PERF-004 | Cache de Dados com React Query (useCachedQuery.ts) | ✅ Implementado |
| PERF-006 | Debounce em Buscas (useDebouncedValue.ts) | ✅ Implementado |
| PERF-007 | Virtual Scrolling (VirtualizedCourseGrid.tsx) | ✅ Implementado |
| PERF-008 | Service Worker/PWA (PWAInstallPrompt.tsx, sw.js) | ✅ Implementado |
| FUNC-001 | Busca Global com Cmd/Ctrl+K (CommandPalette.tsx) | ✅ Implementado |
| FUNC-004 | Comentários/Discussões (CourseDiscussions.tsx) | ✅ Implementado |
| FUNC-006 | Trilhas de Aprendizado (LearningPaths, tabelas) | ✅ Implementado |
| FUNC-008 | Modo de Estudo Focado/Pomodoro (PomodoroTimer) | ✅ Implementado |
| FUNC-018 | Velocidade de Vídeo Personalizada | ✅ Implementado |
| GAME-001 | Desafios Diários (DailyChallenges.tsx) | ✅ Implementado |
| MOB-001 | PWA Completo (manifest.json, sw.js) | ✅ Implementado |
| MOB-003 | Bottom Navigation (MobileBottomNav.tsx) | ✅ Implementado |
| SEC-001 | Rate Limiting (tabelas + RateLimitDashboard) | ✅ Implementado |
| SEC-005 | Audit Log de Admin (audit_logs, useAuditLog) | ✅ Implementado |
| REF-003 | Hooks de Fetch Centralizados (useCachedQuery) | ✅ Implementado |
| A11Y-002 | Navegação por Teclado (CommandPalette) | ✅ Parcial |
| SEO-001 | Meta Tags Dinâmicas (DynamicSEO.tsx) | ✅ Implementado |
| + outros componentes de onboarding, analytics, security | ✅ |

---

## ⏳ MELHORIAS PENDENTES (48)

### 🎨 UX/UI - 8 Pendentes

#### UI-004: Feedback Visual em Ações
**Prioridade:** 🟡 Média  
**Esforço:** 3h  
**Descrição:** Alguns botões não mostram loading state durante ações.

**Implementação:**
```
1. Auditar CourseForm, LessonForm, QuizManager, Profile
2. Adicionar loading state em todos os botões de ação
3. Usar disabled + Loader2 durante operações async
4. Arquivo: src/components/admin/*.tsx, src/pages/Profile.tsx
```

---

#### UI-006: Tooltips Informativos
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Faltam tooltips em ícones de ação.

**Implementação:**
```
1. Adicionar Tooltip em todos os ícones de ação
2. Locais: Dashboard stats, Profile stats, Admin actions
3. Usar TooltipProvider já configurado
```

---

#### UI-008: Modo de Visualização de Cursos (Grid/Lista)
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Catálogo só mostra cursos em grid.

**Implementação:**
```
1. Criar ViewToggle.tsx componente
2. Criar CourseListItem.tsx para visão em lista
3. Salvar preferência no localStorage
4. Aplicar em Catalog.tsx
```

---

#### UI-009: Preview de Vídeo no Hover do Card
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Cards de curso são estáticos.

**Implementação:**
```
1. Adicionar thumbnail_gif ou video_preview_url na tabela courses
2. Criar migration para novo campo
3. Mostrar preview no hover do CourseCard
4. Usar lazy loading para performance
```

---

#### ✅ UI-011: Modal de Confirmação de Saída — CONCLUÍDO

**Entregue em 25/11/2026**

O `QuizPlayer` já tinha o `AlertDialog` de saída e o `beforeunload`, mas **o diálogo nunca era
aberto**: não existia botão que chamasse `setShowExitConfirm(true)`, e o `beforeunload` estava
duplicado dentro do componente.

- `src/hooks/useConfirmExit.ts` **já existia no repo, mas não era importado em lugar nenhum** (trabalho
  parcial de outro agente). Foi reaproveitado como está — `confirmNavigation(ação)`, `handleConfirm`,
  `handleCancel`, `showDialog` e `beforeunload` —, sem reescrever o hook.
- `QuizPlayer`: botão **Sair** no cabeçalho (com `aria-label`) abre o diálogo de confirmação quando o
  quiz já foi iniciado; o `AlertDialog` existente passou a ser controlado pelo hook (fim do
  `beforeunload` duplicado).
- `LessonPlayer` não entrou: o progresso do vídeo já é salvo em tempo real pelo `onProgress` do
  `VideoPlayer` — sair não perde nada e confirmar a cada troca de aula atrapalharia a navegação.
- O texto do `AlertDialog` passou a vir do `message` do próprio hook (uma fonte de verdade).
- `src/test/useConfirmExit.test.tsx` (novo): 5 testes cobrindo navegação direta, confirmação,
  cancelamento, registro/remoção do `beforeunload` e a mensagem — o hook estava sem nenhum teste.

**Verificado:** `tsc -b` exit 0; `eslint` nos 3 arquivos exit 0; `vitest run` 38 arquivos / 391 testes
passando; guards 88 testes (85 pass / 3 skip / 0 fail); `vite build` exit 0.

---

#### UI-012: Tema de Cores Personalizável
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Tema fixo, sem opção de personalização.

**Implementação:**
```
1. Criar ThemeCustomizer.tsx
2. Permitir escolha entre 3-5 paletas de cores
3. Salvar preferência no localStorage
4. Adicionar em Profile ou Settings
```

---

#### UI-014: Feedback de Copiar Código de Certificado
**Prioridade:** 🟢 Baixa  
**Esforço:** 1h  
**Descrição:** Código de verificação não tem botão de copiar.

**Implementação:**
```
1. Adicionar botão de copiar em CertificateCard
2. Usar navigator.clipboard.writeText
3. Mostrar toast de confirmação
```

---

#### UI-015: Avatar Upload no Perfil
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Perfil mostra apenas inicial do nome como avatar.

**Implementação:**
```
1. Criar AvatarUpload.tsx componente
2. Usar Supabase Storage para armazenar imagens
3. Criar bucket 'avatars' com políticas RLS
4. Atualizar profiles.avatar_url
5. Redimensionar imagem antes do upload (max 256x256)
```

---

#### UI-016: Indicador de Cache/Offline
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Usuário não sabe quando está vendo dados em cache.

**Implementação:**
```
1. Criar CacheIndicator.tsx
2. Mostrar badge quando dados são do cache
3. Integrar com queryClient
4. Mostrar quando offline
```

---

### ⚡ PERFORMANCE - 3 Pendentes

#### PERF-002: Memoização de Componentes
**Prioridade:** 🔴 Alta  
**Esforço:** 3h  
**Descrição:** Componentes re-renderizam desnecessariamente.

**Implementação:**
```
1. Aplicar React.memo em: CourseCard, AchievementsGrid item
2. Usar useMemo para cálculos pesados (filteredCourses, etc)
3. Usar useCallback para handlers passados como props
4. Otimizar: Dashboard.tsx, Profile.tsx, Catalog.tsx
5. Usar React DevTools Profiler para identificar re-renders
```

---

#### PERF-003: Paginação no Catálogo
**Prioridade:** 🟡 Média  
**Esforço:** 3h  
**Descrição:** Todos os cursos são carregados de uma vez.

**Implementação:**
```
1. Implementar paginação com limit/offset no useCourses
2. Adicionar infinite scroll ou botão "Carregar mais"
3. Mostrar 12 cursos por página inicialmente
4. Usar useInfiniteQuery do React Query
```

---

#### PERF-005: Otimização de Imagens
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Thumbnails não são otimizados.

**Implementação:**
```
1. Já existe LazyImage.tsx - verificar uso
2. Adicionar srcset para imagens responsivas
3. Implementar blur placeholder com base64 inline
4. Usar loading="lazy" nativo em <img>
```

---

### 🚀 FUNCIONALIDADES - 13 Pendentes

#### FUNC-002: Favoritar Cursos
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Usuários não podem favoritar cursos.

**Implementação:**
```sql
-- Migration
CREATE TABLE public.user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES public.courses NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
ON public.user_favorites FOR ALL
USING (auth.uid() = user_id);
```

```
1. Criar tabela user_favorites
2. Criar useFavorites.ts hook
3. Adicionar botão de favorito no CourseCard
4. Criar seção "Meus Favoritos" no Dashboard
```

---

#### FUNC-003: Notas nas Aulas
**Prioridade:** 🟡 Média  
**Esforço:** 6h  
**Descrição:** Usuários não podem fazer anotações durante aulas.

**Implementação:**
```sql
-- Migration
CREATE TABLE public.user_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  lesson_id UUID REFERENCES public.lessons NOT NULL,
  content TEXT NOT NULL,
  timestamp_seconds INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_notes ENABLE ROW LEVEL SECURITY;
```

```
1. Criar tabela user_notes
2. Criar NotesPanel.tsx componente
3. Integrar no LessonPlayer (sidebar ou drawer)
4. Permitir marcar timestamp do vídeo
5. Exportar notas em markdown
```

---

#### FUNC-005: Melhorar Download de Certificado PDF
**Prioridade:** 🟡 Média  
**Esforço:** 3h  
**Descrição:** Template do certificado pode melhorar.

**Implementação:**
```
1. Melhorar template no edge function generate-certificate
2. Adicionar logo da empresa (Promo Brindes)
3. Incluir QR code para verificação
4. Melhorar tipografia e layout
5. Opção de compartilhar no LinkedIn
```

---

#### FUNC-007: Sistema de Mentoria
**Prioridade:** 🟢 Baixa  
**Esforço:** 12h  
**Descrição:** Não há conexão entre usuários experientes e iniciantes.

**Implementação:**
```
1. Criar tabela mentorship_requests
2. Permitir usuários de alto nível serem mentores
3. Sistema de solicitação de mentoria
4. Notificações para mentores
5. (Fase futura: chat integrado, agendamento)
```

---

#### FUNC-009: Flashcards de Revisão
**Prioridade:** 🟢 Baixa  
**Esforço:** 8h  
**Descrição:** Não há sistema de revisão espaçada.

**Implementação:**
```
1. Criar tabelas flashcards, user_flashcard_progress
2. Admin pode criar flashcards por curso
3. Sistema de repetição espaçada (SRS) básico
4. XP por revisões corretas
5. Componente FlashcardPlayer.tsx
```

---

#### FUNC-010: Exportar Progresso
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Usuário não pode exportar seu progresso.

**Implementação:**
```
1. Criar edge function export-progress
2. Gerar relatório PDF com:
   - Cursos concluídos
   - Horas assistidas
   - Quizzes realizados
   - Conquistas
3. Usar jsPDF (já instalado)
4. Botão no Profile.tsx
```

---

#### FUNC-011: Agenda de Estudos
**Prioridade:** 🟡 Média  
**Esforço:** 6h  
**Descrição:** Não há planejamento de estudos.

**Implementação:**
```sql
CREATE TABLE public.study_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  course_id UUID REFERENCES public.courses,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INT DEFAULT 30,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```
1. Criar tabela study_schedule
2. Criar StudyCalendar.tsx com react-day-picker
3. Agendar horários de estudo
4. Mostrar no Dashboard
5. (Futuro: lembretes por email, integração Google Calendar)
```

---

#### FUNC-012: Metas de Aprendizado
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Não há sistema de metas personalizadas.

**Implementação:**
```sql
CREATE TABLE public.user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  goal_type TEXT NOT NULL, -- 'courses_month', 'hours_week', 'xp_day'
  target_value INT NOT NULL,
  current_value INT DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```
1. Criar tabela user_goals
2. Tipos: cursos/mês, horas/semana, XP/dia
3. Mostrar progresso da meta no Dashboard
4. Notificação quando atingir meta
5. Componente GoalProgress.tsx
```

---

#### FUNC-013: Histórico de Atividades Timeline
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** XP history existe mas não há timeline visual de atividades.

**Implementação:**
```
1. Criar componente ActivityTimeline.tsx
2. Agregar dados de: aulas assistidas, quizzes, conquistas, XP
3. Filtrar por período (7d, 30d, all)
4. Adicionar no Profile.tsx
5. Usar framer-motion para animações
```

---

#### FUNC-014: Comparativo de Desempenho
**Prioridade:** 🟢 Baixa  
**Esforço:** 3h  
**Descrição:** Usuário não vê como se compara com média.

**Implementação:**
```
1. Criar função RPC get_platform_averages
2. Calcular média de XP da plataforma
3. Calcular média de conclusão de cursos
4. Mostrar comparativo no Profile
5. "Você está X% acima da média"
```

---

#### FUNC-015: Recomendações Personalizadas
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Não há sistema de recomendação de cursos.

**Implementação:**
```
1. Criar função RPC get_recommended_courses
2. Analisar cursos concluídos do usuário
3. Recomendar cursos da mesma categoria não iniciados
4. Recomendar cursos populares
5. Seção "Para você" no Dashboard
```

---

#### FUNC-016: Modo Offline para Vídeos
**Prioridade:** 🟢 Baixa  
**Esforço:** 8h  
**Descrição:** Vídeos não podem ser baixados.

**Implementação:**
```
1. Adicionar botão de download no LessonPlayer
2. Usar IndexedDB para armazenar vídeos
3. Detectar modo offline
4. Servir vídeo do cache quando offline
5. Sincronizar progresso quando online
6. (Complexidade alta - considerar para fase futura)
```

---

#### FUNC-017: Transcrição de Vídeos
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Vídeos não têm transcrição.

**Implementação:**
```
1. Adicionar campo transcript (TEXT) na tabela lessons
2. Criar TranscriptPanel.tsx
3. Sincronizar com tempo do vídeo
4. Permitir busca na transcrição
5. Admin pode adicionar transcrição manualmente
```

---

#### FUNC-019: Marcadores de Tempo no Vídeo
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Não há chaptering/marcadores no vídeo.

**Implementação:**
```
1. Adicionar campo chapters (JSONB) na tabela lessons
2. Mostrar marcadores na barra de progresso do vídeo
3. Lista de capítulos clicável
4. Admin pode definir capítulos
```

---

#### FUNC-020: Quiz Adaptativo
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Quizzes têm dificuldade fixa.

**Implementação:**
```
1. Adicionar difficulty_level nas quiz_questions
2. Ajustar dificuldade baseado no desempenho
3. Mais XP para questões difíceis
4. Tracking de acertos por nível
```

---

#### FUNC-021: Revisão de Quiz Após Conclusão ✅ CONCLUÍDO
**Prioridade:** 🟡 Média  
**Esforço:** 3h  
**Descrição:** Usuário vê resultado mas não revisa respostas.

**Implementação:**
```
1. Criar QuizReview.tsx
2. Mostrar todas as respostas com explicações
3. Destacar erros e acertos
4. Link para revisar a aula relacionada
5. Já temos campo 'explanation' em quiz_questions
```

**Entrega (2026-11-25):**
```
- QuizReview.tsx já existia no repo mas estava órfão; agora renderizado pelo QuizPlayer
  após a conclusão (acertos/erros, explicação, opção correta, revisar aula, tentar novamente).
- O gabarito não chega mais pelo cliente: quiz_options_public não expõe is_correct.
  Criada RPC public.get_quiz_review(p_attempt_id uuid) SECURITY DEFINER, que só devolve
  a tentativa do próprio auth.uid(); EXECUTE revogado de PUBLIC/anon.
  Migration: supabase/migrations/20261125233000_quiz_review.sql (aplicada em produção).
- src/lib/quizReview.ts: mapper do payload da RPC para QuizReview (testado em
  src/test/quizReview.test.ts, 5 casos).
- useQuizzes.submitQuizAttempt agora devolve attemptId (.select("id").single() no insert);
  nova fetchQuizReview(attemptId). QuizCard e CourseQuizModal passam onLoadReview.
```
#### FUNC-021: Revisão de Quiz Após Conclusão
**Prioridade:** 🟡 Média  
**Esforço:** 3h  
**Descrição:** Usuário vê resultado mas não revisa respostas.

**Implementação:**
```
1. Criar QuizReview.tsx
2. Mostrar todas as respostas com explicações
3. Destacar erros e acertos
4. Link para revisar a aula relacionada
5. Já temos campo 'explanation' em quiz_questions
```

---

#### FUNC-022: Compartilhar Conquistas
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Não há opção de compartilhar conquistas.

**Implementação:**
```
1. Criar ShareAchievement.tsx
2. Gerar imagem da conquista (canvas ou SVG)
3. Web Share API para compartilhar
4. URL pública para visualização (opcional)
```

---

### ♿ ACESSIBILIDADE - 6 Pendentes

#### ✅ A11Y-001: Labels em Todos os Inputs — CONCLUÍDO

**Entregue em 25/11/2026**

Auditoria de todo o `src` (fora `src/components/ui`, que são primitivos shadcn) achou **39 campos sem
nome acessível**: 22 com `<Label>` visual logo acima, mas sem `htmlFor`/`id` (o rótulo não chegava ao
leitor de tela) e 17 só com `placeholder`.

- 18 campos ganharam `id` + `<Label htmlFor>`: `AdminAssessmentsTab` (4), `AdminVideosTab` (6),
  `AdminPlaybooksTab` (4), `AdminWorkflowsTab` (2), `BlockedIPsTab` (2), `WhitelistTab` (2),
  `CourseDiscussions` (título da dúvida) e `GoalsWidget` (valor alvo).
- 17 campos só com `placeholder` ganharam `aria-label` descritivo: buscas de admin (cursos, usuários,
  país, IP, trilhas, recuperação de senha), `Playbooks`, `VideoLibrary`, `VerifyCertificate`,
  `SearchOverlay`, `Footer` (newsletter), `QuizQuestionCard` (explicação e texto da opção),
  `CourseDiscussions` (resposta) e os três campos do passo de workflow. O `SearchInput` repassa o
  `placeholder` como nome acessível.
- 4 `htmlFor` apontavam para id inexistente (`CourseForm` nível e categoria, `GeoBlockingManager`
  país, `LearningPathForm` dificuldade) — os `<SelectTrigger>` ganharam o `id` correspondente.
- `scripts/ci/a11y-input-labels.unit.mjs` (novo): guard de CI que falha se aparecer `<Input>` sem
  `id`/`aria-label` ou `htmlFor` órfão, com testes do próprio auditor (inclusive o `>` do
  `onChange={e => ...}`, que não fecha a tag). Roda no job `guardas`, via `node --test scripts/ci/*.unit.mjs`.

**Verificado:** guard novo 8/8; suite de guards 88 testes (85 pass / 3 skip / 0 fail); `tsc -b` exit 0;
`eslint` nos 22 arquivos sem erro novo.

---

#### A11Y-003: ARIA Roles e Labels
**Prioridade:** 🟡 Média  
**Esforço:** 2h  
**Descrição:** Faltam roles e labels em componentes.

**Implementação:**
```
1. Adicionar role="navigation" no header
2. Adicionar role="main" no conteúdo principal
3. Adicionar aria-label em botões com apenas ícone
4. Verificar todos os componentes de navegação
```

---

#### A11Y-004: Contraste de Cores
**Prioridade:** 🟡 Média  
**Esforço:** 2h  
**Descrição:** Verificar ratio de contraste WCAG AA.

**Implementação:**
```
1. Auditar com lighthouse ou axe-core
2. Ajustar cores que não passam 4.5:1
3. Focar em: muted-foreground, border colors
4. Testar em modo claro e escuro
```

---

#### A11Y-005: Skip Links ✅ CONCLUÍDO
**Prioridade:** 🟡 Média  
**Esforço:** 1h  
**Descrição:** Não há skip link para conteúdo principal.

**Implementação:**
```
1. Criar SkipLink.tsx
2. Adicionar no início do body/App.tsx
3. "Pular para conteúdo principal"
4. Visível apenas no focus
```

**Entrega (2026-11-25):**
```
- SkipLinks.tsx já existia e estava em App.tsx, mas os alvos não existiam no DOM:
  #navigation e #footer em nenhuma rota, #main-content em 4 de 24 páginas (os links
  eram inertes). Agora cada atalho resolve o alvo (#id -> main/nav/footer -> role),
  só é renderizado quando há alvo visível na página, e ao acionar aplica tabindex=-1
  e move o foco (WCAG 2.4.1).
- src/test/skipLinks.test.tsx: 6 casos (alvo presente, ausente, footer, sem landmarks,
  foco + tabindex, prioridade do id canônico).
```
---

#### A11Y-006: Anúncios de Screen Reader
**Prioridade:** 🟡 Média  
**Esforço:** 2h  
**Descrição:** Ações dinâmicas não são anunciadas.

**Implementação:**
```
1. Usar aria-live regions
2. Anunciar: toasts, carregamentos, erros
3. Anunciar progresso de quiz
4. Componente LiveAnnouncer.tsx
```

---

#### A11Y-007: Textos Alternativos
**Prioridade:** 🟡 Média  
**Esforço:** 2h  
**Descrição:** Algumas imagens não têm alt text.

**Implementação:**
```
1. Auditar todas as tags img
2. Adicionar alt descritivo
3. Usar alt="" para imagens decorativas
4. Verificar LazyImage.tsx
```

---

#### A11Y-008: Reduzir Animações
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Não respeita prefers-reduced-motion.

**Implementação:**
```
1. Adicionar media query prefers-reduced-motion no CSS
2. Desabilitar animações quando preferido
3. Configurar framer-motion para respeitar preferência
4. Manter animações essenciais (loading)
```

---

#### A11Y-009: Tamanho de Fonte Ajustável
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Não há controle de tamanho de fonte.

**Implementação:**
```
1. Verificar que todas as fontes usam rem/em
2. Criar FontSizeControl.tsx (opcional)
3. Salvar preferência
4. Testar com zoom do navegador
```

---

#### A11Y-010: Modo Alto Contraste
**Prioridade:** 🟢 Baixa  
**Esforço:** 3h  
**Descrição:** Não há modo de alto contraste.

**Implementação:**
```
1. Criar variáveis CSS para alto contraste
2. Toggle em configurações/perfil
3. Respeitar prefers-contrast: more
4. Testar com ferramentas de acessibilidade
```

---

### 🔒 SEGURANÇA - 3 Concluídas (SEC-002, SEC-003, SEC-004)

#### ✅ SEC-002: Validação de Input Completa — CONCLUÍDO

**Entregue em 25/11/2026**

`CourseForm` e `LessonForm` já tinham `zodResolver`. O que faltava era o `QuizManager`, que só
validava "sem texto", "< 2 opções" e "sem resposta correta" numa cadeia de `if` dentro do
`handleSave`, e aceitava título vazio, `passing_score`/`xp_reward`/`cooldown` negativos e lista de
opções sem teto.

- `src/lib/schemas.ts` (novo): `quizSchema`, `quizQuestionSchema` e constantes de limite
  (`MAX_QUIZ_QUESTIONS = 50`, `MAX_QUIZ_OPTIONS = 10`).
- `QuizManager.handleSave` passou a usar `safeParse` e a gravar o `parsed.data`, com o erro da
  primeira issue prefixado por "Questão N " quando a issue é de uma questão.
- Opção em branco continua sendo descartada (o formulário nasce com 4 linhas), agora dentro do
  schema via `z.preprocess` — mesma regra de antes, explícita.
- `src/test/quizSchemas.test.ts` (novo): 12 casos (payload válido, opções em branco descartadas,
  < 2 opções, sem resposta correta, sem título, sem questões, questão sem texto, teto de opções,
  `passing_score` fora de 0-100, XP/cooldown negativos, tempo limite fracionário).

---

#### ✅ SEC-003: CSRF Protection Verificação — CONCLUÍDO

**Entregue em 25/11/2026**

Verificado no código: a sessão vive em `localStorage`
(`src/integrations/supabase/client.ts`, `auth.storage: localStorage`) e o token é enviado em
`Authorization: Bearer` pelo JS do app — nenhuma credencial viaja automaticamente com a requisição,
então não há CSRF a explorar. O único cookie do app é `sidebar_state`
(`src/components/ui/sidebar.tsx:68`), preferência visual escrita e nunca lida pelo cliente, que
servidor nenhum consulta. Documentado em `docs/agentes/regras-dominio.md` > "Segurança", com a
condição que invalidaria a conclusão (sessão passar a usar cookie).

---

#### ✅ SEC-004: Headers de Segurança — CONCLUÍDO

**Entregue em 25/11/2026**

Já aplicado por PR anterior e conferido **na produção** (resposta real de
`https://multiplixe-v2.vercel.app/`): `Content-Security-Policy`, `X-Content-Type-Options: nosniff`,
`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
`Strict-Transport-Security: max-age=31536000; includeSubDomains`. Fonte: `vercel.json` >
`headers` para `/(.*)`.

---

### 🔍 SEO - 5 Pendentes

#### SEO-002: Structured Data (JSON-LD)
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Não há dados estruturados.

**Implementação:**
```
1. Adicionar schema Course em CourseDetail
2. Adicionar schema Organization na landing
3. Criar componente JsonLd.tsx
4. Verificar com Google Rich Results Test
```

---

#### SEO-003: Sitemap.xml
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Não há sitemap.

**Implementação:**
```
1. Criar edge function generate-sitemap
2. Incluir páginas públicas (/, /auth, /verificar-certificado)
3. Atualizar frequência de mudança
4. Adicionar ao robots.txt
```

---

#### SEO-004: Canonical URLs
**Prioridade:** 🟢 Baixa  
**Esforço:** 1h  
**Descrição:** Não há canonical URLs.

**Implementação:**
```
1. Adicionar link rel="canonical" em DynamicSEO
2. Evitar conteúdo duplicado
3. Usar URL completa
```

---

#### SEO-005: Página 404 Otimizada
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** NotFound.tsx existe mas pode melhorar.

**Implementação:**
```
1. Melhorar design do 404 com ilustração
2. Adicionar sugestões de páginas
3. Link para catálogo e dashboard
4. Busca inline
```

---

#### SEO-006: Performance Core Web Vitals
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Verificar e otimizar LCP, FID, CLS.

**Implementação:**
```
1. Auditar com PageSpeed Insights
2. Otimizar LCP (largest contentful paint)
3. Minimizar CLS (layout shift)
4. Verificar FID/INP
5. Documentar métricas atuais e melhorias
```

---

### 🎮 GAMIFICAÇÃO - 11 Pendentes

#### GAME-002: Desafios Semanais
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Não há desafios semanais (apenas diários).

**Implementação:**
```
1. Adicionar challenge_period (daily/weekly) na tabela
2. Desafios maiores com prazo semanal
3. "Complete um curso", "Mantenha streak de 5 dias"
4. Recompensas maiores
```

---

#### GAME-003: Sistema de Ligas
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Leaderboard único sem divisões.

**Implementação:**
```
1. Criar tabela user_leagues
2. Ligas: Bronze, Prata, Ouro, Platina, Diamante
3. Promoção/rebaixamento semanal
4. Top 10 sobe de liga, bottom 10 desce
5. Cron job para atualização semanal
```

---

#### GAME-004: Recompensas de Milestone Expandidas
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Conquistas existem mas podem expandir.

**Implementação:**
```
1. Adicionar mais conquistas de milestone via migration
2. "Primeiro curso", "10 cursos", "100 aulas"
3. Badges especiais por categoria
4. Conquistas secretas
```

---

#### GAME-005: Multiplier de XP
**Prioridade:** 🟢 Baixa  
**Esforço:** 3h  
**Descrição:** XP é fixo, sem multiplicadores.

**Implementação:**
```
1. Adicionar campo xp_multiplier na user_xp
2. Double XP weekend (sexta-domingo)
3. Streak multiplier (1.5x após 7 dias)
4. Happy hour de aprendizado (opcional)
```

---

#### GAME-006: Moeda Virtual
**Prioridade:** 🟢 Baixa  
**Esforço:** 8h  
**Descrição:** Apenas XP, sem moeda para gastar.

**Implementação:**
```
1. Adicionar campo coins na user_xp
2. Ganhar coins com conquistas e desafios
3. Loja virtual (fase futura)
4. Gastar em: avatares, temas, power-ups
```

---

#### GAME-007: Power-ups de Estudo
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Não há power-ups.

**Implementação:**
```
1. Criar tabela user_powerups
2. "XP Boost" - 2x XP por 1 hora
3. "Streak Freeze" - protege streak por 1 dia
4. Comprar com coins ou ganhar em conquistas
```

---

#### GAME-008: Missões de Equipe/Departamento
**Prioridade:** 🟢 Baixa  
**Esforço:** 8h  
**Descrição:** Gamificação é individual.

**Implementação:**
```
1. Usar campo department existente em profiles
2. Criar tabela department_challenges
3. Missões colaborativas por departamento
4. Já existe DepartmentLeaderboard - expandir
```

---

#### GAME-009: Seasonal Events
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Não há eventos sazonais.

**Implementação:**
```
1. Criar tabela seasonal_events
2. Eventos temáticos (Natal, Páscoa, Aniversário empresa)
3. Conquistas exclusivas temporárias
4. Decorações na UI (opcional)
```

---

#### GAME-010: Perfil Público com Badges
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Perfil é privado.

**Implementação:**
```
1. Criar página /usuario/:id pública
2. Mostrar badges, nível, cursos concluídos
3. Adicionar campo is_public em profiles
4. Opção de tornar privado
```

---

#### GAME-011: Ranking por Categoria
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Leaderboard geral apenas.

**Implementação:**
```
1. Criar função RPC get_category_leaderboard
2. Filtrar ranking por categoria de curso
3. Mostrar especialistas por área
4. "Top em Vendas", "Top em Atendimento"
```

---

#### GAME-012: Sistema de Reputação
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Apenas XP, sem reputação social.

**Implementação:**
```
1. Criar campo reputation em profiles
2. Ganhar reputação ajudando outros (votos em discussões)
3. Responder perguntas dá reputação
4. Mostrar no perfil
```

---

### 🛠️ MELHORIAS ADMINISTRATIVAS - 5 Pendentes

#### ✅ ADMIN-002: Gestão de Usuários Avançada — CONCLUÍDO
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Lista de usuários sem ações avançadas.

**Implementação:**
```
1. Botão para resetar senha (via password_reset_requests)
2. Botão para desativar usuário (soft delete)
3. Atribuir/remover role de admin
4. Ver progresso detalhado do usuário
5. Busca e filtros avançados
```

**Entregue em 25/11/2026:**
- Migration `20261125190500_admin_gestao_usuarios.sql`: `profiles.email` / `is_active` / `deactivated_at`, backfill a partir de `auth.users`, `handle_new_user` gravando e-mail e trigger `protect_profile_admin_columns` (usuário comum não altera e-mail/status/user_id nem reativa a própria conta).
- Edge function `admin-user-actions` (`verify_jwt = true`, service role, checagem de papel admin, ban no GoTrue + signOut global): `deactivate` / `reactivate`.
- `Admin.tsx`: agregação única com e-mail real, status e papéis (antes `email: ''` era hardcoded).
- `AdminUsersTab`: colunas Papel/Status/Ações, filtros por papel e status, busca por nome e e-mail.
- `UserActionsMenu`: resetar senha (reaproveita `password_reset_requests` + `approve-password-reset`), desativar/reativar, conceder/remover admin (protege auto-desativação e o último admin).
- `UserProgressDialog`: XP por origem, nível e progresso por curso.

---

#### ADMIN-003: Gestão de Conquistas
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Conquistas são fixas no banco.

**Implementação:**
```
1. Criar AchievementsManager.tsx no admin
2. CRUD de conquistas
3. Criar novas conquistas customizadas
4. Definir critérios e recompensas
5. Preview de ícone/gradiente
```

---

#### ADMIN-004: Bulk Actions
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Ações apenas individuais.

**Implementação:**
```
1. Selecionar múltiplos cursos com checkbox
2. Publicar/despublicar em massa
3. Atribuir categoria em massa
4. Excluir em massa (com confirmação)
```

---

#### ADMIN-005: Importação de Cursos via CSV
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Cursos criados manualmente.

**Implementação:**
```
1. Já existe CSVImporter.tsx - verificar se funciona para cursos
2. Criar template de importação
3. Validação de campos obrigatórios
4. Preview antes de importar
5. Relatório de importação
```

---

#### ADMIN-006: Relatórios Agendados
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Não há relatórios automáticos.

**Implementação:**
```
1. Criar edge function scheduled-reports
2. Enviar relatório semanal por email
3. Métricas principais da plataforma
4. Usar Resend para email
5. Configurar cron no Supabase
```

---

#### ADMIN-007: Configurações da Plataforma — CONCLUÍDO
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Configurações hardcoded.

**Implementação:**
```sql
CREATE TABLE public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users
);
```

```
1. Criar tabela platform_settings
2. XP por ação configurável
3. Tempo de cooldown de quiz
4. Domínio de email permitido
5. Interface de configuração no admin
```

**Entregue em 25/11/2026:**
- Migration `20261125200000_platform_settings.sql`: tabela `public.platform_settings` (key PK, value JSONB, description, updated_at, updated_by → `auth.users`), RLS habilitada com 3 policies — admin (`has_role`) escreve, autenticado lê tudo, `anon` lê apenas `allowed_email_domains` (o login valida o domínio antes de existir sessão) — trigger `update_updated_at_column` e grants. Seeds idempotentes com os valores que já eram usados no código: `allowed_email_domains = ["promobrindes.com.br"]`, `quiz_defaults = {passing_score: 90, xp_reward: 50, cooldown_hours: 24, time_limit_seconds: null}`, `xp_rewards = {lesson_completed: 25, course_completed: 100}`.
- `src/lib/platformSettings.ts`: chaves, defaults, normalização de domínios, `createCorporateEmailSchema`, getters com clamp (`quizDefaultsFrom`, `xpRewardsFrom`) e schema Zod do formulário.
- `Admin → Configurações` (`PlatformSettingsTab` + `usePlatformSettings`): edita domínios de e-mail, padrões de quiz novo e XP por ação; grava `updated_by`.
- Consumo real: `Auth.tsx` (schema de e-mail do login/cadastro), `QuizManager.tsx` (defaults de quiz novo) e `LessonPlayer.tsx` (XP de aula/curso) leem `platform_settings` — trocar um valor no admin não exige deploy.
- 15 testes em `src/test/platformSettings.test.ts`.

---

### 📱 MOBILE - 2 Pendentes

#### MOB-002: Gestos de Navegação
**Prioridade:** 🟢 Baixa  
**Esforço:** 4h  
**Descrição:** Não há gestos mobile.

**Implementação:**
```
1. Usar framer-motion para gestos
2. Swipe para próxima/anterior aula
3. Pull to refresh em listas (react-pull-to-refresh)
4. Testar em dispositivos reais
```

---

#### MOB-004: Modo Picture-in-Picture
**Prioridade:** 🟢 Baixa  
**Esforço:** 3h  
**Descrição:** Vídeo não suporta PiP.

**Implementação:**
```
1. Adicionar botão PiP no VideoPlayer
2. Usar Picture-in-Picture API do navegador
3. Continuar vídeo minimizado
4. Verificar suporte do navegador
```

---

### 🔗 INTEGRAÇÕES - 4 Pendentes

#### INT-001: Integração com Slack
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Não há integração com Slack.

**Implementação:**
```
1. Criar edge function slack-webhook
2. Notificações de curso concluído
3. Ranking semanal no canal
4. Configuração de webhook no admin
```

---

#### INT-002: Integração com Google Calendar
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Não há integração com calendário.

**Implementação:**
```
1. OAuth com Google
2. Adicionar eventos de estudo agendados
3. Lembrete antes do prazo de curso
4. Bloquear horário para estudar
```

---

#### INT-003: SSO com Google/Microsoft
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Apenas email/senha.

**Implementação:**
```
1. Configurar OAuth providers no Supabase
2. Adicionar botões de login social em Auth.tsx
3. Manter restrição de domínio @promobrindes.com.br
4. Testar fluxo completo
```

---

#### INT-004: Webhooks para Eventos
**Prioridade:** 🟢 Baixa  
**Esforço:** 6h  
**Descrição:** Não há webhooks.

**Implementação:**
```sql
CREATE TABLE public.webhook_endpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

```
1. Criar tabela webhook_endpoints
2. Webhook quando curso é concluído
3. Webhook quando certificado é emitido
4. Edge function para disparar webhooks
```

---

### 🔧 REFATORAÇÕES TÉCNICAS - 5 Pendentes

#### REF-001: Componentização do Header
**Prioridade:** 🟡 Média  
**Esforço:** 4h  
**Descrição:** Header duplicado em várias páginas.

**Implementação:**
```
1. Criar AppHeader.tsx componente único
2. Props: showNav, showProfile, variant
3. Usar em todas as páginas autenticadas
4. Manter Header.tsx apenas para landing
```

---

#### REF-002: Layout Wrapper
**Prioridade:** 🟡 Média  
**Esforço:** 3h  
**Descrição:** Estrutura de página duplicada.

**Implementação:**
```
1. Criar AppLayout.tsx
2. Incluir AppHeader, main, footer
3. Wrap de todas as rotas autenticadas
4. Simplificar código das páginas
```

---

#### REF-004: Tipos Centralizados
**Prioridade:** 🟡 Média  
**Esforço:** 2h  
**Descrição:** Tipos duplicados em componentes.

**Implementação:**
```
1. Criar src/types/index.ts
2. Exportar Course, Lesson, User, etc.
3. Importar em todos os componentes
4. Remover definições duplicadas
```

---

#### REF-005: Constants File
**Prioridade:** 🟢 Baixa  
**Esforço:** 1h  
**Descrição:** Valores hardcoded espalhados.

**Implementação:**
```
1. Criar src/lib/constants.ts
2. XP_PER_LESSON, XP_PER_COURSE, etc.
3. ROUTES object com todas as rotas
4. Outros valores hardcoded
```

---

#### REF-006: Error Boundary
**Prioridade:** 🟡 Média  
**Esforço:** 2h  
**Descrição:** Erros não tratados quebram a UI.

**Implementação:**
```
1. Criar ErrorBoundary.tsx
2. UI amigável para erros
3. Botão de "Tentar novamente"
4. Enviar erro para logging (opcional)
5. Wrap em App.tsx
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO SUGERIDO

### 🔴 Fase 1: Críticas (Semana 1-2)
**Prioridade: Alta | Esforço Total: ~20h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| PERF-002 | Memoização de Componentes | 3h |
| A11Y-001 | Labels em Inputs | ✅ 2h |
| SEC-002 | Validação de Input Completa | ✅ 3h |
| REF-006 | Error Boundary | 2h |
| UI-011 | Modal Confirmação Saída | ✅ 2h |
| FUNC-021 | Revisão de Quiz | ✅ 3h |
| REF-001 | Componentização Header | 4h |

---

### 🟡 Fase 2: Importantes (Semana 3-4)
**Prioridade: Média | Esforço Total: ~30h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| FUNC-002 | Favoritar Cursos | 4h |
| FUNC-015 | Recomendações Personalizadas | 4h |
| FUNC-012 | Metas de Aprendizado | 4h |
| UI-015 | Avatar Upload | 4h |
| GAME-004 | Conquistas Expandidas | 4h |
| ADMIN-002 | Gestão de Usuários Avançada | ✅ 4h |
| REF-002 | Layout Wrapper | 3h |
| REF-004 | Tipos Centralizados | 2h |

---

### 🟢 Fase 3: Melhorias (Semana 5-6)
**Prioridade: Média-Baixa | Esforço Total: ~28h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| FUNC-003 | Notas nas Aulas | 6h |
| FUNC-011 | Agenda de Estudos | 6h |
| FUNC-013 | Activity Timeline | 4h |
| PERF-003 | Paginação Catálogo | 3h |
| SEO-006 | Core Web Vitals | 4h |
| A11Y-005 | Skip Links | ✅ 1h |
| A11Y-008 | Reduced Motion | 2h |
| UI-014 | Copiar Certificado | 1h |

---

### 🔵 Fase 4: Nice-to-Have (Semana 7-8)
**Prioridade: Baixa | Esforço Total: ~26h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| GAME-003 | Sistema de Ligas | 6h |
| FUNC-022 | Compartilhar Conquistas | 4h |
| INT-003 | SSO Google/Microsoft | 4h |
| ADMIN-003 | Gestão de Conquistas | 4h |
| FUNC-005 | Melhorar Certificado PDF | 3h |
| UI-008 | Grid/Lista Toggle | 4h |
| REF-005 | Constants File | 1h |

---

## 📊 RESUMO FINAL

| Categoria | Pendentes | Esforço Est. |
|-----------|-----------|--------------|
| UX/UI | 8 | ~26h |
| Performance | 3 | ~10h |
| Funcionalidades | 13 | ~69h |
| Acessibilidade | 6 | ~13h |
| Segurança | 3 | ~6h |
| SEO | 5 | ~11h |
| Gamificação | 11 | ~59h |
| Administrativas | 5 | ~20h |
| Mobile | 2 | ~7h |
| Integração | 4 | ~22h |
| Refatorações | 5 | ~12h |
| **TOTAL PENDENTE** | **51** | **~255h** |

---

## ✅ CHECKLIST DE QUALIDADE

Antes de considerar cada melhoria "completa", verificar:

- [ ] Funcionalidade testada em desktop e mobile
- [ ] Código revisado (sem console.log, tipos corretos)
- [ ] Tema claro e escuro funcionando
- [ ] Acessibilidade básica (teclado, aria-labels)
- [ ] Performance aceitável (sem re-renders desnecessários)
- [ ] RLS policies aplicadas em novas tabelas
- [ ] Documentação atualizada se necessário

---

*Documento gerado em: 12/01/2026*  
*Próxima revisão sugerida: Após conclusão da Fase 1*
