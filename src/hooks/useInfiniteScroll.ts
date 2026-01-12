import { useState, useCallback, useEffect } from "react";

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

  const displayedItems = items.slice(0, displayedCount);
  const hasMore = displayedCount < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    // Simulate loading delay for smooth UX
    setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + itemsPerPage, items.length));
      setIsLoading(false);
    }, 300);
  }, [hasMore, isLoading, items.length, itemsPerPage]);

  // Reset when items change
  useEffect(() => {
    setDisplayedCount(itemsPerPage);
  }, [items.length, itemsPerPage]);

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

  return {
    displayedItems,
    isLoading,
    hasMore,
    loadMore,
    totalCount: items.length,
    displayedCount,
  };
};
