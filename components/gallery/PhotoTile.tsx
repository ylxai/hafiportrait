'use client'

import { useState, useCallback, memo } from 'react'
import OptimizedImage, {
  ImagePresets,
} from '@/components/common/OptimizedImage'
import LikeButton from './LikeButton'
import HeartAnimation from './HeartAnimation'

interface Photo {
  id: string
  filename: string
  thumbnail_medium_url: string | null
  thumbnail_small_url: string | null
  thumbnail_url: string | null
  likes_count: number
}

interface PhotoTileProps {
  photo: Photo
  eventSlug: string
  onClick: () => void
  allowLikes?: boolean
}

interface HeartAnimationState {
  id: number
  x: number
  y: number
}

function PhotoTile({
  photo,
  eventSlug,
  onClick,
  allowLikes = true,
}: PhotoTileProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [lastTap, setLastTap] = useState(0)
  const [heartAnimations, setHeartAnimations] = useState<HeartAnimationState[]>(
    []
  )
  const [localLikesCount, setLocalLikesCount] = useState(photo.likes_count)

  // Use smallest thumbnail for grid view (400px is enough for tiles)
  const thumbnail_url =
    photo.thumbnail_small_url ||
    photo.thumbnail_medium_url ||
    photo.thumbnail_url

  // Double-tap handler for mobile
  const handleDoubleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const now = Date.now()
      const DOUBLE_TAP_DELAY = 300

      if (now - lastTap < DOUBLE_TAP_DELAY) {
        // Double tap detected
        e.preventDefault()
        e.stopPropagation()

        // Get tap coordinates
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        let x: number, y: number

        if ('touches' in e.nativeEvent) {
          x = e.nativeEvent.touches[0]?.clientX || rect.left + rect.width / 2
          y = e.nativeEvent.touches[0]?.clientY || rect.top + rect.height / 2
        } else {
          x = (e as React.MouseEvent).clientX
          y = (e as React.MouseEvent).clientY
        }

        // Add heart animation at tap location
        const newAnimation = {
          id: Date.now(),
          x,
          y,
        }
        setHeartAnimations((prev) => [...prev, newAnimation])

        // Trigger like via the button (will handle optimistic UI)
        const likeButton = document.getElementById(`like-btn-${photo.id}`)
        if (likeButton) {
          likeButton.click()
        }
      }

      setLastTap(now)
    },
    [lastTap, photo.id]
  )

  const removeHeartAnimation = useCallback((id: number) => {
    setHeartAnimations((prev) => prev.filter((anim) => anim.id !== id))
  }, [])

  const handleLikeChange = useCallback(
    (liked: boolean, newCount: number) => {
      setLocalLikesCount(newCount)
      // Could use liked status for analytics or visual feedback
      console.log(
        `Photo ${photo.id} ${liked ? 'liked' : 'unliked'}, new count: ${newCount}`
      )
    },
    [photo.id]
  )

  return (
    <>
      <div
        className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-gray-200 ${!isLoaded ? 'animate-pulse' : ''}`}
        onClick={onClick}
        onMouseDown={handleDoubleTap}
        onTouchStart={handleDoubleTap}
      >
        <OptimizedImage
          src={thumbnail_url || ''}
          alt={`Photography image: ${photo.filename}`}
          className="transition-transform duration-300 group-hover:scale-105"
          onLoad={() => setIsLoaded(true)}
          {...ImagePresets.thumbnail}
        />

        {/* Like button overlay */}
        {allowLikes && (
          <div
            className="absolute right-2 top-2 z-10 rounded-full bg-white/90 shadow-md backdrop-blur-sm"
            id={`like-btn-${photo.id}`}
          >
            <LikeButton
              photo_id={photo.id}
              eventSlug={eventSlug}
              initialLikesCount={localLikesCount}
              onLikeChange={handleLikeChange}
              size="sm"
              showCount={localLikesCount > 0}
            />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black opacity-0 transition-opacity duration-300 group-hover:opacity-10" />
      </div>

      {/* Heart animations for double-tap */}
      {heartAnimations.map((anim) => (
        <HeartAnimation
          key={anim.id}
          x={anim.x}
          y={anim.y}
          onComplete={() => removeHeartAnimation(anim.id)}
        />
      ))}
    </>
  )
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if photo data, eventSlug, onClick, or allowLikes changes
export default memo(PhotoTile, (prevProps, nextProps) => {
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.likes_count === nextProps.photo.likes_count &&
    prevProps.eventSlug === nextProps.eventSlug &&
    prevProps.allowLikes === nextProps.allowLikes &&
    prevProps.onClick === nextProps.onClick
  )
})
