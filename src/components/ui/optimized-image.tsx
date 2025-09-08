'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
// Import types only (no server-side code)
interface OptimizedImages {
  original: { url: string; size: number; width?: number; height?: number; };
  thumbnail: { url: string; size: number; };
  small: { url: string; size: number; };
  medium: { url: string; size: number; };
  large: { url: string; size: number; };
}

interface OptimizedImageProps {
  images: OptimizedImages;
  alt: string;
  usage: 'thumbnail' | 'gallery' | 'lightbox' | 'download' | 'mobile';
  className?: string;
  onClick?: () => void;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export function OptimizedImage({
  images,
  alt,
  usage,
  className = '',
  onClick,
  priority = false,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get optimal image URL for current usage (client-side utility)
  const getOptimalImageUrl = (images: OptimizedImages, usage: string): string => {
    switch (usage) {
      case 'thumbnail': return images.thumbnail.url;
      case 'gallery': return images.medium.url;
      case 'lightbox': return images.large.url;
      case 'download': return images.original.url;
      case 'mobile': return images.small.url;
      default: return images.medium.url;
    }
  };

  const getResponsiveSources = (images: OptimizedImages) => ({
    srcSet: [
      `${images.small.url} 800w`,
      `${images.medium.url} 1200w`,
      `${images.large.url} 1920w`
    ].join(', '),
    sizes: [
      '(max-width: 768px) 800px',
      '(max-width: 1200px) 1200px',
      '1920px'
    ].join(', '),
    src: images.medium.url,
    placeholder: images.thumbnail.url
  });

  const imageUrl = getOptimalImageUrl(images, usage);
  const responsiveSources = usage === 'gallery' || usage === 'lightbox' 
    ? getResponsiveSources(images)
    : null;

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Optimized Image */}
      {responsiveSources ? (
        // Responsive image for gallery/lightbox
        <img
          src={responsiveSources.src}
          srcSet={responsiveSources.srcSet}
          sizes={responsiveSources.sizes}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
        />
      ) : (
        // Single optimized image for thumbnail/mobile
        <img
          src={imageUrl}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={onClick}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
        />
      )}

      {/* Hapus development overlay untuk menghindari error */}
    </div>
  );
}

// Skeleton loader component
export function ImageSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-gray-200 animate-pulse ${className}`}>
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

// Progressive image loader
export function ProgressiveImage({
  images,
  alt,
  className,
  onClick
}: {
  images: OptimizedImages;
  alt: string;
  className?: string;
  onClick?: () => void;
}) {
  const [currentSrc, setCurrentSrc] = useState(images.thumbnail.url);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Progressive loading: thumbnail -> medium -> large
    const img = new window.Image();
    img.onload = () => {
      setCurrentSrc(images.medium.url);
      setIsLoaded(true);
    };
    img.src = images.medium.url;
  }, [images.medium.url]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'filter-none' : 'filter blur-sm'
        }`}
        onClick={onClick}
      />
    </div>
  );
}