# 📋 PLANO DE IMPLEMENTAÇÃO - MELHORIAS PENDENTES

**MULTIPLIXE - Plataforma de Treinamento Corporativo**  
*Análise atualizada em: 12/01/2026*

---

## 📊 RESUMO EXECUTIVO

### Status Atual do Projeto

Após análise exaustiva do repositório, identifiquei **102 melhorias** no plano original (27/12/2024). Muitas já foram implementadas com sucesso. Este documento lista apenas as **PENDENTES**.

### ✅ Melhorias JÁ IMPLEMENTADAS (79)

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

## ⏳ MELHORIAS PENDENTES (20)

### 🎨 UX/UI - 2 Pendentes

#### UI-004: Feedback Visual em Ações ✅ CONCLUÍDO
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

**Implementação — status:**
```
[x] 1. Auditoria de CourseForm, LessonForm, QuizManager, Profile e telas admin
[x] 2. Loading state nos botões de ação que faltavam
[x] 3. disabled + Loader2 durante operações async, com guarda contra duplo clique
[x] 4. src/components/admin/*.tsx, src/pages/Profile.tsx
```

**O que a auditoria encontrou (e o que foi corrigido):**
- `CourseForm`, `LessonForm` e `QuizManager` já tinham `disabled={loading}` + `Loader2` — nada a fazer.
- `LessonsManager`: o botão "Excluir" do diálogo de confirmação chamava `handleDeleteLesson` sem estado — dava para clicar 3x e disparar 3 deletes. Agora `savingDeletion` desabilita o botão e mostra spinner durante o delete (inclusive na atualização do contador de aulas do curso).
- `LearningPathsManager`: os dois interruptores de publicar/destacar e o "Excluir" da trilha não tinham estado nenhum — duplo clique alternava o valor duas vezes (publicava e despublicava na sequência). Agora `busyPathId` desabilita os interruptores da trilha em operação e `savingDeletion` cobre o delete.
- `Profile`: "Exportar dados" (chamada à edge function `export-user-data`) e o botão de sair não tinham feedback. Agora `exporting`/`signingOut` desabilitam o botão e trocam o ícone por `Loader2`, com guarda contra clique repetido (evita baixar o arquivo duas vezes).

**Testes:** `src/test/profileExportProgress.test.tsx` ganhou o caso "desabilita o botão de exportar dados enquanto a exportação está em andamento" (promise pendente → botão `disabled`, depois liberado) — 4 casos verdes no arquivo. Suíte completa: 68 arquivos / 536 testes. `tsc -b` 0 erros; eslint 0 erros nos arquivos tocados.

**Arquivos:** `src/components/admin/LessonsManager.tsx`, `src/components/admin/LearningPathsManager.tsx`, `src/pages/Profile.tsx`, `src/test/profileExportProgress.test.tsx`.

---

#### UI-006: Tooltips Informativos ✅ CONCLUÍDO
**Prioridade:** 🟢 Baixa  
**Esforço:** 2h  
**Descrição:** Faltam tooltips em ícones de ação.

**Implementação:**
```
1. Adicionar Tooltip em todos os ícones de ação
2. Locais: Dashboard stats, Profile stats, Admin actions
3. Usar TooltipProvider já configurado
```

**Status:** ✅ CONCLUÍDO

- `src/components/ui/icon-tooltip.tsx` (novo): wrapper padrão de tooltip para ícone de ação. Traz o próprio `TooltipProvider` (funciona em diálogo, ilha e teste), aplica `aria-label` no gatilho e exibe o rótulo real — não só o `title` nativo do navegador.
- **Ações de admin:** 21 botões de ícone em `AdminCoursesTab` (4), `LearningPathsManager` (4), `AdminWorkflowsTab` (3), `LearningPathCoursesManager` (3), `LessonsManager` (2), `AdminVideosTab` (2), `AdminPlaybooksTab` (2), `AdminAssessmentsTab` (2), `AdminAchievementsTab` (2), `QuizQuestionCard`, `IPWhitelistManager` e `GeoBlockingManager` passaram a usar o wrapper. Os `title=` antigos (dependiam do tooltip cinza do navegador) foram removidos e substituídos por `aria-label` explícito.
- **Stats com explicação:** `DashboardStatsGrid` ganhou `tooltip` no `StatItem` e mostra um ícone de informação que explica a métrica; `Dashboard` explica os 4 cards (em andamento, concluídos, XP, sequência) e `Profile` os 4 do perfil (aulas, cursos, em progresso, minutos).
- `src/test/iconTooltip.test.tsx` (novo, 2 casos): nome acessível + tooltip no gatilho e o card com ícone de informação. O teste de guarda `iconButtonLabels.test.ts` continua passando — nenhum botão de ícone ficou sem nome acessível.

**Verificação:** `tsc -b --force` 0 · `eslint` 0 erros (3 warnings herdados de hooks) · suíte **72 arquivos / 555 testes** · guard de botões de ícone verde.

---

#### UI-008: Modo de Visualização de Cursos (Grid/Lista) ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- ViewToggle.tsx e CourseListItem.tsx existiam completos e nunca eram renderizados por
  nenhuma rota (orfaos). Montados no Catalog: botao de alternancia ao lado da contagem
  de resultados e visao em lista reaproveitando o CourseListItem.
- useViewMode ja persistia a escolha em localStorage (chave catalog-view); a preferencia
  sobrevive a recarga e e aplicada na abertura da pagina.
- Acessibilidade: os dois botoes do toggle ganharam aria-label e aria-pressed; a lista
  usa role=list/listitem com rotulo "Lista de cursos".
- src/test/catalogViewMode.test.tsx: 4 casos (inicia em grade, alterna para lista e
  persiste, retoma a preferencia salva, volta para grade e persiste).
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

#### UI-014: Feedback de Copiar Código de Certificado ✅ CONCLUÍDO
**Prioridade:** 🟢 Baixa  
**Esforço:** 1h  
**Descrição:** Código de verificação não tem botão de copiar.

**Implementação:**
```
1. Adicionar botão de copiar em CertificateCard
2. Usar navigator.clipboard.writeText
3. Mostrar toast de confirmação
```

**Evidência (2026-11-26):**
```text
- src/components/CertificateCard.tsx:32-41 copia o codigo com navigator.clipboard.writeText e
  dispara toast.success("Código copiado!") ou toast.error em caso de falha.
- Linhas 109-123: botao de copiar alterna o icone Copy/Check e o rotulo para "Copiado!" por 2s.
```

---

#### UI-015: Avatar Upload no Perfil ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- AvatarUpload.tsx estava orfao (233 linhas, zero imports). Montado no ProfileHeader no
  lugar do circulo com a inicial; onAvatarChange propaga a URL nova para a pagina.
- Profile.tsx passou a carregar profiles.avatar_url junto das estatisticas.
- Bucket 'avatars' existia com RLS habilitado em storage.objects e ZERO policies: todo
  upload autenticado falhava com 403. Migration 20261125234500_storage_policies_avatars.sql
  cria leitura publica e insert/update/delete limitados a pasta do proprio usuario.
- Prova em producao (usuario real criado e removido no teste): upload na propria pasta 200,
  upload em pasta alheia 403 AccessDenied, delete proprio 200; ao remover a policy o upload
  volta a falhar com 403 e ao recria-la volta a passar.
- src/test/profileAvatar.test.tsx: 3 casos (rotulo acessivel, inicial sem avatar, imagem salva).
```

---

#### UI-016: Indicador de Cache/Offline ✅ CONCLUÍDO
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

**Status:** ✅ CONCLUÍDO

O `CacheIndicator` já existia (criado por trabalho anterior) e estava plugado em Dashboard, Catálogo e Trilhas, mas só sabia de cache: nada avisava o usuário quando ele estava **sem internet** — exatamente o caso em que os dados na tela são os salvos.

- `src/hooks/useOnlineStatus.ts` (novo): estado de conexão com listeners `online`/`offline` e limpeza no unmount.
- `src/components/ui/CacheIndicator.tsx`: passa a consumir o hook. Offline ganha prioridade sobre cache e refetch (ícone `WifiOff`, cor âmbar, rótulo "Offline"), o botão fica desabilitado e o tooltip explica "Sem conexão - exibindo dados salvos". Como o componente já estava nos três lugares, os três ganharam o aviso sem tocar nas páginas.
- `src/test/cacheIndicator.test.tsx` (novo, 4 casos): dados frescos, dados em cache, refetch em andamento e offline bloqueando o recarregamento.

---

### ⚡ PERFORMANCE - 1 Pendente

#### PERF-002: Memoização de Componentes ✅ CONCLUÍDO
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

**Entrega (2026-11-25):**
```
- Auditoria: CourseCard, AchievementsGrid e VirtualizedCourseGrid já são React.memo;
  Catalog já usa useMemo (matchesMap, filteredCourses) e useCallback nos handlers.
- Gap real corrigido: Catalog recriava a lista mapeada passada ao VirtualizedCourseGrid
  a cada render, anulando o memo do grid a cada tecla digitada na busca.
  Agora é useMemo([filteredCourses]).
- Dashboard/Profile: os cálculos são filtros O(n) sobre dezenas de itens e ficam após
  early return (useMemo exigiria reordenar hooks); não há ganho mensurável.
