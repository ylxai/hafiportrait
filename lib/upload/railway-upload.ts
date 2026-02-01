/**
 * Railway Upload API Client
 *
 * Handles file uploads to Railway Upload API service
 * This centralizes all upload operations to the dedicated Railway service
 * which handles Sharp image processing and R2 storage.
 */

import { xhrUpload, XhrUploadResponse } from './xhr-upload'

// =============================================================================
// Types
// =============================================================================

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface PhotoMetadata {
  id: string
  filename: string
  original_url: string
  thumbnail_url: string | null
  thumbnail_small_url: string | null
  thumbnail_medium_url: string | null
  thumbnail_large_url: string | null
  width: number
  height: number
  size: number
  mime_type: string
  event_id?: string
}

export interface UploadResult {
  success: boolean
  photo?: PhotoMetadata
  error?: string
}

export interface BatchUploadResult {
  success: boolean
  message: string
  results: Array<{
    filename: string
    success: boolean
    photo?: PhotoMetadata
    error?: string
  }>
  summary: {
    total: number
    success: number
    failed: number
  }
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  abortSignal?: AbortSignal
}

export interface BatchUploadOptions extends UploadOptions {
  onFileProgress?: (fileIndex: number, progress: UploadProgress) => void
  onFileComplete?: (fileIndex: number, result: UploadResult) => void
}

// =============================================================================
// Configuration
// =============================================================================

/**
 * Get Railway Upload API URL from environment
 */
function getUploadApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_UPLOAD_API_URL
  if (!url) {
    throw new Error('NEXT_PUBLIC_UPLOAD_API_URL is not configured')
  }
  return url.replace(/\/$/, '') // Remove trailing slash
}

/**
 * Get Railway Upload API Key from environment
 */
function getUploadApiKey(): string {
  const key = process.env.NEXT_PUBLIC_UPLOAD_API_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_UPLOAD_API_KEY is not configured')
  }
  return key
}

/**
 * Build headers for Railway API requests
 */
function buildHeaders(): Record<string, string> {
  return {
    'X-API-Key': getUploadApiKey(),
  }
}

/**
 * Parse XHR response to typed object
 */
function parseResponse<T>(response: XhrUploadResponse): T {
  if (response.json) {
    return response.json as T
  }
  try {
    return JSON.parse(response.responseText) as T
  } catch {
    throw new Error('Invalid response format')
  }
}

// =============================================================================
// Upload Functions
// =============================================================================

/**
 * Upload single photo to event
 */
