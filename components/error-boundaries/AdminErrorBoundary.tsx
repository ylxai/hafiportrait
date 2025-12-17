'use client'

/**
 * Admin Error Boundary
 * 
 * Specialized error boundary for admin components:
 * - Admin dashboard
 * - Event management
 * - Photo management
 * - Analytics
 * 
 * Features:
 * - Admin-specific error handling
 * - Detailed error information for admins
 * - Integration with admin logging
 */

import React, { ReactNode } from 'react'
import { BaseErrorBoundary } from './BaseErrorBoundary'
import { AdminErrorFallback } from './ErrorFallbackUI'
import { toast } from 'sonner'

interface AdminErrorBoundaryProps {
  children: ReactNode
  errorContext?: string
  onError?: (error: Error) => void
  showDevDetails?: boolean
}

/**
 * Admin Error Boundary
 * Wraps admin components with specialized error handling
 */
export function AdminErrorBoundary({
  children,
  errorContext = 'Admin Panel',
  onError,
  showDevDetails = true,
}: AdminErrorBoundaryProps) {
  const handleError = (error: Error) => {
    // Log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('[AdminErrorBoundary]', errorContext, error)
    }

    // Show toast notification with more technical details for admins
    toast.error('Admin Panel Error', {
      description: `${errorContext}: ${error.message}`,
      duration: 8000,
      action: {
        label: 'Report',
        onClick: () => {
          // TODO: Integrate with error reporting system
          console.log('Report error:', error)
        },
      },
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
      showDevDetails={showDevDetails}
      fallback={(error, errorInfo, reset) => {
        const errorId = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        return (
          <AdminErrorFallback
            error={error}
            errorInfo={errorInfo}
            errorId={errorId}
            reset={reset}
            context={errorContext}
            showDevDetails={showDevDetails}
            showContactSupport={false}
          />
        )
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}

export default AdminErrorBoundary
