'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  StarIcon as Star,
  TrashIcon as Trash2,
  PencilIcon as Edit2,
  Bars3Icon as GripVertical,
  CheckIcon as Check,
} from '@heroicons/react/24/outline'

interface PortfolioPhoto {
  id: string
  filename: string
  original_url: string
  thumbnail_url: string
  display_order: number
  is_featured: boolean
  category: string | null
  description: string | null
  created_at: string
}

interface PortfolioGridProps {
  photos: PortfolioPhoto[]
  onUpdate: () => void
}

export default function PortfolioGrid({
  photos,
  onUpdate,
}: PortfolioGridProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ category: '', description: '' })

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === photos.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(photos.map((p) => p.id)))
    }
  }

  const toggleFeatured = async (photo_id: string, currentFeatured: boolean) => {
    try {
      const response = await fetch('/api/admin/portfolio', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          updates: { id: photo_id, is_featured: !currentFeatured },
        }),
      })

      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error)
    }
  }

  const deletePhotos = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} photo(s)?`)) return

    try {
      const response = await fetch(
        `/api/admin/portfolio?ids=${ids.join(',')}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      )

      if (response.ok) {
        setSelectedIds(new Set())
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to delete photos:', error)
    }
  }

  const startEdit = (photo: PortfolioPhoto) => {
    setEditingId(photo.id)
    setEditData({
      category: photo.category || '',
      description: photo.description || '',
    })
  }

  const saveEdit = async () => {
    if (!editingId) return

    try {
      const response = await fetch('/api/admin/portfolio', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          updates: { id: editingId, ...editData },
        }),
      })

      if (response.ok) {
        setEditingId(null)
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to update photo:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-detra-gold/10 p-4">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-900">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => deletePhotos(Array.from(selectedIds))}
              className="flex items-center space-x-2 rounded-lg bg-red-500 px-3 py-1.5 text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete</span>
            </button>
          </div>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Select All */}
      {photos.length > 0 && (
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="checkbox"
              checked={selectedIds.size === photos.length && photos.length > 0}
              onChange={selectAll}
              className="rounded border-gray-300 text-detra-gold focus:ring-detra-gold"
            />
            {selectedIds.size === photos.length && photos.length > 0 && (
              <Check className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white" />
            )}
          </div>
          <label className="text-sm text-gray-600">
            {selectedIds.size === photos.length && photos.length > 0
              ? 'Deselect all'
              : 'Select all'}
          </label>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`group relative overflow-hidden rounded-lg border-2 bg-white transition-all ${
              selectedIds.has(photo.id)
                ? 'border-detra-gold ring-2 ring-detra-gold'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Checkbox */}
            <div className="absolute left-2 top-2 z-10">
              <input
                type="checkbox"
                checked={selectedIds.has(photo.id)}
                onChange={() => toggleSelect(photo.id)}
                className="h-5 w-5 rounded border-gray-300 text-detra-gold focus:ring-detra-gold"
              />
            </div>

            {/* Drag Handle */}
            <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="h-5 w-5 cursor-move text-gray-400" />
            </div>

            {/* Featured Badge */}
            {photo.is_featured && (
              <div className="absolute right-2 top-2 z-10 rounded-full bg-yellow-400 p-1.5 text-white">
                <Star className="h-4 w-4 fill-current" />
              </div>
            )}

            {/* Image */}
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={photo.thumbnail_url || photo.original_url}
                alt={`Portfolio photo: ${photo.category || photo.filename}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
                loading="lazy"
              />
            </div>

            {/* Actions Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center space-x-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                className="rounded-full bg-white p-2 hover:bg-gray-100"
                title={
                  photo.is_featured
                    ? 'Remove from featured'
                    : 'Mark as featured'
                }
              >
                <Star
                  className={`h-5 w-5 ${photo.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                />
              </button>
              <button
                onClick={() => startEdit(photo)}
                className="rounded-full bg-white p-2 hover:bg-gray-100"
                title="Edit details"
              >
                <Edit2 className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => deletePhotos([photo.id])}
                className="rounded-full bg-white p-2 hover:bg-gray-100"
                title="Delete"
              >
                <Trash2 className="h-5 w-5 text-red-500" />
              </button>
            </div>

            {/* Photo Info */}
            <div className="p-2">
              <p className="truncate text-xs text-gray-600">{photo.filename}</p>
              {photo.category && (
                <p className="text-xs text-gray-500">{photo.category}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Edit Photo Details</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={editData.category}
                  onChange={(e) =>
                    setEditData({ ...editData, category: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-detra-gold"
                  placeholder="e.g., Wedding, Portrait, Event"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-detra-gold"
                  rows={3}
                  placeholder="Photo description..."
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditingId(null)}
                className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-lg bg-detra-gold px-4 py-2 text-white hover:bg-detra-gold/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
