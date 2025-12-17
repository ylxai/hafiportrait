'use client';

/**
 * Comment Card Component
 * Displays a single comment
 */

import { formatDistanceToNow } from 'date-fns';

interface CommentCardProps {
  guestName: string;
  message: string;
  relationship?: string;
  created_at: string;
}

export default function CommentCard({
  guestName,
  message,
  relationship,
  created_at,
}: CommentCardProps) {
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{guestName}</h4>
          {relationship && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded">
              {relationship}
            </span>
          )}
        </div>
        <time className="text-xs text-gray-500">{timeAgo}</time>
      </div>
      <p className="text-gray-700 whitespace-pre-wrap">{message}</p>
    </div>
  );
}
