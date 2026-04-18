
E2/E5 — Modo "Foco" no LessonPlayer.

## Mudanças

**1. `useUserPreferences.ts`** — adicionar `focusMode: boolean` (default false) ao tipo e DEFAULT_PREFERENCES.

**2. `LessonPlayer.tsx`** — quando `focusMode` ativo:
- Esconder `LessonPlayerSidebar` e header secundário (manter apenas botão sair).
- Centralizar player com max-width maior.
- Iniciar Pomodoro automaticamente (via `usePomodoro.startWork()`) ao ativar.
- Adicionar classe `focus-mode-active` no `<html>` para silenciar `NotificationBell`/toasts não-críticos via CSS.

**3. `src/components/player/LessonPlayerHeader.tsx`** — botão toggle (ícone `Maximize2`/`Minimize2`) com `aria-pressed`, tooltip "Modo Foco (F)".

**4. `useVideoShortcuts.ts`** (ou criar handler local) — atalho `F` toggla focus mode.

**5. `src/index.css`** — `.focus-mode-active` esconde toasts não-críticos (`[data-sonner-toaster] [data-type="info"]`) e `NotificationBell` via `[data-focus-hide]`. Marcar `NotificationBell` com esse atributo.

**6. Persistência** — preferência salva em localStorage via `updatePreference('focusMode', value)`; restaura ao reabrir player.

## Aceite
Toggle visível no header do player · F atalho funciona · sidebar/header somem · Pomodoro inicia automático · notificações silenciadas · preferência persiste · zero regressão fora do player.

Depois: E3 — Continue inteligente.
