'use client'

/**
 * Photo Uploader Component dengan Toast Notifications
 *
 * Drag-and-drop photo upload interface with:
 * - Multi-file selection
 * - Preview grid
 * - Progress tracking dengan toast
 * - Error handling dengan toast feedback
 * - Mobile support
 */

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { xhrUpload } from '@/lib/upload/xhr-upload'
import {
  getUploadErrorMessage,
  getUploadHeaders,
  parseUploadResponse,
  resolveUploadUrl,
} from '@/lib/upload/uploadService'
import {
  ArrowUpTrayIcon as Upload,
  XMarkIcon as X,
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle,
  ArrowPathIcon as Loader2,
  PhotoIcon as ImageIcon,
} from '@heroicons/react/24/outline'
import { useAdminToast } from '@/hooks/toast/useAdminToast'
import { showFileValidationError } from '@/lib/toast/toast-utils'

// Accepted file types - moved outside component to be stable
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

interface UploadFile {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface PhotoUploaderProps {
  event_id: string
  eventName: string
  onUploadComplete?: (results: {
    total: number
    success: number
    failed: number
  }) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
}

const runWithConcurrency = async <T,>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) => {
  const executing = new Set<Promise<void>>()

  for (const item of items) {
    const p = worker(item)
    executing.add(p)
    const cleanup = () => executing.delete(p)
    p.then(cleanup).catch(cleanup)
    if (executing.size >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
}

export default function PhotoUploader({
  event_id,
  eventName,
  onUploadComplete,
  maxFiles = 500,
  maxFileSize = 50 * 1024 * 1024, // 50MB
}: PhotoUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useAdminToast()

  /**
   * Validate file
   */
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return `File type ${file.type} not supported. Use JPG, PNG, or WebP.`
      }

      if (file.size > maxFileSize) {
        const maxMB = maxFileSize / 1024 / 1024
        const fileMB = file.size / 1024 / 1024
        return `File size ${fileMB.toFixed(2)}MB exceeds maximum ${maxMB}MB.`
      }

      return null
    },
    [maxFileSize]
  )

  /**
   * Add files to upload queue
   */
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)

      // Check total files limit
      if (files.length + fileArray.length > maxFiles) {
        toast.updateToast(
          'max-files-error',
          'error',
          `Maksimal ${maxFiles} file`,
          {
            description: `Saat ini: ${files.length}, Menambahkan: ${fileArray.length}`,
          }
        )
        return
      }

      const uploadFiles: UploadFile[] = fileArray.map((file) => {
        const error = validateFile(file)

        // Show validation error toast untuk setiap file yang invalid
        if (error) {
          if (error.includes('size')) {
            showFileValidationError(
              file.name,
              'size',
              `${maxFileSize / 1024 / 1024}MB`
            )
          } else {
            showFileValidationError(file.name, 'type')
          }
        }

        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          status: error ? 'error' : 'pending',
          progress: 0,
          error,
        } as UploadFile
      })

      setFiles((prev) => [...prev, ...uploadFiles])

      // Show success toast untuk valid files
      const validFiles = uploadFiles.filter((f) => !f.error)
      if (validFiles.length > 0) {
        toast.generic.saveSuccess()
      }
    },
    [files.length, maxFiles, maxFileSize, toast, validateFile]
  )

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles)
      }
    },
    [addFiles]
  )

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
    },
    [addFiles]
  )

  /**
   * Remove file from queue
   */
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  /**
   * Clear all files
   */
  const clearAll = useCallback(() => {
    files.forEach((file) => URL.revokeObjectURL(file.preview))
    setFiles([])
    toast.generic.saveSuccess()
  }, [files, toast])

  /**
   * Upload all files dengan toast progress
   */
  const uploadAll = useCallback(async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending')

    if (pendingFiles.length === 0) {
      toast.updateToast('no-files', 'warning', 'Tidak ada file untuk diupload')
      return
    }

    setIsUploading(true)
    setUploadProgress({ current: 0, total: pendingFiles.length })

    // Show loading toast
    const uploadToastId = toast.photo.uploadStart(pendingFiles.length)

    // Upload in batches of 5
    const batchSize = 5
    const concurrencyLimit = Math.max(
      1,
      Math.min(10, Number(process.env.NEXT_PUBLIC_UPLOAD_CONCURRENCY ?? 2))
    )
    let completed = 0
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < pendingFiles.length; i += batchSize) {
      const batch = pendingFiles.slice(i, i + batchSize)

      // Mark as uploading
      setFiles((prev) =>
        prev.map((f) =>
          batch.find((b) => b.id === f.id)
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      )

      // Upload batch with concurrency control
      await runWithConcurrency(batch, concurrencyLimit, async (uploadFile) => {
        try {
          const formData = new FormData()
          formData.append('file', uploadFile.file)

          const uploadUrl = resolveUploadUrl(
            `/upload/event/${event_id}`,
            `/api/admin/events/${event_id}/photos/upload`
          )

          const result = await xhrUpload({
            url: uploadUrl,
            formData,
            withCredentials: false,
            headers: getUploadHeaders(),
            onProgress: (p) => {
              setFiles((prev) =>
                prev.map((f) =>
                  f.id === uploadFile.id ? { ...f, progress: p.percent } : f
                )
              )
            },
          })

          const data = parseUploadResponse(result.json)

          if (result.ok && data.success) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === uploadFile.id
                  ? { ...f, status: 'success' as const, progress: 100 }
                  : f
              )
            )
            successCount++
            return
          }

          throw new Error(getUploadErrorMessage(result.status, data))
        } catch (error) {
          console.error('Upload error:', error)
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadFile.id
                ? {
                    ...f,
                    status: 'error' as const,
                    error:
                      error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          )
          errorCount++
          toast.photo.uploadError(uploadFile.file.name)
        }
      })
      completed += batch.length

      // Update progress toast
      toast.updateToast(
        uploadToastId,
        'info',
        `Uploading... ${completed}/${pendingFiles.length} foto`,
        { description: `${successCount} berhasil, ${errorCount} gagal` }
      )

      setUploadProgress({ current: completed, total: pendingFiles.length })
    }

    setIsUploading(false)

    // Show final result toast
    if (errorCount === 0) {
      toast.updateToast(
        uploadToastId,
        'success',
        `${successCount} foto berhasil diupload! 🎉`,
        {
          description: `Semua foto berhasil ditambahkan ke event "${eventName}"`,
        }
      )
    } else if (successCount > 0) {
      toast.updateToast(
        uploadToastId,
        'warning',
        `Upload selesai dengan beberapa error`,
        { description: `${successCount} berhasil, ${errorCount} gagal` }
      )
    } else {
      toast.updateToast(uploadToastId, 'error', 'Upload gagal', {
        description: `Semua ${errorCount} file gagal diupload`,
      })
    }

    // Callback
    if (onUploadComplete) {
      onUploadComplete({
        total: pendingFiles.length,
        success: successCount,
        failed: errorCount,
      })
    }

    // Clear successful uploads after delay
    setTimeout(() => {
      setFiles((prev) => prev.filter((f) => f.status !== 'success'))
    }, 3000)
  }, [files, event_id, eventName, onUploadComplete, toast])

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const successCount = files.filter((f) => f.status === 'success').length

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-xl border-2 border-dashed p-12 text-center
          transition-all duration-200
          ${
            isDragging
              ? 'scale-[1.02] border-detra-gold bg-detra-gold/5'
              : 'border-gray-300 hover:border-detra-gold hover:bg-gray-50'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center space-y-4">
          <div
            className={`
            rounded-full p-4 transition-colors
            ${isDragging ? 'bg-detra-gold text-white' : 'bg-gray-100 text-gray-400'}
          `}
          >
            <Upload className="h-8 w-8" />
          </div>

          <div>
            <p className="mb-1 text-lg font-semibold text-gray-900">
              {isDragging ? 'Drop files here' : 'Upload Photos'}
            </p>
            <p className="text-sm text-gray-500">
              Drag & drop atau click untuk pilih file
            </p>
            <p className="mt-2 text-xs text-gray-400">
              JPG, PNG, WebP • Max {maxFileSize / 1024 / 1024}MB per file • Max{' '}
              {maxFiles} files
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {files.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="font-semibold text-gray-900">
                {files.length}
              </span>
              <span className="ml-1 text-gray-600">Total</span>
            </div>
            {pendingCount > 0 && (
              <div>
                <span className="font-semibold text-blue-600">
                  {pendingCount}
                </span>
                <span className="ml-1 text-gray-600">Pending</span>
              </div>
            )}
            {successCount > 0 && (
              <div>
                <span className="font-semibold text-green-600">
                  {successCount}
                </span>
                <span className="ml-1 text-gray-600">Success</span>
              </div>
            )}
            {errorCount > 0 && (
              <div>
                <span className="font-semibold text-red-600">{errorCount}</span>
                <span className="ml-1 text-gray-600">Error</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="btn btn-secondary text-sm"
            >
              Clear All
            </button>
            <button
              onClick={uploadAll}
              disabled={isUploading || pendingCount === 0}
              className="btn btn-primary text-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading... ({uploadProgress.current}/{uploadProgress.total})
                </>
              ) : (
                `Upload ${pendingCount} Photos`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
            >
              {/* File type icon background */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
              <Image
                src={file.preview}
                alt={file.file.name}
                fill
                className="object-cover"
              />

              {/* Status Overlay */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-2">
                <p className="flex-1 truncate text-xs text-white">
                  {file.file.name}
                </p>
              </div>

              {/* Status Icon */}
              <div className="absolute right-2 top-2">
                {file.status === 'pending' && (
                  <button
                    onClick={() => removeFile(file.id)}
                    className="rounded-full bg-white p-1 shadow-lg transition-colors hover:bg-red-50"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                )}
                {file.status === 'uploading' && (
                  <div className="rounded-full bg-white p-1 shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-detra-gold" />
                  </div>
                )}
                {file.status === 'success' && (
                  <div className="rounded-full bg-green-500 p-1 shadow-lg">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}
                {file.status === 'error' && (
                  <div
                    className="rounded-full bg-red-500 p-1 shadow-lg"
                    title={file.error}
                  >
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {file.status === 'uploading' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className="h-full bg-detra-gold transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
