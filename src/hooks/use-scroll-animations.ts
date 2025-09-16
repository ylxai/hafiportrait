'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

export function useScrollAnimation(options: ScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    delay = 0
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Mobile-optimized threshold and rootMargin
    const isMobile = window.innerWidth < 768;
    const mobileThreshold = isMobile ? Math.max(threshold, 0.2) : threshold;
    const mobileRootMargin = isMobile ? '0px 0px -20px 0px' : rootMargin;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const animationDelay = prefersReducedMotion ? 0 : delay;
          
          if (animationDelay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              if (triggerOnce) {
                observer.unobserve(element);
              }
            }, animationDelay);
          } else {
            setIsVisible(true);
            if (triggerOnce) {
              observer.unobserve(element);
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

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, delay]);

  return { elementRef, isVisible };
}

export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        const element = elementRef.current;
        if (!element) {
          ticking = false;
          return;
        }

        const rect = element.getBoundingClientRect();
        const isVisible = rect.bottom >= 0 && rect.top <= window.innerHeight;
        
        if (isVisible) {
          const scrolled = window.pageYOffset;
          // Reduce parallax speed on mobile for better performance
          const isMobile = window.innerWidth < 768;
          const adjustedSpeed = isMobile ? speed * 0.3 : speed;
          const rate = scrolled * adjustedSpeed;
          
          setOffset(rate);
        }
        
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return { elementRef, offset };
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = (window.pageYOffset / totalHeight) * 100;
        setProgress(Math.min(Math.max(currentProgress, 0), 100));
        ticking = false;
      });
    };

    // Initial calculation
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return progress;
}

export function useStaggeredAnimation(itemCount: number, delay: number = 100) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
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
      { threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
    };
  }, [itemCount, delay]);

  return { containerRef, visibleItems };
}

