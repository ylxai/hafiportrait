'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom, Thumbs, FreeMode, Keyboard } from 'swiper/modules';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { OptimizedImage } from './optimized-image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import 'swiper/css/thumbs';

interface Photo {
  id: string;
  url: string;
  original_name: string;
  optimized_images?: any;
  uploader_name?: string;
}

interface SwiperLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function SwiperLightbox({ photos, currentIndex, isOpen, onClose }: SwiperLightboxProps) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);

  // Body scroll lock effect
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // ESC key handler
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEsc);
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = 'unset';
        document.documentElement.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !photos.length) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black flex flex-col"
      style={{ 
        height: '100vh', 
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden'
      }}
      onClick={(e) => {
        // Close on backdrop click
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Header with close button */}
      <div className="absolute top-4 right-4 z-30 safe-top">
        <button 
          onClick={onClose}
          className="bg-black/70 hover:bg-black/90 text-white p-3 rounded-full transition-colors shadow-lg backdrop-blur-sm"
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Swiper Container */}
      <div className="flex-1 flex items-center justify-center p-4 pb-32 relative">
        <div className="w-full h-full max-w-6xl">
          <Swiper
            modules={[Navigation, Pagination, Zoom, Thumbs, Keyboard]}
            initialSlide={currentIndex}
            spaceBetween={10}
            slidesPerView={1}
            navigation={{
              nextEl: '.lightbox-button-next',
              prevEl: '.lightbox-button-prev',
            }}
            pagination={{ 
              clickable: true,
              dynamicBullets: true,
              el: '.lightbox-pagination'
            }}
            zoom={{
              maxRatio: 2,
              minRatio: 1,
              toggle: true,
              containerClass: 'swiper-zoom-container',
            }}
            thumbs={{ 
              swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null 
            }}
            keyboard={{
              enabled: true,
              onlyInViewport: false,
            }}
            className="h-full w-full"
            loop={photos.length > 1}
          >
            {photos.map((photo) => (
              <SwiperSlide key={photo.id} className="flex items-center justify-center h-full">
                <div className="swiper-zoom-container flex items-center justify-center w-full h-full">
                  {photo.optimized_images ? (
                    <OptimizedImage
                      images={photo.optimized_images}
                      alt={photo.original_name || 'Gallery Photo'}
                      usage="lightbox"
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.original_name || 'Gallery Photo'}
                      className="max-w-full max-h-full w-auto h-auto object-contain"
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                    />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <div className="lightbox-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              
              <div className="lightbox-button-next absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Thumbnails Swiper */}
      {photos.length > 1 && (
        <div className="h-20 md:h-24 px-4 pb-safe">
          <Swiper
            modules={[FreeMode, Thumbs]}
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            className="h-full"
            centeredSlides={true}
            breakpoints={{
              640: { slidesPerView: 6, spaceBetween: 10 },
              768: { slidesPerView: 8, spaceBetween: 12 },
              1024: { slidesPerView: 10, spaceBetween: 16 }
            }}
          >
            {photos.map((photo) => (
              <SwiperSlide key={`thumb-${photo.id}`} className="cursor-pointer">
                <div className="w-full h-full rounded-lg overflow-hidden border-2 border-transparent hover:border-white/80 transition-all duration-200">
                  {photo.optimized_images ? (
                    <OptimizedImage
                      images={photo.optimized_images}
                      alt={photo.original_name || 'Thumbnail'}
                      usage="thumbnail"
                      className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-200"
                    />
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.original_name || 'Thumbnail'}
                      className="w-full h-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-200"
                    />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Pagination */}
      <div className="lightbox-pagination absolute bottom-28 md:bottom-32 left-1/2 -translate-x-1/2 z-20"></div>

      {/* Instructions */}
      <div className="absolute bottom-28 md:bottom-32 left-4 text-white/70 text-xs md:text-sm hidden md:block">
        <p>Gunakan panah untuk navigasi • Klik 2x untuk zoom • ESC untuk tutup</p>
      </div>

      {/* Mobile Instructions */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 text-white/60 text-xs block md:hidden">
        <p>Ketuk 2x untuk zoom • Swipe untuk navigasi</p>
      </div>
    </div>
  );
}