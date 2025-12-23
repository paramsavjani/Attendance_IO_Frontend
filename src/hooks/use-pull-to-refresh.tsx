import { useState, useRef, useCallback, useEffect } from "react";

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 70,
  maxPull = 100,
}: UsePullToRefreshOptions) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrame = useRef<number>();

  const smoothSetPullDistance = useCallback((target: number, duration: number = 200) => {
    const start = pullDistance;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * eased;
      
      setPullDistance(current);
      
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    animationFrame.current = requestAnimationFrame(animate);
  }, [pullDistance]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing && !isReleasing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    }
  }, [isRefreshing, isReleasing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0 && window.scrollY === 0) {
      e.preventDefault();
      // Exponential resistance for natural feel
      const resistance = 1 - Math.pow(diff / (maxPull * 3), 0.5);
      const pullValue = Math.min(diff * resistance * 0.6, maxPull);
      setPullDistance(pullValue);
    }
  }, [isPulling, isRefreshing, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);
    setIsReleasing(true);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      
      // Animate to threshold position
      smoothSetPullDistance(50, 150);
      
      try {
        await onRefresh();
      } finally {
        // Smooth release animation
        setTimeout(() => {
          smoothSetPullDistance(0, 300);
          setTimeout(() => {
            setIsRefreshing(false);
            setIsReleasing(false);
          }, 300);
        }, 200);
      }
    } else {
      // Bounce back smoothly
      smoothSetPullDistance(0, 250);
      setTimeout(() => {
        setIsReleasing(false);
      }, 250);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh, smoothSetPullDistance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, { passive: true });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  return {
    containerRef,
    pullDistance,
    isRefreshing,
    isPulling,
    isReleasing,
    progress,
    shouldRefresh,
  };
}
