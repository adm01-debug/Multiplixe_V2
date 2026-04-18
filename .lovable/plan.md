
Item 21/23 — Bundle size & code splitting.

## Mudanças

**1. `vite.config.ts`** — refinar `manualChunks` para isolar libs pesadas em chunks separados (melhor cache):
- `react-vendor`: react, react-dom, react-router-dom
- `ui-vendor`: @radix-ui/*
- `motion-vendor`: framer-motion
- `chart-vendor`: recharts
- `query-vendor`: @tanstack/react-query
- `supabase-vendor`: @supabase/supabase-js
- `utils-vendor`: date-fns, fuse.js, canvas-confetti

**2. Lazy-load de páginas pesadas** em `src/App.tsx` — confirmar que rotas admin/dashboards já usam `React.lazy` + `Suspense` com `PageLoader`. Adicionar onde faltar:
- `Admin`, `RateLimitDashboard`, `SecurityDashboard`, `PlatformAnalytics` (sub-rotas).

**3. Imports tree-shakeable**:
- Auditar `import * as X from ...` e trocar por imports nomeados.
- `lucide-react` — confirmar imports nomeados (já são, ok).
- `date-fns` — usar `import { format } from 'date-fns'` (named, tree-shakes).

**4. Dynamic imports para libs usadas só em fluxos específicos:**
- `canvas-confetti` em `useConfetti` — `await import('canvas-confetti')` sob demanda (evita carregar no first paint).
- `html2canvas`/`jspdf` (se presentes em certificados) — dynamic import no clique de "baixar PDF".

**5. Remover imports não usados** detectados em arquivos editados recentemente.

## Aceite
Build OK · chunks vendor separados visíveis no output do Vite · first paint não carrega `canvas-confetti` · zero regressão funcional.

Depois: Item 22 — Testes (cobrir hooks críticos novos: toastHelpers, RouteErrorBoundary).
