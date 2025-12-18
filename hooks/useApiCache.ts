/**
 * Custom Hook for API Caching
 * Provides React-friendly interface to the caching system
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  cachedFetch,
  CacheTTL,
  invalidateCache,
  apiCache,
} from '@/lib/cache/api-cache'

interface UseApiCacheOptions {
  ttl?: number
  cacheKey?: string
  enabled?: boolean
  refetchOnMount?: boolean
  refetchOnWindowFocus?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

interface UseApiCacheResult<T> {
  data: T | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
}

/**
 * Custom hook for cached API calls
 */
export function useApiCache<T>(
  url: string | null,
  options: UseApiCacheOptions = {}
): UseApiCacheResult<T> {
  const {
    ttl = CacheTTL.MEDIUM,
    cacheKey,
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsLoading(true)
    setError(null)

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const result = await cachedFetch<T>(
        url,
        { signal: abortControllerRef.current.signal },
        cacheKey,
        ttl
      )

      if (mountedRef.current) {
        setData(result)
        setError(null)
        onSuccess?.(result)
      }
    } catch (err) {
      if (
        mountedRef.current &&
        err instanceof Error &&
        err.name !== 'AbortError'
      ) {
        const error =
          err instanceof Error ? err : new Error('Unknown error occurred')
        setError(error)
        onError?.(error)
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [url, enabled, cacheKey, ttl, onSuccess, onError])

  const invalidate = useCallback(() => {
    if (cacheKey) {
      apiCache.delete(cacheKey)
    } else if (url) {
      apiCache.delete(`fetch:${url}:${JSON.stringify({})}`)
    }
  }, [cacheKey, url])

  const refetch = useCallback(async () => {
    invalidate()
    await fetchData()
  }, [invalidate, fetchData])

  // Set mounted state and initial fetch
  useEffect(() => {
    mountedRef.current = true
    
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Initial fetch (separate effect to avoid dependencies issue)
  useEffect(() => {
    console.log('🔍 useApiCache initial fetch check:', { refetchOnMount, url, enabled })
    if (refetchOnMount && url && enabled) {
      console.log('🚀 useApiCache starting fetch for:', url)
      // Call fetchData directly without dependency to avoid circular issues
      const fetch = async () => {
        if (!url || !enabled || !mountedRef.current) return

        setIsLoading(true)
        setError(null)

        try {
          const result = await cachedFetch(url, {}, cacheKey, ttl)
          if (mountedRef.current) {
            setData(result as T)
            setError(null)
          }
        } catch (err) {
          if (mountedRef.current && err instanceof Error) {
            setError(err)
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false)
          }
        }
      }
      
      fetch()
    } else {
      console.log('❌ useApiCache fetch skipped for:', url, { refetchOnMount, url, enabled })
    }
  }, [url, enabled, refetchOnMount, cacheKey, ttl]) // Fixed dependencies

  // Refetch on window focus (optional)
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (!document.hidden && mountedRef.current) {
        fetchData()
      }
    }

    window.addEventListener('visibilitychange', handleFocus)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('visibilitychange', handleFocus)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchData, refetchOnWindowFocus])

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
  }
}

/**
 * Hook for events API with caching
 */
export function useEventsCache(filters?: Record<string, any>) {
  const queryParams = filters ? new URLSearchParams(filters).toString() : ''
  const url = `/api/admin/events${queryParams ? `?${queryParams}` : ''}`

  return useApiCache(url, {
    ttl: CacheTTL.MEDIUM,
    cacheKey: `events:${JSON.stringify(filters || {})}`,
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      // Pre-cache individual events
      if (data.events) {
        data.events.forEach((event: any) => {
          apiCache.set(`event:${event.id}`, event, CacheTTL.MEDIUM)
        })
      }
    },
  })
}

/**
 * Hook for photos API with caching
 */
export function usePhotosCache(
  event_id: string,
  filters?: Record<string, any>
) {
  const queryParams = filters ? new URLSearchParams(filters).toString() : ''
  const url = `/api/admin/events/${event_id}/photos${queryParams ? `?${queryParams}` : ''}`

  return useApiCache(url, {
    ttl: CacheTTL.SHORT, // Photos change more frequently
    cacheKey: `photos:${event_id}:${JSON.stringify(filters || {})}`,
    onSuccess: (data) => {
      // Pre-cache individual photos
      if (data.photos) {
        data.photos.forEach((photo: any) => {
          apiCache.set(`photo:${photo.id}`, photo, CacheTTL.SHORT)
        })
      }
    },
  })
}

/**
 * Hook for packages API with caching
 */
export function usePackagesCache() {
  return useApiCache('/api/public/packages', {
    ttl: CacheTTL.LONG, // Packages don't change often
    cacheKey: 'packages',
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook for dashboard data with caching
 */
export function useDashboardCache() {
  return useApiCache('/api/admin/dashboard', {
    ttl: CacheTTL.SHORT, // Dashboard data should be fresh
    cacheKey: 'dashboard',
    refetchOnWindowFocus: true,
  })
}

/**
 * Hook for hero slideshow with caching
 */
export function useHeroSlideshowCache<T = any>() {
  console.log('🎯 useHeroSlideshowCache called!')
  
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    console.log('🚀 Simple fetch starting...')
    
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/public/hero-slideshow')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        console.log('✅ Simple fetch success:', result)
        setData(result)
        setError(null)
      } catch (err) {
        console.error('❌ Simple fetch error:', err)
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  const result = { data, isLoading, error, refetch: () => {}, invalidate: () => {} }
  console.log('🎯 Simple useHeroSlideshowCache result:', result)
  return result
}

/**
 * Global cache invalidation functions
 */
export const cacheInvalidation = {
  events: () => invalidateCache.events(),
  event: (id: string) => invalidateCache.event(id),
  photos: (event_id: string) => invalidateCache.photos(event_id),
  packages: () => invalidateCache.packages(),
  dashboard: () => invalidateCache.dashboard(),
  all: () => invalidateCache.all(),
}

/**
 * Hook to get cache statistics (for debugging)
 */
export function useCacheStats() {
  const [stats, setStats] = useState(apiCache.getStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(apiCache.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return stats
}