export async function uploadEventPhoto(
  eventId: string,
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const url = `${getUploadApiUrl()}/upload/event/${eventId}`

  try {
    const response = await xhrUpload({
      url,
      formData,
      headers: buildHeaders(),
      onProgress: options.onProgress
        ? (p) =>
            options.onProgress!({
              loaded: p.loaded,
              total: p.total,
              percentage: p.percent,
            })
        : undefined,
      signal: options.abortSignal,
    })

    if (!response.ok) {
      const errorData = parseResponse<{ error?: string }>(response)
      return {
        success: false,
        error: errorData.error || `Upload failed (${response.status})`,
      }
    }

    const data = parseResponse<{ success: boolean; photo: PhotoMetadata }>(
      response
    )

    if (data.success && data.photo) {
      return {
        success: true,
        photo: data.photo,
      }
    }

    return {
      success: false,
      error: 'Upload failed - no photo returned',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Upload multiple photos to event (batch)
 */
export async function uploadEventPhotosBatch(
  eventId: string,
  files: File[],
  options: BatchUploadOptions = {}
): Promise<BatchUploadResult> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const url = `${getUploadApiUrl()}/upload/event/${eventId}/batch`

  try {
    const response = await xhrUpload({
      url,
      formData,
      headers: buildHeaders(),
      onProgress: options.onProgress
        ? (p) =>
            options.onProgress!({
              loaded: p.loaded,
              total: p.total,
              percentage: p.percent,
            })
        : undefined,
      signal: options.abortSignal,
    })

    if (!response.ok) {
      const errorData = parseResponse<{ error?: string }>(response)
      return {
        success: false,
        message: errorData.error || 'Batch upload failed',
        results: [],
        summary: { total: files.length, success: 0, failed: files.length },
      }
    }

    return parseResponse<BatchUploadResult>(response)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Batch upload failed',
      results: [],
      summary: { total: files.length, success: 0, failed: files.length },
    }
  }
}

/**
 * Upload single photo to portfolio
 */
export async function uploadPortfolioPhoto(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const url = `${getUploadApiUrl()}/upload/portfolio`

  try {
    const response = await xhrUpload({
      url,
      formData,
      headers: buildHeaders(),
      onProgress: options.onProgress
        ? (p) =>
            options.onProgress!({
              loaded: p.loaded,
              total: p.total,
              percentage: p.percent,
            })
        : undefined,
      signal: options.abortSignal,
    })

    if (!response.ok) {
      const errorData = parseResponse<{ error?: string }>(response)
      return {
        success: false,
        error: errorData.error || `Upload failed (${response.status})`,
      }
    }

    const data = parseResponse<{ success: boolean; photo: PhotoMetadata }>(
      response
    )

    if (data.success && data.photo) {
      return {
        success: true,
        photo: data.photo,
      }
    }

    return {
      success: false,
      error: 'Upload failed - no photo returned',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Upload multiple photos to portfolio (batch)
 */
export async function uploadPortfolioPhotosBatch(
  files: File[],
  options: BatchUploadOptions = {}
): Promise<BatchUploadResult> {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })

  const url = `${getUploadApiUrl()}/upload/portfolio/batch`

  try {
    const response = await xhrUpload({
      url,
      formData,
      headers: buildHeaders(),
      onProgress: options.onProgress
        ? (p) =>
            options.onProgress!({
              loaded: p.loaded,
              total: p.total,
              percentage: p.percent,
            })
        : undefined,
      signal: options.abortSignal,
    })

    if (!response.ok) {
      const errorData = parseResponse<{ error?: string }>(response)
      return {
        success: false,
        message: errorData.error || 'Batch upload failed',
        results: [],
        summary: { total: files.length, success: 0, failed: files.length },
      }
    }

    return parseResponse<BatchUploadResult>(response)
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Batch upload failed',
      results: [],
      summary: { total: files.length, success: 0, failed: files.length },
    }
  }
}

/**
 * Upload photo to hero slideshow
 */
export async function uploadSlideshowPhoto(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const url = `${getUploadApiUrl()}/upload/slideshow`

  try {
    const response = await xhrUpload({
      url,
      formData,
      headers: buildHeaders(),
      onProgress: options.onProgress
        ? (p) =>
            options.onProgress!({
              loaded: p.loaded,
              total: p.total,
              percentage: p.percent,
            })
        : undefined,
      signal: options.abortSignal,
    })

    if (!response.ok) {
      const errorData = parseResponse<{ error?: string }>(response)
      return {
        success: false,
        error: errorData.error || `Upload failed (${response.status})`,
      }
    }

    const data = parseResponse<{ success: boolean; photo: PhotoMetadata }>(
      response
    )

    if (data.success && data.photo) {
      return {
        success: true,
        photo: data.photo,
      }
    }

    return {
      success: false,
      error: 'Upload failed - no photo returned',
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Upload files one by one with individual progress tracking
 * Useful for UI that needs per-file progress
 */
export async function uploadFilesSequentially(
  uploadFn: (file: File, options: UploadOptions) => Promise<UploadResult>,
  files: File[],
  options: BatchUploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = []

  for (const [i, file] of files.entries()) {
    // Check if aborted
    if (options.abortSignal?.aborted) {
      const abortError = new Error('Upload aborted')
      abortError.name = 'AbortError'
      throw abortError
    }

    try {
      const result = await uploadFn(file, {
        onProgress: (progress) => {
          options.onFileProgress?.(i, progress)
        },
        abortSignal: options.abortSignal,
      })

      results.push(result)
      options.onFileComplete?.(i, result)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      const errorResult: UploadResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
      results.push(errorResult)
      options.onFileComplete?.(i, errorResult)
    }
  }

  return results
}

/**
 * Check if Railway Upload API is available
 */
export async function checkUploadApiHealth(): Promise<boolean> {
  try {
    const url = `${getUploadApiUrl()}/health`
    const response = await fetch(url, {
      method: 'GET',
      headers: buildHeaders(),
    })
    return response.ok
  } catch {
    return false
  }
}

// Named exports for Railway Upload API
export const railwayUpload = {
  uploadEventPhoto,
  uploadEventPhotosBatch,
  uploadPortfolioPhoto,
  uploadPortfolioPhotosBatch,
  uploadSlideshowPhoto,
  uploadFilesSequentially,
  checkUploadApiHealth,
}
