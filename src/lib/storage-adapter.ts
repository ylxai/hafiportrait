/**
 * Storage Adapter - Bridge between API endpoints and Smart Storage Manager
 * Provides TypeScript interface for the Smart Storage Manager
 */

import { Photo } from './database';

// Import the Smart Storage Manager (JavaScript module)
const SmartStorageManager = require('./smart-storage-manager.js');

export interface StorageUploadResult {
  url: string;
  path: string;
  size: number;
  storage: 'cloudflare-r2' | 'google-drive' | 'local';
  tier: string;
  thumbnailUrl?: string | null;
  compressionUsed: string;
  etag?: string;
  fileId?: string;
}

export interface PhotoMetadata {
  eventId?: string;
  albumName: string;
  uploaderName: string;
  isHomepage: boolean;
  isPremium?: boolean;
  isFeatured?: boolean;
  fileSize: number;
  eventType?: string;
  fileType: string;
}

export class StorageAdapter {
  private storageManager: any;
  private initialized: boolean = false;
  private initializationError: Error | null = null;

  constructor() {
    try {
      this.storageManager = new SmartStorageManager({
        // Override default config if needed
        local: {
          backupFolder: process.env.LOCAL_BACKUP_PATH || './DSLR-System/Backup/dslr-backup'
        }
      });
    } catch (error) {
      this.initializationError = error instanceof Error ? error : new Error('Smart Storage Manager initialization failed');
      console.error('❌ Smart Storage Manager constructor failed:', this.initializationError);
    }
  }

  /**
   * Initialize storage providers
   */
  async initialize(): Promise<void> {
    if (this.initializationError) {
      throw this.initializationError;
    }

    if (!this.initialized) {
      try {
        if (!this.storageManager) {
          throw new Error('Smart Storage Manager not available');
        }
        await this.storageManager.initializeProviders();
        this.initialized = true;
        console.log('✅ Storage Adapter initialized');
      } catch (error) {
        const initError = error instanceof Error ? error : new Error('Storage initialization failed');
        console.error('❌ Storage Adapter initialization failed:', initError);
        throw initError;
      }
    }
  }

  /**
   * Upload photo using Smart Storage Manager
   */
  async uploadPhoto(file: File, metadata: PhotoMetadata): Promise<StorageUploadResult> {
    await this.initialize();

    // Convert File to the format expected by Smart Storage Manager
    const arrayBuffer = await file.arrayBuffer();
    const photoFile = {
      buffer: Buffer.from(arrayBuffer),
      name: file.name,
      size: file.size,
      type: file.type
    };

    // Prepare metadata for Smart Storage Manager
    const storageMetadata = {
      eventId: metadata.eventId,
      albumName: metadata.albumName,
      uploaderName: metadata.uploaderName,
      isHomepage: metadata.isHomepage,
      isPremium: metadata.isPremium || false,
      isFeatured: metadata.isFeatured || false,
      fileSize: metadata.fileSize,
      eventType: metadata.eventType || 'standard',
      fileType: metadata.fileType
    };

    console.log(`🚀 Uploading ${file.name} via Smart Storage Manager`);
    console.log(`📊 Metadata:`, storageMetadata);

    try {
      const result = await this.storageManager.uploadPhoto(photoFile, storageMetadata);
      
      console.log(`✅ Upload successful:`, {
        tier: result.tier,
        storage: result.storage,
        url: result.url,
        size: result.size
      });

      return result;
    } catch (error) {
      console.error('❌ Storage upload failed:', error);
      throw new Error(`Storage upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageReport(): Promise<any> {
    await this.initialize();
    return this.storageManager.getStorageReport();
  }

  /**
   * Cleanup old files
   */
  async cleanupOldFiles(retentionDays: number = 30): Promise<void> {
    await this.initialize();
    await this.storageManager.cleanupOldFiles(retentionDays);
  }

  /**
   * Check if storage tier has space
   */
  async hasStorageSpace(tier: 'cloudflareR2' | 'googleDrive' | 'local', fileSize: number): Promise<boolean> {
    await this.initialize();
    return this.storageManager.hasSpace(tier, fileSize);
  }

  /**
   * Get optimal storage tier for a photo
   */
  async determineStorageTier(metadata: PhotoMetadata): Promise<any> {
    await this.initialize();
    return this.storageManager.determineStorageTier(metadata);
  }

  /**
   * Upload original file for backup (uncompressed)
   */
  async uploadOriginalPhoto(file: File, metadata: PhotoMetadata): Promise<StorageUploadResult> {
    await this.initialize();

    // Convert File to the format expected by Smart Storage Manager
    const arrayBuffer = await file.arrayBuffer();
    const photoFile = {
      buffer: Buffer.from(arrayBuffer),
      name: file.name,
      size: file.size,
      type: file.type
    };

    // Use Google Drive specifically for original backup
    const originalResult = await this.storageManager.uploadOriginalToGoogleDrive(photoFile, metadata);
    
    console.log(`✅ Original file backed up:`, {
      storage: originalResult.storage,
      fileId: originalResult.fileId,
      size: originalResult.size
    });

    return {
      url: originalResult.url,
      path: originalResult.fileId,
      size: originalResult.size,
      storage: originalResult.storage,
      tier: 'google-drive-original',
      fileId: originalResult.fileId,
      compressionUsed: 'none'
    };
  }
}

// Export singleton instance
export const storageAdapter = new StorageAdapter();