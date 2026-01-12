import { useMemo, useCallback, useRef, useEffect } from "react";

/**
 * Custom hook to create a memoized selector for filtered/sorted data
 * Prevents unnecessary recalculations when dependencies haven't changed
 */
export const useMemoizedSelector = <T, R>(
  data: T[],
  selector: (items: T[]) => R,
  deps: React.DependencyList
): R => {
  return useMemo(() => selector(data), [data, ...deps]);
};

/**
 * Debounce a callback function
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );
};

/**
 * Throttle a callback function
 */
export const useThrottledCallback = <T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  const inThrottleRef = useRef(false);
  const lastArgsRef = useRef<Parameters<T> | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        callback(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
          if (lastArgsRef.current) {
            callback(...lastArgsRef.current);
            lastArgsRef.current = null;
          }
        }, limit);
      } else {
        lastArgsRef.current = args;
      }
    },
    [callback, limit]
  );
};

/**
 * Memoize expensive computations with stable references
 */
export const useStableMemo = <T>(factory: () => T, deps: React.DependencyList): T => {
  const ref = useRef<{ value: T; deps: React.DependencyList } | null>(null);

  const depsChanged = !ref.current || deps.some((dep, i) => dep !== ref.current!.deps[i]);

  if (depsChanged) {
    ref.current = {
      value: factory(),
      deps,
    };
  }

  return ref.current!.value;
};

/**
 * Create a stable callback that doesn't change between renders
 */
export const useStableCallback = <T extends (...args: any[]) => any>(callback: T): T => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    ((...args) => callbackRef.current(...args)) as T,
    []
  );
};
