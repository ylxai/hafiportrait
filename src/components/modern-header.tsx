'use client';

import React from 'react';
import { useBreakpoint } from '@/hooks/use-mobile';
import MobileHeader from './mobile-header';
import DesktopHeader from './desktop-header';

/**
 * Modern Header 2025 - Responsive Component
 * 
 * Features:
 * - Mobile-first design with Dock navigation
 * - Desktop glassmorphism with magnetic effects
 * - ReactBits integration with brand colors
 * - Smooth animations and micro-interactions
 * - Performance optimized
 */

interface ModernHeaderProps {
  className?: string;
}

export default function ModernHeader({ className = '' }: ModernHeaderProps) {
  // Mobile-first approach - always use mobile header for now
  return <MobileHeader className={className} />;
}