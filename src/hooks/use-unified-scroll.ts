'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

interface UnifiedScrollOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  enableReducedMotion?: boolean;
}

interface ScrollState {
  isVisible: boolean;
  hasTriggered: boolean;
  progress: number;
}

/**
 * Hook terpusat untuk semua scroll animations
 * Menggabungkan fungsionalitas dari useScrollAnimation dan useMobileScrollEffects
 * dengan performa yang lebih baik dan battery-efficient
 */
export function useUnifiedScroll(options: UnifiedScrollOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px',
    triggerOnce = true,
    delay = 0,
    enableReducedMotion = true
  } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<ScrollState>({
    isVisible: false,
    hasTriggered: false,
    progress: 0
  });

  // Detect reduced motion preference
  const prefersReducedMotion = enableReducedMotion && 
    (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Throttled intersection observer callback
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isIntersecting = entry.isIntersecting;
    const intersectionRatio = entry.intersectionRatio;

    setState(prev => {
      // If triggerOnce and already triggered, don't update
      if (triggerOnce && prev.hasTriggered) return prev;

      return {
        isVisible: isIntersecting,
        hasTriggered: prev.hasTriggered || isIntersecting,
        progress: intersectionRatio
      };
    });
  }, [triggerOnce]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create intersection observer with optimized settings
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: Array.isArray(threshold) ? threshold : [threshold],
      rootMargin,
      // Use passive listener for better performance
    });

    // Apply delay if specified
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        observer.observe(element);
      }, delay);

      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
      };
    } else {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [handleIntersection, threshold, rootMargin, delay]);

  // Battery-efficient scroll listener (optional, only if needed)
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    if (prefersReducedMotion) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReducedMotion]);

  return {
    elementRef,
    isVisible: state.isVisible,
    hasTriggered: state.hasTriggered,
    progress: state.progress,
    scrollY,
    prefersReducedMotion,
    // Helper methods
    reset: () => setState({
      isVisible: false,
      hasTriggered: false,
      progress: 0
    })
  };
}

/**
 * Specialized hook for mobile-optimized scroll effects
 */
export function useMobileOptimizedScroll(options: UnifiedScrollOptions = {}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollData = useUnifiedScroll({
    ...options,
    // More aggressive reduced motion on mobile
    enableReducedMotion: true,
    // Lower threshold for mobile
    threshold: isMobile ? 0.1 : (options.threshold || 0.15)
  });

  return {
    ...scrollData,
    isMobile
  };
}