/**
 * Color Palette Hook
 * Manages dynamic color palette switching with persistence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColorPalette, colorPalettes, defaultPalette } from '@/lib/color-palettes';

const STORAGE_KEY = 'hafiportrait-color-palette';

export function useColorPalette() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(defaultPalette);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved palette from localStorage
  useEffect(() => {
    try {
      const savedPaletteId = localStorage.getItem(STORAGE_KEY);
      if (savedPaletteId) {
        const savedPalette = colorPalettes.find(p => p.id === savedPaletteId);
        if (savedPalette) {
          setCurrentPalette(savedPalette);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved color palette:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Apply CSS custom properties when palette changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const { colors, gradients } = currentPalette;

    // Apply color variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVar = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVar, value);
    });

    // Apply gradient variables
    Object.entries(gradients).forEach(([key, value]) => {
      const cssVar = `--gradient-${key}`;
      root.style.setProperty(cssVar, value);
    });

    // Apply theme class for Tailwind
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${currentPalette.id}`);

  }, [currentPalette]);

  // Change palette function
  const changePalette = useCallback((paletteId: string) => {
    const newPalette = colorPalettes.find(p => p.id === paletteId);
    if (newPalette) {
      setCurrentPalette(newPalette);
      
      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, paletteId);
      } catch (error) {
        console.warn('Failed to save color palette:', error);
      }
    }
  }, []);

  // Reset to default palette
  const resetPalette = useCallback(() => {
    setCurrentPalette(defaultPalette);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to reset color palette:', error);
    }
  }, []);

  // Get CSS custom property value
  const getCSSVar = useCallback((property: keyof ColorPalette['colors']) => {
    return `var(--color-${property.replace(/([A-Z])/g, '-$1').toLowerCase()})`;
  }, []);

  // Get gradient CSS value
  const getGradient = useCallback((gradient: keyof ColorPalette['gradients']) => {
    return `var(--gradient-${gradient})`;
  }, []);

  return {
    currentPalette,
    availablePalettes: colorPalettes,
    changePalette,
    resetPalette,
    getCSSVar,
    getGradient,
    isLoading
  };
}