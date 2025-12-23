'use client'

import Image from 'next/image'
/**
 * Photo Uploader with Persistence
 *
 * Enhanced photo uploader with upload progress persistence
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  ArrowUpTrayIcon as Upload,
  XMarkIcon as X,
  CheckCircleIcon as CheckCircle,
  ExclamationCircleIcon as AlertCircle,
  ArrowPathIcon as Loader2,
  PhotoIcon as ImageIcon,
  PauseIcon as Pause,
  PlayIcon as Play,
  TrashIcon as Trash2,
} from '@heroicons/react/24/outline'
import { IntegratedUploadQueue } from '@/lib/upload/uploadQueueIntegrated'
import {
  UploadSession,
  UploadFileState,
  createUploadSession,
  saveUploadState,
  loadUploadState,
  clearUploadState,
  hasPendingUploads,
  loadUploadHistory,
  saveUploadHistory,
  clearUploadHistory,
  updateFileState,
  removeFileFromSession,
  getCompletedFiles,
} from '@/lib/upload/uploadPersistence'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'
import { ConnectionStatusBanner } from '@/components/upload/ConnectionStatus'
import { ResumeUploadBanner } from '@/components/upload/ResumeUploadBanner'
import { UploadHistoryPanel } from '@/components/upload/UploadHistoryPanel'

export interface UploadStats {
  success: number
  error: number
  total: number
}

interface PhotoUploaderPersistentProps {
  event_id: string
  eventName: string
  onUploadComplete?: (results: UploadStats) => void
  maxFiles?: number
  maxFileSize?: number
}

export default function PhotoUploaderPersistent({
  event_id,
  eventName,
  onUploadComplete,
  maxFiles = 500,
  maxFileSize = 50 * 1024 * 1024,
}: PhotoUploaderPersistentProps) {
  const [session, setSession] = useState<UploadSession | null>(null)
  const [pendingSession, setPendingSession] = useState<UploadSession | null>(
    null
  )
  const [showHistory, setShowHistory] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadQueueRef = useRef<IntegratedUploadQueue | null>(null)
  const filesMapRef = useRef<Map<string, File>>(new Map())

  const { isOnline } = useNetworkStatus()

  const ACCEPTED_TYPES = useMemo(
    () => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    []
  )

  // Load existing session on mount
  useEffect(() => {
    const existingSession = loadUploadState()

    if (
      existingSession &&
      existingSession.event_id === event_id &&
      hasPendingUploads(existingSession)
    ) {
      setPendingSession(existingSession)
    } else if (existingSession && existingSession.event_id === event_id) {
      clearUploadState()
    }
  }, [event_id])

  // Handle upload completion
  const handleUploadComplete = useCallback(() => {
    if (!session) return

    saveUploadHistory(session)
    clearUploadState()

    const stats = {
      success: session.files.filter((f) => f.status === 'completed').length,
      error: session.files.filter((f) => f.status === 'failed').length,
      total: session.files.length,
    }

    if (onUploadComplete) {
      onUploadComplete(stats)
    }
  }, [session, onUploadComplete])

  // Initialize upload queue
  useEffect(() => {
    if (!session) return

    const queue = new IntegratedUploadQueue(event_id, {
      maxConcurrent: 3,
      maxRetries: 10,
      onProgress: (fileId, progress, uploadedBytes) => {
        setSession((prev) => {
          if (!prev) return prev
          return updateFileState(prev, fileId, { progress, uploadedBytes })
        })
      },
      onFileComplete: (fileId) => {
        setSession((prev) => {
          if (!prev) return prev
          return updateFileState(prev, fileId, {
            status: 'completed',
            progress: 100,
          })
        })
      },
      onFileError: (fileId, error) => {
        setSession((prev) => {
          if (!prev) return prev
          return updateFileState(prev, fileId, { status: 'failed', error })
        })
      },
      onStatusChange: (status) => {
        if (status === 'completed') {
          handleUploadComplete()
        }
      },
      onRetrying: (fileId, attempt, delay) => {
        console.log(
          `Retrying upload for file ${fileId}, attempt ${attempt}, next retry in ${delay}ms`
        )
        // Could add toast notification here for retry feedback
        // toast.showInfo(`Retrying upload (attempt ${attempt})...`);
      },
    })

    uploadQueueRef.current = queue

    return () => {
      queue.destroy()
    }
  }, [session, event_id, handleUploadComplete])

  // Save session to localStorage
  useEffect(() => {
    if (session) {
      saveUploadState(session)
    }
  }, [session])

  // Pause uploads when offline
  useEffect(() => {
    if (!uploadQueueRef.current) return

    if (!isOnline) {
      uploadQueueRef.current.pause()
    } else if (uploadQueueRef.current.getStatus() === 'paused') {
      uploadQueueRef.current.resume()
    }
  }, [isOnline])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return `Tipe file ${file.type} tidak didukung. Gunakan JPG, PNG, atau WebP.`
      }

      if (file.size > maxFileSize) {
        const maxMB = maxFileSize / 1024 / 1024
        const fileMB = file.size / 1024 / 1024
        return `Ukuran file ${fileMB.toFixed(2)}MB melebihi maksimum ${maxMB}MB.`
      }

      return null
    },
    [ACCEPTED_TYPES, maxFileSize]
  )

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles)
      const currentFiles = session?.files || []

      if (currentFiles.length + fileArray.length > maxFiles) {
        alert(
          `Maksimum ${maxFiles} files. Saat ini: ${currentFiles.length}, Menambahkan: ${fileArray.length}`
        )
        return
      }

      const uploadFileStates: UploadFileState[] = fileArray.map((file) => {
        const error = validateFile(file)
        const fileId = `${Date.now()}-${Math.random()}`

        filesMapRef.current.set(fileId, file)

        return {
          id: fileId,
          file: {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
          },
          progress: 0,
          status: error ? 'failed' : 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          error: error || undefined,
          retryCount: 0,
        }
      })

      if (session) {
        setSession({
          ...session,
          files: [...session.files, ...uploadFileStates],
          updated_at: Date.now(),
        })
      } else {
        const newSession = createUploadSession(event_id, uploadFileStates)
        setSession(newSession)
      }
    },
    [session, event_id, maxFiles, validateFile]
  )

  const resumePendingSession = useCallback(() => {
    if (!pendingSession) return

    setSession(pendingSession)
    setPendingSession(null)

    setTimeout(() => {
      uploadQueueRef.current?.start()
    }, 100)
  }, [pendingSession])

  const cancelPendingSession = useCallback(() => {
    clearUploadState()
    setPendingSession(null)
  }, [])

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

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files)
      }
    },
    [addFiles]
  )

  const removeFile = useCallback(
    (fileId: string) => {
      if (!session) return

      filesMapRef.current.delete(fileId)
      uploadQueueRef.current?.removeFile(fileId)

      const updatedSession = removeFileFromSession(session, fileId)
      setSession(updatedSession)

      if (updatedSession.files.length === 0) {
        clearUploadState()
        setSession(null)
      }
    },
    [session]
  )

  const clearAll = useCallback(() => {
    uploadQueueRef.current?.stop()
    filesMapRef.current.clear()
    clearUploadState()
    setSession(null)
  }, [])

  const clearCompleted = useCallback(() => {
    if (!session) return

    const completedFiles = getCompletedFiles(session)
    completedFiles.forEach((file) => {
      filesMapRef.current.delete(file.id)
      uploadQueueRef.current?.removeFile(file.id)
    })

    const remainingFiles = session.files.filter((f) => f.status !== 'completed')

    if (remainingFiles.length === 0) {
      clearUploadState()
      setSession(null)
    } else {
      setSession({
        ...session,
        files: remainingFiles,
        updated_at: Date.now(),
      })
    }
  }, [session])

  const uploadAll = useCallback(async () => {
    if (!session) return

    session.files.forEach((fileState) => {
      if (fileState.status === 'queued' || fileState.status === 'failed') {
        const actualFile = filesMapRef.current.get(fileState.id)
        uploadQueueRef.current?.addFile(fileState, actualFile!!)
      }
    })

    await uploadQueueRef.current?.start()
  }, [session])

  const pauseUpload = useCallback(() => {
    uploadQueueRef.current?.pause()
  }, [])

  const resumeUpload = useCallback(() => {
    uploadQueueRef.current?.resume()
  }, [])

  // Upload complete handler moved above to avoid hoisting issues

  const retryFailed = useCallback(() => {
    if (!session) return

    const updatedFiles = session.files.map((f) =>
      f.status === 'failed'
        ? { ...f, status: 'queued' as const, error: undefined, retryCount: 0 }
        : f
    )

    setSession({
      ...session,
      files: updatedFiles,
      updated_at: Date.now(),
    })
  }, [session])

  const stats = session
    ? {
        total: session.files.length,
        queued: session.files.filter((f) => f.status === 'queued').length,
        uploading: session.files.filter((f) => f.status === 'uploading').length,
        completed: session.files.filter((f) => f.status === 'completed').length,
        failed: session.files.filter((f) => f.status === 'failed').length,
        paused: session.files.filter((f) => f.status === 'paused').length,
      }
    : { total: 0, queued: 0, uploading: 0, completed: 0, failed: 0, paused: 0 }

  const queueStatus = uploadQueueRef.current?.getStatus() || 'idle'
  const isUploading = queueStatus === 'uploading'
  const isPaused = queueStatus === 'paused'
  const canUpload = stats.queued > 0 && !isUploading && !isPaused

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upload Foto</h2>
          <p className="mt-1 text-sm text-gray-600">
            Upload foto untuk event:{' '}
            <span className="font-semibold">{eventName}</span>
          </p>
        </div>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm font-medium text-[#54ACBF] hover:text-[#54ACBF]/80"
        >
          {showHistory ? 'Sembunyikan Riwayat' : 'Tampilkan Riwayat'}
        </button>
      </div>

      <ConnectionStatusBanner />

      {pendingSession && (
        <ResumeUploadBanner
          session={pendingSession}
          onResume={resumePendingSession}
          onCancel={cancelPendingSession}
        />
      )}

      {showHistory && (
        <UploadHistoryPanel
          history={loadUploadHistory()}
          onClearHistory={clearUploadHistory}
        />
      )}

      {/* Drop Zone */}
      <div
        className={`relative rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-[#54ACBF] bg-[#54ACBF]/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="p-12 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold text-[#54ACBF] hover:text-[#54ACBF]/80"
            >
              Klik untuk memilih
            </button>
            <span className="text-gray-600"> atau drag foto ke sini</span>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            JPG, PNG, WebP hingga {maxFileSize / 1024 / 1024}MB per file
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Maksimum {maxFiles} file per batch • Progress upload otomatis
            tersimpan
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Statistics & Controls */}
      {session && session.files.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="font-semibold text-gray-900">{stats.total}</span>
              <span className="text-gray-600"> total</span>
            </div>
            {stats.queued > 0 && (
              <div>
                <span className="font-semibold text-gray-700">
                  {stats.queued}
                </span>
                <span className="text-gray-600"> antrian</span>
              </div>
            )}
            {stats.uploading > 0 && (
              <div>
                <span className="font-semibold text-blue-600">
                  {stats.uploading}
                </span>
                <span className="text-gray-600"> uploading</span>
              </div>
            )}
            {stats.completed > 0 && (
              <div>
                <span className="font-semibold text-green-600">
                  {stats.completed}
                </span>
                <span className="text-gray-600"> selesai</span>
              </div>
            )}
            {stats.failed > 0 && (
              <div>
                <span className="font-semibold text-red-600">
                  {stats.failed}
                </span>
                <span className="text-gray-600"> gagal</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {stats.completed > 0 && (
              <button
                onClick={clearCompleted}
                disabled={isUploading}
                className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Selesai
              </button>
            )}
            {stats.failed > 0 && !isUploading && (
              <button
                onClick={retryFailed}
                className="text-sm font-medium text-[#54ACBF] hover:text-[#54ACBF]/80"
              >
                Coba Lagi
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={isUploading}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Hapus Semua
            </button>
            {isUploading && (
              <button
                onClick={pauseUpload}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                <Pause className="h-4 w-4" />
                Jeda
              </button>
            )}
            {isPaused && (
              <button
                onClick={resumeUpload}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                <Play className="h-4 w-4" />
                Lanjutkan
              </button>
            )}
            {!isUploading && !isPaused && (
              <button
                onClick={uploadAll}
                disabled={!canUpload}
                className="rounded-lg bg-[#54ACBF] px-6 py-2 text-sm font-semibold text-white hover:bg-[#54ACBF]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Upload Semua
              </button>
            )}
          </div>
        </div>
      )}

      {/* File Grid */}
      {session && session.files.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {session.files.map((fileState) => {
            const actualFile = filesMapRef.current.get(fileState.id)
            const preview = actualFile ? URL.createObjectURL(actualFile) : ''

            return (
              <div
                key={fileState.id}
                className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                {preview && (
                  <div className="relative h-full w-full">
                    <Image
                      src={preview}
                      alt={`Upload preview: ${fileState.file.name}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                <div className="absolute right-2 top-2">
                  {fileState.status === 'queued' && (
                    <button
                      onClick={() => removeFile(fileState.id)}
                      className="rounded-full bg-white/90 p-1 text-gray-700 hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {fileState.status === 'uploading' && (
                    <div className="rounded-full bg-blue-500 p-1">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    </div>
                  )}
                  {fileState.status === 'completed' && (
                    <div className="rounded-full bg-green-500 p-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  {fileState.status === 'failed' && (
                    <div className="rounded-full bg-red-500 p-1">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>

                {fileState.status === 'uploading' && fileState.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${fileState.progress}%` }}
                    />
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="truncate text-xs font-medium text-white">
                    {fileState.file.name}
                  </p>
                  <p className="text-xs text-white/80">
                    {(fileState.file.size / 1024 / 1024).toFixed(2)} MB
                    {fileState.progress > 0 &&
                      fileState.status === 'uploading' &&
                      ` • ${fileState.progress}%`}
                  </p>
                  {fileState.error && (
                    <p
                      className="mt-1 line-clamp-2 text-xs text-red-300"
                      title={fileState.error}
                    >
                      {fileState.error}
                    </p>
                  )}
                  {fileState.retryCount > 0 && (
                    <p className="mt-1 text-xs text-orange-300">
                      Retry {fileState.retryCount}/10
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(!session || session.files.length === 0) && !pendingSession && (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Belum ada foto dipilih. Mulai dengan menambahkan foto di atas.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Progress upload akan otomatis tersimpan dan dapat dilanjutkan kapan
            saja.
          </p>
        </div>
      )}
    </div>
  )
}
