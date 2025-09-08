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
      <div className={`text-center text-gray-500 ${
        isMobile ? 'py-16 px-6' : 'py-12'
      }`}>
        <div className={`${
          isMobile ? 'bg-gray-50 rounded-2xl p-8' : ''
        }`}>
          <Camera className={`mx-auto mb-4 text-gray-300 ${
            isMobile ? 'h-16 w-16' : 'h-12 w-12'
          }`} />
          <p className={`${
            isMobile ? 'text-base font-medium mb-2' : 'text-sm'
          }`}>
            Belum ada foto di album {albumName}
          </p>
          {isMobile && (albumName === "Tamu" || albumName === "Bridesmaid") && (
            <p className="text-sm text-gray-400">
              Jadilah yang pertama upload foto!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`photo-grid ${
      isMobile 
        ? 'grid-cols-2 gap-3' 
        : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    }`}>
      {albumPhotos.map((photo, index) => (
        <div 
          key={photo.id} 
          className={`relative group cursor-pointer touch-feedback ${
            isMobile ? 'rounded-xl overflow-hidden' : 'rounded-lg overflow-hidden'
          }`}
          onClick={() => onPhotoClick(index)}
        >
          <img
            src={photo.url}
            alt={photo.original_name}
            className={`w-full object-cover transition-transform duration-200 ${
              isMobile 
                ? 'h-40 group-active:scale-95' 
                : 'h-48 group-hover:scale-105'
            }`}
            loading="lazy"
          />
          
          {/* Mobile-Optimized Overlay */}
          <div className={`absolute inset-0 transition-all duration-200 flex items-end ${
            isMobile 
              ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent' 
              : 'bg-black/0 group-hover:bg-black/30'
          }`}>
            <div className={`transition-opacity duration-200 text-white ${
              isMobile 
                ? 'opacity-100 p-3 w-full' 
                : 'opacity-0 group-hover:opacity-100 flex items-center justify-center w-full h-full'
            }`}>
              <div className={`flex items-center ${
                isMobile ? 'justify-between w-full' : 'space-x-2'
              }`}>
                <div className="flex items-center space-x-2">
                  <Heart className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
                  <span className={`${isMobile ? 'text-sm font-medium' : 'text-sm'}`}>
                    {photo.likes || 0}
                  </span>
                </div>
                {isMobile && photo.uploader_name && (
                  <span className="text-xs opacity-80 truncate max-w-20">
                    {photo.uploader_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Mobile Touch Indicator */}
          {isMobile && (
            <div className="absolute top-2 right-2 bg-black/20 rounded-full p-1">
              <div className="w-2 h-2 bg-white/80 rounded-full"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}