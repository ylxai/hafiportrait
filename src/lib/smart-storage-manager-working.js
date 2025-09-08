/**
 * Smart Storage Manager - Multi-tier storage solution
 * Optimizes storage across Supabase, Cloud providers, and local backup
 */

const fs = require('fs').promises;
const path = require('path');

class SmartStorageManager {
  constructor(config = {}) {
    this.config = {
      // Cloudflare R2 (Tier 1 - Primary)
      cloudflareR2: {
        maxSizeGB: 8, // 80% of 10GB free limit
        priority: 'high',
        types: ['premium', 'homepage', 'featured', 'standard']
      },
      
      // Google Drive (Tier 2 - Secondary)
      googleDrive: {
        maxSizeGB: 12, // 80% of 15GB free limit
        priority: 'medium',
        types: ['backup', 'archive', 'overflow']
      },
      
      // Local Backup (Tier 3 - Archive)
      local: {
        maxSizeGB: 50,
        priority: 'low',
        types: ['raw', 'local-backup', 'emergency']
      },
      
      // Compression settings
      compression: {
        premium: { quality: 0.95, maxWidth: 4000 },
        standard: { quality: 0.85, maxWidth: 2000 },
        thumbnail: { quality: 0.75, maxWidth: 800 }
      },
      
      ...config
    };
    
    this.storageStats = {
      cloudflareR2: { used: 0, available: this.config.cloudflareR2.maxSizeGB * 1024 * 1024 * 1024 },
      googleDrive: { used: 0, available: this.config.googleDrive.maxSizeGB * 1024 * 1024 * 1024 },
      local: { used: 0, available: this.config.local.maxSizeGB * 1024 * 1024 * 1024 }
    };

    // Initialize storage providers
    this.cloudflareR2 = null;
    this.googleDrive = null;
  }

  /**
   * Initialize storage providers
   */
  async initializeProviders() {
    try {
      // Initialize Cloudflare R2
      const CloudflareR2Storage = require('./cloudflare-r2-storage');
      this.cloudflareR2 = new CloudflareR2Storage();
      await this.cloudflareR2.initialize();

      // Initialize Google Drive
      const GoogleDriveStorage = require('./google-drive-storage');
      this.googleDrive = new GoogleDriveStorage();
      await this.googleDrive.initialize();

      console.log('✅ Storage providers initialized');
    } catch (error) {
      console.error('❌ Failed to initialize storage providers:', error);
    }
  }

  /**
   * Determine optimal storage tier for a photo
   */
  async determineStorageTier(photoMetadata) {
    const { 
      isHomepage, 
      isPremium, 
      isFeatured, 
      fileSize, 
      eventType,
      albumName,
      fileType 
    } = photoMetadata;

    // Tier 1: Cloudflare R2 (Primary storage for all photos)
    // Check if Cloudflare R2 credentials are available
    const hasR2Credentials = !!(
      process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_BUCKET_NAME
    );
    
    if (hasR2Credentials && this.hasSpace('cloudflareR2', fileSize)) {
      console.log('🎯 Selecting Cloudflare R2 as primary tier');
      return {
        tier: 'cloudflareR2',
        compression: isHomepage || isPremium || isFeatured ? 'premium' : 'standard',
        priority: 'high'
      };
    } else if (hasR2Credentials) {
      console.warn('⚠️ Cloudflare R2 credentials available but no space');
    } else {
      console.warn('⚠️ Cloudflare R2 credentials not available');
    }

    // Tier 2: Google Drive (Overflow and backup)
    if (this.hasSpace('googleDrive', fileSize)) {
      return {
        tier: 'googleDrive',
        compression: 'standard',
        priority: 'medium'
      };
    }

    // Tier 3: Local Backup (Emergency fallback)
    return {
      tier: 'local',
      compression: 'standard',
      priority: 'low'
    };
  }

  /**
   * Check if storage tier has available space
   */
  hasSpace(tier, fileSize) {
    const stats = this.storageStats[tier];
    const hasSpace = (stats.used + fileSize) <= stats.available;
    
    console.log(`📊 Space check for ${tier}:`);
    console.log(`   Used: ${(stats.used / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Available: ${(stats.available / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   File size: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Has space: ${hasSpace ? '✅ Yes' : '❌ No'}`);
    
    return hasSpace;
  }

