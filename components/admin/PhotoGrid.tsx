'use client'

/**
 * Photo Grid Component
 *
 * Displays photos in a responsive grid with:
 * - Sort and filter controls
 * - Search functionality
 * - Multi-select mode
 * - Bulk actions
 * - Quick actions on hover
 * - Photo detail modal integration
 */

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MagnifyingGlassIcon as Search,
  AdjustmentsHorizontalIcon as SlidersHorizontal,
  TrashIcon as Trash2,
  ArrowDownTrayIcon as Download,
  EyeIcon as Eye,
  CheckIcon as CheckSquare,
  Squares2X2Icon as Square,
  StarIcon as Star,
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import PhotoDetailModal from './PhotoDetailModal'

interface Photo {
  id: string
  filename: string
  original_url: string
  thumbnail_medium_url: string | null
  thumbnail_small_url: string | null
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

interface PhotoGridProps {
  photos: Photo[]
  event_id: string
  currentSort?: string
  currentFilter?: string
  currentSearch?: string
}

export default function PhotoGrid({
  photos,
  event_id,
  currentSort = 'date-desc',
  currentFilter,
  currentSearch,
}: PhotoGridProps) {
  const router = useRouter()
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState(currentSearch || '')
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  )

  /**
   * Toggle photo selection
   */
  const toggleSelection = (photo_id: string) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(photo_id)) {
      newSelected.delete(photo_id)
    } else {
      newSelected.add(photo_id)
    }
    setSelectedPhotos(newSelected)
  }

  /**
   * Select all photos
   */
  const selectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(photos.map((p) => p.id)))
    }
  }

  /**
   * Handle sort change
   */
  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams()
    params.set('sort', sort)
    if (currentFilter) params.set('filter', currentFilter)
    if (currentSearch) params.set('search', currentSearch)
    router.push(`/admin/events/${event_id}/photos?${params.toString()}`)
  }

  /**
   * Handle filter change
   */
  const handleFilterChange = (filter: string) => {
    const params = new URLSearchParams()
    params.set('sort', currentSort)
    if (filter !== 'all') params.set('filter', filter)
    if (currentSearch) params.set('search', currentSearch)
    router.push(`/admin/events/${event_id}/photos?${params.toString()}`)
  }

  /**
   * Handle search
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    params.set('sort', currentSort)
    if (currentFilter) params.set('filter', currentFilter)
    if (searchQuery) params.set('search', searchQuery)
    router.push(`/admin/events/${event_id}/photos?${params.toString()}`)
  }

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0) return

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedPhotos.size} photo(s)? This action can be undone from the Trash.`
    )

    if (!confirmed) return

    try {
      // Delete selected photos
      const deletePromises = Array.from(selectedPhotos).map((photo_id) =>
        fetch(`/api/admin/photos/${photo_id}`, {
          method: 'DELETE',
        })
      )

      await Promise.all(deletePromises)

      // Refresh page
      router.refresh()
      setSelectedPhotos(new Set())
      setIsSelectMode(false)

      alert(`Successfully deleted ${selectedPhotos.size} photo(s)`)
    } catch (error) {
      console.error('Error deleting photos:', error)
      alert('Failed to delete photos. Please try again.')
    }
  }

  /**
   * Handle bulk download
   */
  const handleBulkDownload = () => {
    if (selectedPhotos.size === 0) return

    alert('Bulk download feature coming soon!')
    // TODO: Implement bulk download
  }

  /**
   * Open photo detail modal
   */
  const handlePhotoClick = (index: number) => {
    if (!isSelectMode) {
      setSelectedPhotoIndex(index)
    }
  }

  /**
   * Close photo detail modal
   */
  const handleCloseModal = () => {
    setSelectedPhotoIndex(null)
  }

  /**
   * Handle photo change in modal
   */
  const handlePhotoChange = (newIndex: number) => {
    setSelectedPhotoIndex(newIndex)
  }

  /**
   * Handle photo update
   */
  const handlePhotoUpdate = () => {
    router.refresh()
  }

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <>
      <div className="space-y-6">
        {/* Controls Bar */}
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <form onSubmit={handleSearch} className="max-w-md flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search photos by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-[#54ACBF] focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                />
              </div>
            </form>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Filter */}
              <div className="relative">
                <SlidersHorizontal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={currentFilter || 'all'}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-[#54ACBF] focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                >
                  <option value="all">All Photos</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                </select>
              </div>

              {/* Sort */}
              <div className="relative">
                <Eye className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-[#54ACBF] focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="size-desc">Size (Largest)</option>
                  <option value="size-asc">Size (Smallest)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                </select>
              </div>

              {/* Select Mode */}
              <button
                onClick={() => {
                  setIsSelectMode(!isSelectMode)
                  setSelectedPhotos(new Set())
                }}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  isSelectMode
                    ? 'border-[#54ACBF] bg-[#54ACBF] text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isSelectMode ? 'Cancel' : 'Select'}
              </button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {isSelectMode && selectedPhotos.size > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-[#54ACBF]/10 p-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">
                  {selectedPhotos.size} photo(s) selected
                </span>
                <button
                  onClick={selectAll}
                  className="text-sm font-medium text-[#54ACBF] hover:text-[#54ACBF]/80"
                >
                  {selectedPhotos.size === photos.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDownload}
                  className="inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {photos.map((photo, index) => {
            const isSelected = selectedPhotos.has(photo.id)
            const thumbnail_url =
              photo.thumbnail_medium_url || photo.thumbnail_small_url

            return (
              <div
                key={photo.id}
                className={`group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-gray-100 transition-all ${
                  isSelected
                    ? 'ring-4 ring-[#54ACBF]'
                    : 'border-gray-200 hover:shadow-lg'
                }`}
                onClick={() => {
                  if (isSelectMode) {
                    toggleSelection(photo.id)
                  } else {
                    handlePhotoClick(index)
                  }
                }}
              >
                {/* Photo */}
                {thumbnail_url ? (
                  <Image
                    src={thumbnail_url}
                    alt={`Photo: ${photo.filename}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <span className="text-gray-400">No preview</span>
                  </div>
                )}

                {/* Selection Checkbox */}
                {isSelectMode && (
                  <div className="absolute left-2 top-2 z-10">
                    {isSelected ? (
                      <CheckSquare className="h-6 w-6 text-[#54ACBF]" />
                    ) : (
                      <Square className="h-6 w-6 text-white" />
                    )}
                  </div>
                )}

                {/* Featured Badge */}
                {photo.is_featured && (
                  <div className="absolute right-2 top-2 z-10">
                    <div className="rounded-full bg-yellow-500 p-1.5">
                      <Star className="h-3 w-3 text-white" fill="white" />
                    </div>
                  </div>
                )}

                {/* Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p
                    className="truncate text-xs font-medium text-white"
                    title={photo.filename}
                  >
                    {photo.filename}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span>{formatFileSize(photo.file_size)}</span>
                    {photo.width && photo.height && (
                      <span>
                        {photo.width} × {photo.height}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60">
                    {format(new Date(photo.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Info */}
        <div className="rounded-lg bg-white p-4 text-center text-sm text-gray-600 shadow-sm">
          Showing {photos.length} photo(s)
        </div>
      </div>

      {/* Photo Detail Modal */}
      {selectedPhotoIndex !== null && photos[selectedPhotoIndex] && (
        <PhotoDetailModal
          photo={photos[selectedPhotoIndex]}
          photos={photos}
          currentIndex={selectedPhotoIndex}
          onClose={handleCloseModal}
          onPhotoChange={handlePhotoChange}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}
    </>
  )
}
