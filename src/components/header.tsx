'use client';

/**
 * Header Component - Updated for 2025 Trends
 * 
 * MIGRATION NOTICE:
 * This component now uses ModernHeader which provides:
 * - Mobile-first responsive design
 * - ReactBits integration with brand colors 2025
 * - Glassmorphism effects and micro-interactions
 * - Dock navigation for mobile
 * - Performance optimizations
 * 
 * The old header code is preserved below for reference
 */

import ModernHeader from './modern-header';

export default function Header() {
  return <ModernHeader />;
}

/* 
 * LEGACY HEADER CODE (Preserved for reference)
 * Remove this section after confirming new header works properly
 * 
 * Features that were migrated:
 * - Contact info bar -> Integrated in desktop header
 * - Mobile menu -> Replaced with Dock navigation
 * - Logo -> Extracted to separate Logo component with GradientText
 * - Navigation -> Enhanced with magnetic hover effects
 * - Scroll behavior -> Improved with glassmorphism
 * - Color system -> Updated to 2025 brand colors
 */