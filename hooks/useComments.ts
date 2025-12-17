/**
 * useComments Hook
 * Manages comment state and API calls
 */

import { useState, useEffect, useCallback } from 'react';

export interface Comment {
  id: string;
  guest_name: string;
  message: string;
  relationship?: string;
  created_at: string;
  photo_id?: string;
}

interface UseCommentsOptions {
  eventSlug: string;
  photo_id?: string;
  autoLoad?: boolean;
}

export function useComments({ eventSlug, photo_id, autoLoad = true }: UseCommentsOptions) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/gallery/${eventSlug}/comments`, window.location.origin);
      if (photo_id) url.searchParams.set('photo_id', photo_id);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      setComments(data.comments);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setIsLoading(false);
    }
  }, [eventSlug, photo_id]);

  const addComment = useCallback((comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
    setTotalCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (autoLoad) {
      fetchComments();
    }
  }, [autoLoad, fetchComments]);

  return {
    comments,
    isLoading,
    error,
    totalCount,
    hasMore,
    fetchComments,
    addComment,
  };
}
