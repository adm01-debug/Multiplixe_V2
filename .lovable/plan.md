
P4 — Empty states ilustrados contextuais.

## Mudanças

**1. `src/components/EmptyState.tsx`** — já possui 12 variantes ilustradas (courses, progress, achievements, notifications, certificates, search, discussions, leaderboard, streaks, challenges, learning-paths, analytics). Adicionar 3 novas variantes:
- `favorites` — ilustração de coração, CTA "Explorar cursos".
- `notes` — ilustração de caderno, CTA "Começar a estudar".
- `goals` — ilustração de alvo/bandeira, CTA "Definir meta".

**2. Aplicar em telas reais**:
- `src/components/favorites/*` ou onde lista favoritos vazia → usar `<EmptyState type="favorites" />`.
- `src/components/notes/NotesPanel.tsx` → quando `notes.length === 0` substituir mensagem genérica.
- `src/components/goals/GoalsWidget.tsx` → idem para metas vazias.
- `src/pages/Catalog.tsx` → garantir uso de `type="search"` quando filtro retorna vazio (verificar se já usa).
- `src/pages/LearningPaths.tsx` → `type="learning-paths"` quando lista vazia.

**3. Acessibilidade** — `role="status"` + `aria-live="polite"` no container do empty state para anunciar estado.

## Aceite
3 novas variantes ilustradas · empty states aplicados em favoritos/notas/metas · zero regressão visual · acessível.

Depois: P5 — Lighthouse pass final.
