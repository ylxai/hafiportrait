'use client';

import { useScrollProgress } from '@/hooks/use-scroll-animations';

export function ScrollProgressBar() {
  const progress = useScrollProgress();

  return (
    <div 
      className="scroll-progress"
      style={{ width: `${progress}%` }}
    />
  );
}