```

---

#### PERF-003: Paginação no Catálogo ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- useInfiniteScroll.ts existia completo e nunca era usado (orfao). O catalogo agora renderiza 12 cursos
  por vez e libera o restante pelo botao "Carregar mais", pelo scroll da janela e por um sentinel
  (IntersectionObserver com rootMargin) que funciona tambem dentro de containers com scroll proprio.
- A lista completa continua em memoria: a contagem "N cursos encontrados", a busca com destaque
  (fuse + searchMatches) e os filtros de categoria/nivel nao mudaram. A paginacao reduz so o que e
  montado no DOM.
- Na lista o ganho e direto (nao ha virtualizacao). Na grade com 20 ou mais cursos o
  VirtualizedCourseGrid continua recebendo todos os cursos, porque tem scroll interno proprio e ja
  monta apenas as linhas visiveis; paginar ali esconderia itens sem ganho de render.
- O hook passou a limpar o setTimeout do carregamento no unmount (antes resolvia depois do teardown
  nos testes e deixava a suite instavel).
- Testes: src/test/catalogInfiniteScroll.test.tsx (4 casos: 12 de 25, carregar mais ate o fim, grade
  virtualizada sem botao, busca continuando a filtrar a lista paginada). Suite: 54 arquivos / 467 testes.
```

Desvio consciente: o passo 1 do rascunho (limit/offset no servidor com useInfiniteQuery) nao foi
aplicado porque o servidor passaria a devolver um subconjunto e a busca fuzzy com destaque, a
contagem total e os filtros de categoria/nivel sao client-side - seria regressao funcional.

---

#### PERF-005: Otimização de Imagens ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O `LazyImage` ja tinha lazy loading, shimmer e blur placeholder, mas servia sempre a mesma imagem: um card de 192px baixava a foto de 800px. Nenhum CDN era aproveitado e nao havia `srcset`.

- `src/lib/imageSrcSet.ts` (novo): `buildImageSrcSet(url)` monta o `srcset` so quando a URL ja expoe o parametro de largura (`w=` ou `width=`, estilo Unsplash/imgix — o formato de todos os thumbnails atuais). CDN desconhecido, caminho local, `data:`/`blob:` devolvem `undefined` e o browser continua no `src` original, sem risco de imagem quebrada.
- `src/components/LazyImage.tsx`: usa o helper automaticamente e deriva `sizes` de `(min-width: 768px) <width>px, 100vw`; `srcSet` e `sizes` manuais continuam tendo prioridade.
- `src/test/imageSrcSet.test.tsx` (novo, 7 casos): variantes geradas, largura maxima respeitada, CDN sem parametro, data URL, `width=` de outro CDN e as tres combinacoes no componente.

Efeito: o card de catalogo passou a pedir 320–640px no celular em vez de baixar 800px.


---

### 🚀 FUNCIONALIDADES - 4 Pendentes

#### FUNC-002: Favoritar Cursos ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- A base ja existia e estava orfa: useFavorites.ts (mutacoes otimistas com rollback, toasts, undo),
  FavoriteButton.tsx (coracao com aria-pressed, spinner e tooltip) e a tabela public.user_favorites
  em producao com RLS e 3 policies (select/insert/delete com auth.uid() = user_id).
- FavoriteButton so era montado no modo lista (CourseListItem). Agora tambem aparece no CourseCard,
  que e o card usado na grade do catalogo, nos favoritos e nas secoes do Dashboard.
- Novo FavoritesSection.tsx: secao "Meus Favoritos" no Dashboard, lista os cursos salvos na ordem
  dos favoritos (course_id -> courses com categoria), com skeleton durante o carregamento, estado
  vazio (EmptyState type="favorites") e atalho para o catalogo.
- Seguranca: is_published = true na consulta + RLS de user_favorites impedem que favorito de curso
  despublicado ou de outro usuario apareca.
- Testes: src/test/favorites.test.tsx (3 casos: so favoritados na ordem dos favoritos, estado vazio
  com atalho, toggle sem navegar para o curso). Suite: 55 arquivos, todos verdes.
```

---

#### FUNC-003: Notas nas Aulas ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

A tabela `user_notes`, o hook `useNotes` e o `NotesPanel` (criar, editar, excluir) já existiam, mas o painel era montado no `LessonPlayer` com `currentTime={0}` fixo: toda nota nascia no segundo 0 e o botão de timestamp não movia o vídeo. Faltava também o export em markdown.

- `src/components/player/VideoPlayer.tsx`: ganhou a prop `onTimeUpdate` (tempo real do elemento `<video>`) e o handle `VideoPlayerHandle.seek()`, exposto via `forwardRef` + `useImperativeHandle`.
- `src/pages/LessonPlayer.tsx`: guarda o tempo atual em `videoTimeRef` (sem re-render a cada `timeupdate`), passa `getCurrentTime` ao painel e `handleSeekToVideoTime`, que executa o seek no player; o tempo volta a zero ao trocar de aula.
- `src/components/notes/NotesPanel.tsx`: salva a nota com o tempo real do vídeo, mostra o tempo ao vivo (1x/s enquanto o painel está aberto) e ganhou "Exportar em Markdown" (`notesToMarkdown` + download de `anotacoes-aula.md`).
- `src/test/notesPanel.test.tsx` (novo, 6 casos): formato do markdown, ordem das notas, lista vazia, salvamento no tempo real (125s, não 0), seek pelo timestamp e conteúdo do arquivo exportado.

---

#### FUNC-005: Melhorar Download de Certificado PDF ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O botao "Baixar" entregava um arquivo `.svg` (o edge function devolve o certificado como SVG em base64, apesar do nome `pdfBase64`), o layout era um desenho fixo no edge function e nao havia como levar o certificado para o LinkedIn.

- `src/lib/certificatePdf.ts` (novo): `buildCertificatePdf` monta um PDF A4 paisagem de verdade com jsPDF (que ja era dependencia): moldura dourada dupla, marca PROMO BRINDES no topo, titulo em serifada, nome e curso com quebra de linha automatica, data de emissao em pt-BR, bloco de assinatura digital e rodape com codigo + URL de verificacao. Tema claro, pensado para impressao.
- `src/lib/certificatePdf.ts`: `buildLinkedInCertificationUrl` (startTask=CERTIFICATION_NAME, nome do curso, organizacao, mes/ano de emissao, URL absoluta de verificacao e codigo), `absoluteCertificateUrl` e `certificateFileName` (`certificado-<codigo>.pdf`).
- `src/hooks/useCertificates.ts`: `downloadCertificate` passou a receber os dados do certificado e salvar o PDF (antes decodificava o SVG em base64 e baixava `.svg`).
- `src/components/CertificateCard.tsx`: botao "Adicionar certificado ao LinkedIn" ao lado de visualizar/baixar/verificar, abrindo o formulario de certificacao do LinkedIn em nova aba.
- `src/test/certificatePdf.test.ts` (novo, 5 casos) e `src/test/certificateShare.test.tsx` (novo, 2 casos): conteudo do PDF, nome do arquivo, data em pt-BR, parametros do LinkedIn e o clique em Baixar entregando os dados certos.

QR de verificacao ficou fora: exigiria uma dependencia de encoder de QR (nao existe no projeto) e o certificado ja imprime codigo + URL da pagina publica `/verificar-certificado`.


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

#### FUNC-009: Flashcards de Revisão ✅ CONCLUÍDO
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

**Status:** ✅ Implementado em 26/11.
**Evidência:** migration `supabase/migrations/20261127090000_flashcards_srs.sql` aplicada em produção (tabelas `flashcards` e `user_flashcard_progress` + RPCs `review_flashcard`, `get_due_flashcards`, `get_flashcard_overview`, RLS nas duas tabelas); replay em transação com `rollback` provou os prazos (10min/1d/6d), o XP por nota (0/3/5/7) e as permissões (authenticated sim, anon não); 7 cartões semeados no curso Excel vinculados às aulas reais. Front: `src/pages/Flashcards.tsx` (rota `/flashcards`), `src/components/flashcards/FlashcardPlayer.tsx`, `src/components/admin/AdminFlashcardsTab.tsx`, `src/hooks/useFlashcards.ts`, `src/lib/flashcardSrs.ts` (6 testes). PR #68 mergeada em `main` (`3600e01`); deploy confirmado no bundle de produção (`Flashcards-CZXN0Wim.js`, `useFlashcards-IaR_niNG.js`, `AdminFlashcardsTab-Ce9rmoRz.js`).

---

#### FUNC-010: Exportar Progresso ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- ExportProgress.tsx existia completo (259 linhas: Dialog com pre-visualizacao + geracao de
  PDF via jsPDF) e nenhuma rota o importava. Montado no header da secao Estatisticas do
  Profile, com lazy load para o jsPDF nao entrar no bundle inicial do perfil.
- O PDF usa tabelas conferidas em producao: user_course_progress (+ courses.duration_minutes),
  user_lesson_progress, user_achievements, user_streaks, certificates e os dados de
  useUserXP (XP total e nivel).
- src/test/profileExportProgress.test.tsx: 3 casos (botao presente na pagina, pre-visualizacao
  abre no clique, PDF gerado com nome progresso-<usuario>-<data>.pdf).
```

---

#### FUNC-011: Agenda de Estudos ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- StudyCalendar.tsx e useStudyCalendar.ts existiam completos e nunca eram renderizados por nenhuma rota
  (orfaos). Agora aparecem no Dashboard, na secao Agenda de Estudos, ao lado do painel de agendamento.
- useStudyCalendar ja montava os itens do mes juntando aulas concluidas (user_lesson_progress),
  tentativas de quiz (user_quiz_attempts) e conquistas (user_achievements); o calendario mostra um
  indicador por atividade do dia, com tooltip por item e legenda por tipo.
