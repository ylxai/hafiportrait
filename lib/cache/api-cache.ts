/**
 * API Response Caching System
 * Simple in-memory cache with TTL and request deduplication
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, PendingRequest>();
  
  // Default TTL: 5 minutes
  private defaultTTL = 5 * 60 * 1000;
  
  /**
   * Get data from cache if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Set data in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get or create a pending request to prevent duplicate API calls
   */
  getOrCreatePendingRequest<T>(
    key: string, 
    requestFn: () => Promise<T>
  ): Promise<T> {
    const existing = this.pendingRequests.get(key);
    
    // Return existing pending request if it exists and is recent (< 30s)
    if (existing && Date.now() - existing.timestamp < 30000) {
      return existing.promise;
    }
    
    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up pending request when done
      this.pendingRequests.delete(key);
    });
    
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    });
    
    return promise;
  }
  
  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clean expired entries
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
        expired: Date.now() - entry.timestamp > entry.ttl
      }))
    };
  }
}

// Global cache instance
export const apiCache = new ApiCache();

// Cache TTL presets (in milliseconds)
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 30 * 60 * 1000,      // 30 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
} as const;

// Cache key builders
export const CacheKeys = {
  events: (filters?: Record<string, any>) => 
    `events:${filters ? JSON.stringify(filters) : 'all'}`,
  
  event: (id: string) => `event:${id}`,
  
  photos: (eventId: string, filters?: Record<string, any>) =>
    `photos:${eventId}:${filters ? JSON.stringify(filters) : 'all'}`,
  
  photo: (id: string) => `photo:${id}`,
  
  packages: () => 'packages',
  
  portfolio: () => 'portfolio',
  
  heroSlideshow: () => 'hero-slideshow',
  
  bentoGrid: () => 'bento-grid',
  
  dashboard: () => 'dashboard',
  
  messages: (page?: number) => `messages:${page || 1}`,
  
  user: (id: string) => `user:${id}`,
} as const;

// Utility function for cached fetch
export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  ttl: number = CacheTTL.MEDIUM
): Promise<T> {
  const key = cacheKey || `fetch:${url}:${JSON.stringify(options)}`;
  
  // Try to get from cache first
  const cached = apiCache.get<T>(key);
  if (cached) {
    return cached;
  }
  
  // Use request deduplication to prevent multiple identical requests
  return apiCache.getOrCreatePendingRequest(key, async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache successful responses
    apiCache.set(key, data, ttl);
    
    return data;
  });
}

// Cache invalidation helpers
export const invalidateCache = {
  events: () => apiCache.invalidatePattern('^events:'),
  event: (id: string) => {
    apiCache.delete(CacheKeys.event(id));
    apiCache.invalidatePattern(`^photos:${id}:`);
  },
  photos: (eventId: string) => apiCache.invalidatePattern(`^photos:${eventId}:`),
  photo: (id: string) => apiCache.delete(CacheKeys.photo(id)),
  packages: () => apiCache.delete(CacheKeys.packages()),
  portfolio: () => apiCache.delete(CacheKeys.portfolio()),
  dashboard: () => apiCache.delete(CacheKeys.dashboard()),
  all: () => apiCache.clear(),
};

// Automatic cleanup every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 10 * 60 * 1000);
}