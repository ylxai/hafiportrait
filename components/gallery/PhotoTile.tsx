'use client';

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import LikeButton from './LikeButton';
import HeartAnimation from './HeartAnimation';

interface Photo {
  id: string;
  filename: string;
  thumbnailMediumUrl: string | null;
  thumbnailSmallUrl: string | null;
  thumbnailUrl: string | null;
  likesCount: number;
}

interface PhotoTileProps {
  photo: Photo;
  eventSlug: string;
  onClick: () => void;
  allowLikes?: boolean;
}

interface HeartAnimationState {
  id: number;
  x: number;
  y: number;
}

function PhotoTile({ 
  photo, 
  eventSlug,
  onClick, 
  allowLikes = true 
}: PhotoTileProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [heartAnimations, setHeartAnimations] = useState<HeartAnimationState[]>([]);
  const [localLikesCount, setLocalLikesCount] = useState(photo.likesCount);
  
  const thumbnailUrl = 
    photo.thumbnailMediumUrl || 
    photo.thumbnailSmallUrl || 
    photo.thumbnailUrl;

  // Double-tap handler for mobile
  const handleDoubleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected
      e.preventDefault();
      e.stopPropagation();

      // Get tap coordinates
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let x: number, y: number;

      if ('touches' in e.nativeEvent) {
        x = e.nativeEvent.touches[0]?.clientX || rect.left + rect.width / 2;
        y = e.nativeEvent.touches[0]?.clientY || rect.top + rect.height / 2;
      } else {
        x = (e as React.MouseEvent).clientX;
        y = (e as React.MouseEvent).clientY;
      }

      // Add heart animation at tap location
      const newAnimation = {
        id: Date.now(),
        x,
        y,
      };
      setHeartAnimations(prev => [...prev, newAnimation]);

      // Trigger like via the button (will handle optimistic UI)
      const likeButton = document.getElementById(`like-btn-${photo.id}`);
      if (likeButton) {
        likeButton.click();
      }
    }

    setLastTap(now);
  }, [lastTap, photo.id]);

  const removeHeartAnimation = useCallback((id: number) => {
    setHeartAnimations(prev => prev.filter(anim => anim.id !== id));
  }, []);

  const handleLikeChange = useCallback((liked: boolean, newCount: number) => {
    setLocalLikesCount(newCount);
  }, []);

  return (
    <>
      <div
        className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer group"
        onClick={onClick}
        onMouseDown={handleDoubleTap}
        onTouchStart={handleDoubleTap}
      >
        {!isLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-300" />
        )}
        
        <Image
          src={thumbnailUrl || ''}
          alt={`Photography image: ${photo.filename}`}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-all duration-300 ${
            isLoaded ? 'opacity-100 group-hover:scale-105' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          loading="lazy"
        />

        {/* Like button overlay */}
        {allowLikes && (
          <div 
            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full shadow-md z-10"
            id={`like-btn-${photo.id}`}
          >
            <LikeButton
              photoId={photo.id}
              eventSlug={eventSlug}
              initialLikesCount={localLikesCount}
              onLikeChange={handleLikeChange}
              size="sm"
              showCount={localLikesCount > 0}
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
      </div>

      {/* Heart animations for double-tap */}
      {heartAnimations.map(anim => (
        <HeartAnimation
          key={anim.id}
          x={anim.x}
          y={anim.y}
          onComplete={() => removeHeartAnimation(anim.id)}
        />
      ))}
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if photo data, eventSlug, onClick, or allowLikes changes
export default memo(PhotoTile, (prevProps, nextProps) => {
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.likesCount === nextProps.photo.likesCount &&
    prevProps.eventSlug === nextProps.eventSlug &&
    prevProps.allowLikes === nextProps.allowLikes &&
    prevProps.onClick === nextProps.onClick
  );
});