- O que faltava para a agenda existir de verdade era o agendamento: a tabela public.study_schedule nao
  existia em producao (migration 20261125235500_study_schedule). Criada com RLS habilitado e quatro
  policies (select/insert/update/delete) restritas ao dono da linha, indice (user_id, scheduled_date)
  e grants para authenticated.
- Novo hook useStudySchedule (criar, concluir/reabrir e excluir blocos de estudo) e novo painel
  StudySchedulePanel (dialog com curso opcional, data, hora e duracao; lista de proximos blocos e de
  concluidos recentes), montado no Dashboard junto do calendario.
- Acessibilidade: labels em todos os campos do dialog, aria-label nos botoes de icone, aria-pressed no
  botao de concluir e rotulos que descrevem o bloco (curso + data).
- RLS provado em producao com dois usuarios reais: leitura pelo dono = 1 linha; leitura pelo outro
  usuario = 0 linhas; insert forjando user_id alheio = 403 (row-level security); update e delete na
  linha alheia = 0 linhas afetadas; update e delete na propria linha = aplicados.
```


---

#### FUNC-012: Metas de Aprendizado ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

A tabela `user_goals`, o hook `useGoals` e o `GoalsWidget` existiam, mas `current_value` nunca era atualizado: o `updateGoalProgress` do hook não era chamado em nenhum lugar do front nem existia função/trigger no banco que mexesse em `user_goals`, então toda meta ficava travada em 0.

- `supabase/migrations/20261126010000_metas_progresso_real.sql`: função `public.recalculate_user_goals(uuid)` (SECURITY DEFINER, só o próprio usuário) que deriva o progresso real — `xp_day` de `user_xp_history`, `lessons_week` de `user_lesson_progress.is_completed`, `hours_week` de `watched_seconds` e `courses_month` de `user_course_progress.completed_at`, sempre dentro da janela `start_date..end_date` da meta; marca `completed`/`completed_at` sozinho.
- Triggers `trg_goals_after_lesson_progress`, `trg_goals_after_course_progress` e `trg_goals_after_xp_history`: cada aula concluída, curso concluído ou XP ganho atualiza as metas do aluno na hora (falha na meta nunca derruba o salvamento da aula).
- `src/hooks/useGoals.ts`: recalcula antes de ler as metas (meta criada depois de o aluno já ter estudado já nasce com o valor certo) e remove o `updateGoalProgress` morto.
- `src/test/goalProgress.test.ts` (novo, 3 casos): chama o recálculo, usa o valor gravado e tolera ambiente sem a função.

Validado no banco de produção com o usuário real `96b716a2`: 4 metas de teste dentro de uma transação (rollback) deram `lessons_week = 1`, `courses_month = 0`, `xp_day = 0`, `hours_week = 0` — exatamente o que os dados reais mostram. Depois, com XP e tempo inseridos na transação, os triggers levaram as metas a `xp_day = 150` e `hours_week = 5` com `completed = true`.


---

#### FUNC-013: Histórico de Atividades Timeline ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- ActivityTimeline.tsx (213 linhas) estava orfao. Montado na Profile em secao 'Atividade
  Recente' com lazy load e skeleton, limit=8.
- Agrega user_lesson_progress, user_course_progress e user_achievements; colunas e chaves
  estrangeiras usadas nos embeds foram conferidas no banco de producao.
- Filtro por periodo (7 dias / 30 dias / tudo) adicionado ao componente, com aria-pressed.
- src/test/activityTimeline.test.tsx: 3 casos (ordem, filtro de 7 dias, periodo ativo).
```

---

#### FUNC-014: Comparativo de Desempenho ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O card `src/components/analytics/PerformanceComparison.tsx` já existia pronto, mas estava órfão: nenhum arquivo o importava e os números vinham de um `defaultStats` fixo (2450 XP, 24h) — não havia nada no banco calculando média nenhuma.

- `supabase/migrations/20261126030000_comparativo_desempenho.sql` (nova, já aplicada em produção): RPC `public.get_performance_comparison()` (SECURITY DEFINER, `stable`) devolve, numa linha só, o valor do aluno logado e a média da plataforma para XP total, aulas concluídas, cursos concluídos, horas de estudo e sequência atual, mais `student_count`. Só agregados saem da função — nenhum dado de outro aluno.
- A coorte da média são os alunos com atividade (aparecem em `user_xp`, `user_streaks`, `user_course_progress` ou `user_lesson_progress`); contas `admin`/`super_admin` ficam fora para não inflar a média. Aulas contam só `is_completed` e cursos só `completed_at is not null`.
- `src/lib/performanceComparison.ts` (novo): mapeia a linha do RPC (números como texto inclusive), arredonda horas/sequência em 1 casa e descarta linhas em que nem o aluno nem a média têm número — quem está começando não vê zero contra zero.
- `src/hooks/usePerformanceComparison.ts` (novo) chama o RPC e devolve `metrics`, `loading` e `refetch`.
- `src/components/analytics/PerformanceComparisonWidget.tsx` (novo): monta os ícones, mostra skeleton durante a chamada, some da tela se a função falhar e escreve embaixo "Comparado com N alunos com atividade".
- `src/pages/Profile.tsx`: widget registrado com `lazy` + `Suspense` logo acima do bloco Estatísticas, como o plano pedia.
- `PerformanceComparison.tsx`: `defaultStats` (mock) removido; a barra usa `peak = max(dois valores, 1)`, então aluno e média zerados não geram mais `NaN%` na largura.
- `src/test/performanceComparison.test.tsx` (novo, 5 casos): conversão da linha do RPC, nulos e valores inválidos, ocultação de linhas zeradas, e o card mostrando Você, Média e +36%.

Validado no banco de produção dentro de transação com rollback: aluno sintético com 300 XP, 2 aulas concluídas, 1 curso concluído e 2,5h assistidas devolveu exatamente esses valores nas médias, com os 345 XP da conta admin ignorados e `student_count = 1`.

Verificação: `tsc -b --force` 0 erros, eslint 0, suíte 65 arquivos / 522 testes, `node --test scripts/ci/*.unit.mjs` 85 pass / 0 fail, guard de Supabase 0 violações, `vite build` ok.

---

#### FUNC-015: Recomendacoes Personalizadas ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

Existiam duas implementacoes de recomendacao e nenhuma montada na tela: o `SmartRecommendations` (que usa o RPC `get_smart_recommendations`) nao era importado por pagina alguma, e `useRecommendations` + `RecommendationsWidget` eram codigo morto duplicado, sem o RPC.

- RPC `public.get_smart_recommendations(p_user_id uuid, p_limit integer DEFAULT 6)` conferido no banco de producao: SECURITY DEFINER, devolve curso + `recommendation_reason` (mesma categoria, populares, nivel).
- `src/hooks/useSmartRecommendations.ts` (React Query, cache de 10 min) + `src/components/dashboard/SmartRecommendations.tsx` (skeleton, some quando nao ha recomendacao, link com prefetch) montados em `src/pages/Dashboard.tsx:250` dentro de `Suspense`, na secao "Recomendado para voce".
- Removidos `src/hooks/useRecommendations.ts` e `src/components/recommendations/RecommendationsWidget.tsx`: nao tinham nenhum import no repositorio (apenas as proprias referencias internas) e consultavam a mesma tabela sem passar pelo RPC.


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

#### FUNC-020: Quiz Adaptativo ✅ CONCLUÍDO
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

**Status:** ✅ CONCLUÍDO em 26/11/2026 — PR #66 (main 6b9fbfc).

- supabase/migrations/20261126180000_quiz_adaptativo.sql: quiz_questions.difficulty_level (acil|medio|dificil, default medio) + índice; user_quiz_attempts.weighted_score/difficulty_level/by_difficulty; helpers quiz_difficulty_weight, quiz_difficulty_xp_bonus, quiz_recommended_difficulty e get_adaptive_quiz_plan; submit_quiz_attempt reescrita mantendo assinatura e regra de aprovação.
- Produção (transação + ROLLBACK): submit_quiz_attempt devolveu score 100, passed true, xp_bonus 15, weighted_score 100, y_difficulty {"medio":{"total":3,"correct":3}}, ecommended_difficulty "dificil"; privilege('authenticated')=true, ('anon')=false.
- Front: src/lib/quizAdaptive.ts, src/components/quiz/QuizAdaptiveResult.tsx, plano adaptativo em useQuizzes.ts, badge de nível no QuizPlayer.tsx, nível editável no admin (QuizQuestionCard/QuizManager), zod com default medio, tipos do Supabase e inventário de schema regenerados.
- Verificação: 	sc -b limpo, eslint sem erro, suíte 73 arquivos / 559 testes, ite build ok, guarda de uso do Supabase sem violação.
- Deploy provado: bundle servido em produção contém os marcadores (CourseQuizModal-Bf3pjVxD.js).

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
---

#### FUNC-022: Compartilhar Conquistas ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- ShareAchievement.tsx (287 linhas) estava orfao. Montado no card de conquista desbloqueada
  do AchievementsGrid, com botao visivel no hover/focus e aria-label por conquista.
- O componente ja cobre imagem via canvas, Web Share API com fallback, links sociais,
  copiar texto e download; consome lib/shareImage e useTelemetry ja existentes.
- src/test/achievementShare.test.tsx: 3 casos (so desbloqueadas, nenhuma desbloqueada,
  dialogo aberto com descricao e XP da conquista).
