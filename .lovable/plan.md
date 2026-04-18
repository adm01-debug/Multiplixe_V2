
Item 13/23 — Memoização agressiva em listas e cards.

## Alvos

Componentes renderizados em listas grandes (catálogo, trilhas, leaderboard, achievements, lessons) que re-renderizam sem necessidade quando o pai atualiza estado.

## Mudanças

**1. `React.memo` nos cards de listagem:**
- `src/components/catalog/CourseCard.tsx`
- `src/components/catalog/CourseListItem.tsx`
- `src/components/learning-paths/LearningPathCard.tsx`
- `src/components/learning-paths/LearningPathCourseItem.tsx`
- `src/components/gamification/AchievementBadge.tsx`
- `src/components/CertificateCard.tsx`
- `src/components/player/LessonList.tsx` (item interno)

Envolver `export default` com `memo(...)` e adicionar `displayName`.

**2. `useMemo` em arrays derivados pesados:**
- `src/pages/Catalog.tsx` — array filtrado/ordenado de cursos
- `src/pages/LearningPaths.tsx` — array de paths filtrado
- `src/pages/Leaderboard.tsx` — ranking ordenado
- `src/components/AchievementsGrid.tsx` — grupos por categoria

**3. `useCallback` em handlers passados como props para itens memoizados:**
- handlers de favoritar, navegar, selecionar nas páginas acima.

## Aceite
Zero regressão visual · re-renders reduzidos em listas · build OK · sem mudanças de comportamento.

Depois: Item 14 — Otimização de imagens (LazyImage + decoding="async" + width/height para evitar CLS).
