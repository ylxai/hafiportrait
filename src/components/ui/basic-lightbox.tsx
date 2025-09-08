'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  original_name: string;
  uploader_name?: string | null;
  album_name?: string | null;
}

interface BasicLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function BasicLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose
}: BasicLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Touch/Swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);

  // Sync with props when lightbox opens or currentIndex changes
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex, isOpen]);

  const goToPrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && photos.length > 1) {
      goToNext();
    }
    if (isRightSwipe && photos.length > 1) {
      goToPrevious();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen || !photos[activeIndex]) return null;

  const currentPhoto = photos[activeIndex];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Background overlay - click to close */}
      <div 
        className="absolute inset-0"
        onClick={onClose}
      />
      
      {/* Main Image */}
      <div 
        ref={imageRef}
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center z-10"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.original_name}
          className={`max-w-full max-h-full object-contain transition-all duration-300 ${
            isTransitioning ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
          }`}
          style={{ maxHeight: '90vh', maxWidth: '90vw' }}
        />

        {/* Navigation Buttons */}
        {photos.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Photo Counter */}
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded text-sm">
            {activeIndex + 1} / {photos.length}
          </div>
        )}

        {/* Photo Info */}
        {currentPhoto.uploader_name && (
          <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
            {currentPhoto.uploader_name}
          </div>
        )}

        {/* Swipe Indicator for Mobile */}
        {photos.length > 1 && (
          <div className="swipe-indicator">
            ← Geser untuk navigasi →
          </div>
        )}
      </div>
    </div>
  );
}