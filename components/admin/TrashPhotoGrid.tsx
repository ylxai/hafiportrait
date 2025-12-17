'use client'

import { useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { RotateCcw, Trash2, Clock } from 'lucide-react'
import DeleteConfirmationModal from './DeleteConfirmationModal'

interface Photo {
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

interface TrashPhotoGridProps {
  photos: Photo[]
  isAdmin: boolean
}

export default function TrashPhotoGrid({
  photos,
  isAdmin,
}: TrashPhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSelectPhoto = (photo_id: string, selected: boolean) => {
    const newSelected = new Set(selectedPhotos)
    if (selected) {
      newSelected.add(photo_id)
    } else {
      newSelected.delete(photo_id)
    }
    setSelectedPhotos(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(photos.map((p) => p.id)))
    }
  }

  const handleBulkRestore = async () => {
    if (selectedPhotos.size === 0 || isProcessing) return

    setIsProcessing(true)
    try {
      const promises = Array.from(selectedPhotos).map((photo_id) =>
        fetch(`/api/admin/photos/${photo_id}/restore`, { method: 'POST' })
      )

      const results = await Promise.all(promises)
      const failed = results.filter((r) => !r.ok).length

      if (failed === 0) {
        alert(`${selectedPhotos.size} foto berhasil di-restore!`)
        setSelectedPhotos(new Set())
        // Refresh the page or trigger parent refresh
        window.location.reload()
      } else {
        alert(
          `${failed} foto gagal di-restore dari ${selectedPhotos.size} total.`
        )
      }
    } catch (error) {
      alert('Terjadi kesalahan saat restore foto.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPhotos.size === 0 || isProcessing) return

    setIsProcessing(true)
    try {
      const promises = Array.from(selectedPhotos).map((photo_id) =>
        fetch(`/api/admin/photos/${photo_id}/force-delete`, {
          method: 'DELETE',
        })
      )

      const results = await Promise.all(promises)
      const failed = results.filter((r) => !r.ok).length

      if (failed === 0) {
        alert(`${selectedPhotos.size} foto berhasil dihapus permanen!`)
        setSelectedPhotos(new Set())
        // Refresh the page or trigger parent refresh
        window.location.reload()
      } else {
        alert(`${failed} foto gagal dihapus dari ${selectedPhotos.size} total.`)
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus foto.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRestore = async (photo_id: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/photos/${photo_id}/restore`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to restore photo')
      }

      alert('Foto berhasil di-restore!')
      window.location.reload()
    } catch (error) {
      console.error('Restore error:', error)
      alert('Gagal me-restore foto. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePermanentDelete = async (photo_id: string) => {
    if (isProcessing) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/admin/photos/${photo_id}/permanent`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to permanently delete photo')
      }

      alert('Foto berhasil dihapus permanen!')
      window.location.reload()
    } catch (error) {
      console.error('Permanent delete error:', error)
      alert('Gagal menghapus foto secara permanen. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
    }
  }

  const openDeleteModal = (photo_id: string) => {
    setPhotoToDelete(photo_id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (photoToDelete) {
      await handlePermanentDelete(photoToDelete)
    }
  }

  const calculateDaysInTrash = (deleted_at: Date | null): number => {
    if (!deleted_at) return 0
    const now = new Date()
    const deleted = new Date(deleted_at)
    const diffTime = Math.abs(now.getTime() - deleted.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDaysRemainingClass = (days: number): string => {
    if (days >= 30) return 'text-red-600 font-bold'
    if (days >= 25) return 'text-orange-600 font-semibold'
    if (days >= 20) return 'text-yellow-600'
    return 'text-gray-600'
  }

  return (
    <>
      {/* Bulk Actions */}
      {selectedPhotos.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <span className="font-medium text-blue-900">
              {selectedPhotos.size} foto dipilih
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkRestore}
              disabled={isProcessing}
              className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? 'Memproses...' : 'Restore Terpilih'}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isProcessing ? 'Memproses...' : 'Hapus Permanen'}
            </button>
          </div>
        </div>
      )}

      {/* Select All */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="checkbox"
          checked={selectedPhotos.size === photos.length && photos.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300"
        />
        <label className="text-sm font-medium">
          Pilih Semua ({photos.length} foto)
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => {
          const daysInTrash = calculateDaysInTrash(photo.deleted_at)
          const daysRemaining = Math.max(0, 30 - daysInTrash)
          const isExpired = daysInTrash >= 30

          return (
            <div
              key={photo.id}
              className="group relative overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm transition-all hover:shadow-lg"
            >
              {/* Photo Thumbnail */}
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <Image
                  src={
                    photo.thumbnail_medium_url ||
                    photo.thumbnail_small_url ||
                    '/placeholder.jpg'
                  }
                  alt={photo.filename}
                  fill
                  className="object-cover opacity-75"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />

                {/* Selection Checkbox */}
                <div className="absolute right-2 top-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.has(photo.id)}
                    onChange={(e) =>
                      handleSelectPhoto(photo.id, e.target.checked)
                    }
                    className="h-5 w-5 rounded border-2 border-white bg-white/80 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                {/* Deleted Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Clock className="h-8 w-8 text-white opacity-75" />
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <p
                  className="truncate text-xs font-medium text-gray-900"
                  title={photo.filename}
                >
                  {photo.filename}
                </p>
                <p
                  className="mt-1 truncate text-xs text-gray-500"
                  title={photo.event.name}
                >
                  {photo.event.name}
                </p>

                {photo.deleted_at && (
                  <p className="mt-1 text-xs text-gray-500">
                    Dihapus:{' '}
                    {format(new Date(photo.deleted_at), 'dd MMM yyyy', {
                      locale: localeId,
                    })}
                  </p>
                )}

                {photo.deletedByUser && (
                  <p className="mt-1 text-xs text-gray-500">
                    Oleh: {photo.deletedByUser.name}
                  </p>
                )}

                {/* Days Remaining */}
                <p
                  className={`mt-2 text-xs ${getDaysRemainingClass(daysInTrash)}`}
                >
                  {isExpired ? (
                    <span className="font-bold">⚠️ Siap dihapus permanen</span>
                  ) : (
                    <span>{daysRemaining} hari tersisa</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-200">
                <button
                  onClick={() => handleRestore(photo.id)}
                  disabled={isProcessing}
                  className="flex flex-1 items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50"
                  title="Restore foto"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore
                </button>

                {isAdmin && (
                  <button
                    onClick={() => openDeleteModal(photo.id)}
                    disabled={isProcessing}
                    className="flex flex-1 items-center justify-center gap-1 border-l border-gray-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    title="Hapus permanen"
                  >
                    <Trash2 className="h-3 w-3" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setPhotoToDelete(null)
        }}
        onConfirm={confirmDelete}
        title="Hapus Permanen?"
        message="Foto ini akan dihapus secara permanen beserta semua thumbnails dari storage. Tindakan ini tidak bisa dibatalkan!"
        photoCount={1}
        isPermanent={true}
      />
    </>
  )
}
