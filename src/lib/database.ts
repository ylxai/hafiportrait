import { supabaseAdmin } from './supabase'; // Remove .ts extension
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

      // Delete photos from storage first
      if (eventPhotos && eventPhotos.length > 0) {
        for (const photo of eventPhotos) {
          try {
            await this.deletePhoto(photo.id);
          } catch (photoDeleteError) {
            console.error(`Error deleting photo ${photo.id}:`, photoDeleteError);
            // Continue with other photos even if one fails
          }
        }
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
    // Get basic event data
    const { data: event, error: eventError } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (eventError) throw eventError;
    if (!event) return null;

    // Get photo count
    const { count: photoCount, error: photoError } = await this.supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    // Get message count
    const { count: messageCount, error: messageError } = await this.supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', id);

    // Get last activity (most recent photo or message)
    const { data: lastPhoto } = await this.supabase
      .from('photos')
      .select('uploaded_at')
      .eq('event_id', id)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    const { data: lastMessage } = await this.supabase
      .from('messages')
      .select('created_at')
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

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

    // Get unique participant count (based on uploader names and message senders)
    const { data: uploaders } = await this.supabase
      .from('photos')
      .select('uploader_name')
      .eq('event_id', id)
      .not('uploader_name', 'is', null);

    const { data: messageSenders } = await this.supabase
      .from('messages')
      .select('guest_name')
      .eq('event_id', id)
      .not('guest_name', 'is', null);

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
    const { data, error } = await this.supabase
      .from('photos')
      .select('*')
      .eq('is_homepage', true) // Asumsi kolom ini ada di tabel photos
      .order('uploaded_at', { ascending: false });
    if (error) {
      // Log error yang lebih spesifik jika kolom tidak ditemukan
      if (error.code === '42P01') { // PostgreSQL error code for undefined_table
        if (process.env.NODE_ENV === 'development') {
          console.error("Database Error: Column 'is_homepage' does not exist. Please add it to your 'photos' table.");
        }
      }
      throw error;
    }
    return data;
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
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
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
      
      // Process image with optimization (server-side)
      const optimizedImages = await this.imageOptimizer.processImage(buffer, file.name, `events/${eventId}`);
      
      // Get image metadata
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(buffer).metadata();
      
      const imageMetadata = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        original_size: buffer.length
      };

      // Calculate compression stats
      const compressionStats = ImageOptimizerServer.getCompressionStats(optimizedImages);

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
          compression_stats: compressionStats
        })
        .select()
        .single();

      if (insertError) throw insertError;
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
      
      // Process image with optimization (server-side)
      const optimizedImages = await this.imageOptimizer.processImage(buffer, file.name, 'homepage');
      
      // Get image metadata
      const sharp = (await import('sharp')).default;
      const metadata = await sharp(buffer).metadata();
      
      const imageMetadata = {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'jpeg',
        original_size: buffer.length
      };

      // Calculate compression stats
      const compressionStats = ImageOptimizerServer.getCompressionStats(optimizedImages);

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
          compression_stats: compressionStats
        })
        .select()
        .single();

      if (insertError) throw insertError;
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

  async deletePhoto(photoId: string): Promise<void> {
    // Get photo details
    const photo = await this.getPhotoById(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    try {
      // Extract file path from URL or use stored filename
      let filePath: string;
      
      if (photo.filename) {
        // Use stored filename if available
        if (photo.is_homepage) {
          filePath = `homepage/${photo.filename}`;
        } else if (photo.event_id) {
          filePath = `events/${photo.event_id}/${photo.filename}`;
        } else {
          // Fallback if structure is unclear
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
          // Fallback if structure is unclear
          filePath = fileName;
        }
      }

      // Delete from storage first
      const { error: deleteStorageError } = await this.supabase.storage
        .from('photos')
        .remove([filePath]);

      if (deleteStorageError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error deleting file from storage:', deleteStorageError);
        }
        // Continue with database deletion even if storage deletion fails
      }

      // Then delete from database
      const { error: deleteDbError } = await this.supabase
        .from('photos')
        .delete()
        .eq('id', photoId);

      if (deleteDbError) throw deleteDbError;
    } catch (error) {
      // If it's not a storage error, rethrow
      if (error instanceof Error && !error.message.includes('storage')) {
        throw error;
      }
      
      // For storage errors, try to delete from database anyway
      const { error: deleteDbError } = await this.supabase
        .from('photos')
        .delete()
        .eq('id', photoId);
        
      if (deleteDbError) throw deleteDbError;
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
    const { count: totalEvents, error: eventsError } = await this.supabase
      .from('events')
      .select('*', { count: 'exact', head: true });
    if (eventsError) throw eventsError;

    const { count: totalPhotos, error: photosError } = await this.supabase
      .from('photos')
      .select('*', { count: 'exact', head: true });
    if (photosError) throw photosError;

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

  // --- Raw Query Method for Pricing Packages ---
  async query(sql: string, params?: any[]): Promise<any[]> {
    try {
      // For Supabase, we need to use rpc for raw SQL queries
      // But for pricing packages, let's use the proper Supabase client methods
      if (sql.includes('pricing_packages')) {
        if (sql.includes('SELECT') && sql.includes('ORDER BY sort_order')) {
          // Get all pricing packages
          const { data, error } = await this.supabase
            .from('pricing_packages')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
          
          if (error) throw error;
          return data || [];
        }
        
        if (sql.includes('MAX(sort_order)')) {
          // Get max sort order
          const { data, error } = await this.supabase
            .from('pricing_packages')
            .select('sort_order')
            .order('sort_order', { ascending: false })
            .limit(1)
            .single();
          
          if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
          const maxSortOrder = data?.sort_order || 0;
          return [{ next_sort_order: maxSortOrder + 1 }];
        }
        
        if (sql.includes('INSERT INTO pricing_packages')) {
          // Insert new package
          const [
            name, price, duration, guests, photos, delivery, 
            features, badge, is_popular, is_active, sort_order
          ] = params || [];
          
          const { data, error } = await this.supabase
            .from('pricing_packages')
            .insert({
              name,
              price,
              duration,
              guests,
              photos,
              delivery,
              features: typeof features === 'string' ? JSON.parse(features) : features,
              badge,
              is_popular,
              is_active,
              sort_order
            })
            .select()
            .single();
          
          if (error) throw error;
          return [data];
        }
        
        if (sql.includes('UPDATE pricing_packages') && sql.includes('sort_order')) {
          // Update sort order
          const [sort_order, id] = params || [];
          const { data, error } = await this.supabase
            .from('pricing_packages')
            .update({ sort_order, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          return [data];
        }
        
        if (sql.includes('UPDATE pricing_packages')) {
          // General update
          const [
            name, price, duration, guests, photos, delivery,
            features, badge, is_popular, is_active, id
          ] = params || [];
          
          const { data, error } = await this.supabase
            .from('pricing_packages')
            .update({
              name,
              price,
              duration,
              guests,
              photos,
              delivery,
              features: typeof features === 'string' ? JSON.parse(features) : features,
              badge,
              is_popular,
              is_active,
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          return [data];
        }
        
        if (sql.includes('DELETE FROM pricing_packages')) {
          // Delete package
          const [id] = params || [];
          const { data, error } = await this.supabase
            .from('pricing_packages')
            .delete()
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          return [data];
        }
      }
      
      // Fallback for other queries
      throw new Error(`Unsupported query: ${sql}`);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
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