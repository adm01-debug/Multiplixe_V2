
Item 12/23 — Lazy load + code splitting agressivo.

## Mudanças

**1. `src/App.tsx`** — converter overlays globais raramente críticos para lazy:
- `CommandPalette`, `KeyboardShortcutsModal`, `PWAInstallPrompt`, `NotificationPermissionBanner` → `lazy()` envolvidos em `<Suspense fallback={null}>`

**2. `vite.config.ts`** — adicionar manualChunks adicionais:
- `vendor-icons`: `lucide-react`
- `vendor-confetti`: `canvas-confetti`
- `vendor-fuse`: `fuse.js`
- `vendor-helmet`: `react-helmet-async`

**3. `src/pages/Dashboard.tsx`** — lazy load widgets pesados (recharts/framer):
- `XPEvolutionChart`, `SmartRecommendations`, `WeeklyGoalTracker`, `DailyChallenges` com Suspense + Skeleton

**4. `src/pages/Profile.tsx`** — lazy load:
- `XPEvolutionChart`, `AchievementsGrid`, `SkillRadarChart`

## Aceite
Build OK · bundle inicial reduzido · zero regressão visual · Suspense fallbacks invisíveis para overlays.

Depois: Item 13 (Memoização agressiva: React.memo + useMemo em listas grandes).
