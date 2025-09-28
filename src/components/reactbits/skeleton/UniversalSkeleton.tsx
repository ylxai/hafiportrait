'use client';

import React from 'react';

interface UniversalSkeletonProps {
  type?: 'text' | 'image' | 'card' | 'hero' | 'gallery' | 'pricing' | 'events' | 'contact';
  lines?: number;
  className?: string;
  animated?: boolean;
}

const UniversalSkeleton: React.FC<UniversalSkeletonProps> = ({
  type = 'text',
  lines = 3,
  className = '',
  animated = true
}) => {
  const baseClasses = `bg-gray-200 ${animated ? 'animate-pulse' : ''}`;
  
  if (type === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} h-4 rounded`}
            style={{ width: i === lines - 1 ? '75%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (type === 'image') {
    return (
      <div className={`${baseClasses} aspect-video rounded-lg ${className}`} />
    );
  }

  if (type === 'card') {
    return (
      <div className={`border rounded-lg p-6 space-y-4 ${className}`}>
        <div className={`${baseClasses} h-6 w-3/4 rounded`} />
        <div className={`${baseClasses} aspect-video rounded`} />
        <div className="space-y-2">
          <div className={`${baseClasses} h-4 rounded`} />
          <div className={`${baseClasses} h-4 w-5/6 rounded`} />
        </div>
      </div>
    );
  }

  if (type === 'hero') {
    return (
      <div className={`h-screen flex items-center justify-center bg-gray-50 ${className}`}>
        <div className="text-center space-y-6">
          <div className={`${baseClasses} h-12 w-80 mx-auto rounded`} />
          <div className={`${baseClasses} h-6 w-64 mx-auto rounded`} />
          <div className={`${baseClasses} h-10 w-32 mx-auto rounded`} />
        </div>
      </div>
    );
  }

  if (type === 'gallery') {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6 ${className}`}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${baseClasses} aspect-square rounded-lg`} />
        ))}
      </div>
    );
  }

  if (type === 'pricing') {
    return (
      <div className={`grid md:grid-cols-3 gap-6 p-6 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4">
            <div className={`${baseClasses} h-6 w-3/4 rounded`} />
            <div className={`${baseClasses} h-8 w-1/2 rounded`} />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className={`${baseClasses} h-4 rounded`} />
              ))}
            </div>
            <div className={`${baseClasses} h-10 rounded`} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'events') {
    return (
      <div className={`space-y-4 p-6 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex space-x-4 p-4 border rounded-lg">
            <div className={`${baseClasses} w-24 h-24 rounded-lg flex-shrink-0`} />
            <div className="flex-1 space-y-2">
              <div className={`${baseClasses} h-6 w-3/4 rounded`} />
              <div className={`${baseClasses} h-4 w-1/2 rounded`} />
              <div className={`${baseClasses} h-4 rounded`} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'contact') {
    return (
      <div className={`max-w-md mx-auto space-y-6 p-6 ${className}`}>
        <div className={`${baseClasses} h-8 w-3/4 mx-auto rounded`} />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className={`${baseClasses} h-4 w-1/4 rounded`} />
              <div className={`${baseClasses} h-10 rounded`} />
            </div>
          ))}
        </div>
        <div className={`${baseClasses} h-10 rounded`} />
      </div>
    );
  }

  return (
    <div className={`${baseClasses} h-4 rounded ${className}`} />
  );
};

export default UniversalSkeleton;