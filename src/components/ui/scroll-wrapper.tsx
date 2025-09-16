'use client';

import React, { ReactNode, CSSProperties } from 'react';
import { useUnifiedScroll, useMobileOptimizedScroll } from '@/hooks/use-unified-scroll';

interface ScrollWrapperProps {
  children: ReactNode;
  className?: string;
  
  // Animation options
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale' | 'none';
  duration?: number;
  delay?: number;
  easing?: string;
  
  // Intersection options
  threshold?: number;
  triggerOnce?: boolean;
  
  // Mobile optimization
  mobileOptimized?: boolean;
  
  // Advanced options
  blur?: boolean;
  distance?: number;
  initialOpacity?: number;
  scale?: number;
  
  // Callbacks
  onVisible?: () => void;
  onHidden?: () => void;
}

const ScrollWrapper: React.FC<ScrollWrapperProps> = ({
  children,
  className = '',
  animation = 'fade',
  duration = 600,
  delay = 0,
  easing = 'ease-out',
  threshold = 0.15,
  triggerOnce = true,
  mobileOptimized = true,
  blur = false,
  distance = 20,
  initialOpacity = 0,
  scale = 1,
  onVisible,
  onHidden
}) => {
  const scrollHook = mobileOptimized ? useMobileOptimizedScroll : useUnifiedScroll;
  
  const { 
    elementRef, 
    isVisible, 
    prefersReducedMotion 
  } = scrollHook({
    threshold,
    triggerOnce,
    delay,
    enableReducedMotion: true
  });

  // Handle callbacks
  React.useEffect(() => {
    if (isVisible && onVisible) {
      onVisible();
    } else if (!isVisible && onHidden) {
      onHidden();
    }
  }, [isVisible, onVisible, onHidden]);

  // Generate animation styles
  const getAnimationStyles = (): CSSProperties => {
    if (prefersReducedMotion || animation === 'none') {
      return {
        opacity: isVisible ? 1 : initialOpacity,
        transition: `opacity ${duration}ms ${easing}`
      };
    }

    const baseStyles: CSSProperties = {
      transition: `all ${duration}ms ${easing}`,
      opacity: isVisible ? 1 : initialOpacity
    };

    if (blur) {
      baseStyles.filter = isVisible ? 'blur(0px)' : 'blur(10px)';
    }

    switch (animation) {
      case 'fade':
        return baseStyles;

      case 'slide-up':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateY(0)' : `translateY(${distance}px)`
        };

      case 'slide-down':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateY(0)' : `translateY(-${distance}px)`
        };

      case 'slide-left':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateX(0)' : `translateX(${distance}px)`
        };

      case 'slide-right':
        return {
          ...baseStyles,
          transform: isVisible ? 'translateX(0)' : `translateX(-${distance}px)`
        };

      case 'scale':
        return {
          ...baseStyles,
          transform: isVisible ? 'scale(1)' : `scale(${scale})`
        };

      default:
        return baseStyles;
    }
  };

  return (
    <div
      ref={elementRef as React.RefObject<HTMLDivElement>}
      className={className}
      style={getAnimationStyles()}
    >
      {children}
    </div>
  );
};

export default ScrollWrapper;

// Export convenience components
export const FadeInWrapper: React.FC<Omit<ScrollWrapperProps, 'animation'>> = (props) => (
  <ScrollWrapper {...props} animation="fade" />
);

export const SlideUpWrapper: React.FC<Omit<ScrollWrapperProps, 'animation'>> = (props) => (
  <ScrollWrapper {...props} animation="slide-up" />
);

export const SlideDownWrapper: React.FC<Omit<ScrollWrapperProps, 'animation'>> = (props) => (
  <ScrollWrapper {...props} animation="slide-down" />
);

export const ScaleWrapper: React.FC<Omit<ScrollWrapperProps, 'animation'>> = (props) => (
  <ScrollWrapper {...props} animation="scale" />
);