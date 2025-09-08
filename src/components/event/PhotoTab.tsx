'use client';

import PhotoTabContent from "./PhotoTabContent";
import type { Photo } from "@/lib/database";

interface PhotoTabProps {
  albumName: string;
  eventId: string;
  photos: Photo[];
  isLoading: boolean;
  needsAccessCode: boolean;
  onPhotoClick: (index: number) => void;
}

export default function PhotoTab({ 
  albumName, 
  eventId, 
  photos, 
  isLoading, 
  needsAccessCode, 
  onPhotoClick 
}: PhotoTabProps) {
  return (
    <PhotoTabContent
      albumName={albumName}
      eventId={eventId}
      photos={photos}
      isLoading={isLoading}
      needsAccessCode={needsAccessCode}
      onPhotoClick={onPhotoClick}
    />
  );
}