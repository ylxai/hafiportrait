'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { PhotoTileErrorBoundary } from '@/components/error-boundaries'
import ImmersiveLightbox from './ImmersiveLightbox'
import FloatingMenu from './FloatingMenu'
import StoryView from './StoryView'
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
  created_at: string
  hasLiked?: boolean // Assuming API returns this or we track locally
}

interface EditorialPhotoGridProps {
  event_id: string
  eventSlug: string
  allowLikes?: boolean
}

export default function EditorialPhotoGrid({
  event_id,
  eventSlug,
}: EditorialPhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Phase 1 realtime UI state
  const [hasNewImages, setHasNewImages] = useState(false)
  const [newImagesCount, setNewImagesCount] = useState(0)
  const toastShownAtRef = useRef<number>(0)
  const { onPhotoUploadComplete } = useSocket({ eventSlug })
  
  // UI States
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isStoryOpen, setIsStoryOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(true)
  const lastScrollY = useRef(0)

  const observerTarget = useRef<HTMLDivElement>(null)
  const PHOTOS_PER_PAGE = 30 // Smaller batch for smoother load

  // Handle Scroll for Floating Menu
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowMenu(false) // Hide on scroll down
      } else {
        setShowMenu(true) // Show on scroll up
      }
      lastScrollY.current = currentScrollY
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track event view analytics
  const trackEventView = useCallback(async () => {
    if (!event_id) return
    try {
      await fetch(`/api/gallery/${eventSlug}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.warn('Failed to track event view:', error)
    }
  }, [event_id, eventSlug])

  const mergeAndDedupe = useCallback((incoming: Photo[], existing: Photo[]) => {
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
      setNewImagesCount((c) => c + 1)

      // Debounce toast so we don't spam during burst uploads
      const now = Date.now()
      if (now - toastShownAtRef.current < 5000) return
      toastShownAtRef.current = now

      toast('New Images Added', {
        duration: 8000,
      })
    })

    return unsubscribe
  }, [onPhotoUploadComplete])

  const fetchDeltaPhotos = useCallback(
    async (cursor: { since: string; since_id?: string }) => {
      const qs = new URLSearchParams({
        since: cursor.since,
        limit: String(PHOTOS_PER_PAGE),
        sort: 'newest',
      })
      if (cursor.since_id) qs.set('since_id', cursor.since_id)

      const response = await fetch(
        `/api/gallery/${eventSlug}/photos?${qs.toString()}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch new photos')
      }

      const data = await response.json()
      return data.photos as Photo[]
    },
    [eventSlug]
  )

  const getLatestCursor = useCallback(() => {
    const top = photos[0]
    if (!top?.created_at) return null
    return { since: top.created_at, since_id: top.id }
  }, [photos])

  const handleLoadNewImages = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const cursor = getLatestCursor()
    if (!cursor) {
      await fetchPhotos(1)
    } else {
      const newPhotos = await fetchDeltaPhotos(cursor)
      setPhotos((prev) => mergeAndDedupe(newPhotos, prev))
    }

    setPage(1)
    setHasNewImages(false)
    setNewImagesCount(0)

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fetchDeltaPhotos, fetchPhotos, getLatestCursor, mergeAndDedupe])

  // Phase 2 polling fallback (30–45s with jitter)
  const lastNotifiedCursorRef = useRef<{ since: string; since_id?: string } | null>(null)

  useEffect(() => {
    if (photos.length === 0) return

    if (!lastNotifiedCursorRef.current) {
      const top = photos[0]
      lastNotifiedCursorRef.current = top?.created_at
        ? { since: top.created_at, since_id: top.id }
        : null
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const scheduleNext = () => {
      const nextDelay = 30000 + Math.floor(Math.random() * 15000)
      timeoutId = setTimeout(runPoll, nextDelay)
    }

    const runPoll = async () => {
      if (cancelled) return

      const cursor = lastNotifiedCursorRef.current
      if (!cursor) {
        scheduleNext()
        return
      }

      try {
        const newPhotos = await fetchDeltaPhotos(cursor)
        if (newPhotos.length > 0) {
          setHasNewImages(true)
          setNewImagesCount((c) => c + newPhotos.length)

          lastNotifiedCursorRef.current = newPhotos[0]?.created_at
            ? { since: newPhotos[0].created_at, since_id: newPhotos[0].id }
            : cursor

          const now = Date.now()
          if (now - toastShownAtRef.current >= 5000) {
            toastShownAtRef.current = now
            toast('New Images Added', { duration: 8000 })
          }
        }
      } catch {
        // best-effort
      } finally {
        scheduleNext()
      }
    }

    scheduleNext()

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [fetchDeltaPhotos, photos])

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

  // Map photos to format needed by Lightbox/Story
  const galleryPhotos = photos.map(p => ({
    id: p.id,
    url: p.original_url, // Prefer high res for lightbox
    thumbnailUrl: p.thumbnail_medium_url || p.thumbnail_url || '',
    width: p.width || 1000,
    height: p.height || 1000,
    filename: p.filename,
    likes: p.likes_count,
    hasLiked: p.hasLiked
  }))

  const handleDownloadAll = () => {
    // Implement download logic or redirect
    alert("Download all feature coming soon!")
  }

  // Skeleton Loading
  if (isLoading && photos.length === 0) {
    return (
      <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 p-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-full break-inside-avoid rounded-lg bg-gray-200 animate-pulse"
            style={{ height: Math.random() > 0.5 ? '300px' : '200px' }} // Random heights for masonry feel
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="underline">Try Again</button>
      </div>
    )
  }

  return (
    <>
      {hasNewImages && (
        <button
          type="button"
          onClick={handleLoadNewImages}
          className="fixed top-20 left-1/2 z-50 -translate-x-1/2 rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs font-medium text-black shadow-lg backdrop-blur-md transition hover:bg-white"
        >
          New Images Added{newImagesCount > 0 ? ` (${newImagesCount})` : ''}
        </button>
      )}

      {/* Masonry Layout */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4 p-4 md:p-0">
        {photos.map((photo, index) => (
          <PhotoTileErrorBoundary key={photo.id} photoId={photo.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "50px" }}
              transition={{ duration: 0.5 }}
              className="break-inside-avoid relative group cursor-zoom-in overflow-hidden rounded-lg bg-gray-100"
              onClick={() => setLightboxIndex(index)}
            >
              <Image
                src={photo.thumbnail_medium_url || photo.thumbnail_url || ''}
                alt={photo.filename}
                width={photo.width || 500}
                height={photo.height || 500}
                className="w-full h-auto transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" // Basic placeholder
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
            </motion.div>
          </PhotoTileErrorBoundary>
        ))}
      </div>

      {hasMore && (
        <div ref={observerTarget} className="flex justify-center py-12">
          <div className="h-1 w-1 bg-black/20 rounded-full mx-1 animate-bounce" />
          <div className="h-1 w-1 bg-black/20 rounded-full mx-1 animate-bounce delay-75" />
          <div className="h-1 w-1 bg-black/20 rounded-full mx-1 animate-bounce delay-150" />
        </div>
      )}

      {/* Components */}
      <ImmersiveLightbox 
        isOpen={lightboxIndex !== null}
        initialPhotoIndex={lightboxIndex || 0}
        photos={galleryPhotos}
        onClose={() => setLightboxIndex(null)}
      />

      <StoryView 
        isOpen={isStoryOpen}
        photos={galleryPhotos}
        onClose={() => setIsStoryOpen(false)}
      />

      <FloatingMenu 
        isVisible={showMenu && !lightboxIndex && !isStoryOpen}
        onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onGridView={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onStoryMode={() => setIsStoryOpen(true)}
        onDownloadAll={handleDownloadAll}
      />
    </>
  )
}
