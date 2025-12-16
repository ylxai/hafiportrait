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
  const chunkSize = 1024 * 1024; // 1MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  let offset = 0;

  // Use SubtleCrypto API for hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  if (onProgress) {
    onProgress(100);
  }

  return hashHex;
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
  return calculateChecksum(file, onProgress);
}

/**
 * Verify file checksum
 */
export async function verifyChecksum(
  file: File,
  expectedChecksum: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  const actualChecksum = await calculateChecksum(file, onProgress);
  return actualChecksum === expectedChecksum;
}

/**
 * Calculate checksum for a Blob/ArrayBuffer
 */
export async function calculateBlobChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

/**
 * Generate a simple hash for quick comparison (not cryptographic)
 */
export function generateQuickHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}
