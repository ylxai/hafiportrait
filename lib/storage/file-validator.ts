/**
 * File Upload Security Validator
 * 
 * CRITICAL SECURITY: Multi-layer file validation
 * - MIME type validation
 * - File signature (magic bytes) verification
 * - File size enforcement
 * - Filename sanitization
 * - Malware pattern detection (basic)
 */

import { fileTypeFromBuffer } from 'file-type';

/**
 * Allowed image MIME types
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

/**
 * Maximum file size (200MB for high-res wedding photos)
 */
export const MAX_FILE_SIZE = 200 * 1024 * 1024;

/**
 * Magic bytes signatures for image validation
 */
const FILE_SIGNATURES = {
  jpeg: [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG EXIF
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG Canon
    [0xFF, 0xD8, 0xFF, 0xE8], // JPEG SPIFF
  ],
  png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
  heic: [[0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63]], // ftyp heic
};

/**
 * Validation result interface
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedType?: string;
  securityWarnings?: string[];
}

/**
 * Validate file MIME type
 */
export function isValidMimeType(mime_type: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(mime_type as any);
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Check file signature (magic bytes) against buffer
 */
function checkFileSignature(buffer: Buffer): string | null {
  // Check JPEG
  for (const signature of FILE_SIGNATURES.jpeg) {
    if (signature.every((byte, index) => buffer[index] === byte)) {
      return 'image/jpeg';
    }
  }

  // Check PNG
  const pngSig = FILE_SIGNATURES.png[0];
  if (pngSig.every((byte, index) => buffer[index] === byte)) {
    return 'image/png';
  }

  // Check WebP (RIFF header, then check for WebP)
  const webpSig = FILE_SIGNATURES.webp[0];
  if (webpSig.every((byte, index) => buffer[index] === byte)) {
    // Check if it's actually WebP (bytes 8-11 should be "WEBP")
    if (buffer.toString('ascii', 8, 12) === 'WEBP') {
      return 'image/webp';
    }
  }

  // Check HEIC
  const heicSig = FILE_SIGNATURES.heic[0];
  if (heicSig.every((byte, index) => buffer[index + 4] === byte)) {
    return 'image/heic';
  }

  return null;
}

/**
 * Comprehensive file validation
 * Validates MIME type, file signature, and size
 */
export async function validateImageFile(
  buffer: Buffer,
  declaredMimeType: string,
  file_size: number
): Promise<FileValidationResult> {
  const warnings: string[] = [];

  // 1. Validate file size
  if (!isValidFileSize(file_size)) {
    return {
      valid: false,
      error: `File size ${(file_size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // 2. Validate declared MIME type
  if (!isValidMimeType(declaredMimeType)) {
    return {
      valid: false,
      error: `Invalid file type: ${declaredMimeType}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // 3. Check file signature (magic bytes)
  const detectedType = checkFileSignature(buffer);
  if (!detectedType) {
    return {
      valid: false,
      error: 'Invalid file signature. File may be corrupted or not a valid image.',
    };
  }

  // 4. Verify MIME type matches file signature
  // Handle JPEG variants
  const normalizedDeclared = declaredMimeType.replace('jpeg', 'jpg');
  const normalizedDetected = detectedType.replace('jpeg', 'jpg');

  if (normalizedDeclared !== normalizedDetected) {
    warnings.push(
      `MIME type mismatch: declared as ${declaredMimeType}, detected as ${detectedType}`
    );
    
    // Still allow if detected type is valid
    if (!isValidMimeType(detectedType)) {
      return {
        valid: false,
        error: `File signature indicates ${detectedType}, which is not allowed`,
      };
    }
  }

  // 5. Use file-type library for additional verification
  try {
    const fileTypeResult = await fileTypeFromBuffer(buffer);
    
    if (!fileTypeResult) {
      warnings.push('Could not detect file type with file-type library');
    } else if (!isValidMimeType(fileTypeResult.mime)) {
      return {
        valid: false,
        error: `Detected file type ${fileTypeResult.mime} is not allowed`,
        detectedType: fileTypeResult.mime,
      };
    }
  } catch (error) {
    warnings.push('File type detection failed');
  }

  // 6. Basic malware pattern detection
  const malwarePatterns = [
    /(<script|javascript:|onerror=)/i, // Script injection
    /(eval\(|exec\()/i, // Code execution
  ];

  // Check first 4KB for malware patterns
  const headerString = buffer.slice(0, 4096).toString('utf-8', 0, 4096);
  const hasMalwarePattern = malwarePatterns.some(pattern => pattern.test(headerString));

  if (hasMalwarePattern) {
    return {
      valid: false,
      error: 'File contains suspicious content and was rejected',
    };
  }

  // 7. All checks passed
  return {
    valid: true,
    detectedType,
    securityWarnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Sanitize filename
 * Remove dangerous characters and path traversal attempts
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal
  let sanitized = filename.replace(/\.\./g, '');
  
  // Remove directory separators
  sanitized = sanitized.replace(/[\/\\]/g, '-');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove spaces
  sanitized = sanitized.replace(/\s+/g, '-');
  
  // Keep only safe characters: alphanumeric, dash, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Remove multiple consecutive dots
  sanitized = sanitized.replace(/\.{2,}/g, '.');
  
  // Remove leading/trailing dots and dashes
  sanitized = sanitized.replace(/^[.-]+|[.-]+$/g, '');
  
  // Ensure filename is not empty
  if (!sanitized || sanitized.length === 0) {
    sanitized = 'unnamed-file';
  }
  
  // Limit length
  const maxLength = 100;
  const parts = sanitized.split('.');
  const ext = parts.pop() || 'jpg';
  let base = parts.join('.');
  
  if (base.length > maxLength) {
    base = base.substring(0, maxLength);
  }
  
  return `${base}.${ext}`;
}

/**
 * Generate secure random filename
 */
export function generateSecureFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = sanitized.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}-${random}.${ext}`;
}

/**
 * Quick validation for file metadata (before buffer processing)
 */
export function validateFileMetadata(
  filename: string,
  mime_type: string,
  size: number
): FileValidationResult {
  // Validate filename
  if (!filename || filename.length === 0) {
    return { valid: false, error: 'Filename is required' };
  }

  if (filename.length > 255) {
    return { valid: false, error: 'Filename too long (max 255 characters)' };
  }

  // Validate MIME type
  if (!isValidMimeType(mime_type)) {
    return {
      valid: false,
      error: `Invalid file type: ${mime_type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
    };
  }

  // Validate size
  if (!isValidFileSize(size)) {
    return {
      valid: false,
      error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

const fileValidator = {
  validateImageFile,
  validateFileMetadata,
  sanitizeFilename,
  generateSecureFilename,
  isValidMimeType,
  isValidFileSize,
};
export default fileValidator;
