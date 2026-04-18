
P3 — Prefetch inteligente de rotas no hover.

## Mudanças

**1. `src/components/catalog/CourseCard.tsx`** — verificar se já usa `PrefetchLink`. Se ainda usa `Link` do react-router, trocar por `PrefetchLink` com `onPrefetchData={() => prefetchCourseDetail(slug)}` via `usePrefetchQuery`.

**2. `src/components/learning-paths/LearningPathCard.tsx`** — mesmo tratamento, prefetch de `/trilha/:slug` via `routePrefetch.ts`. Adicionar entrada de prefetch de dados se houver query dedicada (`useLearningPathDetail`).

**3. `src/components/dashboard/SmartRecommendations.tsx`** — cards de recomendação devem usar `PrefetchLink` para warm-up do chunk de CourseDetail.

**4. `src/components/recommendations/RecommendationsWidget.tsx`** — idem.

**5. `src/lib/routePrefetch.ts`** — já cobre `/curso` e `/trilha`. Sem alteração necessária.

**6. Validação** — confirmar que `PrefetchLink` aceita `onPrefetchData` opcional e não quebra quando ausente. Cards sem slug específico apenas warm-up do chunk.

## Aceite
Hover em qualquer card de curso/trilha pré-carrega chunk + dados · navegação subsequente instantânea · zero regressão visual · sem novas dependências.

Depois: P4 — Empty states ilustrados.
