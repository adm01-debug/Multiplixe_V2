
Item 20/23 — Memoização e re-render hygiene.

## Mudanças

**1. `React.memo` em componentes de lista pesados** (renderizados N vezes em grids):
- `src/components/catalog/CourseCard.tsx`
- `src/components/catalog/CourseListItem.tsx`
- `src/components/learning-paths/LearningPathCard.tsx`
- `src/components/learning-paths/LearningPathCourseItem.tsx`

Envolver export com `memo(...)` para evitar re-render quando props não mudam.

**2. `useCallback` em handlers passados a filhos memoizados**:
- `src/pages/Catalog.tsx` — handlers de filtro/busca/toggle view passados para `CategoryFilter`, `LevelFilter`, `ViewToggle`, `SearchInput`.
- `src/pages/LearningPaths.tsx` — handlers passados aos cards.

**3. `useMemo` em listas derivadas (filter/sort/group)**:
- `src/pages/Catalog.tsx` — confirmar que `filteredCourses` está em `useMemo` com deps corretas (cursos, query, categoria, nível).
- `src/pages/Leaderboard.tsx` — ranking ordenado.
- `src/components/dashboard/DashboardStatsGrid.tsx` — cards derivados de stats.

**4. Estabilizar referências de objetos/arrays passadas como props**:
- Substituir literais inline (`style={{...}}`, `options={[...]}`) por constantes/`useMemo` em componentes que renderizam muito.

**5. Não memoizar onde não há ganho** — evitar `useCallback`/`useMemo` em handlers de página única ou cálculos triviais (custo > benefício).

## Aceite
Build OK · zero regressão visual/funcional · grids grandes (100+ cards) sem re-render desnecessário ao digitar busca · React DevTools Profiler mostra menos commits em filhos de lista.

Depois: Item 21 — Bundle size & code splitting (analisar imports, tree-shaking, dynamic imports onde compensa).
