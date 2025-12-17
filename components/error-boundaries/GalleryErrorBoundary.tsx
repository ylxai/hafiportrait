'use client'

/**
 * Gallery Error Boundary
 * 
 * Specialized error boundary for gallery components:
 * - PhotoGrid
 * - PhotoLightbox
 * - PhotoTile
 * 
 * Features:
 * - Gallery-specific error handling
 * - Graceful degradation for partial failures
 * - Photo-specific error recovery
 */

import React, { ReactNode } from 'react'
import { BaseErrorBoundary } from './BaseErrorBoundary'
import { GalleryErrorFallback, PhotoTileErrorFallback } from './ErrorFallbackUI'
import { toast } from 'sonner'

interface GalleryErrorBoundaryProps {
  children: ReactNode
  errorContext?: string
  eventSlug?: string
  onError?: (error: Error) => void
  fallbackType?: 'full' | 'tile'
}

/**
 * Gallery Error Boundary
 * Wraps gallery components with specialized error handling
 */
export function GalleryErrorBoundary({
  children,
  errorContext = 'Gallery',
  eventSlug,
  onError,
  fallbackType = 'full',
}: GalleryErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[GalleryErrorBoundary]', errorContext, error)
    }

    // Show toast notification
    toast.error('Gallery Error', {
      description: 'Unable to load some photos. Please try refreshing.',
      duration: 5000,
    })

    // Call custom error handler
    if (onError) {
      onError(error)
    }
  }

  return (
    <BaseErrorBoundary
      errorContext={errorContext}
      onError={(error) => handleError(error)}
      fallback={(error, errorInfo, reset) => {
        const errorId = `gallery-${Date.now()}`
        
        if (fallbackType === 'tile') {
          return <PhotoTileErrorFallback reset={reset} />
        }

        return (
          <GalleryErrorFallback
            error={error}
            errorId={errorId}
            reset={reset}
            showContactSupport={true}
          />
        )
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}

/**
 * Photo Tile Error Boundary
 * Wraps individual photo tiles for isolated error handling
 */
export function PhotoTileErrorBoundary({
  children,
  photoId,
}: {
  children: ReactNode
  photoId?: string
}) {
  return (
    <BaseErrorBoundary
      errorContext={`PhotoTile-${photoId || 'unknown'}`}
      fallback={(error, errorInfo, reset) => (
        <PhotoTileErrorFallback reset={reset} />
      )}
      onError={(error) => {
        // Silent logging for individual photo errors
        console.warn(`Photo tile error (${photoId}):`, error.message)
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}

export default GalleryErrorBoundary
