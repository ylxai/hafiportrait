'use client';

import { Camera, Heart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { PhotoGridSkeleton } from "@/components/ui/enhanced-skeleton";
import type { Photo } from "@/lib/database";

interface PhotoGalleryProps {
  photos: Photo[];
  albumName: string;
  isLoading: boolean;
  onPhotoClick: (index: number) => void;
}

export default function PhotoGallery({ photos, albumName, isLoading, onPhotoClick }: PhotoGalleryProps) {
  const isMobile = useIsMobile();
  const albumPhotos = photos.filter(p => p.album_name === albumName);
  
  if (isLoading) {
    return <PhotoGridSkeleton count={8} />;
  }

  if (albumPhotos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-16 px-6 sm:py-12 sm:px-0">
        <div className="bg-gray-50 rounded-2xl p-8 sm:bg-transparent sm:rounded-none sm:p-0">
          <Camera className="mx-auto mb-4 text-gray-300 h-16 w-16 sm:h-12 sm:w-12" />
          <p className="text-base font-medium mb-2 sm:text-sm sm:font-normal sm:mb-0">
            Belum ada foto di album {albumName}
          </p>
          {(albumName === "Tamu" || albumName === "Bridesmaid") && (
            <p className="text-sm text-gray-400 sm:hidden">
              Jadilah yang pertama upload foto!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {albumPhotos.map((photo, index) => (
        <div 
          key={photo.id} 
          className="relative group cursor-pointer rounded-lg overflow-hidden touch-manipulation active:scale-95 transition-transform duration-150 sm:hover:scale-105 sm:active:scale-100"
          onClick={() => onPhotoClick(index)}
        >
          <img
            src={photo.url}
            alt={photo.original_name}
            className="w-full h-40 sm:h-48 object-cover"
            loading="lazy"
          />
          
          {/* Responsive Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent sm:bg-black/0 sm:group-hover:bg-black/30 transition-all duration-200 flex items-end">
            <div className="text-white opacity-100 p-3 w-full sm:opacity-0 sm:group-hover:opacity-100 sm:flex sm:items-center sm:justify-center sm:h-full transition-opacity duration-200">
              <div className="flex items-center justify-between w-full sm:justify-center sm:space-x-2">
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm font-medium sm:font-normal">
                    {photo.likes || 0}
                  </span>
                </div>
                {photo.uploader_name && (
                  <span className="text-xs opacity-80 truncate max-w-20 sm:hidden">
                    {photo.uploader_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Touch Indicator - Mobile Only */}
          <div className="absolute top-2 right-2 bg-black/20 rounded-full p-1 sm:hidden">
            <div className="w-2 h-2 bg-white/80 rounded-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
}