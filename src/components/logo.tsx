'use client';

import React from 'react';
import { GradientText, REACTBITS_PRESETS } from '@/components/reactbits';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'gradient' | 'scroll';
  showIcon?: boolean;
  className?: string;
}

export default function Logo({ 
  size = 'md', 
  variant = 'gradient',
  showIcon = true,
  className = '' 
}: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl lg:text-4xl'
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36
  };

  if (variant === 'gradient') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="logo-container">
          <span className="logo-h bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">H</span>
          <span className="logo-text ml-1 bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">afi</span>
          <span className="logo-text bg-gradient-to-r from-brand-secondary to-brand-primary bg-clip-text text-transparent">Portrait</span>
        </div>
      </div>
    );
  }

  // Define colors based on variant
  let textColor, accentColor;
  
  if (variant === 'light') {
    textColor = 'text-white drop-shadow-lg';
    accentColor = 'text-brand-secondary-light drop-shadow-lg';
  } else if (variant === 'scroll') {
    textColor = 'text-brand-text-primary';
    accentColor = 'text-brand-secondary';
  } else { // dark
    textColor = 'text-brand-secondary';
    accentColor = 'text-brand-secondary';
  }

  return (
    <div className={`flex items-center ${className}`}>
      <span className={`logo-container ${textColor}`}>
        <span className="logo-h">H</span>
        <span className="logo-text">afi</span>
        <span className={`logo-text ${accentColor}`}>Portrait</span>
      </span>
    </div>
  );
}
