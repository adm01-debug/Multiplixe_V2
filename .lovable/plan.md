
Item 17/23 — Tratamento de erros robusto.

## Mudanças

**1. `src/components/ErrorBoundary.tsx`** — melhorar:
- Aceitar prop `routeName?: string` para contexto no telemetry.
- Adicionar contador de retries (max 3) e botão "Recarregar página" como fallback final.
- Logar `componentStack` + `routeName` no `trackRenderError`.

**2. `src/components/RouteErrorBoundary.tsx`** (novo) — wrapper especializado por rota:
- Usa `ErrorBoundary` com fallback contextualizado (mostra nome da rota).
- Reset automático ao mudar de rota (via `useLocation` key).

**3. `src/App.tsx`** — envolver cada `<Route element={...}>` lazy com `<RouteErrorBoundary routeName="...">` para isolar falhas de rota (uma rota com erro não derruba a app inteira).

**4. `src/lib/toastHelpers.ts`** (novo) — helpers estruturados:
- `toastError(title, description?, action?)` — toast vermelho com ícone e ação opcional "Tentar novamente".
- `toastSuccess`, `toastInfo`, `toastWarning` — variantes consistentes.
- Padroniza uso de `sonner` em toda a aplicação.

**5. Cobertura mínima** — substituir 3-5 chamadas avulsas de `toast.error(...)` em hooks críticos (`useAuth`, `useFavorites`, `useNotifications`) pelo helper para validar a API.

## Aceite
Build OK · falha em uma rota lazy não derruba app · toasts de erro consistentes · retry funcional no boundary · zero regressão visual.

Depois: Item 18 — Loading states & skeletons consistentes em todas listas/páginas.
