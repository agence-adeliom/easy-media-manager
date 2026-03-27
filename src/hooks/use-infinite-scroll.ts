import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  enabled: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

export function useInfiniteScroll({ enabled, isLoading, onLoadMore }: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || isLoading || sentinelRef.current === null) {
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];

      if (entry?.isIntersecting) {
        onLoadMore();
      }
    });

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [enabled, isLoading, onLoadMore]);

  return sentinelRef;
}
