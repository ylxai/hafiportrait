'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Star, Trash2, Edit2, GripVertical, Check } from 'lucide-react'

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

export default function PortfolioGrid({ photos, onUpdate }: PortfolioGridProps) {
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
      setSelectedIds(new Set(photos.map(p => p.id)))
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
      const response = await fetch(`/api/admin/portfolio?ids=${ids.join(',')}`, {
        method: 'DELETE',
        credentials: 'include',
      })

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
        <div className="flex items-center justify-between bg-brand-teal/10 p-4 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-900">
              {selectedIds.size} selected
            </span>
            <button
              onClick={() => deletePhotos(Array.from(selectedIds))}
              className="flex items-center space-x-2 px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
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
          <input
            type="checkbox"
            checked={selectedIds.size === photos.length && photos.length > 0}
            onChange={selectAll}
            className="rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
          />
          <label className="text-sm text-gray-600">Select all</label>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group bg-white rounded-lg border-2 overflow-hidden transition-all ${
              selectedIds.has(photo.id)
                ? 'border-brand-teal ring-2 ring-brand-teal'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedIds.has(photo.id)}
                onChange={() => toggleSelect(photo.id)}
                className="w-5 h-5 rounded border-gray-300 text-brand-teal focus:ring-brand-teal"
              />
            </div>

            {/* Featured Badge */}
            {photo.is_featured && (
              <div className="absolute top-2 right-2 z-10 bg-yellow-400 text-white p-1.5 rounded-full">
                <Star className="w-4 h-4 fill-current" />
              </div>
            )}

            {/* Image */}
            <div className="aspect-square bg-gray-100 relative">
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
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 z-10">
              <button
                onClick={() => toggleFeatured(photo.id, photo.is_featured)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title={photo.is_featured ? 'Remove from featured' : 'Mark as featured'}
              >
                <Star className={`w-5 h-5 ${photo.is_featured ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
              </button>
              <button
                onClick={() => startEdit(photo)}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title="Edit details"
              >
                <Edit2 className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => deletePhotos([photo.id])}
                className="p-2 bg-white rounded-full hover:bg-gray-100"
                title="Delete"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>

            {/* Photo Info */}
            <div className="p-2">
              <p className="text-xs text-gray-600 truncate">{photo.filename}</p>
              {photo.category && (
                <p className="text-xs text-gray-500">{photo.category}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Edit Photo Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  placeholder="e.g., Wedding, Portrait, Event"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                  rows={3}
                  placeholder="Photo description..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingId(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90"
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
