import { supabaseAdmin } from './supabase';
import { ImageOptimizerServer } from './image-optimizer-server';
import { getAppBaseUrl } from './app-config';

// Definisi Tipe Data untuk konsistensi
export type Event = {
  id: string;
  name: string;
  date: string;
  access_code: string | null;
  is_premium: boolean;
  qr_code: string | null;
  shareable_link: string | null;
  status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled' | 'archived';
  is_archived?: boolean;
  archived_at?: string;
  backup_id?: string | null;
  google_drive_backup_url?: string;
  participant_count?: number;
  photo_count?: number;
  message_count?: number;
  last_activity?: string;
};

export type Photo = {
  id: string;
  event_id?: string | null; // Opsional karena bisa jadi foto homepage
  url: string;
  thumbnail_url: string | null;
  uploaded_at: string;
  is_homepage: boolean | null; // Tambahkan ini jika belum ada
  original_name: string;
  uploader_name?: string | null;
  album_name?: string | null;
  filename?: string | null; // Tambahkan filename jika required
  optimized_images?: OptimizedImages | null;
  image_metadata?: ImageMetadata | null;
  compression_stats?: CompressionStats | null;
  likes?: number;
  // Add missing fields for file manager
  file_size?: number;
  storage_path?: string | null;
  storage_tier?: string | null;
  storage_provider?: string | null;
  compression_used?: boolean | null;
  event_name?: string | null; // For join queries
  // Add archive fields
  is_archived?: boolean | null;
  archived_at?: string | null;
  // Add Google Drive backup for original photos
  google_drive_backup_url?: string | null;
  original_file_size?: number;
  // Add MISSING ORIGINAL FILE FIELDS from actual database schema
  original_backup_file_id?: string | null; // Google Drive file ID for original backup
  storage_file_id?: string | null; // Storage file ID for Google Drive
  original_file_id?: string | null; // Alternative original file ID
  original_url?: string | null; // Direct URL for original quality
  original_size?: number | null; // Original file size before compression
  web_url?: string | null; // Web-optimized URL
  is_original_available?: boolean | null; // Whether original is available for download
  storage_etag?: string | null; // Storage ETag
  photo_counter?: string | null; // Photo counter
};

export type OptimizedImages = {
  original: { url: string; size: number; width?: number; height?: number; };
  thumbnail: { url: string; size: number; };
  small: { url: string; size: number; };
  medium: { url: string; size: number; };
  large: { url: string; size: number; };
};

export type ImageMetadata = {
  width: number;
  height: number;
  format: string;
  original_size: number;
};

export type CompressionStats = {
  original_size: string;
  optimized_size: string;
  savings: number;
  ratio: string;
};

export type MessageReactions = {
  love: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
};

export type Message = {
  id: string;
  event_id: string;
  sender_name?: string; // Make optional for compatibility
  content?: string; // Make optional for compatibility
  guest_name?: string; // Database field
  message?: string; // Database field
  sent_at?: string; // Make optional for compatibility
  created_at?: string; // Database field
  hearts: number;
  reactions?: MessageReactions;
};

export type Stats = {
  totalEvents: number;
  totalPhotos: number;
  totalMessages: number;
};

class DatabaseService {
  private supabase: typeof supabaseAdmin;
  private imageOptimizer: ImageOptimizerServer;

  constructor() {
    this.supabase = supabaseAdmin;
    this.imageOptimizer = new ImageOptimizerServer(this.supabase, 'photos');
  }

