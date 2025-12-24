/**
 * VPS Local Storage Provider
 * Direct filesystem storage on VPS
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from '@/lib/logger';

const STORAGE_BASE_PATH = process.env.STORAGE_BASE_PATH || '/home/eouser/storage';
const STORAGE_PUBLIC_URL = process.env.STORAGE_PUBLIC_URL || 'https://hafiportrait.photography/storage';

export interface LocalStorageResult {
  success: boolean;
  url: string;
  path: string;
  size: number;
  error?: string;
}

/**
 * Build storage key for organized file structure
 */
export function buildLocalStorageKey(
  eventId: string,
  filename: string,
  type: 'originals' | 'thumbnails' = 'originals'
): string {
  return `events/${eventId}/photos/${type}/${filename}`;
}

/**
 * Upload file to VPS local storage
 */
export async function uploadToLocal(
  buffer: Buffer,
  key: string,
  _contentType?: string
): Promise<LocalStorageResult> {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, key);
    const dir = path.dirname(fullPath);
    
    // Create directory structure
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, buffer);
    
    // Build public URL
    const publicUrl = `${STORAGE_PUBLIC_URL}/${key}`;
    
    logger.info('File uploaded to local storage', {
      key,
      size: buffer.length,
      path: fullPath,
      url: publicUrl
    });
    
    return {
      success: true,
      url: publicUrl,
      path: fullPath,
      size: buffer.length
    };
    
  } catch (error) {
    logger.error('Failed to upload to local storage', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return {
      success: false,
      url: '',
      path: '',
      size: 0,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

/**
 * Read file from VPS local storage
 */
export async function readFromLocal(key: string): Promise<Buffer> {
  const fullPath = path.join(STORAGE_BASE_PATH, key);
  return await fs.readFile(fullPath);
}

/**
 * Delete file from VPS local storage
 */
export async function deleteFromLocal(key: string): Promise<boolean> {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, key);
    await fs.unlink(fullPath);
    
    logger.info('File deleted from local storage', { key, path: fullPath });
    return true;
    
  } catch (error) {
    logger.error('Failed to delete from local storage', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  }
}

/**
 * Check if file exists in VPS local storage
 */
export async function existsInLocal(key: string): Promise<boolean> {
  try {
    const fullPath = path.join(STORAGE_BASE_PATH, key);
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage statistics
 */
export async function getLocalStorageStats(): Promise<{
  totalSize: number;
  fileCount: number;
  path: string;
}> {
  try {
    let totalSize = 0;
    let fileCount = 0;
    
    async function scanDir(dirPath: string) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
          fileCount++;
        }
      }
    }
    
    await scanDir(STORAGE_BASE_PATH);
    
    return {
      totalSize,
      fileCount,
      path: STORAGE_BASE_PATH
    };
    
  } catch (error) {
    logger.error('Failed to get storage stats', { error });
    return {
      totalSize: 0,
      fileCount: 0,
      path: STORAGE_BASE_PATH
    };
  }
}

/**
 * Get public URL for a storage key
 */
export function getLocalStorageUrl(key: string): string {
  return `${STORAGE_PUBLIC_URL}/${key}`;
}