```

---

### ♿ ACESSIBILIDADE - Concluído ✅

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

#### A11Y-003: ARIA Roles e Labels ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- Auditoria automática de todo o src (script que lê cada tag <Button>/<button> respeitando
  chaves dentro dos atributos): 50 botões que só mostram ícone (size="icon") não tinham nome
  acessível — um leitor de tela anunciava apenas "botão". Todos receberam aria-label com a
  ação real: fechar, editar/excluir (avaliação, playbook, vídeo, workflow, aula), mover curso
  para cima/baixo, remover etapa/opção/curso/passkey, mês anterior/próximo, sair da conta,
  enviar resposta, voltar, alternar barra lateral, personalizar tema, excluir notificação etc.
  Os 42 arquivos afetados mudaram apenas na linha do atributo.
- Navegação: as 5 <nav> sem rótulo receberam aria-label — CatalogHeader, DashboardHeader e
  landing/Header (menu desktop) como "Navegação principal"; MobileBottomNav como "Navegação
  inferior"; o menu hambúrguer do landing como "Navegação mobile". SkipLinks e Breadcrumb já
  tinham rótulo; pagination já usava role="navigation" aria-label="pagination".
- <main> já existe em todas as páginas (nenhuma alteração necessária) e o menu por teclado
  continua coberto por A11Y-002.
- Guarda de regressão: src/test/iconButtonLabels.test.ts varre src/**/*.tsx a cada execução e
  falha se aparecer um <Button size="icon"> sem aria-label/aria-labelledby/title — reprovava
  com as 50 violações antes da correção e agora passa.
- Validado: tsc 0 erros; suíte 46 arquivos / 438 testes; guards 88 (85 pass, 3 skip, 0 fail);
  build de produção ok.
```

---

#### A11Y-004: Contraste de Cores ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- Calculado o ratio real de cada par cor/fundo das variaveis HSL de src/index.css (conversao
  HSL->sRGB->luminancia relativa, formula WCAG 2.2). Antes: 25 pares abaixo do minimo nos dois
  temas. Exemplos: branco sobre --primary = 4.01 (claro) e 3.36 (escuro); --muted-foreground
  sobre --muted = 4.49; texto --success sobre card = 2.59; --warning como texto = 2.14;
  borda de --input sobre o fundo = 1.17.
- Tema claro: cores de marca e de estado escurecidas ate o primeiro tom que passa como fundo
  com texto branco E como texto sobre o fundo claro — --primary 65%->60%, --primary-hover
  58%->54%, --secondary 60%->47%, --destructive 60%->48%, --success 39%->28%, --warning
  50%->32%, --info 60%->52%, --sidebar-primary 65%->60%; --muted-foreground 45%->43%. O
  gradiente do CTA acompanhou (270 91% 60% / 330 81% 47% / 20 88% 42%) porque o texto branco
  em cima dele tambem era afetado.
- Tema escuro: as cores neon sao claras de proposito, entao o texto em cima delas passou a ser
  escuro (--*-foreground de branco para 250 30% 6% em primary, secondary, destructive, success,
  info e sidebar-primary) em vez de apagar o neon. Resultado: 3.36 -> 5.83 no primary, 1.68 ->
  11.66 no success, 2.17 -> 9.04 no info.
- Bordas: --input (borda que identifica campo de formulario) subiu para 3:1 contra card e
  fundo — claro 92%->62% (1.17 -> 3.16) e escuro 14%->45% (1.20 -> 3.06). --border continua
  como divisor decorativo de superficie, isento pela nota de 1.4.11 (nao e o que identifica o
  componente); o anel de foco (--ring) ja passava (3.81 no claro, 5.97 no escuro).
- Guarda de regressao: src/test/colorContrast.test.ts le src/index.css, extrai as variaveis dos
  blocos :root e .dark e falha se qualquer par texto/fundo cair abaixo de 4.5:1 ou se borda de
  componente/anel de foco cair abaixo de 3:1. Com o CSS anterior ele reprovava em 5 assercoes
  (4.49, 3.81, 3.36, 1.17 e 1.20).
- Validado: tsc 0 erros; suite 47 arquivos / 445 testes; guards 88 (85 pass, 3 skip, 0 fail);
  build de producao ok.
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

#### A11Y-006: Anúncios de Screen Reader ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- LiveAnnouncer.tsx já existia (provider com regiões role="status"/aria-live="polite" e
  role="alert"/aria-live="assertive" + hook useAnnouncements) mas nunca era montado e ninguém
  o importava. Trabalho parado de outro agente.
- Montado em src/main.tsx dentro do ReducedMotionProvider.
- useLiveAnnouncer agora degrada para no-op fora do provider em vez de lançar: telas e modais
  renderizados isoladamente (inclusive nos testes) não quebram.
- QuizPlayer anuncia "Questão X de N" a cada troca de questão e o resultado
  ("Aprovado/Não aprovado: N% de acertos") — educado quando aprovado, assertivo quando não.
- Toasts já são anunciados pelo sonner (região própria), então não foram duplicados.
- src/test/liveAnnouncer.test.tsx (novo, 6 casos): regiões vazias, anúncio educado com limpeza
  em 3s, anúncio assertivo, formato de progresso, uso fora do provider e QuizPlayer anunciando
  a questão atual e a seguinte.
```

---

#### A11Y-007: Textos Alternativos ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- Auditoria de todas as <img> do src (21 ocorrências em 12 arquivos): nenhuma estava sem alt.
  As decorativas já usavam alt="" corretamente (avatar do comentário, que tem o nome do autor
  em texto ao lado; blur placeholder do LazyImage), e as de conteúdo recebem o título do curso
  ou da trilha.
- LazyImage.tsx: quando a imagem falha, a <img> (e o alt junto) era removida do DOM e sobrava
  só um ícone decorativo — agora o estado de erro expõe role="img" aria-label={alt}, então o
  texto alternativo continua disponível para leitores de tela. O placeholder de carregamento
  ficou aria-hidden="true" para não ser anunciado.
- src/test/lazyImage.test.tsx (novo, 4 casos): alt na imagem carregada, placeholder decorativo,
  alt preservado no erro e imagem só inserida no DOM depois de entrar na viewport.
```

---

#### A11Y-008: Reduzir Animações ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- ReducedMotionProvider.tsx já existia (contexto useReducedMotion + SafeMotion + preferência
  salva em localStorage) mas nunca era montado: o hook devolvia sempre shouldAnimate=true e
  a classe .reduce-motion não tinha CSS nenhum. Trabalho parado de outro agente.
- Montado em src/main.tsx em volta de <App /> (StrictMode > ReducedMotionProvider > App).
- O provider agora envolve os filhos em <MotionConfig reducedMotion="user"|"always">, então
  toda animação do framer-motion para quando o SO pede menos movimento ou o usuário ativa a
  preferência.
- src/index.css: media query prefers-reduced-motion e o bloco .reduce-motion zeram
  animation/transition/scroll-behavior, mantendo spinner (.animate-spin/.animate-ping/
  .animate-pulse/.animate-bounce e [role=progressbar] > *) rodando (WCAG 2.3.3).
- src/test/reducedMotion.test.tsx (novo, 7 casos): preferência do sistema, preferência salva,
  sistema sobrepondo o salvo, alternância com persistência e SafeMotion com/sem fallback.
```

---

#### A11Y-009: Tamanho de Fonte Ajustável ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- FontSizeControl.tsx já existia (popover com slider 14-22px, presets e reset, grava em
  localStorage["font-size-preference"] e aplica no <html>) mas nunca era renderizado.
  Trabalho parado de outro agente.
- Montado dentro de AccessibilityWidget.tsx, junto do HighContrastToggle, no mesmo wrapper
  sempre montado: a preferência salva é aplicada no carregamento, com o painel fechado.
- Auditoria de rem/em: nenhum font-size em px nos CSS e o Tailwind do projeto é rem, então
  ajustar o font-size do <html> escala a interface inteira. Restam 7 text-[10px] fixos, todos
  em rótulos decorativos (teclas de atalho do CommandPalette, badge de notificação e a tagline
  "by Promo Brindes") — mantidos de propósito.
- src/test/fontSize.test.tsx (novo, 8 casos): aplicação no load, ausência de preferência, valor
  fora da faixa ignorado, aumentar/diminuir com persistência, preset, reset, widget revelando o
  controle e preferência valendo com o painel fechado.
```

---

#### A11Y-010: Modo Alto Contraste ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```
- HighContrastToggle.tsx já existia (aplica .high-contrast no <html>, grava a escolha em
  localStorage["high-contrast-mode"] e respeita prefers-contrast: more) mas nunca era
  renderizado e a classe não tinha uma única regra CSS. Trabalho parado de outro agente.
- src/components/accessibility/AccessibilityWidget.tsx (novo): botão flutuante
  "Opções de acessibilidade" (bottom-left, z-40) que revela os controles; fica sempre montado
  para a preferência salva valer logo no carregamento, mesmo com o painel fechado.
- Montado em App.tsx junto dos outros flutuantes (ConditionalPomodoroButton, MobileBottomNav).
- src/index.css: variáveis de alto contraste para os temas claro (.high-contrast) e escuro
  (.dark.high-contrast) — fundo/texto/bordas no máximo de contraste, cores de estado
  recalibradas e anel de foco de 3px sempre visível (WCAG 1.4.11 / 2.4.7).
