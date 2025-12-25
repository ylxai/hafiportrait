/**
 * Image Processing Utility
 * 
 * Handles image processing tasks including:
 * - Thumbnail generation in multiple sizes
 * - Format conversion (JPEG, WebP)
 * - EXIF data extraction
 * - Image optimization and compression
 * - Buffer validation (security)
 */

import sharp from 'sharp';
import { uploadPhoto } from './storage-adapter';

/**
 * Magic bytes for image format validation
 * Used to prevent malicious file processing before Sharp operations
 */
export const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  webp: {
    riff: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    webp: [0x57, 0x45, 0x42, 0x50], // "WEBP" at offset 8
  }
} as const;

/**
 * Validate image buffer using magic bytes
 * Prevents DoS attacks by rejecting malicious files before Sharp processing
 * 
 * @param buffer - Image buffer to validate
 * @param expectedType - Expected MIME type (optional)
 * @returns Object with validation result and detected type
 */
export function validateImageBuffer(
  buffer: Buffer,
  expectedType?: string
): { valid: boolean; detectedType?: string; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'Buffer too small or empty' };
  }

  // Check JPEG magic bytes (FF D8 FF)
  if (
    buffer[0] === MAGIC_BYTES.jpeg[0] &&
    buffer[1] === MAGIC_BYTES.jpeg[1] &&
    buffer[2] === MAGIC_BYTES.jpeg[2]
  ) {
    const detectedType = 'image/jpeg';
    if (expectedType && expectedType !== detectedType && expectedType !== 'image/jpg') {
      return {
        valid: false,
        detectedType,
        error: `MIME type mismatch: expected ${expectedType}, detected ${detectedType}`
      };
    }
    return { valid: true, detectedType };
  }

  // Check PNG magic bytes (89 50 4E 47 0D 0A 1A 0A)
  if (buffer.length >= 8) {
    let isPng = true;
    for (let i = 0; i < MAGIC_BYTES.png.length; i++) {
      if (buffer[i] !== MAGIC_BYTES.png[i]) {
        isPng = false;
        break;
      }
    }
    if (isPng) {
      const detectedType = 'image/png';
      if (expectedType && expectedType !== detectedType) {
        return {
          valid: false,
          detectedType,
          error: `MIME type mismatch: expected ${expectedType}, detected ${detectedType}`
        };
      }
      return { valid: true, detectedType };
    }
  }

  // Check WebP magic bytes (RIFF at start, WEBP at offset 8)
  if (buffer.length >= 12) {
    let isRiff = true;
    for (let i = 0; i < MAGIC_BYTES.webp.riff.length; i++) {
      if (buffer[i] !== MAGIC_BYTES.webp.riff[i]) {
        isRiff = false;
        break;
      }
    }

    if (isRiff) {
      let isWebp = true;
      for (let i = 0; i < MAGIC_BYTES.webp.webp.length; i++) {
        if (buffer[8 + i] !== MAGIC_BYTES.webp.webp[i]) {
          isWebp = false;
          break;
        }
      }

      if (isWebp) {
        const detectedType = 'image/webp';
        if (expectedType && expectedType !== detectedType) {
          return {
            valid: false,
            detectedType,
            error: `MIME type mismatch: expected ${expectedType}, detected ${detectedType}`
          };
        }
        return { valid: true, detectedType };
      }
    }
  }

  return {
    valid: false,
    error: 'Invalid or unsupported image format. Allowed: JPEG, PNG, WebP'
  };
}

/**
 * Thumbnail sizes configuration
 */
export const THUMBNAIL_SIZES = {
  small: 400,
  medium: 800,
  large: 1200,
} as const;

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES;

/**
 * Image format configuration
 */
export const IMAGE_FORMATS = ['jpeg', 'webp'] as const;
export type ImageFormat = typeof IMAGE_FORMATS[number];

/**
 * Compression quality settings
 */
export const QUALITY_SETTINGS = {
  jpeg: 85,
  webp: 80,
} as const;

/**
 * Image metadata interface
 */
export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
  hasAlpha: boolean;
  orientation?: number;
  exif?: {
    make?: string;
    model?: string;
    iso?: number;
    fNumber?: number;
    exposureTime?: string;
    focalLength?: number;
    dateTime?: string;
  };
}

/**
 * Thumbnail generation result
 */
