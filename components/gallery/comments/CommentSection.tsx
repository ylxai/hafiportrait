'use client';

/**
 * Comment Section Component
 * Main component that combines form and list
 */

import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface CommentSectionProps {
  eventSlug: string;
  photoId?: string;
  allowComments?: boolean;
}

export default function CommentSection({
  eventSlug,
  photoId,
  allowComments = true,
}: CommentSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const { comments, isLoading, totalCount, addComment } = useComments({
    eventSlug,
    photoId,
    autoLoad: true,
  });

  const handleCommentSubmitted = (comment: any) => {
    addComment(comment);
    setShowForm(false);
  };

  if (!allowComments) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ChatBubbleLeftRightIcon className="mx-auto h-10 w-10 text-gray-300 mb-2" />
        <p>Comments are disabled for this event</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-7 w-7" />
          Messages
          {totalCount > 0 && (
            <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              {totalCount}
            </span>
          )}
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Leave a Message
          </button>
        )}
      </div>

      {/* Comment Form */}
      {showForm && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Leave a Message</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <CommentForm
            eventSlug={eventSlug}
            photoId={photoId}
            onCommentSubmitted={handleCommentSubmitted}
          />
        </div>
      )}

      {/* Comments List */}
      <CommentList comments={comments} isLoading={isLoading} />
    </div>
  );
}
