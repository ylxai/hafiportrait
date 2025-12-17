'use client'

/**
 * Comment List Component
 * Displays list of comments with sorting and filtering
 */

import { useState, useMemo } from 'react'
import CommentCard from './CommentCard'
import type { Comment } from '@/hooks/useComments'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface CommentListProps {
  comments: Comment[]
  isLoading?: boolean
}

export default function CommentList({ comments, isLoading }: CommentListProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Memoize expensive sorting operation to avoid re-sorting on every render
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })
  }, [comments, sortOrder])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse rounded-lg bg-gray-100 p-4">
            <div className="mb-2 h-4 w-1/4 rounded bg-gray-200"></div>
            <div className="mb-1 h-3 w-full rounded bg-gray-200"></div>
            <div className="h-3 w-3/4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No messages yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Be the first to leave a message!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {comments.length} {comments.length === 1 ? 'message' : 'messages'}
        </p>
        <div className="flex items-center space-x-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as 'newest' | 'oldest')
            }
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {sortedComments.map((comment) => (
          <CommentCard
            key={comment.id}
            guestName={comment.guest_name}
            message={comment.message}
            relationship={comment.relationship}
            created_at={comment.created_at}
          />
        ))}
      </div>
    </div>
  )
}