  // --- Metode Event ---
  async getAllEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getPublicEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('id, name, date, access_code, is_premium, qr_code, shareable_link, status, is_archived, photo_count')
      .is('is_premium', false) // Asumsi hanya event non-premium yang publik, sesuaikan jika perlu
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getEventById(id: string): Promise<Event | null> {
    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async createEvent(event: Omit<Event, 'id' | 'qr_code' | 'shareable_link'>): Promise<Event> {
    // First, insert the event to get the ID
    const { data: newEvent, error } = await this.supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    
    if (error) throw error;
    
    try {
      // Generate QR code and shareable link using centralized config
      // Use the centralized app config for consistent URL generation
      const baseUrl = getAppBaseUrl();
      const eventUrl = `${baseUrl}/event/${newEvent.id}?code=${newEvent.access_code}`;
      
      // Generate QR code using a service like QRServer.com
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}`;
      
      // Update the event with QR code and shareable link
      const { data: updatedEvent, error: updateError } = await this.supabase
        .from('events')
        .update({
          qr_code: qrCodeUrl,
          shareable_link: eventUrl
        })
        .eq('id', newEvent.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      return updatedEvent;
    } catch (updateError) {
      console.error('Error generating QR code:', updateError);
      // Return the event even if QR code generation fails
      return newEvent;
    }
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    const { data, error } = await this.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async deleteEvent(id: string): Promise<void> {
    try {
      // First, get all photos for this event to delete from storage
      const { data: eventPhotos, error: photosError } = await this.supabase
        .from('photos')
        .select('*')
        .eq('event_id', id);

      if (photosError) {
        console.error('Error fetching event photos for deletion:', photosError);
        // Continue with deletion even if we can't fetch photos
      }

      // Delete photos from storage first using bulk operations
      if (eventPhotos && eventPhotos.length > 0) {
        await this.bulkDeletePhotos(eventPhotos.map(p => p.id));
      }

      // Delete all messages for this event
      const { error: messagesError } = await this.supabase
        .from('messages')
        .delete()
        .eq('event_id', id);

      if (messagesError) {
        console.error('Error deleting event messages:', messagesError);
        // Continue with event deletion even if message deletion fails
      }

      // Delete any remaining photos from database (in case storage deletion failed)
      const { error: remainingPhotosError } = await this.supabase
        .from('photos')
        .delete()
        .eq('event_id', id);

      if (remainingPhotosError) {
        console.error('Error deleting remaining event photos:', remainingPhotosError);
        // Continue with event deletion
      }

      // Finally, delete the event itself
      const { error: eventError } = await this.supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (eventError) throw eventError;

      console.log(`Event ${id} and all related data deleted successfully`);
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      throw error;
    }
  }

  // --- Event Status Management Methods ---
  async updateEventStatus(id: string, status: string): Promise<Event> {
    const updates: any = { status };
    
    // Add timestamp for specific status changes
    if (status === 'archived') {
      updates.is_archived = true;
      updates.archived_at = new Date().toISOString();
    } else if (status === 'active' && updates.is_archived) {
      updates.is_archived = false;
      updates.archived_at = null;
    }

    const { data, error } = await this.supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getEventWithStats(id: string): Promise<Event | null> {
    // Create a PostgreSQL function to get all stats in one query
    // This eliminates the N+1 query problem by doing all calculations server-side
    const { data, error } = await this.supabase
      .rpc('get_event_with_stats', { event_id: id });

    if (error) {
      // Fallback to original method if RPC function doesn't exist yet
      console.warn('RPC function not available, using fallback method');
      return this.getEventWithStatsLegacy(id);
    }

    return data?.[0] || null;
  }

  // Legacy method kept as fallback - will be removed after RPC function is deployed
  private async getEventWithStatsLegacy(id: string): Promise<Event | null> {
    // Get basic event data
    const { data: event, error: eventError } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError) throw eventError;
    if (!event) return null;

    // Use Promise.all to run queries in parallel instead of sequentially
    const [
      { count: photoCount },
      { count: messageCount },
      { data: lastPhoto },
      { data: lastMessage },
      { data: uploaders },
      { data: messageSenders }
    ] = await Promise.all([
      this.supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id),
      this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', id),
      this.supabase
        .from('photos')
        .select('uploaded_at')
        .eq('event_id', id)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      this.supabase
        .from('messages')
        .select('created_at')
        .eq('event_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      this.supabase
        .from('photos')
        .select('uploader_name')
        .eq('event_id', id)
        .not('uploader_name', 'is', null),
      this.supabase
        .from('messages')
        .select('guest_name')
        .eq('event_id', id)
        .not('guest_name', 'is', null)
    ]);

    // Determine last activity
    let lastActivity = null;
    if (lastPhoto && lastMessage) {
      lastActivity = new Date(lastPhoto.uploaded_at) > new Date(lastMessage.created_at) 
        ? lastPhoto.uploaded_at 
        : lastMessage.created_at;
    } else if (lastPhoto) {
      lastActivity = lastPhoto.uploaded_at;
    } else if (lastMessage) {
      lastActivity = lastMessage.created_at;
    }

    // Get unique participant count
    const uniqueParticipants = new Set([
      ...(uploaders?.map(u => u.uploader_name) || []),
      ...(messageSenders?.map(m => m.guest_name) || [])
    ]);

    return {
      ...event,
      photo_count: photoCount || 0,
      message_count: messageCount || 0,
      participant_count: uniqueParticipants.size,
      last_activity: lastActivity
    };
  }

  async verifyEventAccessCode(eventId: string, code: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .eq('access_code', code)
      .single();
    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error verifying access code:', error);
      }
      return false;
    }
    return !!data;
  }

  // --- Metode Foto ---
  async getAllPhotos(): Promise<Photo[]> {
    const { data, error } = await this.supabase
      .from('photos')
      .select(`
        *,
        events (
          name
        )
      `)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data to include event_name
    return data?.map(photo => ({
      ...photo,
      event_name: photo.events?.name || null
    })) || [];
  }

  async getEventPhotos(eventId: string): Promise<Photo[]> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async getHomepagePhotos(): Promise<Photo[]> {
    try {
      const { data, error } = await this.supabase
        .from('photos')
        .select('id, url, thumbnail_url, original_name, optimized_images, uploaded_at') // Add uploaded_at yang dibutuhkan untuk order
        .eq('is_homepage', true)
        .or('is_archived.is.null,is_archived.eq.false') // Only non-archived photos
        .order('uploaded_at', { ascending: false })
        .limit(20); // Increase limit untuk show more photos
      
      if (error) {
        console.error('Database Error in getHomepagePhotos:', error);
        // Return empty array instead of throwing to prevent homepage crash
        return [];
      }
      
      console.log(`📸 getHomepagePhotos: Found ${data?.length || 0} homepage photos`);
      return (data || []).map((photo: any) => ({
        ...photo,
        is_homepage: photo.is_homepage ?? true
      }));
    } catch (error) {
      console.error('Error in getHomepagePhotos:', error);
      // Graceful fallback - return empty array to prevent homepage crash
      return [];
    }
  }

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

  async getEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('id, name, date, access_code, is_premium, qr_code, shareable_link, status')
      .order('date', { ascending: false })
      .limit(10); // Only fetch 10 recent events for homepage
    
    if (error) throw error;
    return data || [];
  }

  // Lightweight version for homepage
  async getHomepageEvents(): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from('events')
      .select('id, name, date, is_premium, status')
      .order('date', { ascending: false })
      .limit(6); // Only 6 events for homepage
    
    if (error) throw error;
    return (data || []).map((event: any) => ({
      ...event,
      access_code: event.access_code || '',
      qr_code: event.qr_code || '',
      shareable_link: event.shareable_link || ''
    }));
  }

  async getSimpleCompressionAnalytics() {
    try {
      // Get photos with compression data (simplified version)
      const { data: photos, error: photosError } = await this.supabase
        .from('photos')
        .select('*')
        .not('optimized_images', 'is', null)
        .order('uploaded_at', { ascending: false })
        .limit(100); // Limit to recent 100 photos

      if (photosError) throw photosError;

      // Calculate simple analytics
      const totalPhotos = photos?.length || 0;
      let totalOriginalSize = 0;
      let totalOptimizedSize = 0;
      let totalSavingsBytes = 0;

      const recentPhotos: any[] = [];

      photos?.forEach(photo => {
        if (photo.image_metadata && photo.optimized_images) {
          const originalSize = photo.image_metadata.original_size || 0;
          const optimizedSize = photo.optimized_images.medium?.size || 0;
          const savings = originalSize - optimizedSize;
          const savingsPercentage = originalSize > 0 ? (savings / originalSize) * 100 : 0;

          totalOriginalSize += originalSize;
          totalOptimizedSize += optimizedSize;
          totalSavingsBytes += savings;

          // Recent photos (top 10)
          if (recentPhotos.length < 10) {
            recentPhotos.push({
              id: photo.id,
              original_name: photo.original_name,
              original_size: originalSize,
              optimized_size: optimizedSize,
              savings_percentage: savingsPercentage,
              uploaded_at: photo.uploaded_at
            });
          }
        }
      });

      const totalSavingsPercentage = totalOriginalSize > 0 ? (totalSavingsBytes / totalOriginalSize) * 100 : 0;
      const averageCompressionRatio = totalOptimizedSize > 0 ? totalOriginalSize / totalOptimizedSize : 1;

      return {
        totalPhotos,
        totalOriginalSize,
        totalOptimizedSize,
        totalSavingsBytes,
        totalSavingsPercentage,
        storageSaved: this.formatFileSize(totalSavingsBytes),
        averageCompressionRatio,
        recentPhotos: recentPhotos.sort((a, b) => b.savings_percentage - a.savings_percentage)
      };
    } catch (error) {
      console.error('Error getting simple compression analytics:', error);
      throw error;
    }
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async validateEventAccess(eventId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('events')
      .select('id, is_premium')
      .eq('id', eventId)
      .single();
    
    if (error || !data) {
      throw new Error('Event not found');
    }
    return true;
  }

  async uploadEventPhoto(eventId: string, file: File, uploaderName: string = 'Anonymous', albumName: string = 'Tamu'): Promise<Photo> {
    // Validate eventId exists
    await this.validateEventAccess(eventId);

    // Validate file extension
    if (!this.validateFileExtension(file.name)) {
      throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp');
    }

    try {
      // Convert File to Buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalFileSize = buffer.length;
      
      console.log(`📸 Processing upload: ${file.name} (${this.formatFileSize(originalFileSize)})`);
      
      // Process image with optimization (server-side)
      const optimizedImages = await this.imageOptimizer.processImage(buffer, file.name, `events/${eventId}`);
      
      // Get image metadata
      const sharp = await import('sharp');
      const metadata = await sharp.default(buffer).metadata();
      
      const imageMetadata = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        original_size: originalFileSize
      };

      // Calculate compression stats
      const compressionStats = ImageOptimizerServer.getCompressionStats(optimizedImages);

      // Initialize Google Drive backup
      let googleDriveBackupUrl = null;
      try {
        console.log('☁️ Starting Google Drive backup...');
        const GoogleDriveStorage = require('./google-drive-storage.js');
        const gdStorage = new GoogleDriveStorage();
        
        // Create backup file name
        const backupFileName = `backup_${this.generateFileName(file.name)}`;
        const backupPath = `Events/${eventId}/${albumName}/${backupFileName}`;
        
        // Upload to Google Drive (async, non-blocking)
        googleDriveBackupUrl = await gdStorage.uploadFile(buffer, backupPath, {
          name: backupFileName,
          parents: [`Events/${eventId}/${albumName}`]
        });
        
        console.log(`✅ Google Drive backup completed: ${googleDriveBackupUrl}`);
      } catch (backupError) {
        console.error('⚠️ Google Drive backup failed:', backupError);
        // Continue with upload even if backup fails
        console.log('📤 Continuing upload without backup...');
      }

      const { data: photoData, error: insertError } = await this.supabase
        .from('photos')
        .insert({ 
          event_id: eventId,
          url: optimizedImages.original.url, // Keep original URL for backward compatibility
          thumbnail_url: optimizedImages.thumbnail.url,
          original_name: file.name,
          uploader_name: uploaderName,
          album_name: albumName,
          is_homepage: false,
          filename: this.generateFileName(file.name),
          optimized_images: optimizedImages,
          image_metadata: imageMetadata,
          compression_stats: compressionStats,
          // Add Google Drive backup fields
          google_drive_backup_url: googleDriveBackupUrl,
          original_file_size: originalFileSize,
          storage_provider: 'cloudflare-r2', // Set explicit storage provider
          storage_path: optimizedImages.original.url.split('/').slice(-4).join('/') // Extract path from URL
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      console.log(`✅ Photo uploaded successfully: ${photoData.id}`);
      console.log(`📊 Original: ${this.formatFileSize(originalFileSize)} → Optimized: ${this.formatFileSize(optimizedImages.original.size)}`);
      if (googleDriveBackupUrl) {
        console.log(`☁️ Backup URL: ${googleDriveBackupUrl}`);
      }
      
      return photoData;
    } catch (error) {
      console.error('Error uploading optimized event photo:', error);
      throw error;
    }
  }

  async uploadHomepagePhoto(file: File): Promise<Photo> {
    // Validate file extension
    if (!this.validateFileExtension(file.name)) {
      throw new Error('Invalid file type. Allowed: jpg, jpeg, png, gif, webp');
    }

    try {
      // Convert File to Buffer for server-side processing
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const originalFileSize = buffer.length;
      
      console.log(`🏠 Processing homepage upload: ${file.name} (${this.formatFileSize(originalFileSize)})`);
      
      // Process image with optimization (server-side)
      const optimizedImages = await this.imageOptimizer.processImage(buffer, file.name, 'homepage');
      
      // Get image metadata
      const sharp = await import('sharp');
      const metadata = await sharp.default(buffer).metadata();
      
      const imageMetadata = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        original_size: originalFileSize
      };

      // Calculate compression stats
      const compressionStats = ImageOptimizerServer.getCompressionStats(optimizedImages);

      // Initialize Google Drive backup for homepage photos
      let googleDriveBackupUrl = null;
      try {
        console.log('☁️ Starting Google Drive backup for homepage photo...');
        const GoogleDriveStorage = require('./google-drive-storage.js');
        const gdStorage = new GoogleDriveStorage();
        
        // Create backup file name
        const backupFileName = `homepage_backup_${this.generateFileName(file.name)}`;
        const backupPath = `Homepage/${backupFileName}`;
        
        // Upload to Google Drive (async, non-blocking)
        googleDriveBackupUrl = await gdStorage.uploadFile(buffer, backupPath, {
          name: backupFileName,
          parents: ['Homepage']
        });
        
        console.log(`✅ Google Drive backup completed: ${googleDriveBackupUrl}`);
      } catch (backupError) {
        console.error('⚠️ Google Drive backup failed:', backupError);
        // Continue with upload even if backup fails
        console.log('📤 Continuing homepage upload without backup...');
      }

      const { data: photoData, error: insertError } = await this.supabase
        .from('photos')
        .insert({ 
          url: optimizedImages.original.url, // Keep original URL for backward compatibility
          thumbnail_url: optimizedImages.thumbnail.url,
          original_name: file.name,
          is_homepage: true,
          event_id: null,
          uploader_name: 'Admin',
          album_name: 'Homepage',
          filename: this.generateFileName(file.name),
          optimized_images: optimizedImages,
          image_metadata: imageMetadata,
          compression_stats: compressionStats,
          // Add Google Drive backup fields
          google_drive_backup_url: googleDriveBackupUrl,
          original_file_size: originalFileSize,
          storage_provider: 'cloudflare-r2', // Set explicit storage provider
          storage_path: optimizedImages.original.url.split('/').slice(-2).join('/') // Extract path from URL
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      console.log(`✅ Homepage photo uploaded successfully: ${photoData.id}`);
      console.log(`📊 Original: ${this.formatFileSize(originalFileSize)} → Optimized: ${this.formatFileSize(optimizedImages.original.size)}`);
      if (googleDriveBackupUrl) {
        console.log(`☁️ Backup URL: ${googleDriveBackupUrl}`);
      }
      
      return photoData;
    } catch (error) {
      console.error('Error uploading optimized homepage photo:', error);
      throw error;
    }
  }


  async getPhotoById(photoId: string): Promise<Photo | null> {
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async bulkDeletePhotos(photoIds: string[]): Promise<void> {
    if (!photoIds || photoIds.length === 0) return;

    try {
      console.log(`🗑️ Starting bulk delete for ${photoIds.length} photos`);
      
      // Get all photos data first
      const { data: photos, error: fetchError } = await this.supabase
        .from('photos')
        .select('*')
        .in('id', photoIds);

      if (fetchError) throw fetchError;
      if (!photos || photos.length === 0) return;

      // Group photos by storage provider for efficient bulk operations
      const r2Photos: Photo[] = [];
      const supabasePhotos: Photo[] = [];

      photos.forEach(photo => {
        if (photo.storage_provider === 'cloudflare-r2') {
          r2Photos.push(photo);
        } else {
          supabasePhotos.push(photo);
        }
      });

      // Bulk delete from Cloudflare R2
      if (r2Photos.length > 0) {
        await this.bulkDeleteFromR2(r2Photos);
      }

      // Bulk delete from Supabase Storage
      if (supabasePhotos.length > 0) {
        await this.bulkDeleteFromSupabaseStorage(supabasePhotos);
      }

      // Delete all records from database in one operation
      const { error: deleteDbError } = await this.supabase
        .from('photos')
        .delete()
        .in('id', photoIds);

      if (deleteDbError) throw deleteDbError;
      
      console.log(`✅ Bulk deleted ${photoIds.length} photos successfully`);
    } catch (error) {
      console.error(`❌ Error in bulk delete:`, error);
      throw error;
    }
  }

  private async bulkDeleteFromR2(photos: Photo[]): Promise<void> {
    if (photos.length === 0) return;

    try {
      const { S3Client, DeleteObjectsCommand } = await import('@aws-sdk/client-s3');
      
      const r2Client = new S3Client({
        region: 'auto',
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
        },
      });

      // Prepare objects for bulk deletion (max 1000 per request)
      const objects = photos.map(photo => ({
        Key: photo.storage_path || this.constructFilePath(photo)
      }));

      // Split into chunks of 1000 (AWS S3/R2 limit)
      const chunks = [];
      for (let i = 0; i < objects.length; i += 1000) {
        chunks.push(objects.slice(i, i + 1000));
      }

      // Delete each chunk
      for (const chunk of chunks) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
          Delete: {
            Objects: chunk,
            Quiet: true // Don't return deleted object info to reduce response size
          }
        });

        await r2Client.send(deleteCommand);
        console.log(`✅ Bulk deleted ${chunk.length} files from R2`);
      }
    } catch (error) {
      console.error(`❌ Error bulk deleting from R2:`, error);
      throw error;
    }
  }

  private async bulkDeleteFromSupabaseStorage(photos: Photo[]): Promise<void> {
    if (photos.length === 0) return;

    try {
      const filePaths = photos.map(photo => {
        if (photo.filename) {
          if (photo.is_homepage) {
            return `homepage/${photo.filename}`;
          } else if (photo.event_id) {
            return `events/${photo.event_id}/${photo.filename}`;
          } else {
            return photo.filename;
          }
        } else {
          const urlParts = photo.url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          if (photo.is_homepage) {
            return `homepage/${fileName}`;
          } else if (photo.event_id) {
            return `events/${photo.event_id}/${fileName}`;
          } else {
            return fileName;
          }
        }
      });

      console.log(`🗄️ Bulk deleting ${filePaths.length} files from Supabase Storage`);

      const { error: deleteStorageError } = await this.supabase.storage
        .from('photos')
        .remove(filePaths);

      if (deleteStorageError) {
        console.error('Error bulk deleting from Supabase storage:', deleteStorageError);
        throw deleteStorageError;
      }
      
      console.log(`✅ Successfully bulk deleted from Supabase storage`);
    } catch (error) {
      console.error(`❌ Error bulk deleting from Supabase storage:`, error);
      throw error;
    }
  }

  async deletePhoto(photoId: string): Promise<void> {
    // Get photo details
    const photo = await this.getPhotoById(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    try {
      console.log(`🗑️ Starting delete process for photo: ${photo.id}`);
      console.log(`📁 Storage provider: ${photo.storage_provider || 'unknown'}`);
      console.log(`📂 Storage path: ${photo.storage_path || 'N/A'}`);

      // Delete from storage first based on storage provider
      if (photo.storage_provider === 'cloudflare-r2') {
        await this.deleteFromCloudflareR2(photo);
      } else {
        // Fallback to Supabase storage for older photos
        await this.deleteFromSupabaseStorage(photo);
      }

      // Then delete from database
      const { error: deleteDbError } = await this.supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (deleteDbError) throw deleteDbError;
      
      console.log(`✅ Photo deleted successfully: ${photo.id}`);
    } catch (error) {
      console.error(`❌ Error deleting photo ${photoId}:`, error);
      
      // For storage errors, try to delete from database anyway to prevent orphaned records
      if (error instanceof Error && error.message.includes('storage')) {
        console.log(`⚠️ Storage deletion failed, but continuing with database cleanup`);
        const { error: deleteDbError } = await this.supabase
          .from('photos')
          .delete()
          .eq('id', photoId);
          
        if (deleteDbError) throw deleteDbError;
        console.log(`✅ Database record deleted despite storage error`);
      } else {
        throw error;
      }
    }
  }

  private async deleteFromCloudflareR2(photo: Photo): Promise<void> {
    try {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      
      // Initialize R2 client
      const r2Client = new S3Client({
        region: 'auto',
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
        },
      });

      // Use storage_path if available, otherwise construct path
      const filePath = photo.storage_path || this.constructFilePath(photo);
      
      console.log(`☁️ Deleting from Cloudflare R2: ${filePath}`);
      
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
        Key: filePath,
      });

      await r2Client.send(deleteCommand);
      console.log(`✅ Successfully deleted from R2: ${filePath}`);
      
    } catch (error) {
      console.error(`❌ Error deleting from Cloudflare R2:`, error);
      throw new Error(`Cloudflare R2 storage deletion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async deleteFromSupabaseStorage(photo: Photo): Promise<void> {
    try {
      // Extract file path from URL or use stored filename (legacy logic)
      let filePath: string;
      
      if (photo.filename) {
        // Use stored filename if available
        if (photo.is_homepage) {
          filePath = `homepage/${photo.filename}`;
        } else if (photo.event_id) {
          filePath = `events/${photo.event_id}/${photo.filename}`;
        } else {
          filePath = photo.filename;
        }
      } else {
        // Extract from URL as fallback
        const urlParts = photo.url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (photo.is_homepage) {
          filePath = `homepage/${fileName}`;
        } else if (photo.event_id) {
          filePath = `events/${photo.event_id}/${fileName}`;
        } else {
          filePath = fileName;
        }
      }

      console.log(`🗄️ Deleting from Supabase Storage: ${filePath}`);

      const { error: deleteStorageError } = await this.supabase.storage
        .from('photos')
        .remove([filePath]);

      if (deleteStorageError) {
        console.error('Error deleting from Supabase storage:', deleteStorageError);
        throw new Error(`Supabase storage deletion failed: ${deleteStorageError.message}`);
      }
      
      console.log(`✅ Successfully deleted from Supabase storage: ${filePath}`);
      
    } catch (error) {
      console.error(`❌ Error deleting from Supabase storage:`, error);
      throw error;
    }
  }

  private constructFilePath(photo: Photo): string {
    // Construct file path as fallback if storage_path is not available
    if (photo.filename) {
      if (photo.is_homepage) {
        return `homepage/${photo.filename}`;
      } else if (photo.event_id) {
        return `events/${photo.event_id}/Tamu/${photo.filename}`;
      } else {
        return photo.filename;
      }
    } else {
      // Extract from URL as last resort
      const urlParts = photo.url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      if (photo.is_homepage) {
        return `homepage/${fileName}`;
      } else if (photo.event_id) {
        return `events/${photo.event_id}/Tamu/${fileName}`;
      } else {
        return fileName;
      }
    }
  }

  async likePhoto(photoId: string): Promise<void> {
    const { data, error } = await this.supabase.rpc('increment_likes', { photo_id: photoId }); // Panggil fungsi RPC
    if (error) throw error;
  }


  // --- Metode Pesan ---
  async getEventMessages(eventId: string): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async createMessage(message: Omit<Message, 'id' | 'sent_at' | 'hearts'>): Promise<Message> {
    const { data, error } = await this.supabase
      .from('messages')
      .insert(message)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async heartMessage(messageId: string): Promise<void> {
    const { data, error } = await this.supabase.rpc('increment_hearts', { message_id: messageId }); // Panggil fungsi RPC
    if (error) throw error;
  }

  async getMessageById(messageId: string): Promise<Message | null> {
    const { data, error } = await this.supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();
    if (error) throw error;
    return data;
  }

  async updateMessageHearts(messageId: string, hearts: number): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ hearts })
      .eq('id', messageId);
    if (error) throw error;
  }