- src/test/highContrast.test.tsx (novo, 9 casos): estado inicial, ligar/desligar com
  persistência, aplicação automática por prefers-contrast, preferência salva vencendo o
  sistema, widget abrindo, contraste ligado pelo widget e preferência aplicada com painel
  fechado.
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

### 🔍 SEO - 1 Pendente

#### SEO-002: Structured Data (JSON-LD) ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

Verificado no codigo: os dados estruturados existem e sao reais.

- `src/components/seo/DynamicSEO.tsx`: `getStructuredData()` (`@context` schema.org) emite `WebSite` + `publisher Organization` (Promo Brindes, com logo) por padrao e `Course` (nome, descricao, provider, instrutor, duracao, nivel) quando a pagina passa `type="course"`; o JSON-LD sai num `<script type="application/ld+json">` em `DynamicSEO.tsx:111`.
- Usado em 8 telas: `Index`, `Catalog` (via CourseDetail), `CourseDetail`, `Playbooks`, `PlaybookDetail`, `VideoLibrary`, `SkillAssessments`, `SalesOnboarding`, `OnboardingRuntime`, `NotFound`.

Nada a implementar neste item.


---

#### SEO-003: Sitemap.xml ✅ CONCLUÍDO
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

**Evidência (2026-11-26):**
```text
- supabase/functions/generate-sitemap/index.ts (71 linhas) monta o XML com 9 rotas publicas fixas
  mais playbooks, cursos, trilhas e videos publicados (slug/updated_at vem do banco).
- Funcao ativa em producao: GET /functions/v1/generate-sitemap devolve HTTP 200 com urlset valido
  (conferido nesta sessao; resposta com as 9 rotas + trilhas publicadas).
- public/robots.txt ja aponta "Sitemap:" para a funcao e libera Googlebot, Bingbot, Twitterbot e
  facebookexternalhit.
- Observacao: o gateway do Supabase devolve Content-Type text/plain na resposta, embora a funcao
  declare application/xml. O Google aceita ambos; trocar o header exigiria redeploy da funcao.
```

---

#### SEO-004: Canonical URLs ✅ CONCLUÍDO
**Prioridade:** 🟢 Baixa  
**Esforço:** 1h  
**Descrição:** Não há canonical URLs.

**Implementação:**
```
1. Adicionar link rel="canonical" em DynamicSEO
2. Evitar conteúdo duplicado
3. Usar URL completa
```

**Evidência (2026-11-26):**
```text
- src/components/seo/DynamicSEO.tsx:105 emite <link rel="canonical" href={url} /> usando a URL
  absoluta; o componente tambem monta Open Graph, Twitter Card e JSON-LD.
- Paginas que passam url propria: Playbooks (/playbooks), PlaybookDetail (/playbook/:slug),
  SalesOnboarding (/onboarding) e OnboardingRuntime; a home usa BASE_URL.
- Paginas internas autenticadas (catalogo, dashboard, curso) nao sao indexaveis, entao nao
  concorrem com conteudo duplicado.
```

---

#### SEO-005: Página 404 Otimizada ✅ CONCLUÍDO
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

**Entrega (2026-11-26):**
```text
- NotFound.tsx reescrito em portugues: ilustracao, titulo "Nao encontramos esta pagina", busca inline
  que manda o termo para o catalogo (/catalogo?q=...), atalhos para inicio e dashboard e links para
  catalogo, trilhas, playbooks e biblioteca de videos.
- DynamicSEO ganhou a prop opcional noIndex; a 404 sai com meta robots "noindex, follow" (nao polui o
  indice) e continua com title/description proprios.
- Catalog passou a iniciar a busca pelo parametro q da URL, entao a busca da 404 chega filtrada de
  verdade (antes o parametro era ignorado).
- Testes: src/test/notFound.test.tsx (2 casos: conteudo/atalhos/noindex, busca levando o termo) e um
  caso novo em src/test/catalogInfiniteScroll.test.tsx provando que /catalogo?q=Curso%2025 filtra a lista.
```

---

#### SEO-006: Performance Core Web Vitals ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

Baseline medido com Lighthouse 12 (Chrome headless, mobile, throttling padrão) contra produção: **Performance 0.70**, FCP 4,3 s, **LCP 5,3 s**, CLS 0, TBT 40 ms, TTI 6,1 s. Diagnóstico apontou dois pesos mortos no primeiro carregamento.

- **recharts inteiro no bundle inicial (433 kB / 114 kB gzip).** A entrada do `manualChunks` `'chart-vendor': ['recharts']` fazia o Vite pré-carregar `chart-vendor-*.js` em todo acesso, inclusive na landing page, que não usa gráfico nenhum. Removida a entrada em `vite.config.ts`; o recharts passou a ir em chunks sob demanda (`generateCategoricalChart`, `BarChart`, `PieChart`), carregados só em rotas com gráfico.
- **Fontes render-blocking de terceiros.** `index.html` carregava Inter + Plus Jakarta Sans (que nem são as fontes usadas) e `src/index.css` importava via `@import` Space Grotesk + Outfit do Google Fonts — dois CSS externos bloqueando o render (~919 ms somados no relatório). As fontes reais viraram self-hosted, variáveis e em woff2: `public/fonts/outfit-latin.woff2` (31 kB), `outfit-latin-ext`, `space-grotesk-latin.woff2` (22 kB) e `space-grotesk-latin-ext`, declaradas em `@font-face` com `font-display: swap` e `unicode-range` (subset latin só baixa quando precisa). O `index.html` agora só faz `preload` dos dois arquivos latin; nenhuma requisição a `fonts.googleapis.com`/`fonts.gstatic.com`.
- `index.html` ganhou `preconnect`/`dns-prefetch` para `images.unsplash.com` (capas dos cursos).

Medição local sobre o build de produção (`vite preview`, mesmo Lighthouse mobile): **Performance 0.83**, FCP 3,0 s, **LCP 3,9 s**, CLS 0, TBT 30 ms; `render-blocking-resources` caiu para só o CSS da aplicação (1058 ms) e nenhuma requisição de fonte externa. `dist/index.html` não pré-carrega mais `chart-vendor`. Suíte 69 arquivos / 541 testes, `tsc -b` 0 erro, eslint limpo.
---

### 🎮 GAMIFICAÇÃO - 4 Pendentes

#### GAME-002: Desafios Semanais ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O sistema de desafios era decorativo: `user_daily_challenge_progress` estava **vazia (0 linhas)**. O `updateProgress` do hook não era chamado por nenhum componente, nenhuma função ou trigger do banco mexia no progresso e a tabela nem tinha a chave única que o próprio `upsert` do front usava em `onConflict` — os desafios apareciam sempre com 0/N e não existia desafio semanal.

- `supabase/migrations/20261126050000_desafios_semanais.sql` (nova, já aplicada em produção):
  - coluna `daily_challenges.challenge_period` (`daily`/`weekly`, default `daily`, com check);
  - índice único `(user_id, challenge_id, challenge_date)` em `user_daily_challenge_progress`, que faltava para o upsert do front;
  - `public.refresh_challenge_progress(uuid)` (SECURITY DEFINER): recalcula o progresso de cada desafio ativo a partir do histórico real do aluno (aulas concluídas, `watched_seconds`, `pomodoro_sessions`, `user_xp_history`, `user_quiz_attempts`, `user_course_progress`, `user_achievements`, `user_streaks`) e faz upsert preservando `xp_claimed`; o diário usa o bucket `current_date` e o semanal, `date_trunc('week', current_date)` (segunda-feira);
  - `public.get_my_challenges()` (SECURITY DEFINER, `auth.uid()`): recalcula e devolve desafios + progresso + prazo (`ends_at`); `execute` revogado de `public`/`anon`, liberado só para `authenticated`;
  - triggers em `user_lesson_progress`, `user_quiz_attempts` e `pomodoro_sessions` mantendo o progresso quente;
  - 4 desafios semanais novos: 10 aulas (200 XP), 1 curso (300 XP), streak de 5 dias (250 XP) e 3 quizzes (200 XP).
- `src/hooks/useDailyChallenges.ts`: o progresso passa a vir do RPC (antes o front tentava gravar e nunca conseguia); o `updateProgress` morto foi removido; separa diários e semanais; recarrega ao voltar o foco na janela.
- `src/components/gamification/DailyChallenges.tsx`: seção **Desafios Semanais** com contagem própria, XP da semana e contagem regressiva até segunda-feira; ícones para os 11 tipos de desafio (antes só 4) e selo "Semanal" no card.
- `src/integrations/supabase/types.ts` e `inventario/estado/schema-declarado.json` regenerados (63 tabelas / 53 funções).
- `src/test/dailyChallenges.test.tsx` (novo, 5 casos).

**Verificado de verdade (produção, transação com ROLLBACK):** aluno sintético com 2 aulas concluídas hoje (900s cada) + 1 sessão de pomodoro de 25 min → `get_my_challenges()` devolveu 12 desafios com progresso real: "Primeira Vitória" 1/1 concluído, "Maratonista do Dia" 2/3, "Foco Total" 1/1, "Semana de Foco" 2/10 e "Quiz Master da Semana" 0/3, com prazos corretos (diário 27/11 00:00, semanal 30/11 00:00 = segunda-feira). Antes disso a tabela de progresso tinha 0 linhas.
- `tsc -b --force` 0 erros · eslint limpo nos arquivos tocados · guard de Supabase 368 chamadas / 0 violações · suíte 67 arquivos / 531 testes verdes.

---

