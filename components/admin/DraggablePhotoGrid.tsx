/**
 * DraggablePhotoGrid Component
 * Drag-and-drop photo grid with reordering functionality
 */

'use client'

import Image from 'next/image'
import { useState, useCallback, useEffect, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { MagnifyingGlassIcon as Search } from '@heroicons/react/24/outline'
import SortablePhotoItem from './SortablePhotoItem'
import PhotoDetailModal from './PhotoDetailModal'
import SortMenu from './SortMenu'

interface Photo {
  id: string
  filename: string
  original_url: string
  thumbnail_small_url: string | null
  thumbnail_medium_url: string | null
  thumbnail_large_url: string | null
  file_size: number | null
  width: number | null
  height: number | null
  mime_type: string | null
  caption: string | null
  is_featured: boolean
  likes_count: number
  views_count: number
  download_count: number
  created_at: Date
  display_order: number
  event: {
    id: string
    name: string
  }
}

interface DraggablePhotoGridProps {
  photos: Photo[]
  event_id: string
  currentSort?: string
  currentFilter?: string
  currentSearch?: string
}

export default function DraggablePhotoGrid({
  photos: initialPhotos,
  event_id,
  currentSort = 'order',
  currentFilter,
  currentSearch,
}: DraggablePhotoGridProps) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(-1)
  const [isReordering, setIsReordering] = useState(false)
  const [searchTerm, setSearchTerm] = useState(currentSearch || '')
  const [showUndo, setShowUndo] = useState(false)
  const [previousOrder, setPreviousOrder] = useState<Photo[]>([])

  // Sync with initial photos when they change
  useEffect(() => {
    setPhotos(initialPhotos)
  }, [initialPhotos])

  // Configure sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event

      if (!over || active.id === over.id) {
        setActiveId(null)
        return
      }

      // Store previous order for undo
      setPreviousOrder([...photos])

      // Optimistically update UI
      const oldIndex = photos.findIndex((photo) => photo.id === active.id)
      const newIndex = photos.findIndex((photo) => photo.id === over.id)

      const reorderedPhotos = arrayMove(photos, oldIndex, newIndex)

      // Update display order values
      const photosWithNewOrder = reorderedPhotos.map((photo, index) => ({
        ...photo,
        display_order: index + 1,
      }))

      setPhotos(photosWithNewOrder)
      setActiveId(null)
      setIsReordering(true)

      try {
        // Call API to persist the reorder
        const response = await fetch(
          `/api/admin/events/${event_id}/photos/reorder`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              photoOrders: photosWithNewOrder.map((photo) => ({
                photo_id: photo.id,
                display_order: photo.display_order,
              })),
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to reorder photos')
        }

        // Show success notification with undo option
        setShowUndo(true)
        setTimeout(() => setShowUndo(false), 10000) // Hide after 10 seconds
      } catch (error) {
        console.error('Error reordering photos:', error)
        // Revert to previous order on error
        setPhotos(previousOrder)
        alert('Failed to reorder photos. Please try again.')
      } finally {
        setIsReordering(false)
      }
    },
    [photos, event_id, previousOrder]
  )

  // Handle undo
  const handleUndo = useCallback(async () => {
    if (previousOrder.length === 0) return

    setIsReordering(true)
    setPhotos(previousOrder)

    try {
      const response = await fetch(
        `/api/admin/events/${event_id}/photos/reorder`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            photoOrders: previousOrder.map((photo) => ({
              photo_id: photo.id,
              display_order: photo.display_order,
            })),
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to undo reorder')
      }

      setShowUndo(false)
      setPreviousOrder([])
    } catch (error) {
      console.error('Error undoing reorder:', error)
      alert('Failed to undo reorder. Please try again.')
    } finally {
      setIsReordering(false)
    }
  }, [previousOrder, event_id])

  // Handle auto-sort
  const handleAutoSort = useCallback(
    async (sortBy: string, direction: 'asc' | 'desc') => {
      setIsReordering(true)
      setPreviousOrder([...photos])

      try {
        const response = await fetch(
          `/api/admin/events/${event_id}/photos/auto-sort`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sortBy, direction }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to auto-sort photos')
        }

        const data = await response.json()

        // Update photos with sorted data
        if (data.photos && Array.isArray(data.photos)) {
          setPhotos(data.photos)
          // Show success message
          alert(`Photos auto-sorted by ${sortBy} (${direction}) successfully!`)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error auto-sorting photos:', error)
        alert('Failed to auto-sort photos. Please try again.')
        setPhotos(previousOrder)
      } finally {
        setIsReordering(false)
      }
    },
    [photos, event_id, previousOrder]
  )

  // Filter photos by search term (client-side filtering) - memoized for performance
  const filteredPhotos = useMemo(() => {
    if (!searchTerm) return photos

    const lowerSearchTerm = searchTerm.toLowerCase()
    return photos.filter((photo) =>
      photo.filename.toLowerCase().includes(lowerSearchTerm)
    )
  }, [photos, searchTerm])

  // Handle photo click
  const handlePhotoClick = useCallback(
    (photo_id: string) => {
      const index = filteredPhotos.findIndex((p) => p.id === photo_id)
      setSelectedPhotoIndex(index)
    },
    [filteredPhotos]
  )

  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setSelectedPhotoIndex(-1)
  }, [])

  // Handle photo change in modal
  const handlePhotoChange = useCallback((newIndex: number) => {
    setSelectedPhotoIndex(newIndex)
  }, [])

  // Handle photo update
  const handlePhotoUpdate = useCallback((updatedPhoto?: { id: string; filename: string; caption?: string }) => {
    if (!updatedPhoto) return;
    setPhotos((prevPhotos) =>
      prevPhotos.map((p) =>
        p.id === updatedPhoto.id ? { ...p, ...updatedPhoto } : p
      )
    )
  }, [])

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchTerm) params.set('search', searchTerm)
    if (currentFilter) params.set('filter', currentFilter)
    if (currentSort) params.set('sort', currentSort)
    window.location.href = `?${params.toString()}`
  }

  // Memoize active photo lookup for performance
  const activePhoto = useMemo(() => {
    return activeId ? photos.find((photo) => photo.id === activeId) : null
  }, [activeId, photos])

  const selectedPhoto =
    selectedPhotoIndex >= 0 ? filteredPhotos[selectedPhotoIndex] : null

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search photos..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-[#54ACBF] focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
          />
        </form>

        {/* Sort Menu */}
        <SortMenu
          onSort={handleAutoSort}
          isLoading={isReordering}
          currentSort={currentSort}
        />
      </div>

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-gray-900 px-4 py-3 text-white shadow-lg">
          <span className="text-sm">Photos reordered successfully</span>
          <button
            onClick={handleUndo}
            disabled={isReordering}
            className="rounded bg-white px-3 py-1 text-xs font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-50"
          >
            Undo
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isReordering && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
          <div className="rounded-lg bg-white px-6 py-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#54ACBF] border-t-transparent"></div>
              <span className="text-sm font-medium text-gray-900">
                Reordering photos...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {filteredPhotos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredPhotos.map((p) => p.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {filteredPhotos.map((photo) => (
                <SortablePhotoItem
                  key={photo.id}
                  photo={photo}
                  onClick={handlePhotoClick}
                  isDragging={activeId === photo.id}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activePhoto && (
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white shadow-2xl">
                <Image
                  src={
                    activePhoto.thumbnail_medium_url || activePhoto.original_url
                  }
                  alt={`Photo: ${activePhoto.filename}`}
                  fill
                  sizes="300px"
                  className="object-cover opacity-80"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No photos found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && selectedPhotoIndex >= 0 && (
        <PhotoDetailModal
          photo={selectedPhoto}
          photos={filteredPhotos}
          currentIndex={selectedPhotoIndex}
          onClose={handleCloseModal}
          onPhotoChange={handlePhotoChange}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}
    </div>
  )
}
