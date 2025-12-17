'use client'

/**
 * Error Boundary Testing Component
 * 
 * Development-only component for testing error boundaries
 * 
 * Usage:
 * Import this component and wrap it in the error boundary you want to test
 * 
 * Example:
 * <GalleryErrorBoundary>
 *   <ErrorBoundaryTest type="render" />
 * </GalleryErrorBoundary>
 */

import { useState, useEffect } from 'react'

interface ErrorBoundaryTestProps {
  type?: 'render' | 'async' | 'event' | 'delayed'
  message?: string
  delay?: number
}

export function ErrorBoundaryTest({
  type = 'render',
  message = 'Test error triggered by ErrorBoundaryTest component',
  delay = 2000,
}: ErrorBoundaryTestProps) {
  const [shouldError, setShouldError] = useState(false)

  // Render error - throws immediately
  if (type === 'render' && shouldError) {
    throw new Error(message)
  }

  // Async error - throws after delay
  useEffect(() => {
    if (type === 'async' && shouldError) {
      setTimeout(() => {
        throw new Error(message)
      }, 100)
    }
  }, [type, shouldError, message])

  // Delayed error - throws after specified delay
  useEffect(() => {
    if (type === 'delayed' && shouldError) {
      const timer = setTimeout(() => {
        throw new Error(message)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [type, shouldError, message, delay])

  // Event handler error
  const handleEventError = () => {
    throw new Error(message)
  }

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ ErrorBoundaryTest is only available in development mode
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-purple-300 bg-purple-50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="rounded-full bg-purple-600 px-2 py-1 text-xs font-bold text-white">
          DEV ONLY
        </div>
        <h3 className="text-lg font-semibold text-purple-900">
          Error Boundary Test Component
        </h3>
      </div>

      <div className="mb-4 space-y-2 text-sm text-purple-800">
        <p>
          <strong>Type:</strong> {type}
        </p>
        <p>
          <strong>Message:</strong> {message}
        </p>
        {type === 'delayed' && (
          <p>
            <strong>Delay:</strong> {delay}ms
          </p>
        )}
      </div>

      <div className="space-y-2">
        {type === 'event' ? (
          <button
            onClick={handleEventError}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            🔥 Trigger Event Error
          </button>
        ) : (
          <button
            onClick={() => setShouldError(true)}
            disabled={shouldError}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {shouldError
              ? `⏳ Error triggering (${type})...`
              : `🔥 Trigger ${type} Error`}
          </button>
        )}

        <button
          onClick={() => setShouldError(false)}
          disabled={!shouldError && type !== 'event'}
          className="w-full rounded-lg border border-purple-300 bg-white px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50 disabled:opacity-50"
        >
          🔄 Reset
        </button>
      </div>

      <div className="mt-4 rounded-md bg-purple-100 p-3 text-xs text-purple-700">
        <p className="font-semibold">How to use:</p>
        <ol className="ml-4 mt-1 list-decimal space-y-1">
          <li>Wrap this component in the error boundary you want to test</li>
          <li>Click "Trigger Error" button</li>
          <li>Verify the error boundary catches the error</li>
          <li>Check that the fallback UI displays correctly</li>
          <li>Test the reset/retry functionality</li>
        </ol>
      </div>
    </div>
  )
}

/**
 * Gallery Error Test
 */
export function GalleryErrorTest() {
  return (
    <ErrorBoundaryTest
      type="render"
      message="Gallery component error - Testing GalleryErrorBoundary"
    />
  )
}

/**
 * Upload Error Test
 */
export function UploadErrorTest() {
  return (
    <ErrorBoundaryTest
      type="async"
      message="Upload system error - Testing UploadErrorBoundary"
    />
  )
}

/**
 * Admin Error Test
 */
export function AdminErrorTest() {
  return (
    <ErrorBoundaryTest
      type="event"
      message="Admin panel error - Testing AdminErrorBoundary"
    />
  )
}

/**
 * Photo Tile Error Test
 */
export function PhotoTileErrorTest() {
  return (
    <ErrorBoundaryTest
      type="delayed"
      message="Photo tile loading error - Testing PhotoTileErrorBoundary"
      delay={1000}
    />
  )
}

export default ErrorBoundaryTest
