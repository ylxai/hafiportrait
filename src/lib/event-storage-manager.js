/**
 * Event Storage Manager - End-of-Event Backup System
 * Handles batch backup of entire events to Google Drive for long-term storage
 * 
 * Features:
 * - Batch backup entire event photos to Google Drive
 * - Archive management after backup
 * - Progress monitoring and status tracking
 * - Integration with Smart Storage Manager
 */

const SmartStorageManager = require('./smart-storage-manager');

class EventStorageManager {
  constructor(config = {}) {
    this.config = {
      // Google Drive backup settings
      googleDrive: {
        backupFolder: process.env.GOOGLE_DRIVE_FOLDER_NAME || 'HafiPortrait-Photos',
        compressionQuality: 0.90, // High quality for archival
        maxConcurrentUploads: 3,
        retryAttempts: 3
      },
      
      // Archive settings
      archive: {
        enableLocalArchive: true,
        localArchivePath: './event-archives',
        deleteAfterBackup: false // Keep originals by default
      },
      
      ...config
    };
    
    this.smartStorageManager = new SmartStorageManager();
    this.backupStatus = new Map(); // Track backup progress
  }

  /**
   * Initialize storage providers
   */
  async initialize() {
    try {
      await this.smartStorageManager.initializeProviders();
      console.log('✅ EventStorageManager initialized');
    } catch (error) {
      console.error('❌ Failed to initialize EventStorageManager:', error);
      throw error;
    }
  }

  /**
   * Backup entire event to Google Drive
   * @param {string} eventId - Event ID to backup
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} Backup result
   */
  async backupEventToGoogleDrive(eventId, options = {}) {
    const backupId = `backup_${eventId}_${Date.now()}`;
    
    try {
      console.log(`🎯 Starting event backup: ${eventId}`);
      
      // Initialize backup status
      this.backupStatus.set(backupId, {
        eventId,
        status: 'initializing',
        startTime: new Date(),
        totalPhotos: 0,
        processedPhotos: 0,
        successfulUploads: 0,
        failedUploads: 0,
        errors: []
      });

      // Get all photos for the event
      const photos = await this.getEventPhotos(eventId);
      
      if (!photos || photos.length === 0) {
        throw new Error(`No photos found for event ${eventId}`);
      }

      console.log(`📊 Found ${photos.length} photos to backup for event ${eventId}`);
      
      // Update status
      const status = this.backupStatus.get(backupId);
      status.totalPhotos = photos.length;
      status.status = 'backing_up';
      this.backupStatus.set(backupId, status);

      // Create event folder in Google Drive
      const eventFolderName = `Event_${eventId}_${new Date().toISOString().split('T')[0]}`;
      const eventFolder = await this.createGoogleDriveFolder(eventFolderName);
      
      console.log(`📁 Created Google Drive folder: ${eventFolderName}`);

      // Backup photos in batches
      const results = await this.backupPhotosInBatches(photos, eventFolder.id, backupId);
      
      // Update final status
      const finalStatus = this.backupStatus.get(backupId);
      finalStatus.status = 'completed';
      finalStatus.endTime = new Date();
      finalStatus.duration = finalStatus.endTime - finalStatus.startTime;
      finalStatus.googleDriveFolderId = eventFolder.id;
      finalStatus.googleDriveFolderUrl = eventFolder.webViewLink;
      this.backupStatus.set(backupId, finalStatus);

      console.log(`✅ Event backup completed: ${eventId}`);
      console.log(`📊 Results: ${finalStatus.successfulUploads}/${finalStatus.totalPhotos} photos backed up`);
      
      return {
        backupId,
        eventId,
        status: 'completed',
        totalPhotos: finalStatus.totalPhotos,
        successfulUploads: finalStatus.successfulUploads,
        failedUploads: finalStatus.failedUploads,
        googleDriveFolderId: eventFolder.id,
        googleDriveFolderUrl: eventFolder.webViewLink,
        duration: finalStatus.duration
      };

    } catch (error) {
      console.error(`❌ Event backup failed for ${eventId}:`, error);
      
      // Update status with error
      const status = this.backupStatus.get(backupId);
      if (status) {
        status.status = 'failed';
        status.error = error.message;
        status.endTime = new Date();
        this.backupStatus.set(backupId, status);
      }
      
      throw error;
    }
  }

