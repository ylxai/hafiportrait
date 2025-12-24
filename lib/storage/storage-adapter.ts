/**
 * Storage Adapter - Switch between VPS Local and R2 Cloud
 * Controlled by environment variable
 */

import { uploadToR2, deleteFromR2, getR2Url } from './r2';
import { 
  uploadToLocal, 
  deleteFromLocal, 
  getLocalStorageUrl,
  buildLocalStorageKey 
} from './local-storage';
import { logger } from '@/lib/logger';

export type StorageBackend = 'local' | 'r2';

const USE_LOCAL_STORAGE = process.env.USE_LOCAL_STORAGE === 'true';

/**
 * Get current storage backend
 */
export function getStorageBackend(): StorageBackend {
  return USE_LOCAL_STORAGE ? 'local' : 'r2';
}

/**
 * Build storage key based on backend
 */
export function buildPhotoStorageKey(
  eventId: string,
  filename: string,
  type: 'originals' | 'thumbnails' = 'originals'
): string {
  if (USE_LOCAL_STORAGE) {
    return buildLocalStorageKey(eventId, filename, type);
  } else {
    // R2 uses same structure
    return `events/${eventId}/photos/${type}/${filename}`;
  }
}

/**
 * Upload photo to active storage backend
 */
export async function uploadPhoto(
  buffer: Buffer,
  eventId: string,
  filename: string,
  type: 'originals' | 'thumbnails' = 'originals',
  contentType?: string
): Promise<{
  success: boolean;
  url: string;
  backend: StorageBackend;
  size: number;
  error?: string;
}> {
  const key = buildPhotoStorageKey(eventId, filename, type);
  const backend = getStorageBackend();
  
  logger.info('Uploading photo', {
    backend,
    key,
    size: buffer.length,
    type
  });
  
  if (backend === 'local') {
    const result = await uploadToLocal(buffer, key, contentType);
    return {
      success: result.success,
      url: result.url,
      backend: 'local',
      size: result.size,
      error: result.error
    };
  } else {
    try {
      const uploadResult = await uploadToR2(buffer, key, contentType || 'application/octet-stream');
      
      if (uploadResult.success) {
        const url = getR2Url(key);
        return {
          success: true,
          url,
          backend: 'r2',
          size: buffer.length
        };
      } else {
        return {
          success: false,
          url: '',
          backend: 'r2',
          size: 0,
          error: uploadResult.error
        };
      }
    } catch (error) {
      logger.error('R2 upload failed', { key, error });
      return {
        success: false,
        url: '',
        backend: 'r2',
        size: 0,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }
}

/**
 * Delete photo from active storage backend
 */
export async function deletePhoto(
  key: string
): Promise<{ success: boolean; backend: StorageBackend }> {
  const backend = getStorageBackend();
  
  logger.info('Deleting photo', { backend, key });
  
  if (backend === 'local') {
    const success = await deleteFromLocal(key);
    return { success, backend: 'local' };
  } else {
    const result = await deleteFromR2(key);
    return { success: result.success, backend: 'r2' };
  }
}

/**
 * Get public URL for a photo
 */
export function getPhotoUrl(key: string, backend?: StorageBackend): string {
  const activeBackend = backend || getStorageBackend();
  
  if (activeBackend === 'local') {
    return getLocalStorageUrl(key);
  } else {
    return getR2Url(key);
  }
}

/**
 * Get storage backend info for monitoring
 */
export function getStorageInfo() {
  return {
    backend: getStorageBackend(),
    basePath: process.env.STORAGE_BASE_PATH,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
    r2Bucket: process.env.R2_BUCKET_NAME,
    r2PublicUrl: process.env.R2_PUBLIC_URL
  };
}
