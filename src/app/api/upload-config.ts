/**
 * Shared upload configuration for API routes
 * Next.js App Router configuration for file uploads
 */

// Default configuration for upload routes
export const uploadConfig = {
  runtime: 'nodejs' as const,
  maxDuration: 30, // 30 seconds timeout for uploads
  dynamic: 'force-dynamic' as const,
} as const;

// Note: Next.js App Router doesn't use bodyParser config like Pages Router
// File size limits are handled at application level via formData() processing
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_REQUEST_SIZE = 60 * 1024 * 1024; // 60MB (includes multipart overhead)