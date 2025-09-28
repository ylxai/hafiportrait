'use client';

import React from 'react';

interface OptimizedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

const OptimizedLoader: React.FC<OptimizedLoaderProps> = ({
  size = 'md',
  variant = 'spinner',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinnerClasses = `${sizeClasses[size]} border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin`;
  
  if (variant === 'spinner') {
    return (
      <div className={`${spinnerClasses} ${className}`} />
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div className={`${sizeClasses[size]} bg-gray-900 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
        <div className={`${sizeClasses[size]} bg-gray-900 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
        <div className={`${sizeClasses[size]} bg-gray-900 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={`${sizeClasses[size]} bg-gray-900 rounded-full animate-pulse ${className}`} />
    );
  }

  return null;
};

export default OptimizedLoader;