/**
 * useRealtimeLikes Hook (ENHANCED - Memory Leak Fixed)
 * Listens to real-time like updates with proper cleanup
 * 
 * FIXES:
 * - Proper event listener cleanup
 * - Prevents memory leaks
 * - Stable callback references
 */

import { useEffect, useState, useRef } from 'react'
import { useAblyChannel } from './useAblyChannel'

interface UseRealtimeLikesOptions {
  eventSlug: string;
  onLikeAdded?: (photo_id: string, likes_count: number) => void;
  onLikeRemoved?: (photo_id: string, likes_count: number) => void;
}

export function useRealtimeLikes({
  eventSlug,
  onLikeAdded,
  onLikeRemoved,
}: UseRealtimeLikesOptions) {
  const { subscribe } = useAblyChannel(eventSlug)
  const isConnected = true
  const [likesUpdates, setLikesUpdates] = useState<Record<string, number>>({});
  const mountedRef = useRef(true);
  
  // Stable callback references
  const onLikeAddedRef = useRef(onLikeAdded);
  const onLikeRemovedRef = useRef(onLikeRemoved);
  
  useEffect(() => {
    onLikeAddedRef.current = onLikeAdded;
    onLikeRemovedRef.current = onLikeRemoved;
  }, [onLikeAdded, onLikeRemoved]);

  useEffect(() => {
    mountedRef.current = true;
    
    // Listen for like events via Ably
    const handleLikeAdded = ({ photo_id, likes_count }: { photo_id: string; likes_count: number }) => {
      if (!mountedRef.current) return

      setLikesUpdates((prev) => ({ ...prev, [photo_id]: likes_count }))
      onLikeAddedRef.current?.(photo_id, likes_count)
    }

    const handleLikeRemoved = ({ photo_id, likes_count }: { photo_id: string; likes_count: number }) => {
      if (!mountedRef.current) return

      setLikesUpdates((prev) => ({ ...prev, [photo_id]: likes_count }))
      onLikeRemovedRef.current?.(photo_id, likes_count)
    }

    const unsubscribe = subscribe(({ name, data }) => {
      if (name === 'like:added') {
        handleLikeAdded(data as { photo_id: string; likes_count: number })
      }
      if (name === 'like:removed') {
        handleLikeRemoved(data as { photo_id: string; likes_count: number })
      }
    })

    return () => {
      mountedRef.current = false
      unsubscribe?.()
    }
  }, [subscribe])

  return {
    likesUpdates,
    isConnected,
  };
}
