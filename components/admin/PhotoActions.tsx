'use client'

/**
 * Photo Actions Component
 * Handles all photo management actions:
 * - Caption editing with auto-save
 * - Set as event cover
 * - Download photo
 * - Delete photo (with confirmation modal)
 * - Featured toggle
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownTrayIcon as Download,
  TrashIcon as Trash2,
  StarIcon as Star,
  BookmarkIcon as Save,
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle,
  ArrowPathIcon as Loader2,
  PhotoIcon as ImageIcon,
} from '@heroicons/react/24/outline'
import DeleteConfirmationModal from './DeleteConfirmationModal'

interface Photo {
  id: string
  caption: string | null
  is_featured: boolean
  event: {
    id: string
    name: string
  }
}

interface PhotoActionsProps {
  photo: Photo
  onUpdate: () => void
  onDownload: () => void
  onClose: () => void
}

export default function PhotoActions({
  photo,
  onUpdate,
  onDownload,
  onClose,
}: PhotoActionsProps) {
  const router = useRouter()
  const [caption, setCaption] = useState(photo.caption || '')
  const [is_featured, setIsFeatured] = useState(photo.is_featured)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<
    'idle' | 'saving' | 'success' | 'error'
  >('idle')
  const [isSettingCover, setIsSettingCover] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Auto-save caption on blur
  const handleCaptionBlur = async () => {
    if (caption === (photo.caption || '')) {
      return // No changes
    }

    await saveCaption()
  }

  const saveCaption = async () => {
    try {
      setSaveStatus('saving')
      setIsSaving(true)

      const response = await fetch(`/api/admin/photos/${photo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caption }),
      })

      if (response.ok) {
        setSaveStatus('success')
        onUpdate()

        // Clear success message after 2 seconds
        timeoutRef.current = setTimeout(() => {
          setSaveStatus('idle')
        }, 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Error saving caption:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  // Toggle featured status
  const handleToggleFeatured = async () => {
    try {
      const newFeaturedStatus = !is_featured
      setIsFeatured(newFeaturedStatus)

      const response = await fetch(`/api/admin/photos/${photo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_featured: newFeaturedStatus }),
      })

      if (response.ok) {
        onUpdate()
      } else {
        // Revert on error
        setIsFeatured(!newFeaturedStatus)
        alert('Failed to update featured status')
      }
    } catch (error) {
      console.error('Error toggling featured:', error)
      setIsFeatured(!is_featured)
      alert('Failed to update featured status')
    }
  }

  // Set as event cover
  const handleSetCover = async () => {
    const confirmed = confirm(
      `Set this photo as the cover for "${photo.event.name}"?`
    )

    if (!confirmed) return

    try {
      setIsSettingCover(true)

      const response = await fetch(`/api/admin/photos/${photo.id}/set-cover`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        alert('Photo set as event cover successfully!')
        setIsFeatured(true)
        onUpdate()
      } else {
        alert('Failed to set event cover: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error setting cover:', error)
      alert('Failed to set event cover')
    } finally {
      setIsSettingCover(false)
    }
  }

  // Delete photo (soft delete)
  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert('Foto dipindahkan ke Trash!')
        onClose()
        router.refresh()
      } else {
        alert('Failed to delete photo: ' + (data.error || 'Unknown error'))
        throw new Error(data.error || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      throw error
    }
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div className="space-y-6 border-t border-gray-200 p-6">
        {/* Caption Editor */}
        <div className="space-y-2">
          <label className="flex items-center justify-between text-sm font-semibold text-gray-900">
            <span>Caption</span>
            {saveStatus === 'saving' && (
              <span className="flex items-center text-xs text-blue-600">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'success' && (
              <span className="flex items-center text-xs text-green-600">
                <CheckCircle className="mr-1 h-3 w-3" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center text-xs text-red-600">
                <AlertCircle className="mr-1 h-3 w-3" />
                Failed
              </span>
            )}
          </label>

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={handleCaptionBlur}
            placeholder="Add a caption for this photo..."
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#54ACBF] focus:outline-none focus:ring-1 focus:ring-[#54ACBF]"
            rows={3}
            maxLength={500}
          />

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{caption.length} / 500 characters</span>
            {caption !== (photo.caption || '') && (
              <button
                onClick={saveCaption}
                disabled={isSaving}
                className="flex items-center text-[#54ACBF] hover:text-[#54ACBF]/80"
              >
                <Save className="mr-1 h-3 w-3" />
                Save now
              </button>
            )}
          </div>
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Star
              className={`mr-3 h-5 w-5 ${
                is_featured
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-400'
              }`}
            />
            <div>
              <div className="text-sm font-medium text-gray-900">
                Featured Photo
              </div>
              <div className="text-xs text-gray-500">Highlight this photo</div>
            </div>
          </div>

          <button
            onClick={handleToggleFeatured}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              is_featured ? 'bg-[#54ACBF]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                is_featured ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

          {/* Set as Event Cover */}
          <button
            onClick={handleSetCover}
            disabled={isSettingCover}
            className="flex w-full items-center justify-center rounded-lg border border-[#54ACBF] bg-white px-4 py-3 text-sm font-medium text-[#54ACBF] transition-colors hover:bg-[#54ACBF]/5 disabled:opacity-50"
          >
            {isSettingCover ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="mr-2 h-4 w-4" />
            )}
            Set as Event Cover
          </button>

          {/* Download Original */}
          <button
            onClick={onDownload}
            className="flex w-full items-center justify-center rounded-lg bg-[#54ACBF] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#54ACBF]/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Original
          </button>

          {/* Delete Photo */}
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex w-full items-center justify-center rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Photo
          </button>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-2 text-xs font-semibold text-gray-700">
            Keyboard Shortcuts
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Close modal</span>
              <kbd className="rounded bg-gray-200 px-2 py-0.5 font-mono">
                Esc
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Previous/Next photo</span>
              <kbd className="rounded bg-gray-200 px-2 py-0.5 font-mono">
                ← →
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Download</span>
              <kbd className="rounded bg-gray-200 px-2 py-0.5 font-mono">D</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Foto?"
        message="Apakah Anda yakin ingin menghapus foto ini?"
        photoCount={1}
        isPermanent={false}
      />
    </>
  )
}
