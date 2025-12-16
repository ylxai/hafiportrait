/**
 * useRealtimeComments Hook (ENHANCED - Memory Leak Fixed)
 * Listens to real-time comment updates with proper cleanup
 * 
 * FIXES:
 * - Proper event listener cleanup
 * - Prevents memory leaks
 * - Stable callback references
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

interface Comment {
  id: string;
  guestName: string;
  message: string;
  photoId?: string;
  createdAt: string;
}

interface UseRealtimeCommentsOptions {
  eventSlug: string;
  onCommentAdded?: (comment: Comment) => void;
}

export function useRealtimeComments({
  eventSlug,
  onCommentAdded,
}: UseRealtimeCommentsOptions) {
  const { socket, isConnected } = useSocket({ eventSlug });
  const [newComments, setNewComments] = useState<Comment[]>([]);
  const mountedRef = useRef(true);
  
  // Stable callback reference
  const onCommentAddedRef = useRef(onCommentAdded);
  
  useEffect(() => {
    onCommentAddedRef.current = onCommentAdded;
  }, [onCommentAdded]);

  useEffect(() => {
    mountedRef.current = true;
    
    if (!socket || !isConnected) return;

    // Listen for new comments
    const handleCommentAdded = ({ comment }: { comment: Comment }) => {
      if (!mountedRef.current) return;
      
      setNewComments((prev) => [...prev, comment]);
      onCommentAddedRef.current?.(comment);
    };

    socket.on('comment:added', handleCommentAdded);

    // Cleanup function - CRITICAL
    return () => {
      mountedRef.current = false;
      socket.off('comment:added', handleCommentAdded);
    };
  }, [socket, isConnected]);

  return {
    newComments,
    isConnected,
  };
}