  async addMessageReaction(messageId: string, reactionType: keyof MessageReactions): Promise<void> {
    // Get current message
    const message = await this.getMessageById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Get current reactions or initialize
    const currentReactions: MessageReactions = message.reactions || {
      love: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0
    };

    // Increment the specific reaction
    currentReactions[reactionType] = (currentReactions[reactionType] || 0) + 1;

    // Update in database
    const { error } = await this.supabase
      .from('messages')
      .update({ reactions: currentReactions })
      .eq('id', messageId);
    
    if (error) throw error;
  }

  async updateMessageReactions(messageId: string, reactions: MessageReactions): Promise<void> {
    const { error } = await this.supabase
      .from('messages')
      .update({ reactions })
      .eq('id', messageId);
    if (error) throw error;
  }

  // --- Metode Statistik ---
  async getStats(): Promise<Stats> {
    // Count only non-archived events
    const { count: totalEvents, error: eventsError } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .or('is_archived.is.null,is_archived.eq.false');
    if (eventsError) throw eventsError;

    // Count only non-archived photos (consistent with getAllPhotos)
    const { count: totalPhotos, error: photosError } = await this.supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .or('is_archived.is.null,is_archived.eq.false');
    if (photosError) throw photosError;

    // Count all messages (no archive concept for messages)
    const { count: totalMessages, error: messagesError } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    if (messagesError) throw messagesError;

    return {
      totalEvents: totalEvents || 0,
      totalPhotos: totalPhotos || 0,
      totalMessages: totalMessages || 0,
    };
  }

