/**
 * Color Palette Provider
 * Provides color palette context to the entire app
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useColorPalette } from '@/hooks/use-color-palette';
import { ColorPalette } from '@/lib/color-palettes';

interface ColorPaletteContextType {
  currentPalette: ColorPalette;
  availablePalettes: ColorPalette[];
  changePalette: (paletteId: string) => void;
  resetPalette: () => void;
  getCSSVar: (property: keyof ColorPalette['colors']) => string;
  getGradient: (gradient: keyof ColorPalette['gradients']) => string;
  isLoading: boolean;
}

const ColorPaletteContext = createContext<ColorPaletteContextType | undefined>(undefined);

export function ColorPaletteProvider({ children }: { children: ReactNode }) {
  const paletteData = useColorPalette();

  return (
    <ColorPaletteContext.Provider value={paletteData}>
      {children}
    </ColorPaletteContext.Provider>
  );
}

export function useColorPaletteContext() {
  const context = useContext(ColorPaletteContext);
  if (context === undefined) {
    throw new Error('useColorPaletteContext must be used within a ColorPaletteProvider');
  }
  return context;
}

// HOC for components that need palette context
export function withColorPalette<P extends object>(Component: React.ComponentType<P>) {
  return function ColorPaletteComponent(props: P) {
    const palette = useColorPaletteContext();
    return <Component {...props} palette={palette} />;
  };
}