
Item 14/23 — Otimização de imagens (LazyImage + decoding async + dimensões para evitar CLS).

## Mudanças

**1. `src/components/LazyImage.tsx`** — adicionar suporte a `width`/`height` e `fetchpriority` para reservar espaço (anti-CLS) e permitir LCP priority em hero.

**2. Substituir `<img>` por `LazyImage` (com width/height) nos cards de listagem:**
- `src/components/catalog/CourseCard.tsx` — thumbnail do curso
- `src/components/catalog/CourseListItem.tsx` — thumbnail
- `src/components/learning-paths/LearningPathCard.tsx` — cover image
- `src/components/CertificateCard.tsx` — preview/thumb

**3. Adicionar `decoding="async"` + `loading="lazy"` + `width`/`height` em `<img>` remanescentes:**
- `src/components/profile/ProfileHeader.tsx` (avatar usa Avatar do shadcn — verificar)
- `src/components/landing/hero/HeroCard.tsx`
- `src/components/landing/FeaturedCoursesPreview.tsx`
- `src/components/dashboard/ContinueLearningWidget.tsx`

**4. Hero LCP image:** marcar imagem do hero da landing com `fetchpriority="high"` e `loading="eager"` (não lazy) para acelerar LCP.

## Aceite
Zero regressão visual · CLS reduzido (dimensões reservadas) · LCP melhor no hero · imagens fora da viewport carregam apenas quando próximas.

Depois: Item 15 — Prefetch inteligente de rotas (intersect + idle) já parcialmente em `PrefetchLink`; expandir cobertura.
