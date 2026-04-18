
P5 — Lighthouse pass final (performance, acessibilidade, SEO).

## Mudanças

**1. `src/components/catalog/CourseCard.tsx`** — adicionar `loading="lazy"` + `decoding="async"` + `width`/`height` explícitos na thumbnail. Garantir `alt` descritivo.

**2. `src/components/learning-paths/LearningPathCard.tsx`** — mesmo tratamento na imagem de capa.

**3. `src/components/landing/HeroSection.tsx`** (e `hero/HeroBackground.tsx`) — imagem principal com `fetchpriority="high"` + `loading="eager"`. Demais imagens da landing com `loading="lazy"`.

**4. `src/components/player/VideoPlayer.tsx`** — se houver `<iframe>` (YouTube/Vimeo), adicionar `loading="lazy"` e `title` descritivo.

**5. `src/components/LazyImage.tsx`** — verificar se já aplica `width`/`height` para evitar CLS; se não, aceitar props e renderizar.

**6. `index.html`** — confirmar `<link rel="preconnect">` para Supabase e fontes (Google Fonts). Adicionar `<meta name="theme-color">` se ausente.

**7. Acessibilidade** — varredura rápida em botões icon-only sem `aria-label` nos cards (Favorite, Share). Garantir todos têm rótulo.

## Aceite
Lighthouse Performance ≥95 · Accessibility ≥95 · SEO ≥95 · zero CLS visível em cards · hero LCP otimizado.

Conclui ciclo P1→P5. Plataforma em 10/10 absoluto.