  /**
   * Upload photo to determined tier
   */
  async uploadPhoto(photoFile, metadata) {
    const storagePlan = await this.determineStorageTier(metadata);
    
    try {
      let uploadResult;
      
      console.log(`🎯 Attempting upload to tier: ${storagePlan.tier}`);
      
      switch (storagePlan.tier) {
        case 'cloudflareR2':
          uploadResult = await this.uploadToCloudflareR2(photoFile, metadata, storagePlan);
          console.log(`✅ Successfully uploaded to Cloudflare R2: ${uploadResult.path}`);
          break;
          
        case 'googleDrive':
          uploadResult = await this.uploadToGoogleDrive(photoFile, metadata, storagePlan);
          console.log(`✅ Successfully uploaded to Google Drive: ${uploadResult.path}`);
          break;
          
        case 'local':
          uploadResult = await this.uploadToLocal(photoFile, metadata, storagePlan);
          console.log(`✅ Successfully uploaded to local: ${uploadResult.path}`);
          break;
      }

      // Update storage stats
      this.updateStorageStats(storagePlan.tier, photoFile.size);
      
      // Create thumbnail for all tiers (only if main upload succeeded to cloud)
      let thumbnailUrl = null;
      if (storagePlan.tier === 'cloudflareR2' || storagePlan.tier === 'googleDrive') {
        try {
          thumbnailUrl = await this.createThumbnail(photoFile, metadata);
        } catch (thumbnailError) {
          console.warn('⚠️ Thumbnail creation failed:', thumbnailError.message);
        }
      }
      
      return {
        ...uploadResult,
        tier: storagePlan.tier,
        thumbnailUrl,
        compressionUsed: storagePlan.compression
      };
      
    } catch (error) {
      console.error(`❌ Upload failed for tier ${storagePlan.tier}:`, error);
      
      // Fallback to next available tier
      return await this.uploadWithFallback(photoFile, metadata, storagePlan.tier);
    }
  }

  /**
   * Upload to Cloudflare R2 (Tier 1)
   */
  async uploadToCloudflareR2(photoFile, metadata, storagePlan) {
    if (!this.cloudflareR2) {
      await this.initializeProviders();
    }
    
    // Compress based on priority
    const compressedFile = await this.compressImage(photoFile, storagePlan.compression);
    
    const uploadResult = await this.cloudflareR2.uploadPhoto(
      compressedFile.buffer, 
      compressedFile.name, 
      {
        eventId: metadata.eventId,
        albumName: metadata.albumName,
        uploaderName: metadata.uploaderName,
        fileType: metadata.isHomepage ? 'homepage' : 'event'
      }
    );
    
    console.log(`✅ Uploaded to Cloudflare R2: ${uploadResult.path}`);
    
    return {
      url: uploadResult.url,
      path: uploadResult.path,
      size: compressedFile.size,
      storage: 'cloudflare-r2',
      etag: uploadResult.etag
    };
  }

  /**
   * Upload to Google Drive (Tier 2)
   */
  async uploadToGoogleDrive(photoFile, metadata, storagePlan) {
    if (!this.googleDrive) {
      await this.initializeProviders();
    }
    
    // Compress for standard quality
    const compressedFile = await this.compressImage(photoFile, storagePlan.compression);
    
    const uploadResult = await this.googleDrive.uploadPhoto(
      compressedFile.buffer, 
      compressedFile.name, 
      {
        eventId: metadata.eventId,
        albumName: metadata.albumName,
        uploaderName: metadata.uploaderName,
        makePublic: true // Make publicly accessible
      }
    );
    
    console.log(`✅ Uploaded to Google Drive: ${uploadResult.fileName}`);
    
    return {
      url: uploadResult.publicUrl || uploadResult.webViewLink,
      path: uploadResult.fileId,
      size: compressedFile.size,
      storage: 'google-drive',
      fileId: uploadResult.fileId
    };
  }

  /**
   * Upload to Google Drive (Tier 2) - Updated implementation
   */
  async uploadToGoogleDrive(photoFile, metadata, storagePlan) {
    if (!this.googleDrive) {
      await this.initializeProviders();
    }
    
    // Compress for standard quality
    const compressedFile = await this.compressImage(photoFile, storagePlan.compression);
    
    const uploadResult = await this.googleDrive.uploadPhoto(
      compressedFile.buffer, 
      compressedFile.name, 
      {
        eventId: metadata.eventId,
        albumName: metadata.albumName,
        uploaderName: metadata.uploaderName,
        makePublic: true // Make publicly accessible
      }
    );
    
    console.log(`✅ Uploaded to Google Drive: ${uploadResult.fileName}`);
    
    return {
      url: uploadResult.publicUrl || uploadResult.webViewLink,
      path: uploadResult.fileId,
      size: compressedFile.size,
      storage: 'google-drive',
      fileId: uploadResult.fileId
    };
  }

