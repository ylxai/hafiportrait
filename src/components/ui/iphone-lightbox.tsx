'use client';

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Share from "yet-another-react-lightbox/plugins/share";
import Download from "yet-another-react-lightbox/plugins/download";

interface Photo {
  id: string;
  url: string;
  original_name: string;
  optimized_images?: any;
}

interface IPhoneLightboxProps {
  photos: Photo[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function IPhoneLightbox({ photos, currentIndex, isOpen, onClose }: IPhoneLightboxProps) {
  // Convert photos to lightbox format
  const slides = photos.map((photo) => ({
    src: photo.url,
    alt: photo.original_name || 'Gallery Photo',
    title: photo.original_name,
    description: photo.original_name,
    download: photo.url,
  }));

  return (
    <Lightbox
      open={isOpen}
      close={onClose}
      slides={slides}
      index={currentIndex}
      plugins={[Zoom, Fullscreen, Share, Download]}
      zoom={{
        maxZoomPixelRatio: 3,
        zoomInMultiplier: 2,
        doubleTapDelay: 300,
        doubleClickDelay: 300,
        doubleClickMaxStops: 2,
        keyboardMoveDistance: 50,
        wheelZoomDistanceFactor: 100,
        pinchZoomDistanceFactor: 100,
        scrollToZoom: true,
      }}
      carousel={{
        finite: false,
        preload: 2,
        padding: "16px",
        spacing: "30%",
        imageFit: "contain",
      }}
      controller={{
        closeOnPullDown: true,
        closeOnBackdropClick: true,
        preventDefaultWheelX: true,
        preventDefaultWheelY: true,
      }}
      render={{
        buttonPrev: () => null, // Hide navigation arrows for cleaner iPhone look
        buttonNext: () => null,
      }}
      animation={{
        fade: 250,
        swipe: 500,
        easing: {
          fade: "ease",
          swipe: "ease-out",
          navigation: "ease-in-out",
        },
      }}
      styles={{
        container: {
          backgroundColor: "rgba(0, 0, 0, 1)",
        },
        slide: {
          padding: "16px",
        },
      }}
    />
  );
}