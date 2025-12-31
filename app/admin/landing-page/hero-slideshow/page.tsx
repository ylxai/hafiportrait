'use client'

import { useState, useEffect, useCallback } from 'react'
import { xhrUpload } from '@/lib/upload/xhr-upload'
import AdminLayout from '@/app/components/admin/AdminLayout'
import ErrorAlert from '@/components/ui/ErrorAlert'
import { 
  ArrowUpTrayIcon as Upload, 
  TrashIcon as Trash2, 
  Bars3Icon as GripVertical, 
  PhotoIcon as ImageIcon 
} from '@heroicons/react/24/outline'
import Image from 'next/image'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useAdminToast } from '@/hooks/toast/useAdminToast'

interface HeroImage {
  id: string
  imageUrl: string
  title: string | null
  subtitle: string | null
  display_order: number
  is_active: boolean
}

interface SortableItemProps {
  image: HeroImage
  onDelete: (id: string) => void
  onToggleActive: (id: string, is_active: boolean) => void
}

function SortableItem({ image, onDelete, onToggleActive }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center space-x-4">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-5 h-5 text-gray-400" />
        </button>

        <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-100">
          <Image src={image.imageUrl} alt={image.title || 'Hero image'} fill className="object-cover" />
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{image.title || 'Untitled'}</h3>
          {image.subtitle && <p className="text-sm text-gray-500">{image.subtitle}</p>}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onToggleActive(image.id, !image.is_active)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              image.is_active
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {image.is_active ? 'Active' : 'Inactive'}
          </button>
          <button
            onClick={() => onDelete(image.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

type UploadQueueItemStatus = 'pending' | 'uploading' | 'success' | 'error'

interface UploadQueueItem {
  id: string
  file: File
  previewUrl: string
  progress: number
  status: UploadQueueItemStatus
  error?: string
}

export default function HeroSlideshowPage() {
  const [images, setImages] = useState<HeroImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const toast = useAdminToast()

  const fetchImages = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/hero-slideshow')
      if (response.ok) {
        const data = await response.json()
        setImages(data.images || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch images (${response.status})`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch images'
      setError(message)
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const list = Array.from(files)

    // Initialize queue with previews
    const newItems: UploadQueueItem[] = list.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }))

    setUploadQueue((prev) => [...newItems, ...prev])

    setUploading(true)
    const loadingToastId = toast.showLoading(`Uploading ${list.length} gambar...`)

    try {
      for (const item of newItems) {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 0 } : q))
        )

        const fd = new FormData()
        fd.append('file', item.file)
        fd.append('title', '')
        fd.append('subtitle', '')

        const res = await xhrUpload({
          url: '/api/admin/hero-slideshow',
          formData: fd,
          withCredentials: true,
          onProgress: (p) => {
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: p.percent } : q))
            )
          },
        })

        if (!res.ok) {
          const msg =
            typeof res.json === 'object' && res.json && 'error' in res.json
              ? String((res.json as { error?: string }).error || 'Upload failed')
              : `Upload failed (${res.status})`

          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: 'error', error: msg } : q))
          )
          continue
        }

        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
        )
      }

      toast.updateToast(loadingToastId, 'success', `${list.length} slide berhasil diupload!`)
      fetchImages()

      // Cleanup preview URLs for completed uploads
      setTimeout(() => {
        setUploadQueue((prev) => {
          prev.forEach((q) => {
            if (q.status === 'success') URL.revokeObjectURL(q.previewUrl)
          })
          return prev.filter((q) => q.status !== 'success')
        })
      }, 2000)
    } catch (error) {
      console.error('Upload error:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal upload gambar')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus gambar ini dari hero slideshow?')) return

    const loadingToastId = toast.showLoading('Menghapus gambar...')

    try {
      const response = await fetch(`/api/admin/hero-slideshow/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) throw new Error('Delete failed')

      toast.updateToast(loadingToastId, 'success', 'Slide berhasil dihapus!')
      fetchImages()
    } catch (error) {
      console.error('Delete error:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal menghapus gambar')
    }
  }

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      const response = await fetch(`/api/admin/hero-slideshow/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      })

      if (!response.ok) throw new Error('Update failed')

      toast.generic.saveSuccess()
      fetchImages()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.generic.saveError()
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = images.findIndex((img) => img.id === active.id)
    const newIndex = images.findIndex((img) => img.id === over.id)

    const newImages = arrayMove(images, oldIndex, newIndex)
    setImages(newImages)

    // Save new order
    const loadingToastId = toast.showLoading('Menyimpan urutan...')

    try {
      const response = await fetch('/api/admin/hero-slideshow/reorder', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageIds: newImages.map((img) => img.id),
        }),
      })

      if (!response.ok) throw new Error('Reorder failed')

      toast.updateToast(loadingToastId, 'success', 'Urutan slide berhasil diubah!')
    } catch (error) {
      console.error('Reorder error:', error)
      toast.updateToast(loadingToastId, 'error', 'Gagal menyimpan urutan')
      fetchImages() // Revert
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <ErrorAlert error={error} onDismiss={() => setError(null)} />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Hero Slideshow</h1>
            <p className="text-gray-600 mt-1">Kelola gambar hero slideshow di landing page</p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="btn btn-primary flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Drag & drop untuk mengubah urutan slideshow. Hanya gambar yang Active yang akan ditampilkan di landing page.
          </p>
        </div>

        {/* Upload Queue */}
        {uploadQueue.length > 0 && (
          <div className="rounded-lg bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Upload Queue</h3>
                <p className="text-xs text-gray-500">
                  Menampilkan progress upload per file (akan otomatis hilang setelah sukses)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadQueue((prev) => {
                    prev.forEach((q) => URL.revokeObjectURL(q.previewUrl))
                    return []
                  })
                }}
                className="text-xs font-medium text-gray-600 hover:text-gray-900"
                disabled={uploading}
              >
                Clear
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {uploadQueue.map((q) => (
                <div key={q.id} className="relative overflow-hidden rounded-lg bg-gray-100">
                  <div className="relative aspect-[16/10]">
                    <Image src={q.previewUrl} alt={q.file.name} fill className="object-cover" />
                  </div>

                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-gray-900" title={q.file.name}>
                      {q.file.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {q.status}{q.status === 'uploading' ? ` • ${q.progress}%` : ''}
                    </p>

                    {q.status === 'uploading' && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-brand-teal transition-all"
                          style={{ width: `${q.progress}%` }}
                        />
                      </div>
                    )}

                    {q.status === 'error' && q.error && (
                      <p className="mt-1 line-clamp-2 text-[11px] text-red-600" title={q.error}>
                        {q.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Images List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                  <div className="w-32 h-20 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
            <p className="text-gray-500 mb-6">Upload images untuk hero slideshow</p>
            <label className="btn btn-primary inline-flex items-center space-x-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Upload First Image</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={images.map((img) => img.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {images.map((image) => (
                  <SortableItem
                    key={image.id}
                    image={image}
                    onDelete={handleDelete}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </AdminLayout>
  )
}
