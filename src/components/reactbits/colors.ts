/**
 * HafiPortrait ReactBits Color Constants
 * Consistent colors for ReactBits components
 */

export const BRAND_COLORS = {
  // Primary Colors (Cyan Deep)
  primary: '#0E7490',
  primaryLight: '#0891B2',
  primaryLighter: '#22D3EE',
  
  // Secondary Colors (Soft Pink)
  secondary: '#FF8CC8',
  secondaryLight: '#FFB3D9',
  secondaryLighter: '#FECDD3',
  
  // Accent Colors (Purple)
  accent: '#A855F7',
  accentLight: '#C084FC',
  
  // Supporting Colors
  sage: '#84CC16',
  lavender: '#8B5CF6',
  coral: '#FB7185',
  
  // Neutral Colors
  bgPrimary: '#FEFEFE',
  bgSecondary: '#F8FAFC',
  bgTertiary: '#F1F5F9',
  bgDark: '#0F172A',
  
  // Text Colors
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
} as const;

export const GRADIENT_COMBINATIONS = {
  primary: ['#0E7490', '#FF8CC8'],
  secondary: ['#A855F7', '#22D3EE'],
  accent: ['#FF8CC8', '#C084FC', '#22D3EE'],
  soft: ['#FECDD3', '#F8FAFC'],
  hero: ['#0E7490', '#A855F7', '#FF8CC8'],
  features: ['#22D3EE', '#C084FC'],
  gallery: ['#FF8CC8', '#FFB3D9'],
  pricing: ['#A855F7', '#0E7490'],
} as const;

export const REACTBITS_PRESETS = {
  aurora: {
    colorStops: GRADIENT_COMBINATIONS.hero,
    amplitude: 1.2,
    blend: 0.6,
  },
  particles: {
    particleColors: [BRAND_COLORS.primary, BRAND_COLORS.secondary, BRAND_COLORS.accent],
    particleCount: 150,
    speed: 0.8,
  },
  gradientText: {
    colors: GRADIENT_COMBINATIONS.primary,
    animationSpeed: 6,
  },
  pixelCard: {
    colors: `${BRAND_COLORS.primaryLighter},${BRAND_COLORS.secondaryLight},${BRAND_COLORS.accentLight}`,
    gap: 4,
    speed: 30,
  },
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;
export type GradientType = keyof typeof GRADIENT_COMBINATIONS;
export type ReactBitsPreset = keyof typeof REACTBITS_PRESETS;