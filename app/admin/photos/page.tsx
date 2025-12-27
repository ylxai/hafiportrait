'use client'

import AdminLayout from '@/app/components/admin/AdminLayout'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PhotoDetailModal from '@/components/admin/PhotoDetailModal'
import TrashPhotoGrid from '@/components/admin/TrashPhotoGrid'
import {
  ArrowUpTrayIcon as Upload,
  PhotoIcon as ImageIcon,
  CheckIcon as Check,
  Squares2X2Icon as Square,
  TrashIcon as Trash,
} from '@heroicons/react/24/outline'

interface Photo {
  id: string
  filename: string
  original_url: string
  thumbnail_small_url: string | null
  thumbnail_medium_url: string | null
  thumbnail_large_url?: string | null
  event_id: string
  is_featured: boolean
  created_at: string
  event?: {
    id: string
    name: string
  }
}

// Minimal shape expected by TrashPhotoGrid
interface TrashPhoto {
  id: string
  filename: string
  thumbnail_medium_url: string | null
  thumbnail_small_url: string | null
  deleted_at: Date | null
  event: {
    id: string
    name: string
  }
  deletedByUser: {
    name: string
    email: string
  } | null
}

export default function AdminPhotosPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'trash'>('all')
  const [photos, setPhotos] = useState<Photo[]>([])
  const [trashPhotos, setTrashPhotos] = useState<TrashPhoto[]>([])
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    void fetchAll()
    void fetchEvents()
  }, [])

  const fetchAll = async (eventId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const photosUrl =
        eventId && eventId !== 'all'
          ? `/api/admin/photos?event_id=${encodeURIComponent(eventId)}`
          : '/api/admin/photos'

      const [allRes, trashRes] = await Promise.all([
        fetch(photosUrl, { credentials: 'include' }),
        fetch('/api/admin/photos/trash?limit=100', { credentials: 'include' }),
      ])

      if (!allRes.ok) throw new Error('Failed to fetch photos')
      if (!trashRes.ok) throw new Error('Failed to fetch trash photos')

      const allData = await allRes.json()
      const trashData = await trashRes.json()

      // /api/admin/photos returns an array
      const rawPhotos: any[] = Array.isArray(allData) ? allData : allData.photos || []
      const mappedPhotos: Photo[] = rawPhotos.map((p) => ({
        id: p.id,
        filename: p.filename,
        original_url: p.original_url,
        thumbnail_small_url: p.thumbnail_small_url ?? p.thumbnail_url ?? null,
        thumbnail_medium_url: p.thumbnail_medium_url ?? p.thumbnail_url ?? null,
        thumbnail_large_url: p.thumbnail_large_url ?? null,
        event_id: p.event_id,
        is_featured: p.is_featured ?? false,
        created_at: p.created_at,
        event: p.event_name
          ? {
              id: p.event_id,
              name: p.event_name,
            }
          : undefined,
      }))
      setPhotos(mappedPhotos)

      // /api/admin/photos/trash returns { success, data: { photos: [...] } }
      const trashList = trashData?.data?.photos || []
      const mappedTrash: TrashPhoto[] = trashList.map((p: any) => ({
        id: p.id,
        filename: p.filename,
        thumbnail_medium_url: p.mediumUrl ?? null,
        thumbnail_small_url: p.thumbnail_url ?? null,
        deleted_at: p.deleted_at ? new Date(p.deleted_at) : null,
        event: {
          id: p.event_id,
          name: p.event_name || p.event?.name || 'Event',
        },
        deletedByUser: null,
      }))
      setTrashPhotos(mappedTrash)
    } catch (err) {
      console.error('Failed to fetch photos:', err)
      setError('Failed to load photos')
    } finally {
      setLoading(false)
    }
  }

  const selectedPhoto =
    activeTab === 'all' && lightboxIndex !== null ? photos[lightboxIndex] : null

  const closeLightbox = () => setLightboxIndex(null)

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedCount = selected.size

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events?limit=200', {
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      const list = data?.data?.events || data?.events || []
      const mapped = list.map((e: any) => ({ id: e.id, name: e.name }))
      setEvents(mapped)
    } catch {
      // ignore
    }
  }

  const handleBulkTrash = async () => {
    if (selectedCount === 0) return

    const confirmed = confirm(
      `Move ${selectedCount} photo(s) to Trash? You can restore them later.`
    )
    if (!confirmed) return

    try {
      const ids = Array.from(selected).join(',')
      const res = await fetch(`/api/admin/photos?ids=${encodeURIComponent(ids)}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!res.ok) throw new Error('Failed to delete photos')

      setSelected(new Set())
      setIsSelectMode(false)
      await fetchAll()
    } catch (e) {
      console.error(e)
      alert('Failed to move photos to Trash')
    }
  }

  return (
    <AdminLayout>
      {/* Unified Layout (mobile + desktop) */}
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Photos</h1>
            <p className="text-gray-600 mt-1">Manage event photos</p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Event Filter (All tab) */}
            {activeTab === 'all' && (
              <select
                value={selectedEventId}
                onChange={(e) => {
                  const value = e.target.value
                  setSelectedEventId(value)
                  void fetchAll(value)
                  closeLightbox()
                }}
                className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
              >
                <option value="all">All Events</option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name}
                  </option>
                ))}
              </select>
            )}

            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setIsSelectMode((v) => !v)
                  setSelected(new Set())
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  isSelectMode
                    ? 'bg-[#54ACBF] text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isSelectMode ? 'Cancel' : 'Select'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all')
                  closeLightbox()
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All ({photos.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('trash')
                  closeLightbox()
                }}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  activeTab === 'trash'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trash ({trashPhotos.length})
              </button>
            </div>

            <Link
              href="/admin/photos/upload"
              className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Link>
          </div>
        </div>

        {isSelectMode && activeTab === 'all' && selectedCount > 0 && (
          <div className="rounded-lg bg-[#54ACBF]/10 px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              {selectedCount} selected
            </div>
            <button
              type="button"
              onClick={handleBulkTrash}
              className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash className="w-4 h-4 mr-2" />
              Move to Trash
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'trash' ? (
          <div className="rounded-lg bg-white p-6 shadow-sm">
            {trashPhotos.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Trash kosong</h3>
                <p className="text-gray-500">Foto yang dihapus akan muncul di sini untuk di-restore.</p>
              </div>
            ) : (
              <TrashPhotoGrid photos={trashPhotos} isAdmin />
            )}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
            <p className="text-gray-500 mb-6">Upload your first photos to start building your portfolio</p>
            <Link
              href="/admin/photos/upload"
              className="inline-flex items-center px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90 transition-colors"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Photos
            </Link>
          </div>
        ) : (
          <>
            {/* All Photos Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    if (isSelectMode) {
                      toggleSelect(photo.id)
                    } else {
                      setLightboxIndex(idx)
                    }
                  }}
                  className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow text-left ${
                    selected.has(photo.id) ? 'ring-4 ring-[#54ACBF]' : ''
                  }`}
                >
                  {isSelectMode && (
                    <div className="absolute left-2 top-2 z-10">
                      {selected.has(photo.id) ? (
                        <Check className="h-6 w-6 text-[#54ACBF]" />
                      ) : (
                        <Square className="h-6 w-6 text-white" />
                      )}
                    </div>
                  )}
                  <Image
                    src={photo.thumbnail_medium_url || photo.thumbnail_small_url || photo.original_url}
                    alt={photo.filename}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16.67vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-xs font-medium truncate">{photo.filename}</p>
                    {photo.event && (
                      <p className="text-white/80 text-xs truncate">{photo.event.name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Lightbox (All only) */}
            {selectedPhoto && lightboxIndex !== null && (
              <PhotoDetailModal
                // types are compatible enough for reuse
                photo={selectedPhoto as any}
                photos={photos as any}
                currentIndex={lightboxIndex}
                onClose={closeLightbox}
                onPhotoChange={(i) => setLightboxIndex(i)}
                onPhotoUpdate={() => void fetchAll()}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
