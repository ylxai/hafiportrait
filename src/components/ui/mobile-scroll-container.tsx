'use client';

import React, { useRef, useEffect, ReactNode } from 'react';
import { useMobileScrollEffects } from '@/hooks/use-mobile-scroll-effects';
import '@/styles/mobile-scroll-effects.css';

interface MobileScrollContainerProps {
  children: ReactNode;
  className?: string;
  enableParallax?: boolean;
  parallaxSpeed?: number;
  enableSnapScroll?: boolean;
  threshold?: number;
  delay?: number;
  animationType?: 'fade' | 'slide' | 'none';
}

export default function MobileScrollContainer({
  children,
  className = '',
  enableParallax = false,
  parallaxSpeed = 0.2,
  enableSnapScroll = false,
  threshold = 0.15,
  delay = 0,
  animationType = 'fade'
}: MobileScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    elementRef, 
    isVisible, 
    scrollY, 
    isMobile, 
    prefersReducedMotion 
  } = useMobileScrollEffects({
    threshold,
    delay,
    enableParallax,
    parallaxSpeed,
    triggerOnce: true
  });

  // Merge refs
  useEffect(() => {
    if (containerRef.current && elementRef.current !== containerRef.current) {
      (elementRef as any).current = containerRef.current;
    }
  }, [elementRef]);

  // Get animation classes
  const getAnimationClass = () => {
    if (prefersReducedMotion || animationType === 'none') return '';
    
    const baseClass = isMobile ? 'mobile-scroll-element' : '';
    const animationClass = animationType === 'slide' ? 'mobile-slide-up' : 'mobile-fade-in';
    const visibleClass = isVisible ? 'visible' : '';
    
    return `${baseClass} ${animationClass} ${visibleClass}`.trim();
  };

  // Get container styles
  const getContainerStyles = () => {
    const styles: React.CSSProperties = {};
    
    if (enableParallax && !prefersReducedMotion && scrollY !== 0) {
      styles.transform = `translateY(${scrollY}px)`;
    }
    
    return styles;
  };

  return (
    <div
      ref={containerRef}
      className={`
        ${getAnimationClass()}
        ${enableSnapScroll ? 'mobile-scroll-snap-item' : ''}
        ${className}
      `.trim()}
      style={getContainerStyles()}
    >
      {children}
    </div>
  );
}

// Specialized components for common use cases
export function MobileFadeIn({ 
  children, 
  className = '', 
  delay = 0,
  threshold = 0.15 
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) {
  return (
    <MobileScrollContainer
      className={className}
      animationType="fade"
      delay={delay}
      threshold={threshold}
    >
      {children}
    </MobileScrollContainer>
  );
}

export function MobileSlideUp({ 
  children, 
  className = '', 
  delay = 0,
  threshold = 0.15 
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}) {
  return (
    <MobileScrollContainer
      className={className}
      animationType="slide"
      delay={delay}
      threshold={threshold}
    >
      {children}
    </MobileScrollContainer>
  );
}

export function MobileParallax({ 
  children, 
  className = '', 
  speed = 0.2 
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <MobileScrollContainer
      className={className}
      enableParallax={true}
      parallaxSpeed={speed}
      animationType="none"
    >
      {children}
    </MobileScrollContainer>
  );
}