'use client';

import React from 'react';

interface BeamsBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export function BeamsBackground({ className = '', children }: BeamsBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Beams Effect */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated beams */}
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -top-20 -left-32 w-60 h-60 bg-gradient-to-r from-brand-accent/15 to-brand-primary/15 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-20 right-0 w-40 h-40 bg-gradient-to-r from-brand-secondary/10 to-brand-accent/10 rounded-full blur-xl animate-pulse delay-2000"></div>
        
        {/* Moving light beams */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-brand-primary/30 to-transparent animate-pulse"></div>
          <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-brand-secondary/20 to-transparent animate-pulse delay-500"></div>
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-brand-accent/25 to-transparent animate-pulse delay-1000"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,116,144,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      </div>
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border-b border-white/10"></div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

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
    ? 'bg-white/10 border-white/20 backdrop-blur-xl' 
    : 'bg-black/10 border-black/20 backdrop-blur-xl';

  return (
    <div className={`
      ${glassClasses} border rounded-2xl
      shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
      transition-all duration-300 hover:bg-white/20
      ${className}
    `}>
      {children}
    </div>
  );
}