'use client'

/**
 * Upload Error Boundary
 * 
 * Specialized error boundary for upload components:
 * - PhotoUploader
 * - PhotoUploaderPersistent
 * - Upload queue operations
 * 
 * Features:
 * - Upload-specific error handling
 * - Preserve upload state when possible
 * - Recovery mechanisms for failed uploads
 */

import React, { ReactNode } from 'react'
import { BaseErrorBoundary } from './BaseErrorBoundary'
import { UploadErrorFallback } from './ErrorFallbackUI'
import { toast } from 'sonner'

interface UploadErrorBoundaryProps {
  children: ReactNode
  errorContext?: string
  eventId?: string
  onError?: (error: Error) => void
  onReset?: () => void
}

/**
 * Upload Error Boundary
 * Wraps upload components with specialized error handling
 */
export function UploadErrorBoundary({
  children,
  errorContext = 'Photo Upload',
  eventId,
  onError,
  onReset,
}: UploadErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('[UploadErrorBoundary]', errorContext, error)
    }

    // Show toast notification
    toast.error('Upload System Error', {
      description: 'The upload system encountered an error. Your progress has been saved.',
      duration: 6000,
      action: {
        label: 'Retry',
        onClick: () => {
          if (onReset) {
            onReset()
          }
        },
      },
    })

    // Call custom error handler
    if (onError) {
      onError(error)
    }
  }

  const handleReset = () => {
    // Call custom reset handler to preserve upload state
    if (onReset) {
      onReset()
    }

    toast.success('Upload system reset', {
      description: 'You can now try uploading again.',
    })
  }

  return (
    <BaseErrorBoundary
      errorContext={errorContext}
      onError={(error) => handleError(error)}
      fallback={(error, errorInfo, reset) => {
        const errorId = `upload-${eventId || 'unknown'}-${Date.now()}`

        return (
          <UploadErrorFallback
            error={error}
            errorId={errorId}
            reset={() => {
              handleReset()
              reset()
            }}
          />
        )
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}

export default UploadErrorBoundary
