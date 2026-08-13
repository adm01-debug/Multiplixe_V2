import { useMemo } from "react";
import Fuse, { IFuseOptions, FuseResult, FuseResultMatch } from "fuse.js";

export interface FuzzySearchResult<T> {
  item: T;
  matches?: readonly FuseResultMatch[];
  score?: number;
  refIndex: number;
}

/**
 * Hook para busca fuzzy usando Fuse.js
 * @param items - Array de itens para buscar
 * @param keys - Chaves dos objetos para buscar (ex: ['title', 'description'])
 * @param query - Termo de busca
 * @param options - Opções adicionais do Fuse.js
 * @returns Array de itens filtrados
 */
export function useFuzzySearch<T>(
  items: T[],
  keys: string[],
  query: string,
  options?: Partial<IFuseOptions<T>>
): T[] {
  const fuse = useMemo(() => {
    const fuseOptions: IFuseOptions<T> = {
      keys,
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      findAllMatches: true,
      useExtendedSearch: true,
      ...options,
    };

    return new Fuse(items, fuseOptions);
  }, [items, keys, options]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const searchResults: FuseResult<T>[] = fuse.search(query);
    return searchResults.map((result) => result.item);
  }, [fuse, query, items]);

  return results;
}

/**
 * Hook para busca fuzzy COM matches para highlighting
 * @param items - Array de itens para buscar
 * @param keys - Chaves dos objetos para buscar
 * @param query - Termo de busca
 * @param options - Opções adicionais do Fuse.js
 * @returns Array de resultados com matches para highlighting
 */
export function useFuzzySearchWithMatches<T>(
  items: T[],
  keys: string[],
  query: string,
  options?: Partial<IFuseOptions<T>>
): FuzzySearchResult<T>[] {
  const fuse = useMemo(() => {
    const fuseOptions: IFuseOptions<T> = {
      keys,
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true,
      ignoreLocation: true,
      findAllMatches: true,
      useExtendedSearch: true,
      ...options,
    };

    return new Fuse(items, fuseOptions);
  }, [items, keys, options]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return items.map((item, index) => ({
        item,
        refIndex: index,
        score: 0,
        matches: undefined,
      }));
    }

    return fuse.search(query).map((result) => ({
      item: result.item,
      matches: result.matches,
      score: result.score,
      refIndex: result.refIndex,
    }));
  }, [fuse, query, items]);

  return results;
}

/**
 * Hook para busca fuzzy com score de relevância
 * @param items - Array de itens para buscar
 * @param keys - Chaves dos objetos para buscar
 * @param query - Termo de busca
 * @param options - Opções adicionais do Fuse.js
 * @returns Array de resultados com score
 */
export function useFuzzySearchWithScore<T>(
  items: T[],
  keys: string[],
  query: string,
  options?: Partial<IFuseOptions<T>>
): FuseResult<T>[] {
  const fuse = useMemo(() => {
    const fuseOptions: IFuseOptions<T> = {
      keys,
      threshold: 0.4,
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
      useExtendedSearch: true,
      ...options,
    };

    return new Fuse(items, fuseOptions);
  }, [items, keys, options]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return items.map((item, index) => ({
        item,
        refIndex: index,
        score: 0,
      }));
    }

    return fuse.search(query);
  }, [fuse, query, items]);

  return results;
}

/**
 * Instância Fuse.js direta para uso em componentes sem hook
 * @param items - Array de itens para buscar
 * @param keys - Chaves dos objetos para buscar
 * @param options - Opções adicionais do Fuse.js
 * @returns Instância Fuse configurada
 */
export function createFuseInstance<T>(
  items: T[],
  keys: string[],
  options?: Partial<IFuseOptions<T>>
): Fuse<T> {
  const fuseOptions: IFuseOptions<T> = {
    keys,
    threshold: 0.4,
    distance: 100,
    minMatchCharLength: 2,
    includeScore: true,
    ignoreLocation: true,
    findAllMatches: true,
    useExtendedSearch: true,
    ...options,
  };

  return new Fuse(items, fuseOptions);
}
