/**
 * Upload Service
 *
 * Handles actual file upload to API with:
 * - Chunked upload support
 * - Progress tracking
 * - Checksum verification
 * - Retry logic
 */

import axios from 'axios'
import { calculateChecksum } from './checksumUtils'
import { xhrUpload } from '@/lib/upload/xhr-upload'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadApiPhoto {
  id?: string
  event_id?: string
  filename?: string
  original_url?: string
  thumbnail_url?: string
  thumbnail_small_url?: string
  thumbnail_medium_url?: string
  thumbnail_large_url?: string
  width?: number
  height?: number
  size?: number
}

export interface UploadBatchItem {
  success: boolean
  filename?: string
  error?: string
  thumbnail_url?: string
  photo?: UploadApiPhoto
}

export interface UploadBatchSummary {
  total?: number
  success?: number
  failed?: number
}

export interface UploadApiResponse {
  success: boolean
  photo?: UploadApiPhoto
  results?: UploadBatchItem[]
  summary?: UploadBatchSummary
  error?: string
}

export interface UploadResult {
  success: boolean
  photo_id?: string
  url?: string
  error?: string
  checksum?: string
}

function getUploadApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_UPLOAD_API_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    ''
  )
}

function getUploadApiKey(): string {
  return process.env.NEXT_PUBLIC_UPLOAD_API_KEY || ''
}

export function resolveUploadUrl(
  remotePath: string,
  fallbackPath: string
): string {
  const base = getUploadApiBaseUrl()
  if (base) {
    return `${base}${remotePath}`
  }
  return fallbackPath
}

export function getUploadHeaders(): Record<string, string> {
  const key = getUploadApiKey()
  return key ? { 'X-API-Key': key } : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function parseUploadResponse(payload: unknown): UploadApiResponse {
  if (!isRecord(payload)) {
    return { success: false, error: 'Invalid response' }
  }
  const success = typeof payload.success === 'boolean' ? payload.success : false
  const error = typeof payload.error === 'string' ? payload.error : undefined
  return {
    success,
    error,
    photo: isRecord(payload.photo)
      ? (payload.photo as UploadApiPhoto)
      : undefined,
    results: Array.isArray(payload.results)
      ? (payload.results as UploadBatchItem[])
      : undefined,
    summary: isRecord(payload.summary)
      ? (payload.summary as UploadBatchSummary)
      : undefined,
  }
}

export function getUploadErrorMessage(
  status: number,
  response: UploadApiResponse
): string {
  return response.error || `Upload failed (${status})`
}

/**
 * Upload single file to API
 */
export async function uploadFile(
  file: File,
  event_id: string,
  options: {
    onProgress?: (progress: UploadProgress) => void
    signal?: AbortSignal
    calculateFileChecksum?: boolean
  } = {}
): Promise<UploadResult> {
  const { onProgress, signal, calculateFileChecksum = false } = options

  try {
    // Calculate checksum if requested
    let checksum: string | undefined
    if (calculateFileChecksum) {
      checksum = await calculateChecksum(file)
    }

    // Create FormData
    const formData = new FormData()
    formData.append('file', file)
    if (checksum) {
      formData.append('checksum', checksum)
    }

    // Upload with progress tracking
    const result = await uploadWithProgress(
      resolveUploadUrl(
        `/upload/event/${event_id}`,
        `/api/admin/events/${event_id}/photos/upload`
      ),
      formData,
      {
        onProgress,
        signal,
      }
    )

    return {
      ...result,
      checksum,
    }
  } catch (error: unknown) {
    console.error('Upload failed:', error)

    // Check if aborted (handle both standard AbortError and Axios cancellation)
    if (
      (error instanceof Error && error.name === 'AbortError') ||
      axios.isCancel(error)
    ) {
      // Re-throw as AbortError to maintain compatibility with callers
      const abortError = new Error('Upload aborted')
      abortError.name = 'AbortError'
      throw abortError
    }

    let errorMessage = 'Upload failed'
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Upload with progress tracking using Axios
 */
function uploadWithProgress(
  url: string,
  formData: FormData,
  options: {
    onProgress?: (progress: UploadProgress) => void
    signal?: AbortSignal
  } = {}
): Promise<UploadApiResponse> {
  // In browsers, prefer XHR to avoid intermittent aborts and to get reliable upload progress.
  if (typeof window !== 'undefined') {
    return xhrUpload({
      url,
      formData,
      withCredentials: false,
      headers: getUploadHeaders(),
      signal: options.signal,
      onProgress: (p) => {
        options.onProgress?.({
          loaded: p.loaded,
          total: p.total,
          percentage: p.percent,
        })
      },
    }).then((res) => {
      const parsed = parseUploadResponse(res.json)
      if (!res.ok || !parsed.success) {
        const msg = parsed.error || `Upload failed (${res.status})`
        throw new Error(msg)
      }
      return parsed
    })
  }

  // Fallback for non-browser env
  return axios
    .post(url, formData, {
      signal: options.signal,
      withCredentials: false,
      headers: getUploadHeaders(),
      timeout: 120_000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      onUploadProgress: (progressEvent) => {
        if (options.onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            ),
          }
          options.onProgress(progress)
        }
      },
    })
    .then((response) => parseUploadResponse(response.data))
}

/**
 * Upload multiple files in batch
 */
export async function uploadBatch(
  files: File[],
  event_id: string,
  options: {
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
    onFileComplete?: (fileIndex: number, result: UploadResult) => void
    signal?: AbortSignal
  } = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    // Fix: Check if files[i] exists before using
    const file = files[i]
    if (!file) continue

    try {
      const result = await uploadFile(file, event_id, {
        onProgress: (progress) => {
          if (options.onProgress) {
            options.onProgress(i, progress)
          }
        },
        signal: options.signal,
      })

      results.push(result)

      if (options.onFileComplete) {
        options.onFileComplete(i, result)
      }
    } catch (error: unknown) {
      if (
        (error instanceof Error && error.name === 'AbortError') ||
        axios.isCancel(error)
      ) {
        throw error
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed'

      const errorResult: UploadResult = {
        success: false,
        error: errorMessage,
      }

      results.push(errorResult)

      if (options.onFileComplete) {
        options.onFileComplete(i, errorResult)
      }
    }
  }

  return results
}