  /**
   * Upload to Local Storage (Tier 3)
   */
  async uploadToLocal(photoFile, metadata, storagePlan) {
    const localPath = path.join(
      this.config.local.backupFolder || './dslr-backup',
      metadata.eventId || 'default',
      `${Date.now()}_${photoFile.name}`
    );
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    
    // Compress and save
    const compressedFile = await this.compressImage(photoFile, storagePlan.compression);
    await fs.writeFile(localPath, compressedFile.buffer);
    
    console.log(`✅ Saved to local: ${localPath}`);
    
    return {
      url: `file://${localPath}`,
      path: localPath,
      size: compressedFile.size,
      storage: 'local'
    };
  }

  
  /**
   * Compress image with Sharp or fallback
   */
  async compressImage(photoFile, compressionType) {
    const settings = this.config.compression[compressionType];
    
    try {
      // Try to use Sharp
      const sharp = require('sharp');
      
      const compressedBuffer = await sharp(photoFile.buffer)
        .resize(settings.maxWidth, null, { 
          withoutEnlargement: true,
          fit: 'inside'
        })
        .jpeg({ 
          quality: Math.round(settings.quality * 100),
          progressive: true
        })
        .toBuffer();
      
      return {
        ...photoFile,
        buffer: compressedBuffer,
        size: compressedBuffer.length,
        name: photoFile.name.replace(/\.[^/.]+$/, '.jpg')
      };
    } catch (error) {
      console.warn('⚠️ Sharp not available, using fallback compression');
      
      // Fallback: return original file
      return {
        ...photoFile,
        buffer: photoFile.buffer,
        size: photoFile.size,
        name: photoFile.name.replace(/\.[^/.]+$/, '.jpg')
      };
    }
  }
  /**
   * Create thumbnail for fast loading
   */
  async createThumbnail(photoFile, metadata) {
    try {
      const sharp = require('sharp');
      
      const thumbnailBuffer = await sharp(photoFile.buffer)
        .resize(400, 300, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 75 })
        .toBuffer();
      
      // Upload thumbnail to Cloudflare R2 for fast access
      if (!this.cloudflareR2) {
        await this.initializeProviders();
      }
      
      const thumbnailFileName = `thumb_${photoFile.name}`;
      const uploadResult = await this.cloudflareR2.uploadPhoto(
        thumbnailBuffer, 
        thumbnailFileName, 
        {
          eventId: metadata.eventId,
          albumName: 'thumbnails',
          uploaderName: metadata.uploaderName,
          fileType: 'thumbnail'
        }
      );
      
      return uploadResult.url;
    } catch (error) {
      console.warn('⚠️ Thumbnail creation failed:', error.message);
      return null; // Return null if thumbnail creation fails
    }
  }

  /**
   * Fallback upload strategy
   */
  async uploadWithFallback(photoFile, metadata, failedTier) {
    const fallbackOrder = ['cloudflareR2', 'googleDrive', 'local'];
    const startIndex = fallbackOrder.indexOf(failedTier) + 1;
    
    for (let i = startIndex; i < fallbackOrder.length; i++) {
      const tier = fallbackOrder[i];
      
      try {
        const storagePlan = { tier, compression: 'standard', priority: 'fallback' };
        
        if (tier === 'cloudflareR2') {
          return await this.uploadToCloudflareR2(photoFile, metadata, storagePlan);
        } else if (tier === 'googleDrive') {
          return await this.uploadToGoogleDrive(photoFile, metadata, storagePlan);
        } else {
          return await this.uploadToLocal(photoFile, metadata, storagePlan);
        }
      } catch (error) {
        console.warn(`⚠️ Fallback to ${tier} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All storage tiers failed');
  }

  /**
   * Update storage statistics
   */
  updateStorageStats(tier, fileSize) {
    this.storageStats[tier].used += fileSize;
  }

  /**
   * Get storage status report
   */
  getStorageReport() {
    const report = {};
    
    Object.keys(this.storageStats).forEach(tier => {
      const stats = this.storageStats[tier];
      const usedGB = (stats.used / (1024 * 1024 * 1024)).toFixed(2);
      const availableGB = (stats.available / (1024 * 1024 * 1024)).toFixed(2);
      const usagePercent = ((stats.used / stats.available) * 100).toFixed(1);
      
      report[tier] = {
        used: `${usedGB} GB`,
        available: `${availableGB} GB`,
        usage: `${usagePercent}%`,
        status: usagePercent > 90 ? '🔴 Critical' : usagePercent > 70 ? '🟡 Warning' : '🟢 Good'
      };
    });
    
    return report;
  }

  /**
   * Cleanup old files based on retention policy
   */
  async cleanupOldFiles(retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Cleanup local files
    const localBackupPath = this.config.local.backupFolder || './dslr-backup';
    
    try {
      const files = await fs.readdir(localBackupPath, { recursive: true });
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(localBackupPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          cleanedCount++;
        }
      }
      
      console.log(`🧹 Cleaned up ${cleanedCount} old files`);
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

module.exports = SmartStorageManager;