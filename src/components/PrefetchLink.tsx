import { Link, LinkProps } from 'react-router-dom';
import { useCallback, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';

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
  onPrefetchData?: () => void;
}

const PrefetchLink = ({ 
  to, 
  prefetch = 'intent', 
  prefetchDelay = 100,
  onPrefetchData,
  onMouseEnter,
  onFocus,
  children,
  ...props 
}: PrefetchLinkProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const dataPrefetchedRef = useRef(false);
  
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

    // Prefetch data if callback provided and not already prefetched
    if (onPrefetchData && !dataPrefetchedRef.current) {
      dataPrefetchedRef.current = true;
      onPrefetchData();
    }
  }, [to, onPrefetchData]);

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

// Hook for prefetching query data
export const usePrefetchQuery = () => {
  const prefetchCourseDetail = useCallback((slug: string) => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      queryClient.prefetchQuery({
        queryKey: ['course', slug],
        queryFn: async () => {
          const { data } = await supabase
            .from('courses')
            .select('*, categories (*)')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });

      // Also prefetch lessons
      queryClient.prefetchQuery({
        queryKey: ['course-lessons', slug],
        queryFn: async () => {
          const { data: course } = await supabase
            .from('courses')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
          
          if (!course) return [];
          
          const { data } = await supabase
            .from('lessons')
            .select('id, title, description, duration_seconds, order_index, is_free')
            .eq('course_id', course.id)
            .order('order_index');
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, []);

  const prefetchLearningPathDetail = useCallback((slug: string) => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      queryClient.prefetchQuery({
        queryKey: ['learning-path', slug],
        queryFn: async () => {
          const { data } = await supabase
            .from('learning_paths')
            .select('*')
            .eq('slug', slug)
            .eq('is_published', true)
            .maybeSingle();
          return data;
        },
        staleTime: 5 * 60 * 1000,
      });

      // Also prefetch courses in the path
      queryClient.prefetchQuery({
        queryKey: ['learning-path-courses', slug],
        queryFn: async () => {
          const { data: path } = await supabase
            .from('learning_paths')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();
          
          if (!path) return [];

          const { data } = await supabase
            .from('learning_path_courses')
            .select(`
              *,
              course:courses (
                id, title, slug, description, thumbnail_url, 
                duration_minutes, level, total_lessons
              )
            `)
            .eq('learning_path_id', path.id)
            .order('order_index');
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, []);

  // Prefetch catalog data (courses and categories)
  const prefetchCatalog = useCallback(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      queryClient.prefetchQuery({
        queryKey: ['courses'],
        queryFn: async () => {
          const { data } = await supabase
            .from('courses')
            .select('*, categories (*)')
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: ['categories'],
        queryFn: async () => {
          const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name');
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, []);

  // Prefetch learning paths list
  const prefetchLearningPaths = useCallback(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      queryClient.prefetchQuery({
        queryKey: ['learning-paths'],
        queryFn: async () => {
          const { data } = await supabase
            .from('learning_paths')
            .select(`
              *,
              learning_path_courses (
                id, course_id, order_index
              )
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, []);

  // Prefetch leaderboard data
  const prefetchLeaderboard = useCallback(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      queryClient.prefetchQuery({
        queryKey: ['leaderboard', 'all'],
        queryFn: async () => {
          const { data } = await supabase
            .rpc('get_leaderboard', { p_limit: 50 });
          return data || [];
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, []);

  return { 
    prefetchCourseDetail, 
    prefetchLearningPathDetail,
    prefetchCatalog,
    prefetchLearningPaths,
    prefetchLeaderboard
  };
};
