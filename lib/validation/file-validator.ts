/**
 * File Validation Utilities
 * Story 4.10: Photo Upload API & Validation
 *
 * Enhanced security features:
 * - Magic bytes validation (MIME spoofing prevention)
 * - File integrity checks
 * - Malware signature detection (basic patterns)
 * - Batch size validation (DoS prevention)
 * - Comprehensive error reporting
 *
 * PRODUCTION UPDATE: Relaxed limits for wedding photo business
 */

import { fileTypeFromBuffer } from 'file-type'
import crypto from 'crypto'

/**
 * File size limits (in bytes)
 * PRODUCTION: Increased limits for high-res wedding photos
 */
export const FILE_SIZE_LIMITS = {
  MIN_FILE_SIZE: 10 * 1024, // 10KB minimum (reduced from 50KB)
  MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB maximum per file (increased from 50MB)
  MAX_BATCH_SIZE: 5 * 1024 * 1024 * 1024, // 5GB maximum per batch (increased from 2GB)
} as const

/**
 * Allowed MIME types
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

/**
 * Maximum dimensions (prevents ZIP bomb attacks)
 */
export const MAX_DIMENSIONS = {
  width: 50000,
  height: 50000,
  pixels: 200000000, // 200MP max
} as const

/**
 * Malware signature patterns (basic detection)
 * These are common patterns found in malicious files
 */
const MALWARE_SIGNATURES = [
  Buffer.from('4D5A', 'hex'), // MZ header (PE executable)
  Buffer.from('7F454C46', 'hex'), // ELF executable
  Buffer.from('213C617263683E', 'hex'), // Unix archive
  Buffer.from('CAFEBABE', 'hex'), // Java class file
  Buffer.from('504B0304', 'hex'), // ZIP (could contain executable)
] as const

/**
 * Magic bytes for image types (for verification)
 */
const IMAGE_MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  'image/webp': [Buffer.from('RIFF', 'ascii')],
  'image/heic': [Buffer.from('ftyp', 'ascii')],
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean
  error?: string
  details?: Record<string, any>
}

/**
 * File validation options
 */
export interface FileValidationOptions {
  maxSize?: number
  minSize?: number
  allowedTypes?: string[]
  checkMagicBytes?: boolean
  checkMalware?: boolean
  checkIntegrity?: boolean
}

/**
 * Validate file MIME type
 */
