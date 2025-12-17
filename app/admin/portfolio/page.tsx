'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/app/components/admin/AdminLayout'
import { Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react'
import { useAdminToast } from '@/hooks/toast/useAdminToast'
import Image from 'next/image'

interface PortfolioPhoto {
  id: string
  imageUrl: string
  thumbnail_url: string | null
  title: string | null
  description: string | null
  category: string | null
  display_order: number
  is_active: boolean
  filename: string
  original_url: string
  is_featured: boolean
  created_at: string
}

export default function PortfolioPage() {
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploader, setShowUploader] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([])
  const toast = useAdminToast()

  const fetchPhotos = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/portfolio')
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const handleUploadComplete = () => {
    toast.portfolio.updateSuccess()
    setShowUploader(false)
    fetchPhotos()
  }

  const handleDeleteSelected = async () => {
    if (selectedPhotos.length === 0) return

    if (!confirm(`Hapus ${selectedPhotos.length} foto dari portfolio?`)) return

    const loadingToastId = toast.showLoading(`Menghapus ${selectedPhotos.length} foto...`)

    try {
      const deletePromises = selectedPhotos.map((photo_id) =>
        fetch(`/api/admin/portfolio/${photo_id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      )
      await Promise.all(deletePromises)

      toast.updateToast(
        loadingToastId,
        'success',
        'Foto berhasil dihapus!',
        { description: `${selectedPhotos.length} foto berhasil dihapus` }
      )
      setSelectedPhotos([])
      fetchPhotos()
    } catch (error) {
      console.error('Delete error:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal menghapus foto')
    }
  }

  const handleToggleActive = async (photo_id: string, is_active: boolean) => {
    try {
      const response = await fetch(`/api/admin/portfolio/${photo_id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !is_active }),
      })

      if (!response.ok) throw new Error('Update failed')

      toast.generic.saveSuccess()
      fetchPhotos()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.generic.saveError()
    }
  }

  const handleSelectPhoto = (photo_id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photo_id)
        ? prev.filter((id) => id !== photo_id)
        : [...prev, photo_id]
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Portfolio</h1>
            <p className="text-gray-600 mt-1">
              Kelola foto portfolio yang ditampilkan di landing page
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedPhotos.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="btn btn-danger flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedPhotos.length})</span>
              </button>
            )}
            <button
              onClick={() => setShowUploader(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Photos</p>
                <p className="text-2xl font-bold text-gray-900">{photos.length}</p>
              </div>
              <ImageIcon className="w-8 h-8 text-brand-teal" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Photos</p>
                <p className="text-2xl font-bold text-green-600">
                  {photos.filter((p) => p.is_active).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-blue-600">{selectedPhotos.length}</p>
              </div>
              <Trash2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Portfolio Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio photos yet</h3>
            <p className="text-gray-500 mb-6">Upload your best work to showcase</p>
            <button
              onClick={() => setShowUploader(true)}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Upload First Photo</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group cursor-pointer"
                onClick={() => handleSelectPhoto(photo.id)}
              >
                <Image
                  src={photo.thumbnail_url || photo.imageUrl}
                  alt={photo.title || 'Portfolio photo'}
                  fill
                  className="object-cover"
                />

                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      handleSelectPhoto(photo.id)
                    }}
                    className="w-5 h-5 rounded border-gray-300"
                  />
                </div>

                {/* Active Badge */}
                {photo.is_active && (
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                      Active
                    </span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div className="w-full">
                    {photo.title && (
                      <p className="text-white text-sm font-medium truncate">
                        {photo.title}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleActive(photo.id, photo.is_active)
                        }}
                        className="text-xs text-white hover:text-brand-teal"
                      >
                        {photo.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Simple Uploader Modal */}
        {showUploader && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload Portfolio Photos</h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Drag & drop atau click untuk upload portfolio photos
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={async (e) => {
                      const files = e.target.files
                      if (!files || files.length === 0) return

                      const loadingId = toast.showLoading(`Uploading ${files.length} photos...`)

                      try {
                        const formData = new FormData()
                        Array.from(files).forEach((file) => {
                          formData.append('files', file)
                        })

                        const response = await fetch('/api/admin/portfolio', {
                          method: 'POST',
                          credentials: 'include',
                          body: formData,
                        })

                        if (!response.ok) throw new Error('Upload failed')

                        toast.updateToast(loadingId, 'success', `${files.length} foto portfolio berhasil diupload!`)
                        handleUploadComplete()
                      } catch (error) {
                        console.error('Upload error:', error)
                        toast.updateToast(loadingId, 'error', 'Gagal upload photos')
                      }
                    }}
                    className="hidden"
                    id="portfolio-upload"
                  />
                  <label
                    htmlFor="portfolio-upload"
                    className="btn btn-primary cursor-pointer inline-flex items-center space-x-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select Files</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
