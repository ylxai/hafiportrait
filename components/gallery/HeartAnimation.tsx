/**
 * HeartAnimation Component
 * Floating heart animation for double-tap like gesture
 */

'use client';

import { useEffect, useState } from 'react';

interface HeartAnimationProps {
  x: number;
  y: number;
  onComplete?: () => void;
}

export default function HeartAnimation({ x, y, onComplete }: HeartAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <svg
        className="w-16 h-16 fill-red-500 animate-heart-float"
        viewBox="0 0 20 20"
      >
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
      </svg>
    </div>
  );
}
