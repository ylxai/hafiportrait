/**
 * 🚀 OPTIMIZED DATABASE SERVICE
 * Enhanced version with performance optimizations
 * Backward compatible with existing DatabaseService
 */

import { supabaseAdmin } from './supabase';
import { ImageOptimizerServer } from './image-optimizer-server';
import { database as originalDatabase } from './database';

// Re-export all types from original database
export * from './database';

class OptimizedDatabaseService {
  private supabase: typeof supabaseAdmin;
  private imageOptimizer: ImageOptimizerServer;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;

  constructor() {
    this.supabase = supabaseAdmin;
    this.imageOptimizer = new ImageOptimizerServer(this.supabase, 'photos');
    this.cache = new Map();
  }

  // ========================================
  // CACHING UTILITIES
  // ========================================

  private getCacheKey(method: string, params: any[]): string {
    return `${method}:${JSON.stringify(params)}`;
  }

  private setCache(key: string, data: any, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private clearCacheByPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ========================================
  // OPTIMIZED PHOTO METHODS
  // ========================================

  async getEventPhotosOptimized(
    eventId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<any[]> {
    const cacheKey = this.getCacheKey('eventPhotos', [eventId, limit, offset]);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Use optimized function if available, fallback to original query
      const { data, error } = await this.supabase
        .rpc('get_event_photos_optimized', {
          p_event_id: eventId,
          p_limit: limit,
          p_offset: offset
        });

      if (error) {
        // Fallback to original method
        console.log('Using fallback query for event photos');
        return originalDatabase.getEventPhotos(eventId);
      }

      // Cache for 5 minutes
      this.setCache(cacheKey, data, 300);
      return data;
    } catch (error) {
      console.log('Optimized query failed, using fallback');
      return originalDatabase.getEventPhotos(eventId);
    }
  }

  async getHomepagePhotosOptimized(limit: number = 20): Promise<any[]> {
    const cacheKey = this.getCacheKey('homepagePhotos', [limit]);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .rpc('get_homepage_photos_optimized', {
          p_limit: limit
        });

      if (error) {
        return originalDatabase.getHomepagePhotos();
      }

      // Cache for 10 minutes (homepage changes less frequently)
      this.setCache(cacheKey, data, 600);
      return data;
    } catch (error) {
      return originalDatabase.getHomepagePhotos();
    }
  }

  // ========================================
  // OPTIMIZED STATS METHODS
  // ========================================

