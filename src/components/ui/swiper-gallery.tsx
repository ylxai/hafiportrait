'use client';

import { OptimizedImage } from './optimized-image';

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

  // Duplicate photos untuk infinite scroll effect
  const duplicatedPhotos = [...photos, ...photos, ...photos];

  return (
    <div className="photo-strip-container mb-16 overflow-hidden">
      {/* Single Photo Strip - Left to Right (Slower) */}
      <div className="photo-strip-wrapper">
        <div className="photo-strip photo-strip-slow">
          {duplicatedPhotos.map((photo, index) => (
            <div 
              key={`strip-${photo.id}-${index}`}
              className="photo-strip-item"
              onClick={() => onPhotoClick(index % photos.length)}
            >
              {photo.optimized_images ? (
                <OptimizedImage
                  images={photo.optimized_images}
                  alt={photo.original_name || 'Gallery Photo'}
                  usage="gallery"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={photo.url}
                  alt={photo.original_name || 'Gallery Photo'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}