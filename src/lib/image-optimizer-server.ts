/**
 * Server-side Image Optimization Service
 * Handles compression, resizing, and format conversion on the server
 */

// Conditional import for Sharp (optional dependency)
let sharp: any;
try {
  sharp = require('sharp');
} catch (error) {
  console.warn('Sharp not available, image optimization disabled');
  sharp = null;
}

export interface OptimizedImages {
  original: {
    url: string;
    size: number;
    width: number;
    height: number;
  };
  thumbnail: {
    url: string;
    size: number;
  };
  small: {
    url: string;
    size: number;
  };
  medium: {
    url: string;
    size: number;
  };
  large: {
    url: string;
    size: number;
  };
}

export class ImageOptimizerServer {
  private supabase: any;
  private bucketName: string;

  constructor(supabase: any, bucketName: string = 'photos') {
    this.supabase = supabase;
    this.bucketName = bucketName;
  }

  /**
   * Generate filename for different sizes
   */
  private generateFilename(originalName: string, size: string, timestamp: number): string {
    const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    return `${timestamp}_${cleanName}_${size}.${ext}`;
  }

  /**
   * Optimize single image to specific size
   */
  private async optimizeImage(
    buffer: Buffer, 
    width: number, 
    height: number, 
    quality: number
  ): Promise<Buffer> {
    if (!sharp) {
      // Fallback: return original buffer if Sharp not available
      return buffer;
    }
    
    return await sharp(buffer)
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .jpeg({
        quality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
  }

  /**
   * Get image metadata
   */
  private async getImageMetadata(buffer: Buffer) {
    if (!sharp) {
      // Fallback: return default metadata if Sharp not available
      return {
        width: 1920,
        height: 1080,
        format: 'jpeg',
        size: buffer.length
      };
    }
    
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'jpeg',
      size: buffer.length
    };
  }

  /**
   * Upload buffer to Supabase Storage
   */
  private async uploadToStorage(
    buffer: Buffer, 
    filePath: string, 
    contentType: string = 'image/jpeg'
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '31536000', // 1 year cache
        upsert: false
      });

    if (error) throw error;

    const { data: publicUrlData } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  /**
   * Process and optimize image for all sizes (SERVER-SIDE ONLY)
   */
  async processImage(
    buffer: Buffer, 
    originalName: string,
    folder: string = 'optimized'
  ): Promise<OptimizedImages> {
    try {
      // Get original metadata
      const originalMetadata = await this.getImageMetadata(buffer);
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);

      // Define sizes
      const sizes = {
        thumbnail: { width: 300, height: 225, quality: 75 },
        small: { width: 800, height: 600, quality: 90 },
        medium: { width: 1200, height: 900, quality: 95 },
        large: { width: 1920, height: 1440, quality: 100 }
      };

      // Upload original
      const originalPath = `${folder}/original/${timestamp}_${randomId}_original.jpg`;
      const originalUrl = await this.uploadToStorage(buffer, originalPath);

      // Process and upload optimized versions
      const results: OptimizedImages = {
        original: {
          url: originalUrl,
          size: originalMetadata.size,
          width: originalMetadata.width,
          height: originalMetadata.height
        },
        thumbnail: { url: '', size: 0 },
        small: { url: '', size: 0 },
        medium: { url: '', size: 0 },
        large: { url: '', size: 0 }
      };

      // Process each size
      for (const [sizeName, config] of Object.entries(sizes)) {
        const optimizedBuffer = await this.optimizeImage(
          buffer,
          config.width,
          config.height,
          config.quality
        );

        const optimizedPath = `${folder}/${sizeName}/${timestamp}_${randomId}_${sizeName}.jpg`;
        const optimizedUrl = await this.uploadToStorage(optimizedBuffer, optimizedPath);

        results[sizeName as keyof typeof sizes] = {
          url: optimizedUrl,
          size: optimizedBuffer.length
        };
      }

      return results;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Get appropriate image URL based on viewport/usage
   */
  static getOptimalImageUrl(
    images: OptimizedImages, 
    usage: 'thumbnail' | 'gallery' | 'lightbox' | 'download' | 'mobile'
  ): string {
    switch (usage) {
      case 'thumbnail':
        return images.thumbnail.url;
      case 'gallery':
        return images.medium.url;
      case 'lightbox':
        return images.large.url;
      case 'download':
        return images.original.url;
      case 'mobile':
        return images.small.url;
      default:
        return images.medium.url;
    }
  }

  /**
   * Get responsive image sources for different screen sizes
   */
  static getResponsiveSources(images: OptimizedImages) {
    return {
      srcSet: [
        `${images.small.url} 800w`,
        `${images.medium.url} 1200w`,
        `${images.large.url} 1920w`
      ].join(', '),
      sizes: [
        '(max-width: 768px) 800px',
        '(max-width: 1200px) 1200px',
        '1920px'
      ].join(', '),
      src: images.medium.url, // Fallback
      placeholder: images.thumbnail.url
    };
  }

  /**
   * Calculate compression savings
   */
  static getCompressionStats(images: OptimizedImages) {
    const originalSize = images.original.size;
    const optimizedSize = images.medium.size;
    const savings = ((originalSize - optimizedSize) / originalSize) * 100;
    
    return {
      originalSize: this.formatFileSize(originalSize),
      optimizedSize: this.formatFileSize(optimizedSize),
      savings: Math.round(savings),
      ratio: `${Math.round(originalSize / optimizedSize)}:1`
    };
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}