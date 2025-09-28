'use client';

import { useState } from "react";
import dynamic from 'next/dynamic';
import { Camera } from "lucide-react";
import { type Photo } from "@/lib/database";
import { useSectionScrollAnimations } from "@/hooks/use-scroll-animations";

import { OptimizedImage } from "./ui/optimized-image";

// Dynamically import heavy, interactive components to ensure they only run on the client
const SwiperGallery = dynamic(() => 
  import('./ui/swiper-gallery').then(mod => mod.SwiperGallery), 
  { 
    ssr: false,
    loading: () => <div className="w-full h-64 bg-gray-200 rounded-lg" />
  }
);

const IPhoneLightbox = dynamic(() => 
  import('./ui/iphone-lightbox').then(mod => mod.IPhoneLightbox), 
  { 
    ssr: false,
    loading: () => null
  }
);
 


interface GallerySectionProps {
  photos: Photo[];
}

export default function GallerySection({ photos }: GallerySectionProps) {
  // State untuk lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  

  // Simplified refs without scroll animations
  const sectionRef = null;
  const photosContainerRef = null;

  
  // Fungsi untuk membuka lightbox
  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };


  return (
    <section 
      ref={sectionRef}
      id="gallery" 
      className="py-12 bg-gray-50 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {!photos || photos.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada foto di galeri homepage.</p>
          </div>
        )}

        {photos && photos.length > 0 && (
          <>
            {/* Swiper Gallery - Auto-playing carousel */}
            <SwiperGallery 
              photos={photos} 
              onPhotoClick={openLightbox}
            />

            {/* Section Title for Masonry */}
            <div className="text-center my-8 border-t border-gray-200 pt-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-pink-500 to-green-400">Gallery</span>
              </h3>
            </div>

            
            {/* Modern Responsive Grid Gallery */}
            <div
              ref={photosContainerRef as any}
              className="modern-grid-gallery grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 bg-gray-50 p-3 md:p-4 rounded-lg"
            >
              {photos.map((photo, index) => {
                // Dynamic tile sizes for visual interest
                const tileSizes = [
                  'aspect-square',      // Square tiles
                  'aspect-[4/5]',      // Portrait tiles
                  'aspect-[3/4]',      // Slightly portrait
                  'aspect-square',      // Square tiles
                  'aspect-[5/4]',      // Landscape tiles
                ];

                const tileIndex = index % tileSizes.length;
                return (
                  <div
                    key={photo.id}
                    className="relative group overflow-hidden rounded-lg md:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => openLightbox(index)}
                  >
                    <div className={`w-full h-full overflow-hidden ${tileSizes[tileIndex]}`}>
                      {photo.optimized_images ? (
                        <OptimizedImage
                          images={photo.optimized_images}
                          alt={photo.original_name || 'Gallery Photo'}
                          usage="gallery"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading={index < 8 ? 'eager' : 'lazy'}
                          priority={index < 4}
                        />
                      ) : (
                        <img
                          src={photo.url}
                          alt={photo.original_name || 'Gallery Photo'}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading={index < 8 ? 'eager' : 'lazy'}
                        />
                      )}
                    </div>

                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Hover actions */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 md:p-3 shadow-lg">
                          <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>


                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>


      {/* iPhone-Style Lightbox for Homepage Gallery */}
      {isLightboxOpen && photos && (
        <IPhoneLightbox
          photos={photos}
          currentIndex={currentPhotoIndex}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}