export function validateMimeType(
  mime_type: string,
  allowedTypes: string[] = [...ALLOWED_MIME_TYPES]
): ValidationResult {
  // Normalize MIME type
  const normalized = mime_type.toLowerCase().trim()

  // Check if MIME type is in allowed list
  if (
    !allowedTypes.includes(normalized) &&
    !allowedTypes.includes(normalized.replace('image/jpg', 'image/jpeg'))
  ) {
    return {
      valid: false,
      error: `Invalid MIME type: ${mime_type}. Allowed: ${allowedTypes.join(', ')}`,
      details: { mime_type, allowedTypes },
    }
  }

  return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(
  file_size: number,
  options?: { minSize?: number; maxSize?: number }
): ValidationResult {
  const minSize = options?.minSize ?? FILE_SIZE_LIMITS.MIN_FILE_SIZE
  const maxSize = options?.maxSize ?? FILE_SIZE_LIMITS.MAX_FILE_SIZE

  if (file_size < minSize) {
    return {
      valid: false,
      error: `File too small. Minimum size: ${(minSize / 1024).toFixed(0)}KB, Actual: ${(file_size / 1024).toFixed(2)}KB`,
      details: { file_size },
    }
  }

  if (file_size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(0)}MB, Actual: ${(file_size / 1024 / 1024).toFixed(2)}MB`,
      details: { file_size },
    }
  }

  return { valid: true, details: { file_size } }
}

/**
 * Validate batch size (DoS prevention)
 */
export function validateBatchSize(
  files: Array<{ size: number }>,
  maxBatchSize: number = FILE_SIZE_LIMITS.MAX_BATCH_SIZE
): ValidationResult {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0)

  if (totalSize > maxBatchSize) {
    return {
      valid: false,
      error: `Batch too large. Maximum batch size: ${(maxBatchSize / 1024 / 1024 / 1024).toFixed(1)}GB, Actual: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)}GB`,
      details: { file_size: totalSize },
    }
  }

  return { valid: true, details: { totalSize, fileCount: files.length } }
}

/**
 * Validate magic bytes (MIME spoofing prevention)
 */
export function validateMagicBytes(
  buffer: Buffer,
  mime_type: string
): ValidationResult {
  const magicBytes = IMAGE_MAGIC_BYTES[mime_type]

  if (!magicBytes) {
    // No magic bytes defined for this type, skip validation
    return { valid: true }
  }

  // Check if buffer starts with any of the valid magic bytes
  const hasValidMagicBytes = magicBytes.some((magic) => {
    if (buffer.length < magic.length) return false

    // For WEBP, check RIFF at start and WEBP later
    if (mime_type === 'image/webp') {
      return (
        buffer.subarray(0, 4).equals(magic) &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      )
    }

    // For HEIC, check ftyp box signature
    if (mime_type === 'image/heic' || mime_type === 'image/heif') {
      // HEIC files start with ftyp box at offset 4
      return buffer.subarray(4, 8).toString('ascii').startsWith('ftyp')
    }

    return buffer.subarray(0, magic.length).equals(magic)
  })

  if (!hasValidMagicBytes) {
    return {
      valid: false,
      error: `Invalid file format. Magic bytes do not match MIME type: ${mime_type}`,
      details: { mime_type },
    }
  }

  return { valid: true }
}

/**
 * Check for malware signatures (basic detection)
 */
export function checkMalwareSignatures(buffer: Buffer): ValidationResult {
  for (const signature of MALWARE_SIGNATURES) {
    if (buffer.subarray(0, signature.length).equals(signature)) {
      return {
        valid: false,
        error: 'File contains suspicious executable signature',
      }
    }
  }

  return { valid: true }
}

/**
 * Validate file integrity with checksum
 */
export function validateFileIntegrity(
  buffer: Buffer,
  expectedChecksum?: string
): ValidationResult {
  try {
    const hash = crypto.createHash('sha256')
    hash.update(buffer)
    const actualChecksum = hash.digest('hex')

    if (expectedChecksum && actualChecksum !== expectedChecksum) {
      return {
        valid: false,
        error: 'File integrity check failed. Checksum mismatch.',
        details: { expectedChecksum, actualChecksum },
      }
    }

    return {
      valid: true,
      details: { checksum: actualChecksum },
    }
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to compute file checksum',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  buffer: Buffer,
  metadata: {
    filename: string
    mime_type: string
    size: number
    checksum?: string
  },
  options: FileValidationOptions = {}
): Promise<ValidationResult> {
  const {
    maxSize,
    minSize,
    allowedTypes = [...ALLOWED_MIME_TYPES],
    checkMagicBytes = true,
    checkMalware = true,
    checkIntegrity = false,
  } = options

  // 1. Validate file size
  const sizeValidation = validateFileSize(metadata.size, { minSize, maxSize })
  if (!sizeValidation.valid) {
    return sizeValidation
  }

  // 2. Validate MIME type
  const mimeValidation = validateMimeType(metadata.mime_type, allowedTypes)
  if (!mimeValidation.valid) {
    return mimeValidation
  }

  // 3. Check magic bytes (optional but recommended)
  if (checkMagicBytes) {
    // Cross-check with file-type library for additional validation
    try {
      const detectedType = await fileTypeFromBuffer(buffer)
      if (detectedType && detectedType.mime !== metadata.mime_type) {
        // Allow some common mismatches (e.g., jpg vs jpeg)
        const normalizedDetected = detectedType.mime.replace('jpg', 'jpeg')
        const normalizedExpected = metadata.mime_type.replace('jpg', 'jpeg')
        if (normalizedDetected !== normalizedExpected) {
          console.warn(
            `File type mismatch: expected ${metadata.mime_type}, detected ${detectedType.mime}`
          )
        }
      }
    } catch (error) {
      // file-type library failed, continue with existing validation
      console.warn('File type detection failed:', error)
    }

    const magicBytesValidation = validateMagicBytes(buffer, metadata.mime_type)
    if (!magicBytesValidation.valid) {
      // Don't fail for HEIC/HEIF - magic bytes detection might be unreliable
      if (
        metadata.mime_type !== 'image/heic' &&
        metadata.mime_type !== 'image/heif'
      ) {
        return magicBytesValidation
      }
    }
  }

  // 4. Check for malware signatures (optional)
  if (checkMalware) {
    const malwareCheck = checkMalwareSignatures(buffer)
    if (!malwareCheck.valid) {
      return malwareCheck
    }
  }

  // 5. Validate file integrity (optional)
  if (checkIntegrity && metadata.checksum) {
    const integrityCheck = validateFileIntegrity(buffer, metadata.checksum)
    if (!integrityCheck.valid) {
      return integrityCheck
    }
  }

  // All validations passed
  return {
    valid: true,
    details: {
      filename: metadata.filename,
      mime_type: metadata.mime_type,
      file_size: sizeValidation.details?.file_size,
    },
  }
}

/**
 * Validate image dimensions (DoS prevention)
 */
export function validateImageDimensions(
  width: number,
  height: number
): ValidationResult {
  if (width > MAX_DIMENSIONS.width || height > MAX_DIMENSIONS.height) {
    return {
      valid: false,
      error: `Image dimensions too large. Maximum: ${MAX_DIMENSIONS.width}x${MAX_DIMENSIONS.height}, Actual: ${width}x${height}`,
      details: { width, height },
    }
  }

  const pixels = width * height
  if (pixels > MAX_DIMENSIONS.pixels) {
    return {
      valid: false,
      error: `Image has too many pixels. Maximum: ${(MAX_DIMENSIONS.pixels / 1000000).toFixed(0)}MP, Actual: ${(pixels / 1000000).toFixed(1)}MP`,
      details: { width, height, pixels },
    }
  }

  return { valid: true, details: { width, height, pixels } }
}

/**
 * Sanitize filename (security)
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal
  filename = filename.replace(/\.\./g, '')

  // Remove directory separators
  filename = filename.replace(/[\/\\]/g, '-')

  // Remove control characters
  filename = filename.replace(/[\x00-\x1F\x7F]/g, '')

  // Replace spaces with hyphens
  filename = filename.replace(/\s+/g, '-')

  // Keep only safe characters
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '')

  // Remove multiple dots
  filename = filename.replace(/\.{2,}/g, '.')

  // Limit length
  if (filename.length > 255) {
    const ext = filename.substring(filename.lastIndexOf('.'))
    filename = filename.substring(0, 255 - ext.length) + ext
  }

  return filename
}

/**
 * Check if MIME type is allowed (helper function)
 */
export function isAllowedMimeType(
  mime_type: string,
  allowedTypes: string[] = [...ALLOWED_MIME_TYPES]
): boolean {
  const normalized = mime_type.toLowerCase().trim()
  return (
    allowedTypes.includes(normalized) ||
    allowedTypes.includes(normalized.replace('image/jpg', 'image/jpeg'))
  )
}
