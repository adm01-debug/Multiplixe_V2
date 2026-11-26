import { useState, useCallback, useEffect, useRef } from "react";

interface UseInfiniteScrollOptions<T> {
  items: T[];
  itemsPerPage?: number;
  threshold?: number;
}

export const useInfiniteScroll = <T>({
  items,
  itemsPerPage = 12,
  threshold = 200,
}: UseInfiniteScrollOptions<T>) => {
  const [displayedCount, setDisplayedCount] = useState(itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sentinelRef = useCallback((node: HTMLElement | null) => setSentinel(node), []);

  const displayedItems = items.slice(0, displayedCount);
  const hasMore = displayedCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    // Simulate loading delay for smooth UX
    loadTimer.current = setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + itemsPerPage, items.length));
      setIsLoading(false);
      loadTimer.current = null;
    }, 300);
  }, [hasMore, isLoading, items.length, itemsPerPage]);

  // Reset when items change
  useEffect(() => {
    setDisplayedCount(itemsPerPage);
  }, [items.length, itemsPerPage]);

  useEffect(
    () => () => {
      if (loadTimer.current) clearTimeout(loadTimer.current);
    },
    []
  );

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - threshold
      ) {
        loadMore();
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMore, threshold]);

  // Sentinel observer: cobre containers com scroll proprio (a grade virtualizada),
  // onde o evento de scroll da janela nunca dispara.
  useEffect(() => {
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: `${threshold}px` }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinel, loadMore, threshold]);

  return {
    displayedItems,
    sentinelRef,
    isLoading,
    hasMore,
    loadMore,
    totalCount: items.length,
    displayedCount,
  };
};