export interface ThumbnailResult {
  size: ThumbnailSize;
  format: ImageFormat;
  url: string;
  width: number;
  height: number;
  file_size: number;
}

/**
 * Extract metadata from image buffer
 * 
 * @param buffer - Image buffer
 * @returns Image metadata
 */
export async function extractImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  try {
    // Validate buffer before processing
    const validation = validateImageBuffer(buffer);
    if (!validation.valid) {
      throw new Error(`Buffer validation failed: ${validation.error}`);
    }

    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Extract EXIF data if available
    let exif_data: ImageMetadata['exif'] = undefined;
    
    if (metadata.exif) {
      try {
        // EXIF data from Sharp is a Buffer, skip for now
      } catch (error) {
      }
    }
    
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: buffer.length,
      hasAlpha: metadata.hasAlpha || false,
      orientation: metadata.orientation,
      exif: exif_data,
    };
  } catch (error) {
    console.error('Error extracting image metadata:', error);
    throw new Error('Failed to extract image metadata');
  }
}

/**
 * Generate single thumbnail
 * 
 * @param buffer - Original image buffer
 * @param size - Thumbnail size
 * @param format - Output format
 * @returns Processed image buffer and metadata
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: ThumbnailSize,
  format: ImageFormat = 'jpeg'
): Promise<{ buffer: Buffer; width: number; height: number }> {
  try {
    // Validate buffer before processing
    const validation = validateImageBuffer(buffer);
    if (!validation.valid) {
      throw new Error(`Buffer validation failed: ${validation.error}`);
    }

    const maxSize = THUMBNAIL_SIZES[size];
    const quality = QUALITY_SETTINGS[format];
    
    let image = sharp(buffer, { 
      failOnError: false,
      limitInputPixels: 268402689 // Limit to ~16K pixels to prevent memory issues
    })
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    
    // Apply format-specific settings
    if (format === 'jpeg') {
      image = image.jpeg({ quality, progressive: true });
    } else if (format === 'webp') {
      image = image.webp({ quality });
    }
    
    const processedBuffer = await image.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();
    
    return {
      buffer: processedBuffer,
      width: metadata.width || maxSize,
      height: metadata.height || maxSize,
    };
  } catch (error) {
    console.error(`Error generating ${size} thumbnail:`, error);
    throw new Error(`Failed to generate ${size} thumbnail`);
  }
}

/**
 * Generate all thumbnail sizes for an image (OPTIMIZED - Parallel Processing)
 * 
 * @param buffer - Original image buffer
 * @param event_id - Event ID for storage path
 * @param baseFilename - Base filename (without extension)
 * @param formats - Formats to generate (default: ['jpeg', 'webp'])
 * @param onProgress - Progress callback
 * @returns Thumbnail results
 */
