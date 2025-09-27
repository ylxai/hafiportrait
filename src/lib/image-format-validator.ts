/**
 * Image Format Validator - Robust validation before Sharp processing
 * Prevents "Input buffer contains unsupported image format" errors
 */

export interface ValidationResult {
  isValid: boolean;
  format?: string;
  error?: string;
  canProcessWithSharp: boolean;
  needsConversion?: boolean;
}

export class ImageFormatValidator {
  
  /**
   * Magic numbers for common image formats
   */
  private static readonly MAGIC_NUMBERS = {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    gif: [0x47, 0x49, 0x46], // GIF
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF (WebP container)
    bmp: [0x42, 0x4D], // BM
    tiff: [0x49, 0x49, 0x2A, 0x00], // II* (little endian)
    tiff_be: [0x4D, 0x4D, 0x00, 0x2A], // MM* (big endian)
    heic: [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63], // ftypheic (offset 4)
  };

  /**
   * Sharp-supported formats that can be processed directly
   */
  private static readonly SHARP_SUPPORTED = [
    'jpeg', 'jpg', 'png', 'webp', 'gif', 'tiff', 'heic', 'heif', 'svg'
  ];

  /**
   * RAW formats that need special handling
   */
  private static readonly RAW_FORMATS = {
    nef: 'image/x-nikon-nef',
    cr2: 'image/x-canon-cr2', 
    arw: 'image/x-sony-arw',
    dng: 'image/x-adobe-dng',
    raf: 'image/x-fuji-raf'
  };

  /**
   * Validate image buffer before Sharp processing
   */
  static async validateBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<ValidationResult> {
    try {
      // 1. Check if buffer is empty
      if (!buffer || buffer.length === 0) {
        return {
          isValid: false,
          error: 'Empty buffer provided',
          canProcessWithSharp: false
        };
      }

      // 2. Check minimum size (valid images should be at least a few bytes)
      if (buffer.length < 10) {
        return {
          isValid: false,
          error: 'Buffer too small to be a valid image',
          canProcessWithSharp: false
        };
      }

      // 3. Detect format by magic numbers
      const detectedFormat = this.detectFormatByMagicNumber(buffer);
      
      // 4. Check file extension
      const fileExtension = fileName.toLowerCase().split('.').pop() || '';
      
      // 5. Check if it's a RAW format
      if (this.isRawFormat(fileExtension, mimeType)) {
        return {
          isValid: true,
          format: 'raw',
          canProcessWithSharp: false,
          needsConversion: true,
          error: 'RAW format requires special handling'
        };
      }

      // 6. Validate format consistency
      if (detectedFormat) {
        const isSharpSupported = this.SHARP_SUPPORTED.includes(detectedFormat);
        
        return {
          isValid: true,
          format: detectedFormat,
          canProcessWithSharp: isSharpSupported,
          needsConversion: !isSharpSupported
        };
      }

      // 7. Unknown format detected
      return {
        isValid: false,
        error: `Unsupported image format. File: ${fileName}, MIME: ${mimeType}`,
        canProcessWithSharp: false
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        canProcessWithSharp: false
      };
    }
  }

  /**
   * Detect image format by magic numbers
   */
  private static detectFormatByMagicNumber(buffer: Buffer): string | null {
    // Check JPEG
    if (this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.jpeg)) {
      return 'jpeg';
    }

    // Check PNG
    if (this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.png)) {
      return 'png';
    }

    // Check GIF
    if (this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.gif)) {
      return 'gif';
    }

    // Check WebP (RIFF + WEBP signature)
    if (this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.webp) && 
        buffer.length > 12 && 
        buffer.subarray(8, 12).toString() === 'WEBP') {
      return 'webp';
    }

    // Check BMP
    if (this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.bmp)) {
      return 'bmp';
    }

    // Check TIFF
    if (this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.tiff) || 
        this.matchesMagicNumber(buffer, this.MAGIC_NUMBERS.tiff_be)) {
      return 'tiff';
    }

    // Check HEIC (ftypheic at offset 4)
    if (buffer.length > 12 && 
        this.matchesMagicNumber(buffer.subarray(4), this.MAGIC_NUMBERS.heic)) {
      return 'heic';
    }

    return null;
  }

  /**
   * Check if buffer matches magic number pattern
   */
  private static matchesMagicNumber(buffer: Buffer, magicNumber: number[]): boolean {
    if (buffer.length < magicNumber.length) return false;
    
    for (let i = 0; i < magicNumber.length; i++) {
      if (buffer[i] !== magicNumber[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if format is RAW
   */
  private static isRawFormat(extension: string, mimeType: string): boolean {
    const rawExtensions = Object.keys(this.RAW_FORMATS);
    const rawMimeTypes = Object.values(this.RAW_FORMATS);
    
    return rawExtensions.includes(extension) || rawMimeTypes.includes(mimeType);
  }

  /**
   * Get human readable error message
   */
  static getErrorMessage(result: ValidationResult, fileName: string): string {
    if (result.isValid && result.canProcessWithSharp) {
      return '';
    }

    if (result.needsConversion) {
      return `RAW format (${fileName}) requires conversion. Please use JPEG, PNG, or WebP instead.`;
    }

    return result.error || `Unsupported image format: ${fileName}`;
  }
}