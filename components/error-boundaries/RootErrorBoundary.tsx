'use client'

/**
 * Root Error Boundary
 * 
 * Top-level error boundary for the entire application
 * 
 * Features:
 * - Catches all unhandled errors
 * - Provides fallback UI for critical failures
 * - Integrates with logging system
 * - User-type aware error messages
 */

import React, { ReactNode } from 'react'
import { BaseErrorBoundary } from './BaseErrorBoundary'
import { GeneralErrorFallback } from './ErrorFallbackUI'
import { toast } from 'sonner'

interface RootErrorBoundaryProps {
  children: ReactNode
  userType?: 'admin' | 'client' | 'guest'
}

/**
 * Root Error Boundary
 * Wraps the entire application
 */
export function RootErrorBoundary({
  children,
  userType = 'guest',
}: RootErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Log to console
    console.error('[RootErrorBoundary] Critical error:', error)

    // Show toast notification
    toast.error('Application Error', {
      description: 'A critical error occurred. Please refresh the page.',
      duration: 10000,
    })

    // In production, send to error tracking
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service
      console.error('Production critical error:', {
        error: error.message,
        stack: error.stack,
        userType,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return (
    <BaseErrorBoundary
      errorContext="Application Root"
      onError={(error) => handleError(error)}
      showDevDetails={process.env.NODE_ENV === 'development'}
      fallback={(error, errorInfo, reset) => {
        const errorId = `root-${Date.now()}`

        return (
          <GeneralErrorFallback
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            reset={reset}
            context="Application"
            showContactSupport={true}
            showDevDetails={process.env.NODE_ENV === 'development'}
            userType={userType}
          />
        )
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}

export default RootErrorBoundary
