/**
 * ZIP Generator Utility
 * Generates ZIP files from photo selections with progress tracking
 */

interface PhotoItem {
  id: string;
  url: string;
  original_name: string;
  file_size: number;
}

interface ZipOptions {
  includeOriginals?: boolean;
  compressionLevel?: number;
  maxFileSize?: number; // in bytes
  onProgress?: (progress: number, current: number, total: number) => void;
}

export class ZipGenerator {
  private options: ZipOptions;

  constructor(options: ZipOptions = {}) {
    this.options = {
      includeOriginals: true,
      compressionLevel: 6,
      maxFileSize: 100 * 1024 * 1024, // 100MB default
      ...options
    };
  }

  /**
   * Generate ZIP file from photo list
   */
  async generateZip(photos: PhotoItem[]): Promise<Blob> {
    // For now, we'll use a simple implementation
    // In production, you might want to use a library like JSZip
    
    if (typeof window === 'undefined') {
      // Server-side implementation
      return this.generateZipServer(photos);
    } else {
      // Client-side implementation (if needed)
      return this.generateZipClient(photos);
    }
  }

  /**
   * Server-side ZIP generation
   */
  private async generateZipServer(photos: PhotoItem[]): Promise<Blob> {
    const JSZip = require('jszip');
    const zip = new JSZip();
    
    let processed = 0;
    const total = photos.length;

    console.log(`📦 Generating ZIP with ${total} photos`);

    for (const photo of photos) {
      try {
        // Get photo data
        const photoData = await this.fetchPhotoData(photo);
        
        if (photoData) {
          // Add to ZIP with sanitized filename
          const filename = this.sanitizeFilename(photo.original_name);
          zip.file(filename, photoData);
          
          processed++;
          const progress = Math.round((processed / total) * 100);
          
          if (this.options.onProgress) {
            this.options.onProgress(progress, processed, total);
          }
          
          console.log(`✅ Added to ZIP: ${filename} (${processed}/${total})`);
        }
      } catch (error) {
        console.error(`❌ Failed to add photo ${photo.original_name} to ZIP:`, error);
        // Continue with other photos
      }
    }

    // Generate ZIP blob
    console.log('📦 Finalizing ZIP file...');
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: this.options.compressionLevel
      }
    });

    console.log(`✅ ZIP generated successfully: ${zipBlob.size} bytes`);
    return zipBlob;
  }

  /**
   * Client-side ZIP generation (placeholder)
   */
  private async generateZipClient(photos: PhotoItem[]): Promise<Blob> {
    // This would require a client-side ZIP library like JSZip
    // For now, return empty blob
    console.log('📦 Client-side ZIP generation not implemented');
    return new Blob();
  }

  /**
   * Fetch photo data from URL
   */
  private async fetchPhotoData(photo: PhotoItem): Promise<ArrayBuffer | null> {
    try {
      const url = this.options.includeOriginals 
        ? `/api/photos/${photo.id}/original`
        : photo.url;
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Check file size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > (this.options.maxFileSize || 100 * 1024 * 1024)) {
        console.warn(`⚠️ Skipping large file: ${photo.original_name} (${contentLength} bytes)`);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return arrayBuffer;
      
    } catch (error) {
      console.error(`❌ Error fetching photo ${photo.original_name}:`, error);
      return null;
    }
  }

  /**
   * Sanitize filename for ZIP
   */
  private sanitizeFilename(filename: string): string {
    // Remove invalid characters and ensure unique names
    let sanitized = filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 100); // Limit length

    // Ensure file extension
    if (!sanitized.includes('.')) {
      sanitized += '.jpg';
    }

    return sanitized;
  }

  /**
   * Estimate ZIP size (rough calculation)
   */
  static estimateZipSize(photos: PhotoItem[], compressionRatio: number = 0.8): number {
    const totalSize = photos.reduce((sum, photo) => sum + photo.file_size, 0);
    return Math.round(totalSize * compressionRatio);
  }

  /**
   * Check if ZIP generation is feasible
   */
  static validateZipRequest(photos: PhotoItem[]): { valid: boolean; reason?: string } {
    if (photos.length === 0) {
      return { valid: false, reason: 'No photos selected' };
    }

    if (photos.length > 1000) {
      return { valid: false, reason: 'Too many photos (max 1000)' };
    }

    const totalSize = photos.reduce((sum, photo) => sum + photo.file_size, 0);
    const maxTotalSize = 500 * 1024 * 1024; // 500MB

    if (totalSize > maxTotalSize) {
      return { valid: false, reason: 'Total size too large (max 500MB)' };
    }

    return { valid: true };
  }
}

/**
 * Helper function to create ZIP from photos
 */
export async function createPhotoZip(
  photos: PhotoItem[], 
  options: ZipOptions = {}
): Promise<Blob> {
  const generator = new ZipGenerator(options);
  return generator.generateZip(photos);
}