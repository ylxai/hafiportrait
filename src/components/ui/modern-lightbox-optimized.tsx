'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, Heart, Share2, Info, Download } from 'lucide-react';
import { OptimizedImage } from './optimized-image';
import { useDeviceDetection, useLightboxType } from '@/hooks/use-device-detection';

interface Photo {
  id: string;
  url: string;
  original_name: string;
  optimized_images?: any;
  uploader_name?: string;
  title?: string;
  description?: string;
  event_name?: string;
  created_at?: string;
}

interface ModernLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onPhotoLike?: (photoId: string) => void;
}

// Performance optimized version with lazy loading and memoization
export function ModernLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onPhotoLike,
}: ModernLightboxProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(currentIndex);
  const device = useDeviceDetection();
  const lightboxType = useLightboxType();
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<NodeJS.Timeout>();

  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Memoize current photo to prevent unnecessary re-renders
  const currentPhoto = useMemo(() => photos[currentPhotoIndex], [photos, currentPhotoIndex]);

  
  // Optimized native viewer handler
  const openNativeViewer = useCallback(() => {
    if (!currentPhoto) return;

    if (device.isIOS) {
      // iOS QuickLook integration - optimized
      const link = document.createElement('a');
      link.href = currentPhoto.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('download', currentPhoto.original_name || 'photo.jpg');
      link.click();
    } else if (device.isAndroid) {
      // Android Intent - optimized
      try {
        const intent = `intent://${currentPhoto.url}#Intent;scheme=https;package=com.android.chrome;end;`;
        window.location.href = intent;
      } catch (error) {
        // Fallback to regular download
        const link = document.createElement('a');
        link.href = currentPhoto.url;
        link.download = currentPhoto.original_name || 'photo.jpg';
        link.click();
      }
    }
  }, [currentPhoto, device]);

  // Optimized keyboard navigation with passive event listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (!isTransitioning) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigatePhoto(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigatePhoto(1);
        } else if (e.key === ' ' && device.isDesktop) {
          e.preventDefault();
          setShowInfo(prev => !prev);
        }
      }
    };

    // Use passive event listener for better performance
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isTransitioning, device.isDesktop]);

  // Optimized body scroll lock with cleanup
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = document.body.style.cssText;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.cssText = originalStyle;
      document.documentElement.style.cssText = originalStyle;
    };
  }, [isOpen]);

  // Memoized navigation function - declared before useEffect that uses it
  const navigatePhoto = useCallback((direction: number) => {
    if (isTransitioning || photos.length <= 1) return;

    setIsTransitioning(true);
    const newIndex = (currentPhotoIndex + direction + photos.length) % photos.length;
    setCurrentPhotoIndex(newIndex);
    setProgress(0);
    setShowInfo(false);

    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      setTimeout(() => setIsTransitioning(false), 300);
    });
  }, [currentPhotoIndex, photos.length, isTransitioning]);

  // Optimized progress animation with cleanup
  useEffect(() => {
    if (!isOpen || lightboxType !== 'stories' || device.prefersReducedMotion) return;

    const animateProgress = () => {
      setProgress(prev => {
        if (prev >= 100) {
          navigatePhoto(1);
          return 0;
        }
        return prev + 2;
      });
    };

    progressRef.current = setInterval(animateProgress, 100);
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [isOpen, lightboxType, device.prefersReducedMotion, navigatePhoto]);

  // Memoized interaction handlers
  const handleLike = useCallback(() => {
    if (!currentPhoto) return;

    setLikedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentPhoto.id)) {
        newSet.delete(currentPhoto.id);
      } else {
        newSet.add(currentPhoto.id);
      }
      return newSet;
    });

    onPhotoLike?.(currentPhoto.id);
  }, [currentPhoto, onPhotoLike]);

  const handleShare = useCallback(async () => {
    if (!currentPhoto) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPhoto.title || 'Photo from HafiPortrait',
          text: currentPhoto.description || 'Check out this amazing photo!',
          url: currentPhoto.url,
        });
      } catch (err) {
        // Silent fail for user cancellation
        if ((err as Error).name !== 'AbortError') {
          console.log('Share failed:', err);
        }
      }
    } else {
      // Fallback - copy to clipboard with feedback
      try {
        await navigator.clipboard.writeText(currentPhoto.url);
        // Visual feedback could be added here
      } catch (err) {
        console.log('Clipboard access failed:', err);
      }
    }
  }, [currentPhoto]);

  const handleDownload = useCallback(() => {
    if (!currentPhoto) return;

    const link = document.createElement('a');
    link.href = currentPhoto.url;
    link.download = currentPhoto.original_name || `photo-${currentPhoto.id}.jpg`;
    link.click();
  }, [currentPhoto]);

  // Optimized pan handler with threshold
  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (lightboxType !== 'stories' || device.prefersReducedMotion) return;

    const { offset, velocity } = info;
    const threshold = device.isMobile ? 80 : 120;

    if (Math.abs(offset.y) > threshold || Math.abs(velocity.y) > 400) {
      if (offset.y < 0) {
        navigatePhoto(1);
      } else {
        navigatePhoto(-1);
      }
    }
  }, [lightboxType, navigatePhoto, device.isMobile, device.prefersReducedMotion]);

  // Accessibility enhancements
  const getAriaLabel = useCallback((index: number) => {
    const photo = photos[index];
    return photo?.title || photo?.original_name || `Photo ${index + 1} of ${photos.length}`;
  }, [photos]);

  // Early return if not open or no photos
  if (!isOpen || !currentPhoto || photos.length === 0) return null;

  // Simplified UI for reduced motion preferences
  if (device.prefersReducedMotion) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-4">
        <div className="max-w-full max-h-full">
          <img
            src={currentPhoto.url}
            alt={getAriaLabel(currentPhotoIndex)}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded"
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] bg-black overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget && device.isDesktop) {
            onClose();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Image lightbox"
      >
        {/* Progress indicators for stories mode */}
        {lightboxType === 'stories' && !device.prefersReducedMotion && (
          <div className="absolute top-4 left-4 right-4 z-30 flex gap-1" role="progressbar">
            {photos.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: index === currentPhotoIndex ? `${progress}%` : '0%' }}
                  animate={{ width: index === currentPhotoIndex ? `${progress}%` : '0%' }}
                  transition={{ duration: 0.1 }}
                  aria-valuenow={index === currentPhotoIndex ? progress : 0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            ))}
          </div>
        )}

        {/* Main photo container with optimized drag */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center p-4"
          drag={lightboxType === 'stories' && !device.prefersReducedMotion ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handlePan}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <motion.div
            key={currentPhoto.id}
            initial={{
              opacity: 0,
              scale: 0.8,
              y: lightboxType === 'stories' ? 100 : 0
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 1.1,
              y: lightboxType === 'stories' ? -100 : 0
            }}
            transition={{
              duration: device.prefersReducedMotion ? 0 : 0.3,
              ease: lightboxType === 'stories' ? 'easeInOut' : 'easeOut'
            }}
            className="max-w-full max-h-full cursor-pointer"
            onClick={device.isMobile ? openNativeViewer : undefined}
            role="button"
            tabIndex={0}
            aria-label={getAriaLabel(currentPhotoIndex)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                device.isMobile && openNativeViewer();
              }
            }}
          >
            {currentPhoto.optimized_images ? (
              <OptimizedImage
                images={currentPhoto.optimized_images}
                alt={getAriaLabel(currentPhotoIndex)}
                usage="lightbox"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                priority={true}
              />
            ) : (
              <img
                src={currentPhoto.url}
                alt={getAriaLabel(currentPhotoIndex)}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                loading="eager"
                decoding="async"
              />
            )}
          </motion.div>
        </motion.div>

        {/* Navigation controls */}
        {device.isDesktop && photos.length > 1 && (
          <>
            <motion.button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigatePhoto(-1)}
              aria-label="Previous photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <motion.button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigatePhoto(1)}
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </>
        )}

        {/* Close button */}
        <motion.button
          className="absolute top-4 right-4 z-30 bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-all"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Bottom actions with optimized animations */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 z-20 ${
            device.isMobile ? 'pb-safe' : ''
          }`}
          initial={{ y: 100 }}
          animate={{ y: showInfo || device.isMobile ? 0 : 100 }}
          transition={{
            type: 'spring',
            damping: device.prefersReducedMotion ? 0 : 25,
            stiffness: device.prefersReducedMotion ? 0 : 200
          }}
        >
          {/* Photo information */}
          <div className="text-white mb-4">
            <h3 className="text-lg font-semibold mb-1">
              {currentPhoto.title || currentPhoto.original_name}
            </h3>
            {currentPhoto.event_name && (
              <p className="text-sm text-white/70 mb-1">{currentPhoto.event_name}</p>
            )}
            {currentPhoto.description && (
              <p className="text-sm text-white/80">{currentPhoto.description}</p>
            )}
            {currentPhoto.created_at && (
              <time
                className="text-xs text-white/60 mt-2 block"
                dateTime={currentPhoto.created_at}
              >
                {new Date(currentPhoto.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-around" role="group">
            <motion.button
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: device.prefersReducedMotion ? 1 : 1.1 }}
              whileTap={{ scale: device.prefersReducedMotion ? 1 : 0.9 }}
              onClick={handleLike}
              aria-label={likedPhotos.has(currentPhoto.id) ? 'Unlike photo' : 'Like photo'}
            >
              <Heart
                className={`w-6 h-6 ${likedPhotos.has(currentPhoto.id) ? 'fill-red-500 text-red-500' : ''}`}
                aria-hidden="true"
              />
              <span className="text-xs">Like</span>
            </motion.button>

            <motion.button
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: device.prefersReducedMotion ? 1 : 1.1 }}
              whileTap={{ scale: device.prefersReducedMotion ? 1 : 0.9 }}
              onClick={handleShare}
              aria-label="Share photo"
            >
              <Share2 className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs">Share</span>
            </motion.button>

            <motion.button
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: device.prefersReducedMotion ? 1 : 1.1 }}
              whileTap={{ scale: device.prefersReducedMotion ? 1 : 0.9 }}
              onClick={handleDownload}
              aria-label="Download photo"
            >
              <Download className="w-6 h-6" aria-hidden="true" />
              <span className="text-xs">Download</span>
            </motion.button>

            {device.isDesktop && (
              <motion.button
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
                whileHover={{ scale: device.prefersReducedMotion ? 1 : 1.1 }}
                whileTap={{ scale: device.prefersReducedMotion ? 1 : 0.9 }}
                onClick={() => setShowInfo(prev => !prev)}
                aria-label={showInfo ? 'Hide photo info' : 'Show photo info'}
              >
                <Info className="w-6 h-6" aria-hidden="true" />
                <span className="text-xs">Info</span>
              </motion.button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center mt-4 text-xs text-white/60">
            <p>
              {device.isMobile
                ? (lightboxType === 'stories'
                    ? 'Swipe vertikal untuk navigasi • Ketuk foto untuk native viewer'
                    : 'Swipe horizontal untuk navigasi • Ketuk foto untuk native viewer')
                : 'Gunakan panah untuk navigasi • Ketuk foto untuk native viewer • ESC untuk tutup'
              }
            </p>
          </div>
        </motion.div>

        {/* Photo counter */}
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white px-3 py-1 rounded-full text-sm"
          role="status"
          aria-live="polite"
        >
          {currentPhotoIndex + 1} / {photos.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}