'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Captions from 'yet-another-react-lightbox/plugins/captions';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

// Import CSS
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/captions.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface Photo {
  id: string;
  url: string;
  original_name: string;
  uploader_name?: string;
  album_name?: string;
}

interface EnhancedLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
  showDeleteButton?: boolean;
}

export function EnhancedLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onDelete,
  showDeleteButton = false
}: EnhancedLightboxProps) {
  // Convert photos to lightbox format
  const slides = photos.map((photo) => ({
    src: photo.url,
    alt: photo.original_name,
    title: photo.original_name,
    description: photo.uploader_name ? `Uploaded by: ${photo.uploader_name}` : undefined,
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={currentIndex}
      slides={slides}
      plugins={[Captions, Fullscreen, Slideshow, Thumbnails, Zoom]}
      
      // Captions configuration
      captions={{
        showToggle: true,
        descriptionTextAlign: 'center',
      }}
      
      // Fullscreen configuration
      fullscreen={{
        auto: false,
      }}
      
      // Slideshow configuration
      slideshow={{
        autoplay: false,
        delay: 3000,
      }}
      
      // Thumbnails configuration
      thumbnails={{
        position: 'bottom',
        width: 120,
        height: 80,
        border: 2,
        borderRadius: 4,
        padding: 4,
        gap: 16,
        showToggle: true,
      }}
      
      // Zoom configuration
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      
      // Animation settings
      animation={{
        fade: 250,
        swipe: 500,
      }}
      
      // Controller settings
      controller={{
        closeOnPullDown: true,
        closeOnBackdropClick: true,
      }}
      
      // Carousel settings
      carousel={{
        finite: false,
        preload: 2,
        padding: '16px',
        spacing: '30%',
        imageFit: 'contain',
      }}
      
      // Render custom components - simplified to avoid type issues
      {...(showDeleteButton && onDelete && {
        render: {
          toolbar: () => (
            <div className="yarl__toolbar">
              <button
                type="button"
                className="yarl__button"
                onClick={() => {
                  const currentPhoto = photos[currentIndex];
                  if (currentPhoto && onDelete) {
                    onDelete(currentPhoto.id);
                  }
                }}
                aria-label="Delete image"
                style={{
                  background: 'rgba(255, 0, 0, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                🗑️ Delete
              </button>
            </div>
          ),
        } as any
      })}
    />
  );
}