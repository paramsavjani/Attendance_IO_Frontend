import { useState, useRef, useCallback } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 60,
  maxPull = 100,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const scrollableRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Find the scrollable container
    const target = e.target as HTMLElement;
    scrollableRef.current = target.closest('[data-scroll-container]') as HTMLElement;
    
    // Check if we're at the top of the scrollable area
    const scrollTop = scrollableRef.current?.scrollTop ?? window.scrollY;
    
    if (scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    // Check scroll position again
    const scrollTop = scrollableRef.current?.scrollTop ?? window.scrollY;

    // Only activate pull-to-refresh when at top and pulling down
    if (diff > 0 && scrollTop <= 0) {
      // Apply resistance curve for natural feel
      const resistance = Math.max(0.4, 1 - (diff / 300));
      const pullValue = Math.min(diff * resistance, maxPull);
      setPullDistance(pullValue);
    } else if (diff <= 0) {
      // User is scrolling up, reset
      startY.current = null;
      setPullDistance(0);
    }
  }, [isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (startY.current === null) return;

    const shouldTrigger = pullDistance >= threshold;
    startY.current = null;

    if (shouldTrigger && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(40); // Hold at smaller distance during refresh
      
      try {
        await onRefresh();
      } finally {
        setPullDistance(0);
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  return {
    pullDistance,
    isRefreshing,
    progress,
    shouldRefresh,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}
