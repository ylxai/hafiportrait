/**
 * Hook for managing photo likes with optimistic UI
 */

import { useState, useEffect, useCallback } from 'react';
import { useGuestIdentifier } from './useGuestIdentifier';
import { 
  getLikedPhotos, 
  addLikedPhoto, 
  removeLikedPhoto,
  isPhotoLiked as checkIsPhotoLiked 
} from '@/lib/guest-storage';

interface UsePhotoLikesOptions {
  eventSlug: string;
  photoId: string;
  initialLikesCount: number;
  onLikeChange?: (liked: boolean, newCount: number) => void;
}

interface UsePhotoLikesReturn {
  isLiked: boolean;
  likesCount: number;
  isLoading: boolean;
  toggleLike: () => Promise<void>;
  isProcessing: boolean;
}

export function usePhotoLikes({
  eventSlug,
  photoId,
  initialLikesCount,
  onLikeChange,
}: UsePhotoLikesOptions): UsePhotoLikesReturn {
  const { guestId, isLoading: guestIdLoading } = useGuestIdentifier();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize liked state from localStorage
  useEffect(() => {
    if (guestIdLoading) return;
    
    const liked = checkIsPhotoLiked(photoId);
    setIsLiked(liked);
  }, [photoId, guestIdLoading]);

  // Update likes count when prop changes (real-time updates)
  useEffect(() => {
    setLikesCount(initialLikesCount);
  }, [initialLikesCount]);

  const toggleLike = useCallback(async () => {
    if (isProcessing || !guestId) return;

    setIsProcessing(true);

    // Optimistic UI update
    const newIsLiked = !isLiked;
    const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;
    
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);

    // Update localStorage
    if (newIsLiked) {
      addLikedPhoto(photoId);
    } else {
      removeLikedPhoto(photoId);
    }

    // Notify parent component
    onLikeChange?.(newIsLiked, newLikesCount);

    try {
      // Make API call
      const endpoint = `/api/gallery/${eventSlug}/photos/${photoId}/like`;
      const method = newIsLiked ? 'POST' : 'DELETE';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update like');
      }

      const data = await response.json();
      
      // Update with server's authoritative count
      setLikesCount(data.likesCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      
      // Revert optimistic update on error
      setIsLiked(!newIsLiked);
      setLikesCount(likesCount);
      
      // Revert localStorage
      if (newIsLiked) {
        removeLikedPhoto(photoId);
      } else {
        addLikedPhoto(photoId);
      }

      onLikeChange?.(!newIsLiked, likesCount);
    } finally {
      setIsProcessing(false);
    }
  }, [isLiked, likesCount, photoId, eventSlug, guestId, isProcessing, onLikeChange]);

  return {
    isLiked,
    likesCount,
    isLoading: guestIdLoading,
    toggleLike,
    isProcessing,
  };
}
