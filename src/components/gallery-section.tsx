'use client'; // Tetap gunakan ini karena ada hooks seperti useQuery

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { type Photo } from "@/lib/database";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animations";

import { BasicLightbox } from "./ui/basic-lightbox";
import { SwiperGallery } from "./ui/swiper-gallery";
import { SwiperLightbox } from "./ui/swiper-lightbox";
import { OptimizedImage } from "./ui/optimized-image";
 

// --- BAGIAN INI UNTUK FRAMER-MOTION YANG DINONAKTIFKAN (SEBELUMNYA AKAN DIKEMBALIKAN JIKA ANDA INGIN ANIMASI) ---
// import { motion, Easing } from "framer-motion"; 
// const easeOutCubicBezier: Easing = [0, 0, 0.58, 1];
// const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2, }, }, };
// const itemVariants = { hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutCubicBezier, }, }, };
// ----------------------------------------------------------------------------------------------------

export default function GallerySection() {
  // State untuk lightbox dengan enhanced lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Scroll animations
  const { elementRef: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.1 });
  const { elementRef: titleRef, isVisible: titleVisible } = useScrollAnimation({ threshold: 0.3 });

  // Mengembalikan data fetching dari API untuk galeri homepage
  const { data: photos, isLoading, isError } = useQuery<Photo[]>({
    queryKey: ['homepagePhotos'],
    queryFn: async () => {
      const response = await fetch('/api/photos/homepage');
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }
      return response.json();
    },
  });

  console.log("GallerySection: Status Render", {
    isLoading,
    isError,
    photosLength: photos?.length,
    photosData: photos
  });

  // Fungsi untuk membuka lightbox
  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  // Dummy handlers untuk PhotoLightbox (masih dipertahankan jika Anda ingin mengintegrasikan lightbox nanti)
  const handlePhotoLike = (photoId: string) => {
    console.log(`Like action for photo: ${photoId} (Not implemented on homepage)`);
  };

  // Staggered animation untuk photos
  const { containerRef: photosContainerRef, visibleItems } = useStaggeredAnimation(photos?.length || 6, 150);

  return (
    <section 
      ref={sectionRef}
      id="gallery" 
      className={`py-20 bg-[var(--color-bg-secondary)] relative overflow-hidden scroll-reveal ${isVisible ? 'revealed' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div 
          ref={titleRef}
          className={`text-center mb-16 scroll-reveal ${titleVisible ? 'revealed' : ''}`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-4 text-reveal">
            <span className="text-reveal-inner">Galeri Kami</span>
          </h2>
        </div>
        
        {isLoading && (
          <div className="space-y-6">
            {/* Mobile-optimized gallery loading */}
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isError && (
          <div className="text-center py-8 text-red-500">
            <p>Gagal memuat foto galeri. Silakan coba lagi nanti.</p>
          </div>
        )}

        {!isLoading && !isError && (!photos || photos.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <Camera className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada foto di galeri homepage.</p>
          </div>
        )}

        {!isLoading && !isError && photos && photos.length > 0 && (
          <>
            {/* Swiper Gallery - Auto-playing carousel */}
            <SwiperGallery 
              photos={photos} 
              onPhotoClick={openLightbox}
            />

            {/* Photo Grid - Traditional grid layout */}
            <div 
              ref={photosContainerRef}
              className="photo-grid"
            >
              {photos.map((photo, index) => ( 
                <div 
                  key={photo.id} 
                  className={`relative group overflow-hidden rounded-lg shadow-md cursor-pointer hover-lift magnetic scroll-reveal-stagger ${visibleItems[index] ? 'revealed' : ''}`}
                  onClick={() => openLightbox(index)}
                >
                  {photo.optimized_images ? (
                    <OptimizedImage
                      images={photo.optimized_images}
                      alt={photo.original_name || 'Gallery Photo'}
                      usage="gallery"
                      className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
                      loading={index < 6 ? 'eager' : 'lazy'}
                      priority={index < 3}
                    />
                  ) : (
                    <img
                      src={photo.url}
                      alt={photo.original_name || 'Gallery Photo'}
                      className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
                      loading={index < 6 ? 'eager' : 'lazy'}
                    />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Swiper Lightbox untuk Homepage */}
      {isLightboxOpen && photos && (
        <SwiperLightbox
          photos={photos}
          currentIndex={currentPhotoIndex}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
        />
      )}
    </section>
  );
}
