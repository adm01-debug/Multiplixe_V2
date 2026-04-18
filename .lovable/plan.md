
Item 22/23 — Testes para hooks/componentes críticos novos.

## Mudanças

**1. `src/test/toastHelpers.test.ts`** (novo) — cobrir `src/lib/toastHelpers.ts`:
- `toastSuccess`, `toastError`, `toastInfo`, `toastWarning` chamam `sonner` com variant correto.
- Mock de `sonner` (`vi.mock('sonner', ...)`) e assertions sobre `toast.success/error/info/warning` chamados com a mensagem.

**2. `src/test/routeErrorBoundary.test.tsx`** (novo) — cobrir `RouteErrorBoundary`:
- Renderiza children quando não há erro.
- Captura erro de filho e renderiza fallback com `routeName`.
- Botão "Tentar novamente" reseta o boundary (state).
- Após 3 retries, exibe botão "Recarregar página".

**3. `src/test/useConfetti.test.ts`** (novo) — garantir que `loadConfetti` usa dynamic import:
- Mock `canvas-confetti` via `vi.mock` retornando função spy.
- Chamar `fireLessonComplete()` e validar que confetti foi invocado com `particleCount: 80`.
- Validar que `fireXP`, `fireAchievement` invocam confetti.

**4. Garantir que rodam** — os testes seguem padrão dos arquivos existentes em `src/test/` (vitest + @testing-library/react quando necessário). Sem alterar `vitest.config.ts`.

## Aceite
3 novos arquivos de teste · todos passam · cobertura adicional sobre toastHelpers, RouteErrorBoundary e useConfetti · zero alterações em código de produção.

Depois: Item 23 — Polimento final (audit a11y, console limpo, lint zero warning, README atualizado).
