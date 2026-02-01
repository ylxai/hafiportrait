/**
 * useRealtimeComments Hook (ENHANCED - Memory Leak Fixed)
 * Listens to real-time comment updates with proper cleanup
 *
 * FIXES:
 * - Proper event listener cleanup
 * - Prevents memory leaks
 * - Stable callback references
 */

import { useEffect, useState, useRef } from 'react'
import { useAblyChannel } from './useAblyChannel'

interface Comment {
  id: string
  guest_name: string
  message: string
  photo_id?: string
  created_at: string
}

interface UseRealtimeCommentsOptions {
  eventSlug: string
  onCommentAdded?: (comment: Comment) => void
}

export function useRealtimeComments({
  eventSlug,
  onCommentAdded,
}: UseRealtimeCommentsOptions) {
  const { subscribe } = useAblyChannel(eventSlug)
  const isConnected = true
  const [newComments, setNewComments] = useState<Comment[]>([])
  const mountedRef = useRef(true)

  // Stable callback reference
  const onCommentAddedRef = useRef(onCommentAdded)

  useEffect(() => {
    onCommentAddedRef.current = onCommentAdded
  }, [onCommentAdded])

  useEffect(() => {
    mountedRef.current = true

    // Listen for new comments via Ably
    const handleCommentAdded = ({ comment }: { comment: Comment }) => {
      if (!mountedRef.current) return

      setNewComments((prev) => [...prev, comment])
      onCommentAddedRef.current?.(comment)
    }

    const unsubscribe = subscribe(({ name, data }) => {
      if (name === 'comment:added') {
        handleCommentAdded(data as { comment: Comment })
      }
    })

    // Cleanup function
    return () => {
      mountedRef.current = false
      unsubscribe?.()
    }
  }, [subscribe])

  return {
    newComments,
    isConnected,
  }
}
