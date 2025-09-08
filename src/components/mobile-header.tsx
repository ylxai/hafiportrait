'use client';

import React, { useState, useEffect } from 'react';
import { useMobileHeaderScroll } from '@/hooks/use-mobile-scroll-effects';
import { useScrollProgress } from '@/hooks/use-scroll-animations';
import Logo from './logo';
import BubbleMenu from './ui/bubble-menu';
import '@/styles/mobile-scroll-effects.css';
import '@/styles/bubble-menu.css';

interface MobileHeaderProps {
  className?: string;
}

export default function MobileHeader({ className = '' }: MobileHeaderProps) {
  const { isScrolled, scrollDirection } = useMobileHeaderScroll(50);
  const scrollProgress = useScrollProgress();

  return (
    <>
      {/* Mobile Scroll Progress Indicator */}
      <div 
        className="mobile-scroll-indicator fixed top-0 left-0 w-full z-50"
        style={{ transform: `scaleX(${scrollProgress / 100})` }}
      />

      {/* Bubble Menu */}
      <BubbleMenu 
        isScrolled={isScrolled}
        className="z-50"
      />
    </>
  );
}