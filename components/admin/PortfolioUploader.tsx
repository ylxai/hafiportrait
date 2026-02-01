'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { xhrUpload } from '@/lib/upload/xhr-upload'
import {
  getUploadErrorMessage,
  getUploadHeaders,
  parseUploadResponse,
  resolveUploadUrl,
} from '@/lib/upload/uploadService'
import { useAdminToast } from '@/hooks/toast/useAdminToast'
import {
  ArrowUpTrayIcon as Upload,
  XMarkIcon as X,
  PhotoIcon as ImageIcon,
  CheckCircleIcon as CheckCircle,
  XCircleIcon as XCircle,
  ArrowPathIcon as Loader2,
} from '@heroicons/react/24/outline'

interface UploadResult {
  filename?: string
  success: boolean
  photo_id?: string
  url?: string
  thumbnail_url?: string
  error?: string
}

interface PortfolioUploaderProps {
  category?: string
  onUploadComplete?: () => void
}

export default function PortfolioUploader({
  category,
  onUploadComplete,
}: PortfolioUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [description, setDescription] = useState('')
  const toast = useAdminToast()

  // Stable preview URLs to avoid leaking memory by calling URL.createObjectURL in render.
  const [previews, setPreviews] = useState<Record<string, string>>({})

  const fileKeys = useMemo(
    () => files.map((f) => `${f.name}:${f.size}:${f.lastModified}`),
    [files]
  )

  useEffect(() => {
    setPreviews((prev) => {
      const next: Record<string, string> = { ...prev }

      // Add new previews
      files.forEach((file) => {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        if (!next[key]) {
          next[key] = URL.createObjectURL(file)
        }
      })

      // Revoke removed previews
      for (const [key, url] of Object.entries(next)) {
        if (!fileKeys.includes(key)) {
          URL.revokeObjectURL(url)
          delete next[key]
        }
      }

      return next
    })

    return () => {
      // On unmount: revoke everything
      setPreviews((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url))
        return {}
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKeys.join('|')])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('image/')
    )
    setFiles((prev) => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      )
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setUploadResults([])

    const toastId = toast.showLoading(
      `Uploading ${files.length} foto portfolio...`
    )
    try {
      const formData = new FormData()
      const isBatch = files.length > 1
      if (isBatch) {
        files.forEach((file) => formData.append('files', file))
      } else {
        const singleFile = files[0]
        if (singleFile) {
          formData.append('file', singleFile)
        }
      }
      if (category) formData.append('category', category)
      if (description) formData.append('description', description)

      console.log(
        'Sending FormData with files:',
        files.map((f) => f.name)
      )

      const uploadUrl = resolveUploadUrl(
        `/upload/portfolio${isBatch ? '/batch' : ''}`,
        '/api/admin/portfolio/upload'
      )

      const result = await xhrUpload({
        url: uploadUrl,
        formData,
        withCredentials: false,
        headers: getUploadHeaders(),
        onProgress: (p) => setUploadProgress(p.percent),
      })

      const data = parseUploadResponse(result.json)

      if (!result.ok || !data.success) {
        const errorMessage = getUploadErrorMessage(result.status, data)
        console.error('Upload failed:', result.status, result.responseText)
        throw new Error(errorMessage)
      }

      const results =
        data.results ??
        (data.photo
          ? [
              {
                success: true,
                filename: data.photo.filename,
                thumbnail_url: data.photo.thumbnail_url,
              },
            ]
          : [])

      setUploadResults(results)

      const successCount: number = data.summary?.success ?? results.length
      const failedCount: number = data.summary?.failed ?? 0

      if (successCount > 0 && failedCount === 0) {
        toast.updateToast(
          toastId,
          'success',
          `${successCount} foto berhasil diupload!`
        )
      } else if (successCount > 0 && failedCount > 0) {
        toast.updateToast(
          toastId,
          'warning',
          `Upload selesai: ${successCount} berhasil, ${failedCount} gagal`
        )
      } else {
        toast.updateToast(toastId, 'error', 'Semua upload gagal')
      }

      // Clear successful uploads
      if (successCount > 0) {
        const failedFiles = files.filter((_, index) => !results[index]?.success)
        setFiles(failedFiles)
        setDescription('')

        if (onUploadComplete) {
          onUploadComplete()
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      const msg = error instanceof Error ? error.message : 'Upload failed'
      // Best-effort: if toastId exists, update; otherwise show generic
      try {
        toast.updateToast(toastId, 'error', 'Gagal upload portfolio', {
          description: msg,
        })
      } catch {
        toast.updateToast(
          'portfolio-upload-error',
          'error',
          'Gagal upload portfolio',
          {
            description: msg,
          }
        )
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-detra-gold bg-detra-gold/5'
            : 'border-gray-300 hover:border-detra-gold'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={uploading}
        />

        <Upload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-2 text-lg font-medium text-gray-900">
          Drop photos here or click to browse
        </p>
        <p className="text-sm text-gray-500">
          Support for JPEG, PNG, WebP (max 50MB per file)
        </p>
      </div>

      {/* Description Field */}
      {files.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for these photos..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-detra-gold"
            disabled={uploading}
          />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {uploading && (
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-detra-gold transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Selected Files ({files.length})
            </h4>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center space-x-2 rounded-lg bg-detra-gold px-4 py-2 text-white hover:bg-detra-gold/90 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload All</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {files.map((file, index) => (
              <div key={index} className="group relative">
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={
                      previews[
                        `${file.name}:${file.size}:${file.lastModified}`
                      ] || ''
                    }
                    alt={`Upload preview: ${file.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    className="object-cover"
                  />
                </div>
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity disabled:opacity-0 group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
                <p className="mt-1 truncate text-xs text-gray-600">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Upload Results</h4>
          <div className="space-y-2">
            {uploadResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center justify-between rounded-lg p-3 ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {result.filename}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
                {result.thumbnail_url && (
                  <div className="relative h-12 w-12">
                    <Image
                      src={result.thumbnail_url}
                      alt={`Uploaded: ${result.filename}`}
                      fill
                      sizes="48px"
                      className="rounded object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
