'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MobileScrollOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  enableParallax?: boolean;
  parallaxSpeed?: number;
}

/**
 * Mobile-optimized scroll effects hook
 * Designed for touch devices with battery efficiency in mind
 */
export function useMobileScrollEffects(options: MobileScrollOptions = {}) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -30px 0px',
    triggerOnce = true,
    delay = 0,
    enableParallax = false,
    parallaxSpeed = 0.2
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const elementRef = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Check device capabilities
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = typeof window !== 'undefined' && 
    (navigator.hardwareConcurrency || 4) < 4;

  // Optimized scroll handler with RAF throttling
  const handleScroll = useCallback(() => {
    if (!enableParallax || prefersReducedMotion) return;
    
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const isInViewport = rect.bottom >= 0 && rect.top <= window.innerHeight;
    
    if (isInViewport) {
      const scrolled = window.pageYOffset;
      const adjustedSpeed = isLowEndDevice ? parallaxSpeed * 0.5 : parallaxSpeed;
      setScrollY(scrolled * adjustedSpeed);
    }
  }, [enableParallax, parallaxSpeed, prefersReducedMotion, isLowEndDevice]);

  // Throttled scroll handler
  useEffect(() => {
    if (!enableParallax || prefersReducedMotion) return;

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [handleScroll, enableParallax, prefersReducedMotion]);

  // Intersection Observer for visibility
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Mobile-optimized settings
    const mobileThreshold = isMobile ? Math.max(threshold, 0.2) : threshold;
    const mobileRootMargin = isMobile ? '0px 0px -20px 0px' : rootMargin;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const animationDelay = prefersReducedMotion || isLowEndDevice ? 0 : delay;
          
          if (animationDelay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              if (triggerOnce && observerRef.current) {
                observerRef.current.unobserve(element);
              }
            }, animationDelay);
          } else {
            setIsVisible(true);
            if (triggerOnce && observerRef.current) {
              observerRef.current.unobserve(element);
            }
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { 
        threshold: mobileThreshold, 
        rootMargin: mobileRootMargin 
      }
    );

    observerRef.current.observe(element);

    return () => {
      if (observerRef.current) {
        observerRef.current.unobserve(element);
      }
    };
  }, [threshold, rootMargin, triggerOnce, delay, isMobile, prefersReducedMotion, isLowEndDevice]);

  return { 
    elementRef, 
    isVisible, 
    scrollY: enableParallax ? scrollY : 0,
    isMobile,
    prefersReducedMotion,
    isLowEndDevice
  };
}

/**
 * Mobile-optimized staggered animations
 */
export function useMobileStaggeredAnimation(itemCount: number, baseDelay: number = 80) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const containerRef = useRef<HTMLElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = typeof window !== 'undefined' && 
    (navigator.hardwareConcurrency || 4) < 4;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Adjust delay based on device capabilities
          let delay = baseDelay;
          if (prefersReducedMotion) delay = 0;
          else if (isLowEndDevice) delay = baseDelay * 0.5;
          else if (isMobile) delay = baseDelay * 0.7;

          // Trigger staggered animation
          for (let i = 0; i < itemCount; i++) {
            setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev];
                newState[i] = true;
                return newState;
              });
            }, i * delay);
          }
          observer.unobserve(container);
        }
      },
      { 
        threshold: isMobile ? 0.2 : 0.1,
        rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
      }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [itemCount, baseDelay, isMobile, prefersReducedMotion, isLowEndDevice]);

  return { containerRef, visibleItems };
}

/**
 * Mobile-optimized header scroll effect
 */
export function useMobileHeaderScroll(scrollThreshold: number = 50) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.pageYOffset;
        
        // Update scroll state
        setIsScrolled(currentScrollY > scrollThreshold);
        
        // Update scroll direction
        if (Math.abs(currentScrollY - lastScrollY) > 5) {
          setScrollDirection(currentScrollY > lastScrollY ? 'down' : 'up');
          setLastScrollY(currentScrollY);
        }
        
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold, lastScrollY]);

  return { isScrolled, scrollDirection };
}