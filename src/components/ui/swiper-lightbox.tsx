'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Zoom, Thumbs, FreeMode, Keyboard } from 'swiper/modules';
import { useState } from 'react';
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

  if (!isOpen || !photos.length) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header with close button */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={onClose}
          className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Swiper */}
      <div className="flex-1 flex items-center justify-center p-4">
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
              maxRatio: 3,
              minRatio: 1,
              toggle: true,
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
              <SwiperSlide key={photo.id} className="flex items-center justify-center">
                <div className="swiper-zoom-container w-full h-full flex items-center justify-center">
                  {photo.optimized_images ? (
                    <OptimizedImage
                      images={photo.optimized_images}
                      alt={photo.original_name || 'Gallery Photo'}
                      usage="lightbox"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.original_name || 'Gallery Photo'}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons */}
          {photos.length > 1 && (
            <>
              <div className="lightbox-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              
              <div className="lightbox-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300">
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
        <div className="h-24 md:h-32 px-4 pb-4">
          <Swiper
            modules={[FreeMode, Thumbs]}
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView={4}
            freeMode={true}
            watchSlidesProgress={true}
            className="h-full"
            breakpoints={{
              640: { slidesPerView: 6, spaceBetween: 10 },
              768: { slidesPerView: 8, spaceBetween: 12 },
              1024: { slidesPerView: 10, spaceBetween: 16 }
            }}
          >
            {photos.map((photo) => (
              <SwiperSlide key={`thumb-${photo.id}`} className="cursor-pointer">
                <div className="w-full h-full rounded-lg overflow-hidden border-2 border-transparent hover:border-white/50 transition-colors">
                  {photo.optimized_images ? (
                    <OptimizedImage
                      images={photo.optimized_images}
                      alt={photo.original_name || 'Thumbnail'}
                      usage="thumbnail"
                      className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <img 
                      src={photo.url} 
                      alt={photo.original_name || 'Thumbnail'}
                      className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                    />
                  )}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Pagination */}
      <div className="lightbox-pagination absolute bottom-4 left-1/2 -translate-x-1/2 z-10"></div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 text-white/60 text-sm hidden md:block">
        <p>Use arrow keys to navigate • Double-click to zoom • ESC to close</p>
      </div>
    </div>
  );
}