/**
 * Checksum Utilities
 *
 * Provides file integrity verification with:
 * - SHA-256 hashing
 * - Chunked calculation for large files
 * - Progress reporting
 */

/**
 * Calculate SHA-256 checksum for a file
 */
export async function calculateChecksum(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const chunkSize = 1024 * 1024 // 1MB chunks
  const chunks = Math.ceil(file.size / chunkSize)
  let offset = 0

  // Process file in chunks for progress tracking
  const hashBuffer = await (async () => {
    if (chunks <= 1) {
      // Small file, hash directly
      return await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    }

    // Large file, hash in chunks
    const chunksArray: ArrayBuffer[] = []
    for (let i = 0; i < chunks; i++) {
      const start = offset
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      chunksArray.push(await chunk.arrayBuffer())

      offset = end

      // Report progress
      if (onProgress) {
        onProgress(Math.round(((i + 1) / chunks) * 100))
      }
    }

    // Combine all chunks and hash
    const combined = new Uint8Array(
      chunksArray.reduce((acc, chunk) => acc + chunk.byteLength, 0)
    )
    let offset2 = 0
    for (const chunk of chunksArray) {
      combined.set(new Uint8Array(chunk), offset2)
      offset2 += chunk.byteLength
    }

    return await crypto.subtle.digest('SHA-256', combined)
  })()

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  if (onProgress) {
    onProgress(100)
  }

  return hashHex
}

/**
 * Calculate checksum in chunks with progress
 */
export async function calculateChecksumChunked(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  // For browser compatibility, we'll use a simpler approach
  // In production, consider using a library like spark-md5 or hash-wasm
  return calculateChecksum(file, onProgress)
}

/**
 * Verify file checksum
 */
export async function verifyChecksum(
  file: File,
  expectedChecksum: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  const actualChecksum = await calculateChecksum(file, onProgress)
  return actualChecksum === expectedChecksum
}

/**
 * Calculate checksum for a Blob/ArrayBuffer
 */
export async function calculateBlobChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Generate a simple hash for quick comparison (not cryptographic)
 */
export function generateQuickHash(data: string): string {
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(36)
}
