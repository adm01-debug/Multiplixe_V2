// Map of routes/base segments to their lazy-loaded page modules.
// Used by PrefetchLink to warm route chunks via dynamic import().
export const routeModules: Record<string, () => Promise<unknown>> = {
  '/': () => import('@/pages/Index'),
  '/auth': () => import('@/pages/Auth'),
  '/forgot-password': () => import('@/pages/ForgotPassword'),
  '/reset-password': () => import('@/pages/ResetPassword'),
  '/dashboard': () => import('@/pages/Dashboard'),
  '/catalogo': () => import('@/pages/Catalog'),
  '/perfil': () => import('@/pages/Profile'),
  '/ranking': () => import('@/pages/Leaderboard'),
  '/trilhas': () => import('@/pages/LearningPaths'),
  '/admin': () => import('@/pages/Admin'),
  '/admin/security': () => import('@/pages/RateLimitDashboard'),
  '/seguranca': () => import('@/pages/SecurityDashboard'),
  '/verificar-certificado': () => import('@/pages/VerifyCertificate'),
  // Dynamic routes (matched by base segment)
  '/curso': () => import('@/pages/CourseDetail'),
  '/trilha': () => import('@/pages/LearningPathDetail'),
    // Nested route whose chunk is not the one of its base segment (/curso)
    '/curso/:slug/aula/:lessonId': () => import('@/pages/LessonPlayer'),
};

// Session-level cache of routes already prefetched
const prefetchedRoutes = new Set<string>();

// Matches a concrete path against the routeModules keys, treating ":param" as a wildcard
function matchRoutePattern(segments: string[]): (() => Promise<unknown>) | undefined {
  for (const [route, loader] of Object.entries(routeModules)) {
    const pattern = route.split('/').filter(Boolean);
    if (pattern.length !== segments.length) continue;
    if (pattern.every((seg, i) => seg.startsWith(':') || seg === segments[i])) return loader;
  }
  return undefined;
}

export function prefetchRouteChunk(path: string): void {
  if (prefetchedRoutes.has(path)) return;

  const segments = path.split('/').filter(Boolean);
  const basePath = '/' + (segments[0] ?? '');
  // Exact path first, then the most specific pattern, then the base segment
  const loader =
    routeModules[path] || matchRoutePattern(segments) || routeModules[basePath];
  if (!loader) return;

  prefetchedRoutes.add(path);
  loader().catch(() => {
    // Allow retry if it failed
    prefetchedRoutes.delete(path);
  });
}

// requestIdleCallback fallback for browsers that lack it (Safari)
type IdleCb = (cb: () => void, opts?: { timeout?: number }) => number;
const ric: IdleCb =
  typeof window !== 'undefined' && 'requestIdleCallback' in window
    ? (window.requestIdleCallback as IdleCb)
    : (cb) => window.setTimeout(cb, 1) as unknown as number;

export function prefetchRouteWhenIdle(path: string): void {
  ric(() => prefetchRouteChunk(path), { timeout: 2000 });
}
