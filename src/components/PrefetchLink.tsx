import { Link, LinkProps } from 'react-router-dom';
import { useCallback, useRef } from 'react';

// Map of routes to their lazy-loaded components for prefetching
const routeModules: Record<string, () => Promise<unknown>> = {
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
  // Dynamic routes
  '/curso': () => import('@/pages/CourseDetail'),
  '/trilha': () => import('@/pages/LearningPathDetail'),
  '/aula': () => import('@/pages/LessonPlayer'),
};

// Cache for prefetched modules
const prefetchedRoutes = new Set<string>();

interface PrefetchLinkProps extends LinkProps {
  prefetch?: 'intent' | 'render' | 'none';
  prefetchDelay?: number;
}

const PrefetchLink = ({ 
  to, 
  prefetch = 'intent', 
  prefetchDelay = 100,
  onMouseEnter,
  onFocus,
  children,
  ...props 
}: PrefetchLinkProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const prefetchRoute = useCallback(() => {
    const path = typeof to === 'string' ? to : to.pathname || '';
    
    // Check if it's a dynamic route (contains :)
    const basePath = path.split('/').slice(0, 2).join('/');
    const routeToPreload = routeModules[path] || routeModules[basePath];
    
    if (routeToPreload && !prefetchedRoutes.has(path)) {
      prefetchedRoutes.add(path);
      routeToPreload().catch(() => {
        // Remove from cache if prefetch fails so it can be retried
        prefetchedRoutes.delete(path);
      });
    }
  }, [to]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetch === 'intent') {
      timeoutRef.current = setTimeout(prefetchRoute, prefetchDelay);
    }
    onMouseEnter?.(e);
  }, [prefetch, prefetchDelay, prefetchRoute, onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLAnchorElement>) => {
    if (prefetch === 'intent') {
      prefetchRoute();
    }
    onFocus?.(e);
  }, [prefetch, prefetchRoute, onFocus]);

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;

// Hook for programmatic prefetching
export const usePrefetch = () => {
  const prefetch = useCallback((path: string) => {
    const basePath = path.split('/').slice(0, 2).join('/');
    const routeToPreload = routeModules[path] || routeModules[basePath];
    
    if (routeToPreload && !prefetchedRoutes.has(path)) {
      prefetchedRoutes.add(path);
      routeToPreload().catch(() => {
        prefetchedRoutes.delete(path);
      });
    }
  }, []);

  const prefetchMultiple = useCallback((paths: string[]) => {
    paths.forEach(prefetch);
  }, [prefetch]);

  return { prefetch, prefetchMultiple };
};
