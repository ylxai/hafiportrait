'use client';

import { useEffect, useRef } from 'react';
import { useParallax, useMagneticEffect } from '@/hooks/use-scroll-animations';

interface FloatingElementsProps {
  count?: number;
  className?: string;
}

export function FloatingElements({ count = 5, className = '' }: FloatingElementsProps) {
  const { elementRef, offset } = useParallax(0.2);

  const elements = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 bg-[var(--color-accent)] rounded-full opacity-20 float-animation ${className}`}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${i * 0.5}s`,
        transform: `translateY(${offset * 0.5}px)`,
      }}
    />
  ));

  return (
    <div ref={elementRef} className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements}
    </div>
  );
}

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MagneticButton({ children, className = '', onClick }: MagneticButtonProps) {
  const magneticRef = useMagneticEffect();

  return (
    <button
      ref={magneticRef}
      className={`magnetic transition-transform duration-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ParallaxContainerProps {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxContainer({ children, speed = 0.5, className = '' }: ParallaxContainerProps) {
  const { elementRef, offset } = useParallax(speed);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}

interface ScrollRevealTextProps {
  children: string;
  className?: string;
  delay?: number;
}

export function ScrollRevealText({ children, className = '', delay = 0 }: ScrollRevealTextProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            element.classList.add('revealed');
          }, delay);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [delay]);

  return (
    <div ref={elementRef} className={`text-reveal ${className}`}>
      <span className="text-reveal-inner">{children}</span>
    </div>
  );
}

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export function TypewriterText({ text, speed = 50, className = '' }: TypewriterTextProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let i = 0;
    element.innerHTML = '';
    
    const typeWriter = () => {
      if (i < text.length) {
        element.innerHTML += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          typeWriter();
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [text, speed]);

  return (
    <div
      ref={elementRef}
      className={`typewriter ${className}`}
    />
  );
}

interface GlowingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowingCard({ children, className = '', glowColor = 'var(--color-accent)' }: GlowingCardProps) {
  return (
    <div 
      className={`hover-glow relative ${className}`}
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedCounter({ 
  target, 
  duration = 2000, 
  className = '', 
  prefix = '', 
  suffix = '' 
}: AnimatedCounterProps) {
  const elementRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const increment = target / (duration / 16);
          
          const counter = () => {
            start += increment;
            if (start < target) {
              element.textContent = `${prefix}${Math.floor(start)}${suffix}`;
              requestAnimationFrame(counter);
            } else {
              element.textContent = `${prefix}${target}${suffix}`;
            }
          };
          
          counter();
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.unobserve(element);
  }, [target, duration, prefix, suffix]);

  return <span ref={elementRef} className={className}>0</span>;
}