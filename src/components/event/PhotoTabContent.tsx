'use client';

import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import PhotoUploadForm from "@/components/event/PhotoUploadForm";
import PhotoGallery from "@/components/event/PhotoGallery";
import { PhotoErrorBoundary, UploadErrorBoundary } from "@/components/error";
import { UploadFormSkeleton, PhotoGridSkeleton } from "@/components/ui/enhanced-skeleton";
import type { Photo } from "@/lib/database";

interface PhotoTabContentProps {
  albumName: string;
  eventId: string;
  photos: Photo[];
  isLoading: boolean;
  needsAccessCode: boolean;
  onPhotoClick: (index: number) => void;
  showUploadForm?: boolean;
}

export default function PhotoTabContent({ 
  albumName, 
  eventId, 
  photos, 
  isLoading, 
  needsAccessCode, 
  onPhotoClick,
  showUploadForm = true
}: PhotoTabContentProps) {
  const isMobile = useIsMobile();

  const getAlbumDescription = (album: string) => {
    switch (album) {
      case "Official":
        return "Foto resmi dari fotografer acara";
      case "Tamu":
        return "Upload dan lihat foto dari para tamu";
      case "Bridesmaid":
        return "Album khusus untuk para bridesmaid";
      default:
        return "";
    }
  };

  // Show skeleton for entire tab content if loading
  if (isLoading) {
    return (
      <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
        {/* Header skeleton */}
        <div className="text-center space-y-2">
          <div className={`mx-auto bg-gray-200 rounded animate-pulse ${isMobile ? 'h-6 w-32' : 'h-8 w-40'}`} />
          <div className={`mx-auto bg-gray-200 rounded animate-pulse ${isMobile ? 'h-4 w-48' : 'h-5 w-56'}`} />
        </div>

        {/* Upload form skeleton for guest albums */}
        {showUploadForm && (albumName === "Tamu" || albumName === "Bridesmaid") && !needsAccessCode && (
          <UploadFormSkeleton />
        )}
        
        {/* Photo grid skeleton */}
        <PhotoGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <div className={isMobile ? 'space-y-4' : 'space-y-6'}>
      <div className="text-center">
        <h2 className={`font-bold mb-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          Foto {albumName}
        </h2>
        <p className={`text-gray-600 mb-4 ${isMobile ? 'text-sm' : 'mb-6'}`}>
          {getAlbumDescription(albumName)}
        </p>
      </div>

      {/* Upload Form - Only for Tamu and Bridesmaid */}
      {showUploadForm && (albumName === "Tamu" || albumName === "Bridesmaid") && !needsAccessCode && (
        <UploadErrorBoundary albumName={albumName}>
          <Card className={`${isMobile ? 'mobile-card mobile-padding' : 'p-4 sm:p-6'}`}>
            <PhotoUploadForm 
              eventId={eventId}
              albumName={albumName}
              disabled={false}
            />
          </Card>
        </UploadErrorBoundary>
      )}
      
      {/* Photo Gallery */}
      <PhotoErrorBoundary albumName={albumName}>
        <PhotoGallery
          photos={photos}
          albumName={albumName}
          isLoading={false} // We handle loading at tab level
          onPhotoClick={onPhotoClick}
        />
      </PhotoErrorBoundary>
    </div>
  );
}