export function useMagneticEffect() {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 100;
      
      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance;
        const moveX = (x / distance) * strength * 10;
        const moveY = (y / distance) * strength * 10;
        
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    const handleMouseLeave = () => {
      element.style.transform = 'translate(0px, 0px)';
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return elementRef;
}

// ===== CONSOLIDATED HOOKS - MENGGABUNGKAN DUPLICATE PATTERNS =====

interface SectionScrollAnimationOptions {
  sectionThreshold?: number;
  titleThreshold?: number;
  itemCount?: number;
  staggerDelay?: number;
  enableGPUOptimization?: boolean;
  respectReducedMotion?: boolean;
}

/**
 * Hook terpusat untuk section scroll animations
 * Menggabungkan pattern yang sama dari events, gallery, dan contact sections
 */
export function useSectionScrollAnimations(options: SectionScrollAnimationOptions = {}) {
  const {
    sectionThreshold = 0.1,
    titleThreshold = 0.3,
    itemCount = 6,
    staggerDelay = 100,
    enableGPUOptimization = true,
    respectReducedMotion = true
  } = options;

  // Device capability detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isLowEndDevice = typeof window !== 'undefined' && (navigator.hardwareConcurrency || 4) < 4;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Optimized thresholds for mobile
  const optimizedSectionThreshold = isMobile ? Math.max(sectionThreshold, 0.15) : sectionThreshold;
  const optimizedTitleThreshold = isMobile ? Math.max(titleThreshold, 0.25) : titleThreshold;
  const optimizedStaggerDelay = isLowEndDevice ? staggerDelay * 0.5 : (isMobile ? staggerDelay * 0.7 : staggerDelay);

  // Section animation
  const section = useScrollAnimation({ 
    threshold: optimizedSectionThreshold,
    rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
  });

  // Title animation  
  const title = useScrollAnimation({ 
    threshold: optimizedTitleThreshold,
    delay: respectReducedMotion && prefersReducedMotion ? 0 : 100
  });

  // Staggered items animation
  const stagger = useStaggeredAnimation(itemCount, optimizedStaggerDelay);

  // GPU optimization effect
  useEffect(() => {
    if (!enableGPUOptimization) return;

    const sectionElement = section.elementRef.current;
    const titleElement = title.elementRef.current;

    // Apply GPU layers when animations start
    if (section.isVisible && sectionElement) {
      sectionElement.style.willChange = 'transform, opacity';
      sectionElement.style.transform = 'translateZ(0)';
    }

    if (title.isVisible && titleElement) {
      titleElement.style.willChange = 'transform, opacity';
      titleElement.style.transform = 'translateZ(0)';
    }

    // Cleanup GPU layers after animation completes
    const cleanupTimeout = setTimeout(() => {
      if (sectionElement) {
        sectionElement.style.willChange = 'auto';
      }
      if (titleElement) {
        titleElement.style.willChange = 'auto';
      }
    }, 1000); // After typical animation duration

    return () => clearTimeout(cleanupTimeout);
  }, [section.isVisible, title.isVisible, enableGPUOptimization]);

  return {
    section,
    title, 
    stagger,
    deviceInfo: {
      isMobile,
      isLowEndDevice,
      prefersReducedMotion
    }
  };
}

/**
 * Optimized useStaggeredAnimation dengan performance improvements
 */
export function useOptimizedStaggeredAnimation(itemCount: number, delay: number = 100) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>(new Array(itemCount).fill(false));
  const containerRef = useRef<HTMLElement>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Device optimizations
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isLowEndDevice = typeof window !== 'undefined' && (navigator.hardwareConcurrency || 4) < 4;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Adjust delay based on device capabilities
    let adjustedDelay = delay;
    if (prefersReducedMotion) adjustedDelay = 0;
    else if (isLowEndDevice) adjustedDelay = delay * 0.5;
    else if (isMobile) adjustedDelay = delay * 0.7;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Clear any existing timeouts
          timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
          timeoutsRef.current = [];

          // GPU optimization for container
          container.style.willChange = 'transform';
          container.style.transform = 'translateZ(0)';

          // Trigger staggered animation
          for (let i = 0; i < itemCount; i++) {
            const timeout = setTimeout(() => {
              setVisibleItems(prev => {
                const newState = [...prev];
                newState[i] = true;
                return newState;
              });
            }, i * adjustedDelay);
            
            timeoutsRef.current.push(timeout);
          }

          // Cleanup GPU layer after all animations complete
          const cleanupTimeout = setTimeout(() => {
            container.style.willChange = 'auto';
          }, itemCount * adjustedDelay + 1000);
          
          timeoutsRef.current.push(cleanupTimeout);
          observer.unobserve(container);
        }
      },
      { 
        threshold: isMobile ? 0.15 : 0.1,
        rootMargin: isMobile ? '0px 0px -20px 0px' : '0px 0px -50px 0px'
      }
    );

    observer.observe(container);

    return () => {
      observer.unobserve(container);
      // Cleanup all timeouts
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [itemCount, delay, isMobile, isLowEndDevice, prefersReducedMotion]);

  return { containerRef, visibleItems };
}

/**
 * Performance-optimized parallax dengan battery efficiency
 */
export function useOptimizedParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);
  
  // Device capability detection
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isLowEndDevice = typeof window !== 'undefined' && (navigator.hardwareConcurrency || 4) < 4;
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    // Disable on low-end devices or reduced motion preference
    if (prefersReducedMotion || isLowEndDevice) return;

    let ticking = false;
    let animationId: number;
    
    const handleScroll = () => {
      if (ticking) return;
      
      ticking = true;
      animationId = requestAnimationFrame(() => {
        const element = elementRef.current;
        if (!element) {
          ticking = false;
          return;
        }

        const rect = element.getBoundingClientRect();
        const isVisible = rect.bottom >= 0 && rect.top <= window.innerHeight;
        
        if (isVisible) {
          const scrolled = window.pageYOffset;
          // Reduce parallax speed significantly on mobile for battery
          const adjustedSpeed = isMobile ? speed * 0.2 : speed * 0.8;
          const rate = scrolled * adjustedSpeed;
          
          setOffset(rate);
        }
        
        ticking = false;
      });
    };

    // Use passive listeners for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [speed, isMobile, isLowEndDevice, prefersReducedMotion]);

  return { elementRef, offset: prefersReducedMotion || isLowEndDevice ? 0 : offset };
}