#### GAME-003: Sistema de Ligas ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O Ranking era único e sem divisões: não existia tabela de liga, promoção/rebaixamento nem qualquer tela mostrando a liga do aluno.

- `supabase/migrations/20261127120000_ligas_semanais.sql` (nova, já aplicada em produção): tabela `public.user_leagues` (PK `user_id`, liga `bronze/prata/ouro/platina/diamante`, `week_start`, `last_change`, `last_change_at`, timestamps), índice `(league, week_start)`, RLS habilitado (aluno lê a própria linha, admin gerencia todas) e trigger de `updated_at`.
- `refresh_leagues(p_zone default 10, p_min_jogadores default 20)` (SECURITY DEFINER, advisory lock): cria a linha de quem tem XP, fecha a semana anterior somando `user_xp_history` dentro de cada liga, promove o topo e rebaixa a base **só quando a liga tem o mínimo de jogadores**, e devolve `processados/promovidos/rebaixados/novos_participantes/por_liga`.
- `get_my_league()` (SECURITY DEFINER): liga, nível, próxima liga, XP da semana, posição, zonas, semana vigente, data da virada, ranking top 30 da liga e última mudança do aluno. `revoke all from public, anon` + `grant execute to authenticated` nas duas funções.
- `src/lib/leagues.ts` (novo): rótulos/cores das 5 ligas, `nextLeague`/`previousLeague` e `zoneOf`, que reproduz no front a mesma regra de zona aplicada no banco.
- `src/hooks/useLeague.ts` (novo): lê `get_my_league` e expõe `recalc()` para o admin disparar `refresh_leagues`.
- `src/components/leaderboard/LeaguePanel.tsx` (novo) + aba **"Minha Liga"** em `src/pages/Leaderboard.tsx`: liga atual, XP da semana com meta, zona atual, aviso da regra de mínimo de jogadores, próxima liga, ranking da liga com divisor de fim da zona de promoção e botão "Recalcular ligas agora" visível só para admin.
- `src/integrations/supabase/types.ts` com `user_leagues`, `get_my_league` e `refresh_leagues`; `src/test/leagues.test.ts` (novo, 7 casos).

Validado em produção em transação com ROLLBACK: com dois alunos na mesma liga e a semana anterior fechada, `refresh_leagues(1, 2)` devolveu `{"processados":2,"promovidos":1,"rebaixados":1,"por_liga":{"ouro":1,"bronze":1}}` — o maior XP subiu prata→ouro e o menor caiu prata→bronze; a chamada repetida devolveu `processados=0` (idempotente); `get_my_league()` rodando como `authenticated` devolveu liga, posição, XP da semana, ranking com `eu: true` e última mudança; `has_function_privilege` confirmou `authenticated=true` e `anon=false`, com `relrowsecurity=true`. Front: `tsc` 0 erros, suíte **75 arquivos / 572 testes** verdes, `vite build` ok e guards **88 pass / 0 fail**. Deploy provado no bundle servido: `assets/Leaderboard-3ULN3kRX.js` contém "Minha Liga", "Recalcular ligas agora", `get_my_league`, `refresh_leagues` e "Fim da zona de promocao".

---

#### GAME-004: Recompensas de Milestone Expandidas ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O motor de conquistas só sabia avaliar 4 tipos de requisito (`total_xp`, `current_level`, `lessons_completed`, `courses_completed`). As 4 conquistas de pomodoro do catálogo nunca desbloqueavam, porque `pomodoro_sessions` não era avaliado e `complete_pomodoro_session` não chamava o motor. Também não existia conquista secreta.

- `supabase/migrations/20261126020000_gamificacao_conquistas_expandidas.sql` (nova, já aplicada em produção): colunas `achievements.requirement_category` (usada só pelo requisito por categoria) e `achievements.is_secret` (`boolean not null default false`).
- `check_and_award_achievements(uuid)` reescrita: passa de 4 para 7 tipos de requisito, somando `pomodoro_sessions` (conta `pomodoro_sessions`), `streak_days` (maior sequência em `user_streaks.longest_streak`) e `category_courses_completed` (cursos concluídos dentro da categoria escolhida). Continua SECURITY DEFINER e idempotente: só insere o que o aluno ainda não tem.
- `complete_pomodoro_session` passou a chamar `check_and_award_achievements`: terminar um pomodoro concede a conquista na hora, sem depender de o aluno abrir a página de conquistas.
- 4 conquistas de pomodoro tinham nome de ícone lucide gravado como texto ("Timer", "Crown", "Trophy", "Flame") e o grid renderiza o campo como texto puro: o aluno via a palavra. Convertidas para emoji, com UTF-8 conferido byte a byte (`encode(convert_to(icon,'UTF8'),'hex')`).
- 7 conquistas novas (`ON CONFLICT (slug) DO NOTHING`): 10 cursos, 100 aulas, sequência de 7 dias, sequência de 30 dias (secreta, 300 XP) e uma por categoria — Vendas, Atendimento e Soft Skills. Catálogo vai a 23 conquistas.
- Admin (`src/components/admin/AdminAchievementsTab.tsx` + `src/lib/achievementAdmin.ts`): campo "Categoria do requisito" aparece apenas quando o tipo é por categoria (e passa a ser obrigatório), checkbox "Conquista secreta" e selo "Secreta" na linha da tabela; `labelForRequirement` descreve o requisito como "Cursos concluídos na categoria (Vendas) ≥ 2".
- Aluno (`src/components/AchievementsGrid.tsx`): conquista secreta não desbloqueada não aparece na grade — depois de desbloqueada entra normalmente, inclusive na visão compacta.
- `src/integrations/supabase/types.ts` e `src/hooks/useAchievements.ts`: tipos com as duas colunas novas.
- `src/test/adminAchievements.test.tsx`: 14 casos, incluindo categoria obrigatória, categoria no payload, `is_secret` no payload e o selo "Secreta" com o requisito por categoria na tabela.

Validado no banco de produção dentro de transação com rollback: 10 sessões de pomodoro sintéticas concederam `pomodoro_first`, `pomodoro_10` e `category_service`, e uma chamada real a `complete_pomodoro_session` concedeu a conquista imediatamente.

Verificação: `tsc -b --force` 0 erros, eslint 0, suíte 64 arquivos / 517 testes, `node --test scripts/ci/*.unit.mjs` 85 pass / 0 fail, guard de Supabase 0 violações, `vite build` ok.

---

#### GAME-005: Multiplier de XP ✅ CONCLUÍDO
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

**Implementação — status:**
```
[x] 1. Campo xp_multiplier em user_xp (numeric(4,2) not null default 1)
[x] 2. Double XP weekend (sexta, sábado e domingo)
[x] 3. Streak multiplier (1.5x após 7 dias, 2x após 30 dias, teto de 4x)
[ ] 4. Happy hour — NÃO IMPLEMENTADO: o servidor não conhece o timezone do usuário, a regra dispararia na hora errada para o Brasil. Basta chamar xp_multiplier_for com um terceiro parâmetro quando houver horário por usuário.
```

**O que foi entregue (migration `20261126060000_multiplicador_xp.sql`, aplicada em produção):**
- `xp_multiplier_for(p_streak, p_dow)` IMMUTABLE: regra pura, testável sem depender do relógio. Provado em produção: `(0, quinta)=1`, `(7, quinta)=1.5`, `(30, quinta)=2`, `(10, sexta)=3`, `(40, domingo)=4` (teto), `(3, sábado)=2`.
- `get_xp_multiplier(uuid)` STABLE SECURITY DEFINER: multiplicador do usuário na data corrente (sem grant para authenticated — regra interna).
- `get_my_xp_multiplier()` SECURITY DEFINER: devolve `{ multiplier, streak, streak_multiplier, weekend_multiplier, label }` para a UI, com rótulo pronto ("Sequencia de 7 dias: XP x1.5", "Fim de semana: XP em dobro").
- `add_user_xp` reescrito: concede o valor **já multiplicado** (arredondado), grava o multiplicador vigente em `user_xp.xp_multiplier` e registra o XP real em `user_xp_history`. XP negativo (estorno) passa sem multiplicação.
- `claim_daily_challenge_reward` devolve o `xp_earned` real e **corrigiu um bug de produção**: a função chamava `add_user_xp(xp, source, user_id)` com os argumentos na ordem errada (assinatura é `user_id, amount, source`), então todo resgate de desafio estourava `42883 function add_user_xp(integer, unknown, uuid) does not exist`.

**Provado em produção (transação + ROLLBACK, aluno `d543f3c1` com streak 7):**
`add_user_xp(user, 100, 'lesson')` → total 150 e histórico `{xp:150}`; resgate de "Primeira Vitória" (25 XP) → `{success:true, xp_earned:38}` (25 × 1.5 = 37,5 → 38) e histórico `{xp:38, src:'daily_challenge'}`; `user_xp.xp_multiplier = 1.5`; `get_my_xp_multiplier()` → `{multiplier:1.5, streak:7, label:"Sequencia de 7 dias: XP x1.5"}`.

**Front:**
- `src/hooks/useXpMultiplier.ts` (novo): lê o RPC, recarrega em `window focus`, `applyMultiplier(xp)` arredonda igual ao banco, cai para 1x se o RPC falhar (nunca inventa bônus).
- `DailyChallenges.tsx`: o bônus **inventado** (`min(streak*5, 50)%` calculado no cliente, que nunca era creditado) foi substituído pelo multiplicador real — o botão de coleta mostra o valor já multiplicado ("+75"), o header mostra "+N XP hoje" multiplicado e o selo "XP x2 (bônus ativo)" só aparece quando há bônus de verdade. `useStreaks` removido do componente.
- `types.ts`: `get_my_xp_multiplier` (Returns: Json) + `xp_multiplier` em Row/Insert/Update de `user_xp`.

