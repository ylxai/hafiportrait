/**
 * Color Palette Switcher Component
 * Allows users to switch between different color themes
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useColorPalette } from '@/hooks/use-color-palette';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ColorPaletteSwitcherProps {
  variant?: 'button' | 'floating' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
  onPaletteChange?: (paletteId: string) => void;
}

export function ColorPaletteSwitcher({ 
  variant = 'button',
  size = 'md',
  showLabel = true,
  className = '',
  onPaletteChange
}: ColorPaletteSwitcherProps) {
  const { 
    currentPalette, 
    availablePalettes, 
    changePalette, 
    resetPalette,
    isLoading 
  } = useColorPalette();
  
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
      </div>
    );
  }

  const buttonSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  // Floating variant
  if (variant === 'floating') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`fixed bottom-6 right-6 z-50 ${className}`}
      >
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={`${buttonSizes[size]} rounded-full shadow-lg bg-white/90 backdrop-blur-sm border-2 hover:shadow-xl transition-all duration-300`}
              style={{ 
                borderColor: currentPalette.colors.accentPrimary,
                background: `linear-gradient(135deg, ${currentPalette.colors.bgPrimary} 0%, ${currentPalette.colors.bgSecondary} 100%)`
              }}
            >
              <Palette className={iconSizes[size]} style={{ color: currentPalette.colors.accentPrimary }} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-80 p-4 bg-white/95 backdrop-blur-md border-0 shadow-2xl"
            style={{ borderColor: currentPalette.colors.border }}
          >
            <PaletteSelector 
              currentPalette={currentPalette}
              availablePalettes={availablePalettes}
              onPaletteChange={(id) => {
                changePalette(id);
                onPaletteChange?.(id);
              }}
              onReset={resetPalette}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </motion.div>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" style={{ color: currentPalette.colors.accentPrimary }} />
          {showLabel && (
            <span className="font-medium" style={{ color: currentPalette.colors.textPrimary }}>
              Color Theme
            </span>
          )}
        </div>
        <PaletteSelector 
          currentPalette={currentPalette}
          availablePalettes={availablePalettes}
          onPaletteChange={(id) => {
            changePalette(id);
            onPaletteChange?.(id);
          }}
          onReset={resetPalette}
          inline
        />
      </div>
    );
  }

  // Button variant (default)
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
          className={`gap-2 ${className}`}
          style={{ 
            borderColor: currentPalette.colors.border,
            color: currentPalette.colors.textPrimary
          }}
        >
          <Palette className={iconSizes[size]} />
          {showLabel && <span>Theme</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-4"
        style={{ 
          backgroundColor: currentPalette.colors.bgSecondary,
          borderColor: currentPalette.colors.border
        }}
      >
        <PaletteSelector 
          currentPalette={currentPalette}
          availablePalettes={availablePalettes}
          onPaletteChange={(id) => {
            changePalette(id);
            onPaletteChange?.(id);
          }}
          onReset={resetPalette}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface PaletteSelectorProps {
  currentPalette: any;
  availablePalettes: any[];
  onPaletteChange: (id: string) => void;
  onReset: () => void;
  inline?: boolean;
}

function PaletteSelector({ 
  currentPalette, 
  availablePalettes, 
  onPaletteChange, 
  onReset,
  inline = false 
}: PaletteSelectorProps) {
  return (
    <div className="space-y-4">
      {!inline && (
        <>
          <DropdownMenuLabel style={{ color: currentPalette.colors.textPrimary }}>
            Choose Color Theme
          </DropdownMenuLabel>
          <DropdownMenuSeparator style={{ backgroundColor: currentPalette.colors.border }} />
        </>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {availablePalettes.map((palette) => (
          <motion.div
            key={palette.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              currentPalette.id === palette.id 
                ? 'ring-2 ring-offset-2' 
                : 'hover:shadow-md'
            }`}
            style={{
              background: palette.gradients.card,
              borderColor: currentPalette.id === palette.id 
                ? palette.colors.accentPrimary 
                : palette.colors.border
            }}
            onClick={() => onPaletteChange(palette.id)}
          >
            <div className="flex items-center gap-3">
              {/* Color Preview */}
              <div className="flex gap-1">
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: palette.colors.accentPrimary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: palette.colors.accentSecondary }}
                />
                <div 
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: palette.colors.accentGold }}
                />
              </div>
              
              {/* Palette Info */}
              <div className="flex-1">
                <h4 
                  className="font-medium text-sm"
                  style={{ color: palette.colors.textPrimary }}
                >
                  {palette.name}
                </h4>
                <p 
                  className="text-xs opacity-75"
                  style={{ color: palette.colors.textSecondary }}
                >
                  {palette.description}
                </p>
              </div>
              
              {/* Selected Indicator */}
              {currentPalette.id === palette.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: palette.colors.accentPrimary }}
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      {!inline && (
        <>
          <DropdownMenuSeparator style={{ backgroundColor: currentPalette.colors.border }} />
          <DropdownMenuItem 
            onClick={onReset}
            className="gap-2 cursor-pointer"
            style={{ color: currentPalette.colors.textSecondary }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </DropdownMenuItem>
        </>
      )}
    </div>
  );
}

// Quick palette preview component
export function PalettePreview({ palette, size = 'md' }: { palette: any; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  return (
    <div className={`${sizes[size]} rounded-full border-2 border-white shadow-md overflow-hidden`}>
      <div 
        className="w-full h-full"
        style={{ background: palette.preview }}
      />
    </div>
  );
}