  async getStatsOptimized(): Promise<any> {
    const cacheKey = this.getCacheKey('stats', []);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .rpc('get_stats_optimized');

      if (error || !data || data.length === 0) {
        return originalDatabase.getStats();
      }

      const stats = data[0];
      const result = {
        totalEvents: Number(stats.total_events),
        totalPhotos: Number(stats.total_photos),
        totalMessages: Number(stats.total_messages),
        recentUploads: Number(stats.recent_uploads)
      };

      // Cache for 2 minutes
      this.setCache(cacheKey, result, 120);
      return result;
    } catch (error) {
      return originalDatabase.getStats();
    }
  }

  // ========================================
  // OPTIMIZED EVENT METHODS
  // ========================================

  async getEventsOptimized(limit: number = 50): Promise<any[]> {
    const cacheKey = this.getCacheKey('events', [limit]);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Cache for 5 minutes
    this.setCache(cacheKey, data || [], 300);
    return data || [];
  }

  async getEventByIdOptimized(id: string): Promise<any | null> {
    const cacheKey = this.getCacheKey('eventById', [id]);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Cache for 10 minutes (events don't change often)
    this.setCache(cacheKey, data, 600);
    return data;
  }

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  async getEventWithPhotosOptimized(eventId: string): Promise<any> {
    const cacheKey = this.getCacheKey('eventWithPhotos', [eventId]);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    // Parallel queries for better performance
    const [event, photos] = await Promise.all([
      this.getEventByIdOptimized(eventId),
      this.getEventPhotosOptimized(eventId, 100, 0)
    ]);

    const result = {
      ...event,
      photos: photos || []
    };

    // Cache for 3 minutes
    this.setCache(cacheKey, result, 180);
    return result;
  }

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  async invalidateEventCache(eventId: string): Promise<void> {
    this.clearCacheByPattern(`eventPhotos:["${eventId}"`);
    this.clearCacheByPattern(`eventById:["${eventId}"`);
    this.clearCacheByPattern(`eventWithPhotos:["${eventId}"`);
    this.clearCacheByPattern('stats');
  }

  async invalidateHomepageCache(): Promise<void> {
    this.clearCacheByPattern('homepagePhotos');
  }

  async clearAllCache(): Promise<void> {
    this.cache.clear();
  }

  // ========================================
  // PERFORMANCE MONITORING
  // ========================================

  async getPerformanceMetrics(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('performance_metrics')
        .select('*');

      if (error) {
        return {
          error: 'Performance metrics not available',
          cache_size: this.cache.size,
          cache_keys: Array.from(this.cache.keys()).slice(0, 10)
        };
      }

      return {
        database_metrics: data,
        cache_size: this.cache.size,
        cache_hit_potential: this.cache.size > 0 ? 'High' : 'Low'
      };
    } catch (error) {
      return {
        error: 'Metrics unavailable',
        cache_size: this.cache.size
      };
    }
  }

  // ========================================
  // FALLBACK TO ORIGINAL METHODS
  // ========================================

  // All original methods are available as fallbacks
  async uploadEventPhoto(eventId: string, file: File, uploaderName?: string, albumName?: string) {
    const result = await originalDatabase.uploadEventPhoto(eventId, file, uploaderName, albumName);
    // Invalidate relevant caches
    await this.invalidateEventCache(eventId);
    return result;
  }

  async uploadHomepagePhoto(file: File) {
    const result = await originalDatabase.uploadHomepagePhoto(file);
    // Invalidate homepage cache
    await this.invalidateHomepageCache();
    return result;
  }

  async createEvent(event: any) {
    const result = await originalDatabase.createEvent(event);
    // Clear events cache
    this.clearCacheByPattern('events');
    this.clearCacheByPattern('stats');
    return result;
  }

  async deleteEvent(id: string) {
    const result = await originalDatabase.deleteEvent(id);
    // Clear all related caches
    await this.invalidateEventCache(id);
    this.clearCacheByPattern('events');
    this.clearCacheByPattern('stats');
    return result;
  }

  // Proxy all other methods to original database
  async getAllEvents() { return originalDatabase.getAllEvents(); }
  async getPublicEvents() { return originalDatabase.getPublicEvents(); }
  async updateEvent(id: string, updates: any) { 
    const result = await originalDatabase.updateEvent(id, updates);
    await this.invalidateEventCache(id);
    return result;
  }
  async verifyEventAccessCode(eventId: string, code: string) { 
    return originalDatabase.verifyEventAccessCode(eventId, code); 
  }
  async getEventPhotos(eventId: string) { 
    return this.getEventPhotosOptimized(eventId); 
  }
  async getHomepagePhotos() { 
    return this.getHomepagePhotosOptimized(); 
  }
  async getPhotoById(photoId: string) { 
    return originalDatabase.getPhotoById(photoId); 
  }
  async deletePhoto(photoId: string) { 
    const result = await originalDatabase.deletePhoto(photoId);
    this.clearCacheByPattern('Photos');
    this.clearCacheByPattern('stats');
    return result;
  }
  async likePhoto(photoId: string) { 
    return originalDatabase.likePhoto(photoId); 
  }
  async getEventMessages(eventId: string) { 
    return originalDatabase.getEventMessages(eventId); 
  }
  async createMessage(message: any) { 
    const result = await originalDatabase.createMessage(message);
    this.clearCacheByPattern('stats');
    return result;
  }
  async heartMessage(messageId: string) { 
    return originalDatabase.heartMessage(messageId); 
  }
  async getMessageById(messageId: string) { 
    return originalDatabase.getMessageById(messageId); 
  }
  async updateMessageHearts(messageId: string, hearts: number) { 
    return originalDatabase.updateMessageHearts(messageId, hearts); 
  }
  async addMessageReaction(messageId: string, reactionType: any) { 
    return originalDatabase.addMessageReaction(messageId, reactionType); 
  }
  async updateMessageReactions(messageId: string, reactions: any) { 
    return originalDatabase.updateMessageReactions(messageId, reactions); 
  }
  async getStats() { 
    return this.getStatsOptimized(); 
  }
  async getEvents() { 
    return this.getEventsOptimized(); 
  }
  async getEventById(id: string) { 
    return this.getEventByIdOptimized(id); 
  }
  async getSimpleCompressionAnalytics() { 
    return originalDatabase.getSimpleCompressionAnalytics(); 
  }
  async validateEventAccess(eventId: string) { 
    return originalDatabase.validateEventAccess(eventId); 
  }
}

export const optimizedDatabase = new OptimizedDatabaseService();

// Export both for flexibility
export { optimizedDatabase as database };