'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

export function ModernLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onPhotoLike,
}: ModernLightboxProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(currentIndex);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const device = useDeviceDetection();
  const lightboxType = useLightboxType();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentPhotoIndex];

  // Handle native viewer for mobile
  const openNativeViewer = useCallback(() => {
    if (device.isIOS) {
      // iOS QuickLook integration
      const link = document.createElement('a');
      link.href = currentPhoto.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } else if (device.isAndroid) {
      // Android Intent
      const intent = `intent://${currentPhoto.url}#Intent;scheme=https;package=com.android.chrome;end;`;
      window.location.href = intent;
    }
  }, [currentPhoto, device]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (!isTransitioning) {
            navigatePhoto(-1);
          }
          break;
        case 'ArrowRight':
          if (!isTransitioning) {
            navigatePhoto(1);
          }
          break;
        case ' ':
          if (device.isDesktop) {
            e.preventDefault();
            setShowInfo(!showInfo);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isTransitioning, showInfo, device.isDesktop]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Progress animation for stories-style
  useEffect(() => {
    if (!isOpen || lightboxType !== 'stories') return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          navigatePhoto(1);
          return 0;
        }
        return prev + 2; // 2% per 100ms = 50s per photo
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, lightboxType]);

  const navigatePhoto = useCallback((direction: number) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    const newIndex = (currentPhotoIndex + direction + photos.length) % photos.length;
    setCurrentPhotoIndex(newIndex);
    setProgress(0);
    setShowInfo(false);

    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentPhotoIndex, photos.length, isTransitioning]);

  const handleLike = useCallback(() => {
    if (!currentPhoto) return;

    const newLikedPhotos = new Set(likedPhotos);
    if (newLikedPhotos.has(currentPhoto.id)) {
      newLikedPhotos.delete(currentPhoto.id);
    } else {
      newLikedPhotos.add(currentPhoto.id);
    }
    setLikedPhotos(newLikedPhotos);
    onPhotoLike?.(currentPhoto.id);
  }, [currentPhoto, likedPhotos, onPhotoLike]);

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
        console.log('Share cancelled:', err);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(currentPhoto.url);
    }
  }, [currentPhoto]);

  const handleDownload = useCallback(() => {
    if (!currentPhoto) return;

    const link = document.createElement('a');
    // Use original API endpoint for download to get uncompressed file
    link.href = `/api/photos/${currentPhoto.id}/original`;
    link.download = currentPhoto.original_name || `photo-${currentPhoto.id}.jpg`;
    link.target = '_blank'; // Open in new tab to handle potential redirects
    link.click();
  }, [currentPhoto]);

  const handlePan = useCallback((event: any, info: PanInfo) => {
    if (lightboxType !== 'stories') return;

    const { offset, velocity } = info;

    if (Math.abs(offset.y) > 100 || Math.abs(velocity.y) > 500) {
      if (offset.y < 0) {
        navigatePhoto(1); // Swipe up - next photo
      } else {
        navigatePhoto(-1); // Swipe down - previous photo
      }
    }
  }, [lightboxType, navigatePhoto]);

  if (!isOpen || !currentPhoto) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget && device.isDesktop) {
            onClose();
          }
        }}
      >
        {/* Stories-style progress indicators */}
        {lightboxType === 'stories' && (
          <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
            {photos.map((_, index) => (
              <div key={index} className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: index === currentPhotoIndex ? `${progress}%` : '0%' }}
                  animate={{ width: index === currentPhotoIndex ? `${progress}%` : '0%' }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Main photo container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center p-4"
          drag={lightboxType === 'stories' ? 'y' : false}
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
              duration: 0.3,
              ease: lightboxType === 'stories' ? 'easeInOut' : 'easeOut'
            }}
            className="max-w-full max-h-full"
          >
            {currentPhoto.optimized_images ? (
              <OptimizedImage
                images={currentPhoto.optimized_images}
                alt={currentPhoto.original_name || 'Gallery Photo'}
                usage="lightbox"
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                onClick={device.isMobile ? openNativeViewer : undefined}
              />
            ) : (
              <img
                src={currentPhoto.url}
                alt={currentPhoto.original_name || 'Gallery Photo'}
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg"
                onClick={device.isMobile ? openNativeViewer : undefined}
              />
            )}
          </motion.div>
        </motion.div>

        {/* Navigation buttons (desktop only) */}
        {device.isDesktop && photos.length > 1 && (
          <>
            <motion.button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigatePhoto(-1)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <motion.button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigatePhoto(1)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        >
          <X className="w-6 h-6" />
        </motion.button>

        {/* Bottom actions sheet */}
        <motion.div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 z-20 ${
            device.isMobile ? 'pb-safe' : ''
          }`}
          initial={{ y: 100 }}
          animate={{ y: showInfo || device.isMobile ? 0 : 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Photo info */}
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
              <p className="text-xs text-white/60 mt-2">
                {new Date(currentPhoto.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-around">
            <motion.button
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
            >
              <Heart
                className={`w-6 h-6 ${likedPhotos.has(currentPhoto.id) ? 'fill-red-500 text-red-500' : ''}`}
              />
              <span className="text-xs">Like</span>
            </motion.button>

            <motion.button
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleShare}
            >
              <Share2 className="w-6 h-6" />
              <span className="text-xs">Share</span>
            </motion.button>

            <motion.button
              className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDownload}
            >
              <Download className="w-6 h-6" />
              <span className="text-xs">Download</span>
            </motion.button>

            {device.isDesktop && (
              <motion.button
                className="flex flex-col items-center gap-1 text-white/80 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowInfo(!showInfo)}
              >
                <Info className="w-6 h-6" />
                <span className="text-xs">Info</span>
              </motion.button>
            )}
          </div>

          {/* Desktop instructions */}
          {device.isDesktop && (
            <div className="text-center mt-4 text-xs text-white/60">
              <p>Gunakan panah untuk navigasi • Ketuk foto untuk native viewer • ESC untuk tutup</p>
            </div>
          )}

          {/* Mobile instructions */}
          {device.isMobile && (
            <div className="text-center mt-4 text-xs text-white/60">
              <p>
                {lightboxType === 'stories'
                  ? 'Swipe vertikal untuk navigasi • Ketuk foto untuk native viewer'
                  : 'Swipe horizontal untuk navigasi • Ketuk foto untuk native viewer'}
              </p>
            </div>
          )}
        </motion.div>

        {/* Photo counter */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {currentPhotoIndex + 1} / {photos.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}