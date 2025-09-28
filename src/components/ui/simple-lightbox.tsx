'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';

interface Photo {
  id: string;
  url: string;
  original_name: string;
  uploader_name?: string;
  album_name?: string;
}

interface SimpleLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose
}: SimpleLightboxProps) {
  // Convert photos to lightbox format
  const slides = photos.map((photo) => ({
    src: photo.url,
    alt: photo.original_name,
    title: photo.original_name,
    description: photo.uploader_name ? `Uploaded by: ${photo.uploader_name}` : undefined,
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      index={currentIndex}
      slides={slides}
      
      // Animation settings
      animation={{
        fade: 250,
        swipe: 500,
      }}
      
      // Controller settings
      controller={{
        closeOnPullDown: true,
        closeOnBackdropClick: true,
      }}
      
      // Carousel settings
      carousel={{
        finite: false,
        preload: 2,
        padding: '16px',
        spacing: '30%',
        imageFit: 'contain',
      }}
    />
  );
}