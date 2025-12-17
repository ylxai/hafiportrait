'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
}

/**
 * Optimized Image Component with Progressive Loading
 * Features:
 * - Progressive loading with blur placeholder
 * - Automatic fallback handling
 * - Responsive sizing with aspect ratio
 * - Performance optimizations
 * - Error handling with retry
 */
function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className = '',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  quality = 75,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg',
  aspectRatio = 'square'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  // Default blur placeholder - low quality base64 image
  const defaultBlurDataURL = blurDataURL || 
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  };

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (currentSrc !== fallbackSrc) {
      // Try fallback image
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      // Even fallback failed
      setHasError(true);
      setIsLoading(false);
    }
    onError?.();
  }, [currentSrc, fallbackSrc, onError]);

  if (hasError) {
    return (
      <div 
        className={`
          flex items-center justify-center bg-gray-100 text-gray-400
          ${aspectRatioClasses[aspectRatio]}
          ${className}
        `}
        role="img"
        aria-label={alt}
      >
        <svg 
          className="w-8 h-8" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${aspectRatioClasses[aspectRatio]} ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}

      <Image
        src={currentSrc}
        alt={alt}
        {...(fill ? { fill: true } : { width: width || 800, height: height || 600 })}
        className={`
          object-cover transition-opacity duration-300
          ${isLoading ? 'opacity-0' : 'opacity-100'}
          ${fill ? '' : 'w-full h-full'}
        `}
        sizes={sizes}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />

      {/* Loading overlay with spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

// Memoize component for performance
export default memo(OptimizedImage, (prevProps, nextProps) => {
  return (
    prevProps.src === nextProps.src &&
    prevProps.alt === nextProps.alt &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.className === nextProps.className &&
    prevProps.aspectRatio === nextProps.aspectRatio &&
    prevProps.priority === nextProps.priority &&
    prevProps.quality === nextProps.quality
  );
});

// Export preset configurations for common use cases
export const ImagePresets = {
  // Gallery thumbnail
  thumbnail: {
    quality: 60,
    aspectRatio: 'square' as const,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
    placeholder: 'blur' as const
  },

  // Hero images
  hero: {
    fill: true,
    quality: 90,
    aspectRatio: 'video' as const,
    sizes: '100vw',
    priority: true,
    placeholder: 'blur' as const
  },

  // Profile/portrait images
  profile: {
    quality: 80,
    aspectRatio: 'portrait' as const,
    sizes: '(max-width: 768px) 80vw, 400px',
    placeholder: 'blur' as const
  },

  // Admin grid view
  adminGrid: {
    quality: 65,
    aspectRatio: 'square' as const,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw',
    placeholder: 'blur' as const
  }
};