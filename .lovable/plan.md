
Item 18/23 — Loading states & skeletons consistentes em todas listas/páginas.

## Mudanças

**1. `src/components/skeletons/PageSkeletons.tsx`** — auditar/expandir presets reutilizáveis:
- `CardGridSkeleton` (n cards), `ListSkeleton` (n linhas), `DetailHeroSkeleton`, `TableSkeleton`, `StatsGridSkeleton`.
- Garantir uso de `<Skeleton />` shadcn (semantic `bg-muted animate-pulse`).

**2. Aplicar skeletons em loading states que ainda mostram texto/spinner cru ou nada:**
- `src/pages/Catalog.tsx` — `CardGridSkeleton` enquanto `isLoading`.
- `src/pages/LearningPaths.tsx` — `CardGridSkeleton`.
- `src/pages/Playbooks.tsx` — `ListSkeleton`.
- `src/pages/VideoLibrary.tsx` — `CardGridSkeleton`.
- `src/pages/Leaderboard.tsx` — `TableSkeleton`.
- `src/pages/Dashboard.tsx` — `StatsGridSkeleton` no topo enquanto stats carregam.

**3. Empty states** — confirmar `EmptyState`/`SimpleEmptyState` quando lista vazia (não confundir com loading).

## Aceite
Zero regressão · loading states visualmente consistentes · sem flashes de "nenhum dado" durante carregamento · skeletons com mesmas dimensões aproximadas dos cards reais (anti-CLS).

Depois: Item 19 — Otimização de queries (select específico, paginação, índices sugeridos).