export async function generateThumbnails(
  buffer: Buffer,
  event_id: string,
  baseFilename: string,
  formats: ImageFormat[] = ['jpeg', 'webp'],
  onProgress?: (progress: { size: ThumbnailSize; format: ImageFormat; done: boolean }) => void
): Promise<{
  success: boolean;
  thumbnails: Record<ThumbnailSize, Record<ImageFormat, ThumbnailResult | null>>;
  errors: string[];
}> {
  const thumbnails: Record<ThumbnailSize, Record<ImageFormat, ThumbnailResult | null>> = {
    small: { jpeg: null, webp: null },
    medium: { jpeg: null, webp: null },
    large: { jpeg: null, webp: null },
  };
  
  const errors: string[] = [];

  // Validate buffer first
  const validation = validateImageBuffer(buffer);
  if (!validation.valid) {
    errors.push(`Buffer validation failed: ${validation.error}`);
    return { success: false, thumbnails, errors };
  }

  // OPTIMIZATION: Generate all sizes in parallel
  const sizePromises = (Object.keys(THUMBNAIL_SIZES) as ThumbnailSize[]).map(async (size) => {
    try {
      // Generate resized buffer once
      const { buffer: resizedBuffer, width, height } = await generateThumbnail(buffer, size, 'jpeg');

      // OPTIMIZATION: Generate both formats in parallel from the resized buffer
      const formatPromises = formats.map(async (format) => {
        try {
          // Convert to target format
          let convertedBuffer: Buffer;
          if (format === 'jpeg') {
            convertedBuffer = resizedBuffer; // Already in JPEG
          } else {
            // Convert to WebP
            convertedBuffer = await sharp(resizedBuffer)
              .webp({ quality: QUALITY_SETTINGS.webp })
              .toBuffer();
          }

          // Upload to storage (VPS or R2)
          // FIXED: Add size suffix to prevent overwriting (small/medium/large)
          const filename = `${baseFilename}-${size}.${format}`;
          
          const uploadResult = await uploadPhoto(
            convertedBuffer,
            event_id,
            filename,
            'thumbnails',
            `image/${format}`
          );
          
          if (uploadResult.success) {
            thumbnails[size][format] = {
              size,
              format,
              url: uploadResult.url,
              width,
              height,
              file_size: convertedBuffer.length,
            };
            
            onProgress?.({ size, format, done: true });
          } else {
            errors.push(`Failed to upload ${size} ${format} thumbnail: ${uploadResult.error}`);
            onProgress?.({ size, format, done: false });
          }
        } catch (error) {
          const errorMsg = `Error generating ${size} ${format} thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
          onProgress?.({ size, format, done: false });
        }
      });

      await Promise.all(formatPromises);
    } catch (error) {
      const errorMsg = `Error processing ${size} thumbnails: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  });

  await Promise.all(sizePromises);
  
  return {
    success: errors.length === 0,
    thumbnails,
    errors,
  };
}

/**
 * Generate thumbnails with retry logic
 * 
 * @param buffer - Original image buffer
 * @param event_id - Event ID
 * @param baseFilename - Base filename
 * @param maxRetries - Maximum retry attempts per thumbnail
 * @returns Generation results
 */
export async function generateThumbnailsWithRetry(
  buffer: Buffer,
  event_id: string,
  baseFilename: string,
  maxRetries: number = 3
): Promise<{
  success: boolean;
  thumbnails: Record<ThumbnailSize, Record<ImageFormat, ThumbnailResult | null>>;
  errors: string[];
}> {
  let lastResult = await generateThumbnails(buffer, event_id, baseFilename);
  
  // Retry failed thumbnails
  for (let attempt = 1; attempt < maxRetries && !lastResult.success; attempt++) {
    console.log(`Retrying thumbnail generation, attempt ${attempt}/${maxRetries}...`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    
    lastResult = await generateThumbnails(buffer, event_id, baseFilename);
  }
  
  return lastResult;
}

/**
 * Optimize image without resizing
 * 
 * @param buffer - Original image buffer
 * @param format - Output format
 * @returns Optimized image buffer
 */
export async function optimizeImage(
  buffer: Buffer,
  format: ImageFormat = 'jpeg'
): Promise<Buffer> {
  try {
    // Validate buffer before processing
    const validation = validateImageBuffer(buffer);
    if (!validation.valid) {
      throw new Error(`Buffer validation failed: ${validation.error}`);
    }

    const quality = QUALITY_SETTINGS[format];
    
    let image = sharp(buffer).rotate(); // Auto-rotate based on EXIF
    
    if (format === 'jpeg') {
      image = image.jpeg({ quality, progressive: true });
    } else if (format === 'webp') {
      image = image.webp({ quality });
    }
    
    return await image.toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Failed to optimize image');
  }
}

/**
 * Get image dimensions
 * 
 * @param buffer - Image buffer
 * @returns Width and height
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  try {
    // Validate buffer before processing
    const validation = validateImageBuffer(buffer);
    if (!validation.valid) {
      throw new Error(`Buffer validation failed: ${validation.error}`);
    }

    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to get image dimensions');
  }
}

/**
 * Validate image buffer (Enhanced with magic byte validation)
 * 
 * @param buffer - Image buffer to validate
 * @returns True if valid image
 */
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  // Use magic byte validation first (faster, more secure)
  const validation = validateImageBuffer(buffer);
  if (!validation.valid) {
    return false;
  }

  // Then verify with Sharp (slower but comprehensive)
  try {
    await sharp(buffer).metadata();
    return true;
  } catch (error) {
    console.error('Sharp validation failed:', error);
    return false;
  }
}

const imageProcessor = {
  validateImageBuffer,
  extractImageMetadata,
  generateThumbnail,
  generateThumbnails,
  generateThumbnailsWithRetry,
  optimizeImage,
  getImageDimensions,
  isValidImage,
  THUMBNAIL_SIZES,
  IMAGE_FORMATS,
  QUALITY_SETTINGS,
  MAGIC_BYTES,
}

export default imageProcessor;
