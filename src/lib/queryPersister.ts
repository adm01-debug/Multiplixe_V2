import { QueryClient } from "@tanstack/react-query";

const CACHE_KEY = "multiplixe-query-cache";
const CACHE_VERSION = 1;
const MAX_AGE_MS = 1000 * 60 * 60 * 24; // 24 horas

interface PersistedCache {
  version: number;
  timestamp: number;
  clientState: unknown;
}

// Query keys que devem ser persistidas (dados estáticos ou semi-estáticos)
const PERSISTABLE_KEYS = [
  "courses",
  "categories",
  "learning-paths",
  "achievements",
];

// Verifica se uma query key deve ser persistida
const shouldPersistQuery = (queryKey: readonly unknown[]): boolean => {
  const firstKey = queryKey[0];
  if (typeof firstKey !== "string") return false;
  return PERSISTABLE_KEYS.some((key) => firstKey.startsWith(key));
};

// Salva o cache no localStorage
export const persistQueryCache = (queryClient: QueryClient): void => {
  try {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    // Filtra apenas queries que devem ser persistidas e têm dados
    const persistableQueries = queries
      .filter((query) => {
        const hasData = query.state.data !== undefined;
        const shouldPersist = shouldPersistQuery(query.queryKey);
        const isSuccess = query.state.status === "success";
        return hasData && shouldPersist && isSuccess;
      })
      .map((query) => ({
        queryKey: query.queryKey,
        state: {
          data: query.state.data,
          dataUpdatedAt: query.state.dataUpdatedAt,
        },
      }));

    const cacheData: PersistedCache = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      clientState: persistableQueries,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to persist query cache:", error);
  }
};

// Restaura o cache do localStorage
export const restoreQueryCache = (queryClient: QueryClient): void => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return;

    const cacheData: PersistedCache = JSON.parse(cached);

    // Verifica versão e idade do cache
    if (cacheData.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }

    const age = Date.now() - cacheData.timestamp;
    if (age > MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY);
      return;
    }

    // Restaura as queries
    const queries = cacheData.clientState as Array<{
      queryKey: readonly unknown[];
      state: { data: unknown; dataUpdatedAt: number };
    }>;

    queries.forEach(({ queryKey, state }) => {
      queryClient.setQueryData(queryKey, state.data, {
        updatedAt: state.dataUpdatedAt,
      });
    });

    console.log(`[Cache] Restored ${queries.length} queries from localStorage`);
  } catch (error) {
    console.warn("Failed to restore query cache:", error);
    localStorage.removeItem(CACHE_KEY);
  }
};

// Limpa o cache persistido
export const clearPersistedCache = (): void => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn("Failed to clear persisted cache:", error);
  }
};

// Setup de persistência automática
export const setupCachePersistence = (queryClient: QueryClient): (() => void) => {
  // Restaura cache na inicialização
  restoreQueryCache(queryClient);

  // Debounce para evitar escritas excessivas
  let persistTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedPersist = () => {
    if (persistTimeout) clearTimeout(persistTimeout);
    persistTimeout = setTimeout(() => {
      persistQueryCache(queryClient);
    }, 1000);
  };

  // Subscreve a mudanças no cache
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === "updated" && event.action.type === "success") {
      debouncedPersist();
    }
  });

  // Persiste ao sair da página
  const handleBeforeUnload = () => {
    if (persistTimeout) clearTimeout(persistTimeout);
    persistQueryCache(queryClient);
  };
  window.addEventListener("beforeunload", handleBeforeUnload);

  // Persiste quando a aba perde foco
  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      debouncedPersist();
    }
  };
  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Cleanup function
  return () => {
    unsubscribe();
    window.removeEventListener("beforeunload", handleBeforeUnload);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (persistTimeout) clearTimeout(persistTimeout);
  };
};
