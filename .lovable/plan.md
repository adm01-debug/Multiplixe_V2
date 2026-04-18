
Ciclo E1→E5 concluído. Para manter a evolução rumo ao 10/10 absoluto, proponho novo ciclo **P1→P5 (Polimento Final)** focado em qualidade percebida, performance e robustez.

## P1 — Skeleton states unificados no Dashboard
Substituir spinners genéricos por skeletons dedicados (widgets de Continue, Stats, Recommendations) usando `PageSkeletons`. Reduz CLS e percepção de lentidão.

## P2 — Toast helpers centralizados com ações
Estender `toastHelpers.ts` para suportar `action` button (ex: "Desfazer" em favoritar, "Ver" em conquista). Aplicar em `useFavorites`, `useAchievements`, `ShareAchievement`.

## P3 — Prefetch inteligente de rotas no hover
Ativar `PrefetchLink` nos cards de curso (`CourseCard`, `ContinueLearningWidget`) e itens de trilha. Latência percebida ~0ms na navegação.

## P4 — Empty states ilustrados
Trocar `EmptyState` genérico por variantes contextuais (sem favoritos, sem progresso, sem notas) com ilustrações SVG inline e CTA claro.

## P5 — Lighthouse pass
Auditoria final: lazy-load de imagens em `CourseCard`/`LearningPathCard`, `loading="lazy"` em iframes, `fetchpriority="high"` em hero, garantir `width`/`height` em todas imagens. Meta: 95+ em todas categorias.

Executarei P1 primeiro. Após aprovação, sigo P2→P5 sem interrupções.