  /**
   * Get all photos for an event from database
   */
  async getEventPhotos(eventId) {
    try {
      // Import database here to avoid circular dependencies
      const { smartDatabase } = await import('./database-with-smart-storage');
      const photos = await smartDatabase.getEventPhotos(eventId);
      return photos;
    } catch (error) {
      console.error(`❌ Failed to get photos for event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Create folder in Google Drive with proper hierarchy
   */
  async createGoogleDriveFolder(folderName) {
    try {
      if (!this.smartStorageManager.googleDrive) {
        await this.smartStorageManager.initializeProviders();
      }
      
      // Create folder hierarchy: HafiPortrait-Photos/EventBackups/Event_xxx
      let mainFolderId = null;
      let backupFolderId = null;
      
      try {
        // 1. Ensure main folder exists (HafiPortrait-Photos)
        const mainFolder = await this.smartStorageManager.googleDrive.createFolder(
          this.config.googleDrive.backupFolder
        );
        mainFolderId = mainFolder.id;
        console.log(`✅ Main folder ready: ${this.config.googleDrive.backupFolder}`);
        
        // 2. Ensure EventBackups subfolder exists
        const backupFolder = await this.smartStorageManager.googleDrive.createFolder(
          'EventBackups',
          mainFolderId
        );
        backupFolderId = backupFolder.id;
        console.log(`✅ EventBackups subfolder ready`);
        
      } catch (error) {
        console.log(`⚠️ Folder hierarchy creation failed, using root: ${error.message}`);
        // Continue with root folder
      }
      
      // 3. Create the event-specific folder inside EventBackups
      const folder = await this.smartStorageManager.googleDrive.createFolder(
        folderName,
        backupFolderId || mainFolderId
      );
      
      console.log(`✅ Event folder created: ${this.config.googleDrive.backupFolder}/EventBackups/${folderName}`);
      return folder;
      
    } catch (error) {
      console.error(`❌ Failed to create Google Drive folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Backup photos in batches to prevent overwhelming the API
   */
  async backupPhotosInBatches(photos, folderId, backupId) {
    const batchSize = this.config.googleDrive.maxConcurrentUploads;
    const results = [];
    
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize);
      const batchPromises = batch.map(photo => 
        this.backupSinglePhoto(photo, folderId, backupId)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Update progress
      const status = this.backupStatus.get(backupId);
      status.processedPhotos = i + batch.length;
      this.backupStatus.set(backupId, status);
      
      console.log(`📊 Backup progress: ${status.processedPhotos}/${status.totalPhotos} photos processed`);
      
      // Small delay between batches to be respectful to APIs
      if (i + batchSize < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Backup single photo to Google Drive
   */
  async backupSinglePhoto(photo, folderId, backupId) {
    const status = this.backupStatus.get(backupId);
    
    try {
      // Download photo from current storage
      const photoBuffer = await this.downloadPhotoBuffer(photo);
      
      // Create backup filename
      const backupFileName = `${photo.id}_${photo.original_name || photo.filename}`;
      
      // Upload to Google Drive in the event folder
      const uploadResult = await this.smartStorageManager.googleDrive.uploadToFolder(
        photoBuffer,
        backupFileName,
        folderId,
        {
          description: `Backup of photo ${photo.id} from event ${photo.event_id}`,
          originalUploader: photo.uploader_name,
          albumName: photo.album_name
        }
      );
      
      status.successfulUploads++;
      this.backupStatus.set(backupId, status);
      
      console.log(`✅ Backed up photo: ${backupFileName}`);
      return { success: true, photo: photo.id, result: uploadResult };
      
    } catch (error) {
      console.error(`❌ Failed to backup photo ${photo.id}:`, error);
      
      status.failedUploads++;
      status.errors.push({
        photoId: photo.id,
        error: error.message
      });
      this.backupStatus.set(backupId, status);
      
      return { success: false, photo: photo.id, error: error.message };
    }
  }

  /**
   * Download photo buffer from current storage location
   * PRIORITY: Get original quality from R2, not compressed version
   */
  async downloadPhotoBuffer(photo) {
    try {
      console.log(`📥 Downloading photo ${photo.id} from ${photo.storage_provider}:`, {
        storage_path: photo.storage_path,
        storage_file_id: photo.storage_file_id,
        url: photo.url
      });

      // PRIORITY 1: Download ORIGINAL from Cloudflare R2 (highest quality)
      if (photo.storage_provider === 'cloudflare-r2' && photo.storage_path) {
        console.log(`📥 Downloading ORIGINAL from R2: ${photo.storage_path}`);
        return await this.smartStorageManager.cloudflareR2.downloadPhoto(photo.storage_path);
      }
      
      // PRIORITY 2: Download from Google Drive if stored there
      else if (photo.storage_provider === 'google-drive' && photo.storage_file_id) {
        console.log(`📥 Downloading from Google Drive: ${photo.storage_file_id}`);
        return await this.smartStorageManager.googleDrive.downloadPhoto(photo.storage_file_id);
      }
      
      // PRIORITY 3: Local storage
      else if (photo.storage_provider === 'local' && photo.storage_path) {
        console.log(`📥 Downloading from local: ${photo.storage_path}`);
        const fs = require('fs').promises;
        return await fs.readFile(photo.storage_path);
      }
      
      // LAST RESORT: Download from public URL (may be compressed)
      else if (photo.url) {
        console.log(`⚠️ FALLBACK: Downloading from public URL (may be compressed): ${photo.url}`);
        const response = await fetch(photo.url);
        if (!response.ok) {
          throw new Error(`Failed to download from URL: ${response.statusText}`);
        }
        return Buffer.from(await response.arrayBuffer());
      }
      
      else {
        throw new Error(`No valid storage location found for photo ${photo.id}. Provider: ${photo.storage_provider}, Path: ${photo.storage_path}, FileId: ${photo.storage_file_id}, URL: ${photo.url}`);
      }
    } catch (error) {
      console.error(`❌ Failed to download photo ${photo.id}:`, error);
      throw error;
    }
  }

  /**
   * Get backup status for an event (with database fallback)
   */
  async getBackupStatus(backupId) {
    // First check in-memory cache
    const memoryStatus = this.backupStatus.get(backupId);
    if (memoryStatus) {
      return memoryStatus;
    }

    // Fallback to database lookup
    try {
      const { smartDatabase } = await import('./database-with-smart-storage');
      const { supabaseAdmin } = await import('./supabase');
      
      const { data: events, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .eq('backup_id', backupId)
        .limit(1);
      
      if (error) {
        console.warn('Database query error:', error);
        return null;
      }
      
      if (events && events.length > 0) {
        const eventData = events[0];
        return {
          backupId,
          eventId: eventData.id,
          status: eventData.is_archived ? 'completed' : 'unknown',
          googleDriveFolderId: eventData.google_drive_backup_url ? 'archived' : null,
          googleDriveFolderUrl: eventData.google_drive_backup_url,
          archivedAt: eventData.archived_at
        };
      }
    } catch (error) {
      console.warn('Failed to get backup status from database:', error);
    }

    return null;
  }

  /**
   * Get all backup statuses (with database fallback)
   */
  async getAllBackupStatuses() {
    // Get in-memory statuses
    const memoryStatuses = Array.from(this.backupStatus.entries()).map(([id, status]) => ({
      backupId: id,
      ...status
    }));

    // Get archived events from database
    try {
      const { supabaseAdmin } = await import('./supabase');
      
      const { data: archivedEvents, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .not('backup_id', 'is', null)
        .order('archived_at', { ascending: false });
      
      if (error) {
        console.warn('Database query error:', error);
        return memoryStatuses;
      }
      
      const dbStatuses = (archivedEvents || []).map(event => ({
        backupId: event.backup_id,
        eventId: event.id,
        status: event.is_archived ? 'completed' : 'unknown',
        googleDriveFolderId: event.google_drive_backup_url ? 'archived' : null,
        googleDriveFolderUrl: event.google_drive_backup_url,
        archivedAt: event.archived_at
      }));

      // Combine and deduplicate
      const allStatuses = [...memoryStatuses];
      dbStatuses.forEach(dbStatus => {
        if (!allStatuses.find(s => s.backupId === dbStatus.backupId)) {
          allStatuses.push(dbStatus);
        }
      });

      return allStatuses;
    } catch (error) {
      console.warn('Failed to get backup statuses from database:', error);
      return memoryStatuses;
    }
  }

  /**
   * Archive event after successful backup
   */
  async archiveEvent(eventId, backupId) {
    try {
      console.log(`🗄️ Archiving event ${eventId} after backup ${backupId}`);
      
      const backupStatus = await this.getBackupStatus(backupId);
      if (!backupStatus || backupStatus.status !== 'completed') {
        throw new Error('Cannot archive event: backup not completed successfully');
      }
      
      // Mark event as archived in database
      const { smartDatabase } = await import('./database-with-smart-storage');
      await smartDatabase.updateEvent(eventId, { 
        is_archived: true,
        archived_at: new Date().toISOString(),
        backup_id: backupId,
        google_drive_backup_url: backupStatus.googleDriveFolderUrl
      });
      
      console.log(`✅ Event ${eventId} archived successfully`);
      
      return {
        eventId,
        archived: true,
        backupId,
        googleDriveUrl: backupStatus.googleDriveFolderUrl
      };
      
    } catch (error) {
      console.error(`❌ Failed to archive event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old backup statuses
   */
  cleanupOldBackupStatuses(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [backupId, status] of this.backupStatus.entries()) {
      if (status.startTime < cutoff) {
        this.backupStatus.delete(backupId);
      }
    }
  }
}

module.exports = EventStorageManager;