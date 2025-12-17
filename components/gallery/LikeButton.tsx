/**
 * LikeButton Component
 * Heart button with animation for liking photos
 */

'use client';

import { useState, memo } from 'react';
import { usePhotoLikes } from '@/hooks/usePhotoLikes';

interface LikeButtonProps {
  photo_id: string;
  eventSlug: string;
  initialLikesCount: number;
  onLikeChange?: (liked: boolean, newCount: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
  disabled?: boolean;
}

function LikeButton({
  photo_id,
  eventSlug,
  initialLikesCount,
  onLikeChange,
  size = 'md',
  showCount = true,
  className = '',
  disabled = false,
}: LikeButtonProps) {
  const { isLiked, likes_count, toggleLike, isProcessing } = usePhotoLikes({
    eventSlug,
    photo_id,
    initialLikesCount,
    onLikeChange,
  });

  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (disabled || isProcessing) return;

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    await toggleLike();
  };

  // Size configurations
  const sizeClasses = {
    sm: {
      button: 'p-1',
      icon: 'w-4 h-4',
      text: 'text-xs',
    },
    md: {
      button: 'p-2',
      icon: 'w-5 h-5',
      text: 'text-sm',
    },
    lg: {
      button: 'p-3',
      icon: 'w-6 h-6',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      className={`
        flex items-center gap-1 rounded-full
        transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}
        ${isAnimating ? 'scale-125' : ''}
        ${className}
      `}
      aria-label={isLiked ? 'Unlike photo' : 'Like photo'}
      title={isLiked ? 'Unlike photo' : 'Like photo'}
    >
      {/* Heart Icon */}
      <svg
        className={`
          ${sizes.icon}
          transition-all duration-200
          ${isLiked ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400 hover:text-red-500'}
          ${isAnimating ? 'animate-pulse' : ''}
        `}
        viewBox="0 0 20 20"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
      </svg>

      {/* Like Count */}
      {showCount && likes_count > 0 && (
        <span className={`font-medium ${sizes.text} ${isLiked ? 'text-red-500' : 'text-gray-600'}`}>
          {likes_count}
        </span>
      )}
    </button>
  );
}

// Memoize to prevent re-renders when props haven't changed
export default memo(LikeButton, (prevProps, nextProps) => {
  return (
    prevProps.photo_id === nextProps.photo_id &&
    prevProps.eventSlug === nextProps.eventSlug &&
    prevProps.initialLikesCount === nextProps.initialLikesCount &&
    prevProps.size === nextProps.size &&
    prevProps.showCount === nextProps.showCount &&
    prevProps.className === nextProps.className &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.onLikeChange === nextProps.onLikeChange
  );
});
