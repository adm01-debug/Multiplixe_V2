
Item 15/23 — Prefetch inteligente de rotas (intersection + idle).

## Mudanças

**1. `src/components/PrefetchLink.tsx`** — adicionar:
- Modo `intersect`: prefetch automático quando o link entra no viewport (IntersectionObserver com `rootMargin: '200px'`).
- Modo `idle`: usar `requestIdleCallback` para diferir o prefetch e não competir com renderização crítica.
- Prop `prefetchStrategy?: 'hover' | 'intersect' | 'both'` (default `'both'`).
- Cache local (`Set`) de rotas já prefetched para evitar chamadas duplicadas no mesmo session.

**2. Cobertura — aplicar `prefetchStrategy="both"` (ou usar default) nos cards de listagem de alto valor:**
- `src/components/catalog/CourseCard.tsx`
- `src/components/catalog/CourseListItem.tsx`
- `src/components/learning-paths/LearningPathCard.tsx`
- `src/components/dashboard/ContinueLearningWidget.tsx` (links para curso)
- `src/components/landing/FeaturedCoursesPreview.tsx` (converter `<Link>` para `PrefetchLink` se aplicável)

**3. Bundle prefetch (rotas)** — em `PrefetchLink`, quando `to` aponta para rota lazy conhecida, disparar `import()` da chunk via mapa de rotas declarado em `src/lib/routePrefetch.ts` (novo arquivo). Ex: `/curso/:slug` → `() => import('@/pages/CourseDetail')`.

## Aceite
Zero regressão · navegação sub-instantânea em cards visíveis · sem requests desnecessárias (cache de rotas prefetched) · sem competir com main thread (idle callback).

Depois: Item 16 — Acessibilidade WCAG AA completa (aria-labels, focus-visible, skip-to-content cobertura).
