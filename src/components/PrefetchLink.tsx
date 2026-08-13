import { Link, LinkProps } from 'react-router-dom';
import { useCallback, useEffect, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';
import {
  prefetchRouteChunk,
  prefetchRouteWhenIdle,
} from '@/lib/routePrefetch';

export type PrefetchStrategy = 'hover' | 'intersect' | 'both' | 'none';

interface PrefetchLinkProps extends LinkProps {
  /** @deprecated use prefetchStrategy */
  prefetch?: 'intent' | 'render' | 'none';
  prefetchStrategy?: PrefetchStrategy;
  prefetchDelay?: number;
  onPrefetchData?: () => void;
}

const dataPrefetchedPaths = new Set<string>();

const PrefetchLink = ({
  to,
  prefetch,
  prefetchStrategy,
  prefetchDelay = 100,
  onPrefetchData,
  onMouseEnter,
  onFocus,
  children,
  ...props
}: PrefetchLinkProps) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const linkRef = useRef<HTMLAnchorElement | null>(null);

  // Resolve strategy (back-compat with old `prefetch` prop)
  const strategy: PrefetchStrategy =
    prefetchStrategy ??
    (prefetch === 'none' ? 'none' : prefetch === 'render' ? 'both' : 'both');

  const path = typeof to === 'string' ? to : to.pathname || '';

  const runDataPrefetch = useCallback(() => {
    if (!onPrefetchData || dataPrefetchedPaths.has(path)) return;
    dataPrefetchedPaths.add(path);
    onPrefetchData();
  }, [onPrefetchData, path]);

  const prefetchAll = useCallback(() => {
    prefetchRouteChunk(path);
    runDataPrefetch();
  }, [path, runDataPrefetch]);

  // Intersection-based prefetch (when link enters viewport, prefetch on idle)
  useEffect(() => {
    if (strategy !== 'intersect' && strategy !== 'both') return;
    const el = linkRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            prefetchRouteWhenIdle(path);
            // Data prefetch on idle as well
            if (onPrefetchData && !dataPrefetchedPaths.has(path)) {
              const idle =
                'requestIdleCallback' in window
                  ? (window as typeof window & {
                      requestIdleCallback: (cb: () => void) => number;
                    }).requestIdleCallback
                  : (cb: () => void) => window.setTimeout(cb, 1);
              idle(runDataPrefetch);
            }
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [strategy, path, onPrefetchData, runDataPrefetch]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (strategy === 'hover' || strategy === 'both') {
        timeoutRef.current = setTimeout(prefetchAll, prefetchDelay);
      }
      onMouseEnter?.(e);
    },
    [strategy, prefetchDelay, prefetchAll, onMouseEnter]
  );

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      if (strategy === 'hover' || strategy === 'both') {
        prefetchAll();
      }
      onFocus?.(e);
    },
    [strategy, prefetchAll, onFocus]
  );

  return (
    <Link
      ref={linkRef}
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
    prefetchRouteChunk(path);
  }, []);

  const prefetchMultiple = useCallback(
    (paths: string[]) => {
      paths.forEach(prefetch);
    },
    [prefetch]
  );

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

  const prefetchLeaderboard = useCallback(() => {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      queryClient.prefetchQuery({
        queryKey: ['leaderboard', 'all'],
        queryFn: async () => {
          const { data } = await supabase.rpc('get_leaderboard', { p_limit: 50 });
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
    prefetchLeaderboard,
  };
};
