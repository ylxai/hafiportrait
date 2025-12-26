'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import PhotoTile from './PhotoTile'
import PhotoLightbox from './PhotoLightbox'
import { PhotoTileErrorBoundary } from '@/components/error-boundaries'
import { useSocket } from '@/hooks/useSocket'

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

interface PhotoGridProps {
  event_id: string
  eventSlug: string
  allowLikes?: boolean
}

export default function PhotoGrid({
  event_id,
  eventSlug,
  allowLikes = true,
}: PhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  // Phase 1 realtime UI state
  const [hasNewImages, setHasNewImages] = useState(false)
  const toastShownAtRef = useRef<number>(0)

  const observerTarget = useRef<HTMLDivElement>(null)
  const PHOTOS_PER_PAGE = 50

  const { onPhotoUploadComplete } = useSocket({ eventSlug })

  // Track event view analytics
  const trackEventView = useCallback(async () => {
    if (!event_id) return

    try {
      await fetch(`/api/gallery/${eventSlug}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      // Silently fail analytics tracking
      console.warn('Failed to track event view:', error)
    }
  }, [event_id, eventSlug])

  const mergeAndDedupe = useCallback((incoming: Photo[], existing: Photo[]) => {
    // Keep newest-first ordering: incoming (newest page 1) should be prepended.
    const merged = [...incoming, ...existing]
    const seen = new Set<string>()
    const deduped: Photo[] = []
    for (const p of merged) {
      if (seen.has(p.id)) continue
      seen.add(p.id)
      deduped.push(p)
    }
    return deduped
  }, [])

  const fetchPhotos = useCallback(
    async (pageNum: number) => {
      try {
        const response = await fetch(
          `/api/gallery/${eventSlug}/photos?page=${pageNum}&limit=${PHOTOS_PER_PAGE}&sort=newest`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch photos')
        }

        const data = await response.json()

        if (pageNum === 1) {
          setPhotos((prev) => mergeAndDedupe(data.photos, prev))
        } else {
          // Pagination can overlap when new photos are inserted at the top.
          // Always dedupe to avoid duplicates in the grid.
          setPhotos((prev) => mergeAndDedupe(data.photos, prev))
        }

        setHasMore(data.hasMore)
        setIsLoading(false)
      } catch (err) {
        console.error('Error fetching photos:', err)
        setError('Failed to load photos. Please try again.')
        setIsLoading(false)
      }
    },
    [eventSlug, mergeAndDedupe]
  )

  useEffect(() => {
    fetchPhotos(1)
    trackEventView()
  }, [fetchPhotos, trackEventView])

  // Phase 1 realtime: listen for new uploads and show "New Images Added"
  useEffect(() => {
    const unsubscribe = onPhotoUploadComplete(() => {
      setHasNewImages(true)

      // Debounce toast so we don't spam during burst uploads
      const now = Date.now()
      if (now - toastShownAtRef.current < 5000) return
      toastShownAtRef.current = now

      toast('New Images Added', {
        duration: 8000, // auto-hide 5–10s
      })
    })

    return unsubscribe
  }, [onPhotoUploadComplete])

  const handleLoadNewImages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // Fetch newest page and merge into existing list (dedupe by id)
    await fetchPhotos(1)

    // Reset pagination baseline to reduce overlap risk
    setPage(1)
    setHasNewImages(false)

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchPhotos])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting && hasMore && !isLoading) {
          const nextPage = page + 1
          setPage(nextPage)
          fetchPhotos(nextPage)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [hasMore, isLoading, page, fetchPhotos])

  // Define all functions after hooks but before conditional returns
  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
  }

  const handleCloseLightbox = () => {
    setSelectedPhotoIndex(null)
  }

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return

    if (direction === 'prev' && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1)
    } else if (direction === 'next' && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1)
    }
  }

  // All conditional returns AFTER all hooks (React Rules of Hooks)
  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={() => {
            setError(null)
            setIsLoading(true)
            fetchPhotos(1)
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (isLoading && photos.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-4 text-gray-600">
          Belum ada foto tersedia. Cek kembali nanti!
        </p>
      </div>
    )
  }

  return (
    <>
      {hasNewImages && (
        <button
          type="button"
          onClick={handleLoadNewImages}
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-md"
        >
          New Images Added
        </button>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <PhotoTileErrorBoundary key={photo.id} photoId={photo.id}>
            <PhotoTile
              photo={photo}
              eventSlug={eventSlug}
              onClick={() => handlePhotoClick(index)}
              allowLikes={allowLikes}
            />
          </PhotoTileErrorBoundary>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      )}

      {selectedPhotoIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={selectedPhotoIndex}
          onClose={handleCloseLightbox}
          onNavigate={handleNavigate}
          eventSlug={eventSlug}
          allowLikes={allowLikes}
        />
      )}
    </>
  )
}
