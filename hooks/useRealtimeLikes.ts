/**
 * useRealtimeLikes Hook (ENHANCED - Memory Leak Fixed)
 * Listens to real-time like updates with proper cleanup
 * 
 * FIXES:
 * - Proper event listener cleanup
 * - Prevents memory leaks
 * - Stable callback references
 */

import { useEffect, useState, useRef } from 'react';
import { useSocket } from './useSocket';

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
  const { socket, isConnected } = useSocket({ eventSlug });
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
    
    if (!socket || !isConnected) return;

    // Listen for like added
    const handleLikeAdded = ({ photo_id, likes_count }: { photo_id: string; likes_count: number }) => {
      if (!mountedRef.current) return;
      
      setLikesUpdates((prev) => ({ ...prev, [photo_id]: likes_count }));
      onLikeAddedRef.current?.(photo_id, likes_count);
    };

    // Listen for like removed
    const handleLikeRemoved = ({ photo_id, likes_count }: { photo_id: string; likes_count: number }) => {
      if (!mountedRef.current) return;
      
      setLikesUpdates((prev) => ({ ...prev, [photo_id]: likes_count }));
      onLikeRemovedRef.current?.(photo_id, likes_count);
    };

    socket.on('like:added', handleLikeAdded);
    socket.on('like:removed', handleLikeRemoved);

    // Cleanup function - CRITICAL
    return () => {
      mountedRef.current = false;
      socket.off('like:added', handleLikeAdded);
      socket.off('like:removed', handleLikeRemoved);
    };
  }, [socket, isConnected]);

  return {
    likesUpdates,
    isConnected,
  };
}
