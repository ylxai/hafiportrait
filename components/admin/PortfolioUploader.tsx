'use client'

import Image from 'next/image'
import { useState, useCallback } from 'react'
import {
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'

interface UploadResult {
  filename: string
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
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [description, setDescription] = useState('')

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
    setUploadResults([])

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      if (category) formData.append('category', category)
      if (description) formData.append('description', description)

      const response = await fetch('/api/admin/portfolio/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload failed:', response.status, errorText)
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
      }

      const responseText = await response.text()
      console.log('Raw response:', responseText)
      
      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response text:', responseText)
        throw new Error('Invalid server response format')
      }
      
      setUploadResults(data.results || [])

      // Clear successful uploads
      if (data.summary.success > 0) {
        const failedFiles = files.filter(
          (_, index) => !data.results[index]?.success
        )
        setFiles(failedFiles)
        setDescription('')

        if (onUploadComplete) {
          onUploadComplete()
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
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
            ? 'border-brand-teal bg-brand-teal/5'
            : 'border-gray-300 hover:border-brand-teal'
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-brand-teal"
            disabled={uploading}
          />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              Selected Files ({files.length})
            </h4>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center space-x-2 rounded-lg bg-brand-teal px-4 py-2 text-white hover:bg-brand-teal/90 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                    src={URL.createObjectURL(file)}
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
