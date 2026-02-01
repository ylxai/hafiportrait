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
      `${getUploadApiBaseUrl()}/upload/event/${event_id}`,
      formData,
      {
        onProgress,
        signal,
      }
    )

    return {
      success: true,
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
): Promise<any> {
  // In browsers, prefer XHR to avoid intermittent aborts and to get reliable upload progress.
  if (typeof window !== 'undefined') {
    return xhrUpload({
      url,
      formData,
      withCredentials: false,
      headers: {
        'X-API-Key': getUploadApiKey(),
      },
      signal: options.signal,
      onProgress: (p) => {
        options.onProgress?.({
          loaded: p.loaded,
          total: p.total,
          percentage: p.percent,
        })
      },
    }).then((res) => {
      if (!res.ok) {
        const msg =
          typeof res.json === 'object' && res.json && 'error' in res.json
            ? String((res.json as { error?: string }).error || 'Upload failed')
            : `Upload failed (${res.status})`
        throw new Error(msg)
      }
      return res.json
    })
  }

  // Fallback for non-browser env
  return axios
    .post(url, formData, {
      signal: options.signal,
      withCredentials: false,
      headers: {
        'X-API-Key': getUploadApiKey(),
      },
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
    .then((response) => response.data)
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
