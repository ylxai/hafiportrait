/**
 * Enhanced upload configuration for API routes
 * Next.js App Router configuration for file uploads
 * Updated for multiple upload support and better concurrency handling
 */

// Default configuration for upload routes
export const uploadConfig = {
  runtime: 'nodejs' as const,
  maxDuration: 60, // 60 seconds timeout for single uploads
  dynamic: 'force-dynamic' as const,
} as const;

// Batch upload configuration
export const batchUploadConfig = {
  runtime: 'nodejs' as const,
  maxDuration: 90, // Extended to 90 seconds for batch operations
  dynamic: 'force-dynamic' as const,
} as const;

// File size limits
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file
export const MAX_REQUEST_SIZE = 300 * 1024 * 1024; // 300MB total request (for batch uploads)

// Device-specific limits
export const DEVICE_LIMITS = {
  mobile: {
    maxFiles: 5,
    maxFileSize: 30 * 1024 * 1024, // 30MB per file
    maxConcurrent: 2,
    maxRequestSize: 150 * 1024 * 1024, // 150MB total
  },
  desktop: {
    maxFiles: 10,
    maxFileSize: 50 * 1024 * 1024, // 50MB per file
    maxConcurrent: 3,
    maxRequestSize: 300 * 1024 * 1024, // 300MB total
  }
} as const;

// Concurrency limits for better resource management
export const UPLOAD_LIMITS = {
  maxConcurrentUploads: 3,     // Max concurrent uploads per user (single endpoint)
  maxQueueSize: 10,            // Max files in queue per user
  maxBatchSize: 10,            // Max files per batch upload (increased for desktop)
  retryAttempts: 2,            // Auto-retry failed uploads
  retryDelay: 1000,            // Delay between retries (ms)
  batchProcessingDelay: 100,   // Delay between batch processing (ms)
} as const;

// Upload timeout configurations
export const TIMEOUT_CONFIG = {
  imageProcessing: 30000,      // 30s for image processing
  storageUpload: 45000,        // 45s for storage upload
  databaseOperation: 10000,    // 10s for database operations
  totalRequest: 60000,         // 60s total request timeout (single)
  batchRequest: 90000,         // 90s total request timeout (batch)
  batchFileProcessing: 15000,  // 15s per file in batch
} as const;