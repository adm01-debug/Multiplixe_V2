
Item 16/23 — Acessibilidade WCAG AA completa.

## Mudanças

**1. `aria-label` em botões só com ícone** (sem texto visível):
- `src/components/NotificationBell.tsx` — botão do sino
- `src/components/ThemeToggle.tsx` — toggle de tema
- `src/components/LanguageToggle.tsx` — toggle de idioma
- `src/components/favorites/FavoriteButton.tsx` — botão de favoritar
- `src/components/pomodoro/FloatingPomodoroButton.tsx`
- `src/components/navigation/ScrollToTop.tsx`
- `src/components/player/VideoControls.tsx` — play/pause/mute/fullscreen

**2. `focus-visible` consistente:**
- Audit em `src/index.css` para garantir `:focus-visible` ring em todos elementos interativos (já presente em shadcn, validar overrides).
- Adicionar classe `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` em links/cards customizados (CourseCard, LearningPathCard).

**3. Skip links cobertura:**
- Confirmar que `<SkipLinks />` aparece em todas páginas via `App.tsx`/`Layout`. Adicionar `id="main-content"` em `<main>` das páginas que ainda não têm (Catalog, Profile, LearningPaths, Leaderboard).

**4. `aria-current="page"` em navegação ativa:**
- `src/components/navigation/MobileBottomNav.tsx` — marcar item ativo.
- Nav header (se houver).

**5. `role` e landmarks:**
- Garantir `<main>`, `<nav>`, `<header>`, `<footer>` em todas páginas com semântica HTML5 correta.

**6. Imagens decorativas:**
- Adicionar `alt=""` (vazio) em imagens puramente decorativas (HeroBackground, HeroFloatingElements) para que screen readers ignorem.

## Aceite
Zero regressão visual · todos botões só-ícone com aria-label · focus ring visível em tab · skip links funcionais · navegação ativa anunciada por screen reader · landmarks semânticos.

Depois: Item 17 — Tratamento de erros robusto (Error Boundaries por rota + retry + toast estruturado).