**Testes:** `src/test/xpMultiplier.test.tsx` (3 casos: leitura do RPC, fallback 1x em erro, arredondamento 25→38) e `src/test/dailyChallenges.test.tsx` ganhou o caso do multiplicador (agora 6 casos). Suíte: 68 arquivos / 535 testes verdes. `tsc -b` 0, eslint limpo, guard 369 chamadas / 0 violações, `schema-declarado.json` regenerado (56 funções).

---

#### GAME-006: Moeda Virtual ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O aluno só acumulava XP: não existia moeda, carteira, extrato nem loja para gastar.

- `supabase/migrations/20261127140000_moeda_virtual.sql` (aplicada em produção): coluna `user_xp.coins`, tabelas `coin_transactions`, `store_items` e `user_purchases`, 6 funções (`get_my_wallet`, `apply_coin_transaction`, `award_coins_from_xp`, `award_coins_from_achievement`, `purchase_store_item`, `admin_grant_coins`), 3 triggers, RLS com leitura só do próprio aluno e 10 itens de catálogo (avatar, tema, cosmético, power-up, XP Boost 2x).
- `20261127150000_moeda_virtual_hardening.sql`, `20261127160000_moeda_virtual_nao_retroativa.sql` e `20261127170000_moeda_virtual_guarda_sobra_xp.sql` (todas aplicadas em produção): o saldo e a sobra de XP só mudam por função `SECURITY DEFINER` dona de `postgres`; a guarda recusa alteração feita por `authenticated` (saldo **e** `coins_xp_remainder`), o aluno não pode mais inserir conquista direto (`revoke insert` + remoção da policy) e a conversão XP→moeda virou incremental por resto acumulado, sem creditar XP anterior à loja.
- Front: `src/lib/store.ts`, `src/hooks/useWallet.ts`, `src/pages/Store.tsx` (loja com catálogo, coleção, extrato, estados de erro/vazio e aviso quando o preço muda entre a tela e a compra), `src/components/admin/AdminStoreTab.tsx` (CRUD do catálogo e crédito manual para o admin), rota `/loja` em `src/App.tsx`, carteira no `DashboardHeader`, loja na `CommandPalette` e no menu inferior do celular, coleção visível no perfil e chaves de i18n nos 3 idiomas.
- Validado em produção com transação + ROLLBACK atuando como aluno: editar saldo → **BLOQUEADO**; injetar moedas no insert → **BLOQUEADO**; inflar a sobra de XP → **BLOQUEADO**; criar conquista → *permission denied*; `add_user_xp`, upsert de `user_xp` sem moedas, marcar conquista como vista, `get_my_wallet`, `admin_grant_coins` e `purchase_store_item` continuam permitidos. Conversão: 25+25 XP = **5 moedas**; aluno com 345 XP antigos ganha 2 moedas em 25 XP (o método por acumulado creditaria 37). Compra real: 200 moedas − item de 150 = saldo 50, extrato somando 50 e 1 item na coleção.
- Deploy provado no bundle servido: `assets/Store-BfnzTyk0.js`, `assets/useWallet-C72igWsI.js` e `assets/Profile-DlBT1XN9.js` contêm "recompensas", `get_my_wallet`, o aviso de preço alterado e o aviso de coleção desatualizada.
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

#### GAME-010: Perfil Público com Badges ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O perfil era 100% privado: não havia rota pública, nenhum campo de visibilidade e o único acesso era a própria página `/perfil` logada.

- `supabase/migrations/20261126070000_perfil_publico.sql` (aplicada em produção): coluna `profiles.is_public boolean not null default false` e função `public.get_public_profile(p_user_id uuid)` (STABLE, SECURITY DEFINER) que devolve `{available, reason, profile, xp, streak, achievements, completed_courses, certificates_count}` — apenas para perfil ativo **e** público, sem e-mail, com conquistas secretas ocultas e só cursos em 100%. `reason` distingue `private`, `not_found` e `invalid`. Grants para `anon` e `authenticated` (link abre sem login).
- `src/hooks/usePublicProfile.ts` (novo): chama a RPC `get_public_profile` e expõe `profile`, `loading` e `error`, com guarda contra resposta fora de ordem.
- `src/pages/PublicProfile.tsx` (novo): avatar/iniciais, nome, departamento, nível, XP total, sequência, contagem de conquistas/cursos/certificados, grade de badges (gradiente + ícone) e lista de cursos concluídos. Estados de carregando (skeleton), perfil privado, perfil inexistente, link inválido e falha de rede.
- `src/App.tsx`: rota pública `/usuario/:id` registrada fora do `ProtectedRoute` (qualquer pessoa com o link abre).
- `src/pages/Profile.tsx`: card "Perfil público" com `Switch` que grava `is_public` na própria linha de `profiles` (revertendo o estado se o update falhar), indicador de salvando e botão "Copiar link" com o endereço `/usuario/<id>`.
- `src/integrations/supabase/types.ts`: `profiles.is_public` em Row/Insert/Update e `get_public_profile` (`Args: { p_user_id: string }`, `Returns: Json`).
- `src/test/publicProfile.test.tsx` (novo, 5 casos): dados públicos na tela, ausência total de e-mail (`@`), perfil privado, perfil inexistente e falha da RPC.

Validação em produção (transação + `ROLLBACK`, aluno `d543f3c1`): default `is_public = false` → `{available:false, reason:"private"}`; com `is_public = true` → `full_name`, `xp.total_xp`, `streak`, `achievements`, `completed_courses`, `certificates_count`, e `get_public_profile(...)::text` **não contém `@`**; UUID inexistente → `not_found`; `p_user_id` nulo → `invalid`; `has_function_privilege` confirma EXECUTE para `anon` e `authenticated`. Suíte 69 arquivos / 541 testes, `tsc -b` 0 erro, eslint limpo, guard de Supabase 371 chamadas / 0 violações.
---

#### GAME-011: Ranking por Categoria ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O ranking só existia global (individual) e por departamento. Não havia como ver quem é referência em cada área do catálogo, mesmo com `courses.category_id` e as 6 categorias já cadastradas.

- `supabase/migrations/20261126040000_ranking_por_categoria.sql` (nova, já aplicada em produção): RPC `public.get_category_leaderboard(p_category_id uuid default null, p_limit integer default 10)`. Métrica = cursos concluídos na categoria, desempate por aulas concluídas; devolve `rank` por categoria. SECURITY DEFINER, `stable`, `search_path` fixo, `revoke` de `public`/`anon` e `grant` só para `authenticated`.
- Administradores são removidos **antes** do rankeamento (e não depois), senão o ranking abria buraco: a conta admin aparecia como rank 1 e o primeiro aluno exibido saía como rank 2.
- `src/hooks/useCategoryLeaderboard.ts` (novo): chama o RPC e agrupa as linhas por categoria.
- `src/components/leaderboard/CategoryLeaderboard.tsx` (novo): cards por categoria com o top 3 ("Top em Vendas", "Top em Atendimento"), atalhos por categoria com a cor real de `categories.color`, lista completa ao filtrar, skeleton, mensagem de erro e estado vazio.
- `src/pages/Leaderboard.tsx`: terceira aba **Por Categoria** ao lado de Individual e Por Departamento.

**Verificado de verdade (produção, transação com ROLLBACK):** aluno sintético com 1 curso concluído e 3 aulas na categoria Tecnologia → RPC devolveu exatamente 1 curso / 3 aulas / rank 1, e a conta admin (que também tinha o curso e 9 aulas) ficou de fora.
- `tsc -b --force` 0 erros · guard de Supabase 0 violações · `src/test/categoryLeaderboard.test.tsx` (novo, 4 casos): chamada única ao RPC, agrupamento, filtro por categoria, falha do RPC e estado vazio.

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

### 🛠️ MELHORIAS ADMINISTRATIVAS - 1 Pendente

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

#### ADMIN-003: Gestão de Conquistas ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

As conquistas existiam apenas como dado semeado no banco: o admin não tinha como criar, corrigir recompensa, trocar ícone ou apagar uma conquista obsoleta. E havia um defeito silencioso no catálogo — 4 conquistas de pomodoro com ícone textual apareciam para o aluno como a palavra "Timer".

- `src/components/admin/AdminAchievementsTab.tsx` (novo): tabela com ícone, nome, slug, categoria, requisito legível, XP e quantos alunos já desbloquearam; botão "Nova conquista", edição por linha e exclusão com confirmação.
- Formulário cobre nome (slug automático, "Mestre das Vendas Ágeis!" → `mestre-das-vendas-ageis`), identificador editável, descrição, paleta de 12 ícones com `aria-pressed`, categoria, XP, tipo de requisito, valor e 11 gradientes — tudo com preview visual antes de salvar.
- `src/lib/achievementAdmin.ts` (novo): validação antes de tocar o banco (nome ≥ 3, slug `[a-z0-9-]{3,50}`, descrição ≥ 10, XP inteiro ≤ 10000, valor ≥ 1, categoria/gradiente/tipo válidos) e `buildAchievementPayload` convertendo números e aparando strings.
- Só os 4 tipos que `check_and_award_achievements(uuid)` realmente concede são aceitos (`lessons_completed`, `courses_completed`, `current_level`, `total_xp`); a tela lista quais são e avisa que outros tipos ficariam salvos sem nunca desbloquear.
- Exclusão mostra quantos alunos perdem o desbloqueio, porque `user_achievements.achievement_id` é `ON DELETE CASCADE`.
- Slug duplicado (erro `23505` do unique `achievements_slug_key`) vira "Já existe uma conquista com esse identificador", não erro genérico.
- Aba "Conquistas" registrada em `src/pages/Admin.tsx` (lazy + `Suspense`), ao lado de Quizzes.
- `src/test/adminAchievements.test.tsx` (novo, 11 casos): helpers (slug, rótulo de requisito, validações, payload) e CRUD com mock do Supabase — listagem com contagem de desbloqueios, payload do insert, erro 23505, update por id e delete só depois da confirmação.

