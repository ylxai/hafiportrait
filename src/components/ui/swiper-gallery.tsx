'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow, Pagination, FreeMode } from 'swiper/modules';
import { OptimizedImage } from './optimized-image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface Photo {
  id: string;
  url: string;
  original_name: string;
  optimized_images?: any;
}

interface SwiperGalleryProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export function SwiperGallery({ photos, onPhotoClick }: SwiperGalleryProps) {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="swiper-gallery-container mb-16">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 20,
          stretch: 0,
          depth: 50,
          modifier: 0.8,
          slideShadows: false,
        }}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        loop={true}
        speed={800}
        touchRatio={1.2}
        touchAngle={45}
        simulateTouch={true}
        allowTouchMove={true}
        touchStartPreventDefault={false}
        touchMoveStopPropagation={false}
        freeMode={{
          enabled: true,
          momentum: true,
          momentumRatio: 0.6,
          momentumVelocityRatio: 0.6,
          sticky: true,
        }}
        resistance={true}
        resistanceRatio={0.85}
        watchSlidesProgress={true}
        modules={[EffectCoverflow, Pagination, Autoplay, FreeMode]}
        className="gallery-swiper"
        breakpoints={{
          320: {
            slidesPerView: 2.2,
            spaceBetween: 15,
          },
          640: {
            slidesPerView: 3.5,
            spaceBetween: 20,
          },
          768: {
            slidesPerView: 4.5,
            spaceBetween: 25,
          },
          1024: {
            slidesPerView: 6,
            spaceBetween: 30,
          },
        }}
      >
        {photos.map((photo, index) => (
          <SwiperSlide 
            key={photo.id}
            className="swiper-slide-gallery"
          >
            <div 
              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-[3/4] shadow-md hover:shadow-lg transition-all duration-300"
              onClick={() => onPhotoClick(index)}
            >
              {photo.optimized_images ? (
                <OptimizedImage
                  images={photo.optimized_images}
                  alt={photo.original_name || 'Gallery Photo'}
                  usage="gallery"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.original_name || 'Gallery Photo'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* View icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}