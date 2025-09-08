/**
 * Database Service with Smart Storage Integration
 * Extends the existing database service to use Smart Storage Manager
 */

import { database as originalDatabase, Photo } from './database';
import { storageAdapter, PhotoMetadata } from './storage-adapter';
import { supabaseAdmin } from './supabase';

class DatabaseWithSmartStorage {
  private supabase = supabaseAdmin;

  /**
   * Upload event photo using Smart Storage Manager
   */
  async uploadEventPhoto(
    eventId: string, 
    file: File, 
    uploaderName: string = 'Anonymous', 
    albumName: string = 'Tamu'
  ): Promise<Photo> {
    // Validate eventId exists
    await originalDatabase.validateEventAccess(eventId);

    // Validate file extension
    if (!this.validateFileExtension(file.name)) {
      throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp');
    }

    try {
      // Prepare metadata for Smart Storage Manager
      const metadata: PhotoMetadata = {
        eventId,
        albumName,
        uploaderName,
        isHomepage: false,
        isPremium: albumName === 'Official', // Official album gets premium treatment
        isFeatured: albumName === 'Official',
        fileSize: file.size,
        eventType: 'wedding', // Could be dynamic based on event
        fileType: file.type
      };

      console.log(`🎯 Uploading event photo via Smart Storage Manager`);
      console.log(`📊 Event: ${eventId}, Album: ${albumName}, Uploader: ${uploaderName}`);

      // Upload using Smart Storage Manager
      const uploadResult = await storageAdapter.uploadPhoto(file, metadata);

      console.log(`✅ Smart Storage upload successful:`, {
        tier: uploadResult.tier,
        storage: uploadResult.storage,
        compression: uploadResult.compressionUsed
      });

      // Save to database with Smart Storage information
      const { data: photoData, error: insertError } = await this.supabase
        .from('photos')
        .insert({ 
          event_id: eventId,
          url: uploadResult.url,
          thumbnail_url: uploadResult.thumbnailUrl,
          original_name: file.name,
          uploader_name: uploaderName,
          album_name: albumName,
          is_homepage: false,
          filename: this.generateFileName(file.name),
          // Store Smart Storage metadata
          storage_tier: uploadResult.tier,
          storage_provider: uploadResult.storage,
          compression_used: uploadResult.compressionUsed,
          file_size: uploadResult.size,
          storage_path: uploadResult.path,
          storage_etag: uploadResult.etag,
          storage_file_id: uploadResult.fileId
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database insert failed:', insertError);
        throw insertError;
      }

      console.log(`✅ Photo saved to database with Smart Storage metadata`);
      return photoData;

    } catch (error) {
      console.error('❌ Smart Storage upload failed:', error);
      
      // Fallback to original upload method if Smart Storage fails
      console.log('🔄 Falling back to original upload method...');
      try {
        return await originalDatabase.uploadEventPhoto(eventId, file, uploaderName, albumName);
      } catch (fallbackError) {
        console.error('❌ Fallback upload also failed:', fallbackError);
        throw new Error(`Both Smart Storage and fallback upload failed. Last error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Upload homepage photo using Smart Storage Manager
   */
  async uploadHomepagePhoto(file: File): Promise<Photo> {
    // Validate file extension
    if (!this.validateFileExtension(file.name)) {
      throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp');
    }

    try {
      // Prepare metadata for Smart Storage Manager
      const metadata: PhotoMetadata = {
        albumName: 'Homepage',
        uploaderName: 'Admin',
        isHomepage: true,
        isPremium: true, // Homepage photos get premium treatment
        isFeatured: true,
        fileSize: file.size,
        eventType: 'homepage',
        fileType: file.type
      };

      console.log(`🎯 Uploading homepage photo via Smart Storage Manager`);

      // Upload using Smart Storage Manager
      const uploadResult = await storageAdapter.uploadPhoto(file, metadata);

      console.log(`✅ Smart Storage homepage upload successful:`, {
        tier: uploadResult.tier,
        storage: uploadResult.storage,
        compression: uploadResult.compressionUsed
      });

      // Save to database with Smart Storage information
      const { data: photoData, error: insertError } = await this.supabase
        .from('photos')
        .insert({ 
          url: uploadResult.url,
          thumbnail_url: uploadResult.thumbnailUrl,
          original_name: file.name,
          is_homepage: true,
          event_id: null,
          uploader_name: 'Admin',
          album_name: 'Homepage',
          filename: this.generateFileName(file.name),
          // Store Smart Storage metadata
          storage_tier: uploadResult.tier,
          storage_provider: uploadResult.storage,
          compression_used: uploadResult.compressionUsed,
          file_size: uploadResult.size,
          storage_path: uploadResult.path,
          storage_etag: uploadResult.etag,
          storage_file_id: uploadResult.fileId
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Database insert failed:', insertError);
        throw insertError;
      }

      console.log(`✅ Homepage photo saved to database with Smart Storage metadata`);
      return photoData;

    } catch (error) {
      console.error('❌ Smart Storage homepage upload failed:', error);
      
      // Fallback to original upload method if Smart Storage fails
      console.log('🔄 Falling back to original upload method...');
      try {
        return await originalDatabase.uploadHomepagePhoto(file);
      } catch (fallbackError) {
        console.error('❌ Fallback upload also failed:', fallbackError);
        throw new Error(`Both Smart Storage and fallback upload failed. Last error: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Get storage analytics and statistics
   */
  async getStorageAnalytics(): Promise<any> {
    try {
      // Get Smart Storage report
      const storageReport = await storageAdapter.getStorageReport();
      
      // Get database statistics
      const { data: photos, error } = await this.supabase
        .from('photos')
        .select('storage_tier, storage_provider, file_size, compression_used, uploaded_at')
        .not('storage_tier', 'is', null);

      if (error) {
        console.warn('⚠️ Could not fetch storage analytics from database:', error);
      }

      // Analyze photo distribution by tier
      const tierStats = photos?.reduce((acc: any, photo: any) => {
        const tier = photo.storage_tier || 'unknown';
        if (!acc[tier]) {
          acc[tier] = { count: 0, totalSize: 0 };
        }
        acc[tier].count++;
        acc[tier].totalSize += photo.file_size || 0;
        return acc;
      }, {}) || {};

      return {
        storageReport,
        tierStats,
        totalPhotosWithSmartStorage: photos?.length || 0,
        recentUploads: photos?.slice(0, 10) || []
      };
    } catch (error) {
      console.error('❌ Error getting storage analytics:', error);
      throw error;
    }
  }

  /**
   * Cleanup old files across all storage tiers
   */
  async cleanupOldFiles(retentionDays: number = 30): Promise<void> {
    await storageAdapter.cleanupOldFiles(retentionDays);
  }

  // Helper methods
  private validateFileExtension(filename: string): boolean {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext ? allowedExtensions.includes(ext) : false;
  }

  private generateFileName(originalName: string): string {
    const fileExt = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${randomStr}.${fileExt}`;
  }

  // Delegate all other methods to original database
  getAllEvents = originalDatabase.getAllEvents.bind(originalDatabase);
  getPublicEvents = originalDatabase.getPublicEvents.bind(originalDatabase);
  getEventById = originalDatabase.getEventById.bind(originalDatabase);
  createEvent = originalDatabase.createEvent.bind(originalDatabase);
  updateEvent = originalDatabase.updateEvent.bind(originalDatabase);
  deleteEvent = originalDatabase.deleteEvent.bind(originalDatabase);
  verifyEventAccessCode = originalDatabase.verifyEventAccessCode.bind(originalDatabase);
  getEventPhotos = originalDatabase.getEventPhotos.bind(originalDatabase);
  getHomepagePhotos = originalDatabase.getHomepagePhotos.bind(originalDatabase);
  getPhotoById = originalDatabase.getPhotoById.bind(originalDatabase);
  deletePhoto = originalDatabase.deletePhoto.bind(originalDatabase);
  likePhoto = originalDatabase.likePhoto.bind(originalDatabase);
  getEventMessages = originalDatabase.getEventMessages.bind(originalDatabase);
  createMessage = originalDatabase.createMessage.bind(originalDatabase);
  heartMessage = originalDatabase.heartMessage.bind(originalDatabase);
  getMessageById = originalDatabase.getMessageById.bind(originalDatabase);
  updateMessageHearts = originalDatabase.updateMessageHearts.bind(originalDatabase);
  addMessageReaction = originalDatabase.addMessageReaction.bind(originalDatabase);
  updateMessageReactions = originalDatabase.updateMessageReactions.bind(originalDatabase);
  getStats = originalDatabase.getStats.bind(originalDatabase);
  getEvents = originalDatabase.getEvents.bind(originalDatabase);
  getSimpleCompressionAnalytics = originalDatabase.getSimpleCompressionAnalytics.bind(originalDatabase);
  validateEventAccess = originalDatabase.validateEventAccess.bind(originalDatabase);
}

// Export the enhanced database service
export const smartDatabase = new DatabaseWithSmartStorage();