/**
 * Hook for managing photo likes with optimistic UI
 */

import { useState, useEffect, useCallback } from 'react'
import { useGuestIdentifier } from './useGuestIdentifier'
import {
  getLikedPhotos,
  addLikedPhoto,
  removeLikedPhoto,
  isPhotoLiked as checkIsPhotoLiked,
} from '@/lib/guest-storage'

interface UsePhotoLikesOptions {
  eventSlug: string
  photo_id: string
  initialLikesCount: number
  onLikeChange?: (liked: boolean, newCount: number) => void
}

interface UsePhotoLikesReturn {
  isLiked: boolean
  likes_count: number
  isLoading: boolean
  toggleLike: () => Promise<void>
  isProcessing: boolean
  getAllLikedPhotos: () => string[]
}

export function usePhotoLikes({
  eventSlug,
  photo_id,
  initialLikesCount,
  onLikeChange,
}: UsePhotoLikesOptions): UsePhotoLikesReturn {
  const { guestId, isLoading: guestIdLoading } = useGuestIdentifier()
  const [isLiked, setIsLiked] = useState(false)
  const [likes_count, setLikesCount] = useState(initialLikesCount)
  const [isProcessing, setIsProcessing] = useState(false)

  // Initialize liked state from localStorage
  useEffect(() => {
    if (guestIdLoading) return

    const liked = checkIsPhotoLiked(photo_id)
    setIsLiked(liked)
  }, [photo_id, guestIdLoading])

  // Update likes count when prop changes (real-time updates)
  useEffect(() => {
    setLikesCount(initialLikesCount)
  }, [initialLikesCount])

  const toggleLike = useCallback(async () => {
    if (isProcessing || !guestId) return

    setIsProcessing(true)

    // Optimistic UI update
    const newIsLiked = !isLiked
    const newLikesCount = newIsLiked ? likes_count + 1 : likes_count - 1

    setIsLiked(newIsLiked)
    setLikesCount(newLikesCount)

    // Update localStorage
    if (newIsLiked) {
      addLikedPhoto(photo_id)
    } else {
      removeLikedPhoto(photo_id)
    }

    // Notify parent component
    onLikeChange?.(newIsLiked, newLikesCount)

    try {
      // Make API call
      const endpoint = `/api/gallery/${eventSlug}/photos/${photo_id}/like`
      const method = newIsLiked ? 'POST' : 'DELETE'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guestId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update like')
      }

      const data = await response.json()

      // Update with server's authoritative count
      setLikesCount(data.likes_count)
    } catch (error) {
      console.error('Error toggling like:', error)

      // Revert optimistic update on error
      setIsLiked(!newIsLiked)
      setLikesCount(likes_count)

      // Revert localStorage
      if (newIsLiked) {
        removeLikedPhoto(photo_id)
      } else {
        addLikedPhoto(photo_id)
      }

      onLikeChange?.(!newIsLiked, likes_count)
    } finally {
      setIsProcessing(false)
    }
  }, [
    isLiked,
    likes_count,
    photo_id,
    eventSlug,
    guestId,
    isProcessing,
    onLikeChange,
  ])

  const getAllLikedPhotos = useCallback(() => {
    return Array.from(getLikedPhotos())
  }, [eventSlug])

  return {
    isLiked,
    likes_count,
    isLoading: guestIdLoading,
    toggleLike,
    isProcessing,
    getAllLikedPhotos,
  }
}
