'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import LikeButton from './LikeButton'

interface Photo {
  id: string
  filename: string
  thumbnail_medium_url: string | null
  thumbnail_small_url: string | null
  thumbnail_url: string | null
  original_url: string
  width: number | null
  height: number | null
  likes_count: number
  caption: string | null
}

interface PhotoLightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  eventSlug: string
  allowLikes?: boolean
}

export default function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  eventSlug,
  allowLikes = true,
}: PhotoLightboxProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const currentPhoto = photos[currentIndex]

  // Guard against invalid photo data
  if (!currentPhoto) {
    return null
  }

  const [localLikesCount, setLocalLikesCount] = useState(
    currentPhoto.likes_count
  )
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < photos.length - 1

  // Update local likes count when photo changes
  useEffect(() => {
    setLocalLikesCount(currentPhoto.likes_count)
  }, [currentPhoto.likes_count, currentIndex])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate('prev')
        setIsLoading(true)
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate('next')
        setIsLoading(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate, hasPrev, hasNext])

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }

    resetTimeout()
    window.addEventListener('mousemove', resetTimeout)
    window.addEventListener('touchstart', resetTimeout)

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('mousemove', resetTimeout)
      window.removeEventListener('touchstart', resetTimeout)
    }
  }, [])

  // Touch gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0]?.clientX || null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0]?.clientX || null)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && hasNext) {
      onNavigate('next')
      setIsLoading(true)
    }
    if (isRightSwipe && hasPrev) {
      onNavigate('prev')
      setIsLoading(true)
    }
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `/api/gallery/${eventSlug}/photos/${currentPhoto.id}/download`
      )

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to download photo')
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = currentPhoto.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to download photo. Please try again.')
    }
  }

  const handleLikeChange = useCallback(
    (liked: boolean, newCount: number) => {
      setLocalLikesCount(newCount)
      // Track like status for analytics
      console.log(
        `Lightbox photo ${currentPhoto?.id} ${liked ? 'liked' : 'unliked'}, new count: ${newCount}`
      )
    },
    [currentPhoto?.id]
  )

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-white" />
        </div>
      )}

      {/* Main image */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full w-full">
          <Image
            src={currentPhoto.original_url}
            alt={`Full size photography image: ${currentPhoto.caption || currentPhoto.filename}`}
            fill
            sizes="100vw"
            className="object-contain"
            onLoad={() => setIsLoading(false)}
            priority
            quality={95}
          />
        </div>
      </div>

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {/* Top bar */}
        <div className="absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {currentIndex + 1} / {photos.length}
              </p>
              {currentPhoto.caption && (
                <p className="mt-1 text-sm text-gray-300">
                  {currentPhoto.caption}
                </p>
              )}
            </div>

            {/* Like button in top bar */}
            {allowLikes && (
              <div className="mx-4">
                <LikeButton
                  photo_id={currentPhoto.id}
                  eventSlug={eventSlug}
                  initialLikesCount={localLikesCount}
                  onLikeChange={handleLikeChange}
                  size="lg"
                  showCount={true}
                  className="bg-white/20 px-3 py-2 backdrop-blur-sm"
                />
              </div>
            )}

            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-white/20"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation arrows */}
        {hasPrev && (
          <button
            onClick={() => {
              onNavigate('prev')
              setIsLoading(true)
            }}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {hasNext && (
          <button
            onClick={() => {
              onNavigate('next')
              setIsLoading(true)
            }}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Bottom action bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
