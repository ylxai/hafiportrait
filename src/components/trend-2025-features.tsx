'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

/**
 * Trend 2025 Features Collection
 * Advanced UI patterns for modern web experiences
 */

// 1. Magnetic Button Effect
export function MagneticButton({ 
  children, 
  className = '',
  onClick 
}: { 
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.3;
    const deltaY = (e.clientY - centerY) * 0.3;
    
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      className={`relative overflow-hidden ${className}`}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-primary opacity-0 rounded-lg"
        animate={{ opacity: isHovered ? 0.1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.button>
  );
}

// 2. Morphing Logo Effect
export function MorphingLogo({ 
  isScrolled, 
  children 
}: { 
  isScrolled: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={{
        scale: isScrolled ? 0.8 : 1,
        y: isScrolled ? -5 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className="transform-gpu"
    >
      {children}
    </motion.div>
  );
}

// 3. Parallax Mouse Effect
export function ParallaxContainer({ 
  children, 
  intensity = 0.02 
}: { 
  children: React.ReactNode;
  intensity?: number;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) * intensity,
        y: (e.clientY - window.innerHeight / 2) * intensity
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity]);

  return (
    <motion.div
      animate={{
        x: mousePosition.x,
        y: mousePosition.y
      }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20
      }}
      className="transform-gpu"
    >
      {children}
    </motion.div>
  );
}

// 4. Glassmorphism Card
export function GlassmorphismCard({ 
  children, 
  className = '',
  variant = 'light'
}: { 
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const glassClasses = variant === 'light' 
    ? 'bg-white/10 border-white/20' 
    : 'bg-black/10 border-black/20';

  return (
    <div className={`
      backdrop-blur-xl ${glassClasses} border rounded-2xl
      shadow-brand-lg hover:shadow-brand-xl
      transition-all duration-300 hover:scale-105
      ${className}
    `}>
      {children}
    </div>
  );
}

// 5. Animated Gradient Border
export function AnimatedGradientBorder({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative p-[2px] rounded-2xl bg-gradient-accent animate-gradient ${className}`}>
      <div className="bg-brand-bg-primary rounded-2xl p-6 h-full">
        {children}
      </div>
    </div>
  );
}

// 6. Floating Action Button with Pulse
export function FloatingActionButton({ 
  children, 
  onClick,
  className = ''
}: { 
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gradient-primary text-white
        shadow-brand-lg hover:shadow-brand-xl
        flex items-center justify-center
        ${className}
      `}
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      animate={{
        boxShadow: [
          '0 0 0 0 rgba(14, 116, 144, 0.4)',
          '0 0 0 20px rgba(14, 116, 144, 0)',
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.button>
  );
}

// 7. Smart Loading States
export function SmartLoader({ 
  isLoading, 
  children 
}: { 
  isLoading: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={{
        opacity: isLoading ? 0.5 : 1,
        scale: isLoading ? 0.98 : 1
      }}
      transition={{ duration: 0.2 }}
    >
      {children}
      
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-brand-bg-primary/80 backdrop-blur-sm rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </motion.div>
  );
}