'use client'

/**
 * Base Error Boundary Component
 * 
 * Core error boundary implementation with:
 * - Error catching and logging
 * - Integration with logger system
 * - Customizable fallback UI
 * - Error context information
 * - Recovery mechanisms
 */

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { logger } from '@/lib/logger'

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: ErrorInfo, reset: () => void) => ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  errorContext?: string
  showDevDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * Base Error Boundary
 * Can be extended for specific use cases
 */
export class BaseErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props
    const { errorId } = this.state

    // Log error with simple context
    const context = {
      errorId,
      component: 'ErrorBoundary',
      componentStack: errorInfo.componentStack,
    }

    // Log to system
    logger.error('Error caught by boundary', error, context)

    // Update state with error info
    this.setState({ errorInfo })

    // Call custom error handler
    if (onError) {
      onError(error, errorInfo)
    }

    // In production, could send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.error('Production error:', { errorId, error, errorInfo })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback, showDevDetails } = this.props

    if (hasError && error && errorInfo) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, errorInfo, this.resetError)
      }

      // Default fallback
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <div className="max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <div className="mb-4 text-4xl">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold text-red-900">
              Something went wrong
            </h2>
            <p className="mb-4 text-sm text-red-700">
              We encountered an unexpected error. Please try again.
            </p>
            <button
              onClick={this.resetError}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
            {showDevDetails && process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm font-medium text-red-900">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900">
                  {error.toString()}
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return children
  }
}

export default BaseErrorBoundary
