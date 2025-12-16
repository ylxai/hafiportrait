'use client';

/**
 * Comment List Component
 * Displays list of comments with sorting and filtering
 */

import { useState } from 'react';
import CommentCard from './CommentCard';
import type { Comment } from '@/hooks/useComments';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface CommentListProps {
  comments: Comment[];
  isLoading?: boolean;
}

export default function CommentList({ comments, isLoading }: CommentListProps) {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-12">
        <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No messages yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Be the first to leave a message!
        </p>
      </div>
    );
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
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            guestName={comment.guestName}
            message={comment.message}
            relationship={comment.relationship}
            createdAt={comment.createdAt}
          />
        ))}
      </div>
    </div>
  );
}
