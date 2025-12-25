'use client';

/**
 * Photo Detail Modal Component
 * Full-screen modal for viewing photo details with:
 * - Full-size preview with zoom
 * - Metadata display
 * - Photo actions
 * - Navigation (prev/next)
 * - Keyboard shortcuts
 * - Mobile gestures
 */

import Image from 'next/image';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  XMarkIcon as X,
  ChevronLeftIcon as ChevronLeft,
  ChevronRightIcon as ChevronRight,
  MagnifyingGlassPlusIcon as ZoomIn,
  MagnifyingGlassMinusIcon as ZoomOut,
  ArrowPathIcon as Loader2,
} from '@heroicons/react/24/outline';
import PhotoMetadata from './PhotoMetadata';
import PhotoActions from './PhotoActions';

interface Photo {
  id: string;
  filename: string;
  original_url: string;
  thumbnail_large_url: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  mime_type: string | null;
  caption: string | null;
  is_featured: boolean;
  likes_count: number;
  views_count: number;
  download_count: number;
  created_at: Date;
  exif_data?: Record<string, unknown>;
  event: {
    id: string;
    name: string;
  };
}

interface PhotoDetailModalProps {
  photo: Photo;
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPhotoChange: (index: number) => void;
  onPhotoUpdate: (updatedPhoto?: { id: string; filename: string; caption?: string }) => void;
}

export default function PhotoDetailModal({
  photo,
  photos,
  currentIndex,
  onClose,
  onPhotoChange,
  onPhotoUpdate,
}: PhotoDetailModalProps) {
  const [isLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [detailedPhoto, setDetailedPhoto] = useState<Photo | null>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null);

  // Fetch detailed photo data (including EXIF)

  const fetchPhotoDetails = useCallback(async () => {
    if (!photo?.id) return
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}`)
      if (response.ok) {
        const data = await response.json()
        setDetailedPhoto(data.photo)
      }
    } catch (error) {
      console.error('Error fetching photo details:', error)
    }
  }, [photo?.id])

  useEffect(() => {
    fetchPhotoDetails();
  }, [fetchPhotoDetails]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onPhotoChange(currentIndex - 1);
      setZoom(1);
    }
  }, [currentIndex, onPhotoChange]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onPhotoChange(currentIndex + 1);
      setZoom(1);
    }
  }, [currentIndex, photos.length, onPhotoChange]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}/download`);
      const data = await response.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
    }
  }, [photo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'd' || e.key === 'D') {
        handleDownload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrevious, handleNext, onClose, handleDownload]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Touch gestures for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0]) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          distance: 0,
        };
      } else if (e.touches.length === 2 && e.touches[0] && e.touches[1]) {
        const distance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        touchStartRef.current = {
          x: 0,
          y: 0,
          distance,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      if (e.touches.length === 2 && e.touches[0] && e.touches[1] && touchStartRef.current.distance > 0) {
        // Pinch to zoom
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDistance / touchStartRef.current.distance;
        const newZoom = Math.min(Math.max(zoom * scale, 0.5), 3);
        setZoom(newZoom);
        touchStartRef.current.distance = currentDistance;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || touchStartRef.current.distance > 0) {
        touchStartRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Swipe detection
      if (Math.abs(deltaX) > 50 && deltaY < 50) {
        if (deltaX > 0) {
          handlePrevious();
        } else {
          handleNext();
        }
      }

      touchStartRef.current = null;
    };

    const imageElement = imageRef.current;
    if (imageElement) {
      imageElement.addEventListener('touchstart', handleTouchStart);
      imageElement.addEventListener('touchmove', handleTouchMove);
      imageElement.addEventListener('touchend', handleTouchEnd);

      return () => {
        imageElement.removeEventListener('touchstart', handleTouchStart);
        imageElement.removeEventListener('touchmove', handleTouchMove);
        imageElement.removeEventListener('touchend', handleTouchEnd);
      };
    }
    return undefined;
  }, [zoom, handlePrevious, handleNext]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  const displayPhoto = detailedPhoto || photo;
  const imageUrl = displayPhoto.original_url || displayPhoto.thumbnail_large_url || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Close"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Navigation arrows */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Previous photo"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Next photo"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Photo counter */}
      <div className="absolute top-4 left-4 z-10 rounded-lg bg-black/50 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-lg bg-black/50 p-2">
        <button
          onClick={handleZoomOut}
          className="rounded p-2 text-white transition-colors hover:bg-white/20"
          disabled={zoom <= 0.5}
        >
          <ZoomOut className="h-5 w-5" />
        </button>
        <button
          onClick={handleResetZoom}
          className="rounded px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="rounded p-2 text-white transition-colors hover:bg-white/20"
          disabled={zoom >= 3}
        >
          <ZoomIn className="h-5 w-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex h-full w-full flex-col lg:flex-row">
        {/* Image preview - Better mobile height */}
        <div
          ref={imageRef}
          className="flex flex-1 items-center justify-center overflow-hidden p-4 lg:p-8 min-h-[40vh] lg:min-h-0"
        >
          {isLoading ? (
            <Loader2 className="h-12 w-12 animate-spin text-white" />
          ) : (
            <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
              <Image
                src={imageUrl}
                alt={`Photo detail: ${displayPhoto.filename}`}
                width={displayPhoto.width || 1200}
                height={displayPhoto.height || 800}
                className="max-h-full max-w-full object-contain transition-transform"
                style={{
                  transform: `scale(${zoom})`,
                  cursor: zoom > 1 ? 'grab' : 'default',
                }}
                priority
              />
            </div>
          )}
        </div>

        {/* Metadata sidebar - Scrollable on mobile */}
        <div className="w-full overflow-y-auto bg-white lg:w-96 max-h-[50vh] lg:max-h-full">
          <PhotoMetadata photo={displayPhoto} isLoading={isLoading} />
          <PhotoActions
            photo={displayPhoto}
            onUpdate={onPhotoUpdate}
            onDownload={handleDownload}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
