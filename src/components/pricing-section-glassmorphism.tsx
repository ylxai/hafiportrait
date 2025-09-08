'use client';

import ModernGlassmorphismPricing from "./modern-glassmorphism-pricing";

/**
 * Glassmorphism Pricing Section - Drop-in replacement for pricing-section-dynamic.tsx
 * 
 * Features:
 * - Modern glassmorphism design with backdrop blur effects
 * - Mobile-first responsive layout
 * - Smooth animations and hover effects
 * - Dynamic color coding based on package tiers
 * - Optimized performance for mobile devices
 * - Accessibility compliant
 * 
 * Usage:
 * Replace <PricingSectionDynamic /> with <PricingSectionGlassmorphism />
 */
export default function PricingSectionGlassmorphism() {
  return <ModernGlassmorphismPricing />;
}

// Export the main component as well for direct usage
export { ModernGlassmorphismPricing };