Verificação: `tsc -b --force` 0 erros, eslint 0, suíte 64 arquivos / 514 testes, `vite build` ok, guard de Supabase 0 violações.
---

#### ADMIN-004: Bulk Actions ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

A tabela de cursos do admin só tinha ações linha a linha (editar, publicar, destacar, excluir): despublicar uma turma inteira ou mover 20 cursos de categoria exigia 20 cliques e 20 recarregamentos.

- `src/components/admin/AdminCoursesTab.tsx`: checkbox por curso (com `aria-label` "Selecionar <título>") e checkbox "Selecionar todos os cursos" no cabeçalho, que age sobre a lista filtrada (respeita busca, status, nível e categoria ativos).
- Barra de ações em massa, exibida só com seleção ativa: contagem de selecionados, Publicar, Despublicar, Destacar, Remover destaque, Select de categoria (carregado de `categories`) + Aplicar, Excluir e Limpar seleção.
- `applyBulkUpdate` faz `update(patch).in('id', selectedIds)`, aplica o mesmo patch na lista local (tela responde na hora) e limpa a seleção; erro do banco mostra toast e mantém a seleção para nova tentativa.
- Excluir em massa abre confirmação (`AlertDialog`) com a quantidade selecionada e o aviso de que aulas, quizzes e progresso vão junto; o `delete().in('id', ...)` só roda no "Excluir N".
- `src/test/adminBulkActions.test.tsx` (novo, 3 casos): selecionar todos + publicar em massa (patch e ids exatos, seleção limpa depois), exclusão apenas após confirmar no diálogo e "Limpar seleção" sem tocar no banco.


---

#### ADMIN-005: Importação de Cursos via CSV ✅ CONCLUÍDO
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

**Status:** ✅ CONCLUÍDO

**O que foi feito:**
- `src/lib/courseCsv.ts` (novo): `parseDelimited` com suporte a aspas, aspas escapadas e quebra de linha dentro do campo; `detectDelimiter` (`;`, `,`, tab); `parseCourseCsv` gera `title`, `slug` (auto a partir do título quando vazio, com remoção de acentos), `level` normalizado (`básico`→`iniciante`), `duration_minutes`, `category_id` resolvido pelo nome, `is_published`/`is_featured` em sim/nao, e acumula erros por linha (título, nível, categoria inexistente, slug repetido).
- `src/components/admin/CourseCsvImport.tsx` (novo): diálogo com seleção de arquivo, download do modelo, badges de linhas válidas/com erro, preview das 50 primeiras linhas com erro por linha, importação apenas das linhas válidas e relatório final (criados + falhas com mensagem do banco).
- `src/components/admin/AdminCoursesTab.tsx`: botão "Importar CSV" ao lado de "Novo Curso"; ao importar, `onRefresh` recarrega a lista.
- **Correção de premissa do plano:** `CSVImporter.tsx` citado no plano **não existe** no repositório (só há exportação CSV em `quiz-stats/exportUtils.ts`), então o importador foi criado do zero.

**Verificação:**
- `tsc -b --force` → exit 0; `eslint` nos 4 arquivos → exit 0.
- `supabase-usage-guard` → 372 chamadas resolvidas, 0 violações. O insert usa `supabase.from('courses').insert()` tipado.
- Suíte: **70 arquivos / 548 testes** passando, incluindo 7 novos em `src/test/courseCsvImport.test.ts` (separador, aspas, slug automático, categoria inexistente, nível inválido, título vazio, slug repetido, sim/nao, vírgula).

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

### 📱 MOBILE - 1 Pendente

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

#### MOB-004: Modo Picture-in-Picture ✅ CONCLUÍDO
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

**Entregue em 26/11/2026**

O video nao tinha picture-in-picture: nenhum lugar do codigo chamava a API.

- `src/components/player/VideoControls.tsx`: botao de PiP (icone `PictureInPicture2`) ao lado da tela cheia, com `aria-pressed` e rotulo que muda entre "Assistir em picture-in-picture" e "Sair do picture-in-picture". O botao so aparece quando o navegador suporta.
- `src/components/player/VideoPlayer.tsx`: detecta suporte (`document.pictureInPictureEnabled`) com fallback para o `webkitSetPresentationMode` do Safari, escuta `enterpictureinpicture`/`leavepictureinpicture` para refletir o estado e ganhou o atalho de teclado `p`. Falha da API (politica do navegador) nao quebra o player: o video segue inline.
- `src/test/videoPiP.test.tsx` (novo, 4 casos): botao aparece e chama `requestPictureInPicture`, estado ativo ao entrar/sair, atalho `p` e ausencia do botao quando nao ha suporte.


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

### 🔧 REFATORAÇÕES TÉCNICAS - 4 Pendentes

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

#### REF-006: Error Boundary ✅ CONCLUÍDO
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

**Evidência (2026-11-26):**
```text
- src/components/ErrorBoundary.tsx (94 linhas): captura erro de render, registra telemetria
  (trackRenderError + trackTelemetry com routeName), mostra UI amigavel com role="alert" e oferece
  "Tentar novamente" ate 3 vezes, "Recarregar pagina" e "Ir para o Dashboard".
- src/components/RouteErrorBoundary.tsx envolve cada rota e nomeia a tela do erro.
- App.tsx:114 abre <ErrorBoundary> e a linha 146 fecha, envolvendo todas as rotas dentro do
  <Suspense>; portanto nenhum erro de pagina derruba o app.
- Teste existente: src/test/routeErrorBoundary.test.tsx.
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO SUGERIDO

### 🔴 Fase 1: Críticas (Semana 1-2)
**Prioridade: Alta | Esforço Total: ~4h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| PERF-002 | Memoização de Componentes | ✅ 3h |
| A11Y-001 | Labels em Inputs | ✅ 2h |
| SEC-002 | Validação de Input Completa | ✅ 3h |
| REF-006 | Error Boundary | ✅ 2h |
| UI-011 | Modal Confirmação Saída | ✅ 2h |
| FUNC-021 | Revisão de Quiz | ✅ 3h |
| REF-001 | Componentização Header | 4h |

---

### 🟡 Fase 2: Importantes (Semana 3-4)
**Prioridade: Média | Esforço Total: ~5h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| FUNC-002 | Favoritar Cursos | ✅ 4h |
| FUNC-015 | Recomendações Personalizadas | ✅ 4h |
| FUNC-012 | Metas de Aprendizado | ✅ 4h |
| UI-015 | Avatar Upload | ✅ 4h |
| GAME-004 | Conquistas Expandidas | ✅ 4h |
| ADMIN-002 | Gestão de Usuários Avançada | ✅ 4h |
| REF-002 | Layout Wrapper | 3h |
| REF-004 | Tipos Centralizados | 2h |

---

### 🟢 Fase 3: Melhorias (Semana 5-6)
**Prioridade: Média-Baixa | Esforço Total: ~0h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| FUNC-003 | Notas nas Aulas | ✅ 6h |
| FUNC-011 | Agenda de Estudos | ✅ 6h |
| FUNC-013 | Activity Timeline | ✅ 4h |
| PERF-003 | Paginação Catálogo | ✅ 3h |
| SEO-006 | Core Web Vitals | ✅ 4h |
| A11Y-005 | Skip Links | ✅ 1h |
| A11Y-008 | Reduced Motion | ✅ 2h |
| UI-014 | Copiar Certificado | ✅ 1h |

---

### 🔵 Fase 4: Nice-to-Have (Semana 7-8)
**Prioridade: Baixa | Esforço Total: ~5h**

| ID | Melhoria | Esforço |
|----|----------|---------|
| GAME-003 | Sistema de Ligas | ✅ 6h |
| FUNC-022 | Compartilhar Conquistas | ✅ 4h |
| INT-003 | SSO Google/Microsoft | 4h |
| ADMIN-003 | Gestão de Conquistas | ✅ 4h |
| FUNC-005 | Melhorar Certificado PDF | ✅ 3h |
| UI-008 | Grid/Lista Toggle | ✅ 4h |
| REF-005 | Constants File | 1h |

---

## 📊 RESUMO FINAL

| Categoria | Pendentes | Esforço Est. |
|-----------|-----------|--------------|
| UX/UI | 2 | ~10h |
| Performance | 0 | — |
| Funcionalidades | 4 | ~30h |
| Acessibilidade | 0 | — |
| Segurança | 0 | — |
| SEO | 0 | — |
| Gamificação | 4 | ~26h |
| Administrativas | 1 | ~4h |
| Mobile | 1 | ~4h |
| Integração | 4 | ~22h |
| Refatorações | 4 | ~10h |
| **TOTAL PENDENTE** | **20** | **~106h** |

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