  // --- DEPRECATED: Raw Query Method ---
  // This method has been removed due to security and maintainability concerns.
  // Use proper Supabase client methods instead.
  async query(sql: string, params?: any[]): Promise<any[]> {
    console.error('🚨 DEPRECATED: Raw query method has been removed for security reasons');
    console.error('Use proper Supabase client methods like getAllPricingPackages(), createPricingPackage(), etc.');
    throw new Error('Raw query method is deprecated. Use specific typed methods instead.');
  }

  // --- Pricing Packages Methods ---
  async getAllPricingPackages(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('pricing_packages')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async getActivePricingPackages(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('pricing_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async createPricingPackage(packageData: any): Promise<any> {
    // Get next sort order
    const { data: maxData, error: maxError } = await this.supabase
      .from('pricing_packages')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextSortOrder = maxData?.sort_order ? maxData.sort_order + 1 : 1;
    
    const { data, error } = await this.supabase
      .from('pricing_packages')
      .insert({
        ...packageData,
        sort_order: nextSortOrder
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updatePricingPackage(id: string, packageData: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('pricing_packages')
      .update({
        ...packageData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deletePricingPackage(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('pricing_packages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async togglePricingPackageActive(id: string, is_active: boolean): Promise<any> {
    const { data, error } = await this.supabase
      .from('pricing_packages')
      .update({ 
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

export const database = new DatabaseService(); 