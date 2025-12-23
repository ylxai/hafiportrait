'use client'

/**
 * Error Fallback UI Components
 * 
 * Reusable error UI screens for different scenarios:
 * - General errors
 * - Gallery errors
 * - Upload errors
 * - Admin errors
 * - Different user types (Admin, Client, Guest)
 */

import React from 'react'
import { ErrorInfo } from 'react'
import { 
  ExclamationCircleIcon as AlertCircle, 
  ArrowPathIcon as RefreshCw, 
  HomeIcon as Home, 
  PhotoIcon as ImageIcon,
  ArrowUpTrayIcon as Upload,
  CogIcon as Settings,
  EnvelopeIcon as Mail,
  ArrowLeftIcon as ArrowLeft
} from '@heroicons/react/24/outline'

export interface ErrorFallbackProps {
  error: Error
  errorInfo?: ErrorInfo
  errorId?: string
  reset: () => void
  context?: string
  showContactSupport?: boolean
  showDevDetails?: boolean
  userType?: 'admin' | 'client' | 'guest'
}

/**
 * General Error Fallback
 * Generic error screen with recovery options
 */
export function GeneralErrorFallback({
  error,
  errorInfo,
  errorId,
  reset,
  context = 'Application',
  showContactSupport = true,
  showDevDetails = false,
  userType = 'guest',
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg">
        {/* Error Icon */}
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
          Oops! Something went wrong
        </h2>
        <p className="mb-6 text-center text-sm text-gray-600">
          We encountered an unexpected error in the {context}. 
          Don't worry, your data is safe.
        </p>

        {/* Error ID for support */}
        {errorId && (
          <div className="mb-4 rounded-md bg-gray-50 p-3">
            <p className="text-xs text-gray-600">
              Error ID: <code className="font-mono text-xs">{errorId}</code>
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          <button
            onClick={() => window.location.href = userType === 'admin' ? '/admin' : '/'}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Go to {userType === 'admin' ? 'Dashboard' : 'Home'}
          </button>

          {showContactSupport && (
            <button
              onClick={() => window.location.href = 'mailto:support@hafiportrait.com'}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </button>
          )}
        </div>

        {/* Developer Details */}
        {showDevDetails && isDev && errorInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Developer Details
            </summary>
            <div className="mt-2 max-h-48 overflow-auto rounded-md bg-gray-900 p-3">
              <pre className="text-xs text-green-400">
                <strong>Error:</strong> {error.toString()}
                {'\n\n'}
                <strong>Stack:</strong>
                {errorInfo.componentStack}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Gallery Error Fallback
 * Specific to photo gallery errors
 */
export function GalleryErrorFallback({
  error: _error,
  errorId,
  reset,
  showContactSupport = true,
}: Omit<ErrorFallbackProps, 'errorInfo' | 'context'>) {
  return (
    <div className="flex min-h-[500px] items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-rose-100 p-4">
            <ImageIcon className="h-12 w-12 text-rose-600" />
          </div>
        </div>

        <h2 className="mb-2 text-2xl font-semibold text-gray-900">
          Unable to Load Gallery
        </h2>
        <p className="mb-6 text-gray-600">
          We're having trouble loading the photos right now. 
          This might be a temporary connection issue.
        </p>

        {errorId && (
          <p className="mb-4 text-xs text-gray-500">
            Error ID: {errorId}
          </p>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-6 py-3 text-sm font-medium text-white hover:bg-rose-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Gallery
          </button>

          <button
            onClick={() => window.location.reload()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Refresh Page
          </button>

          {showContactSupport && (
            <p className="pt-2 text-sm text-gray-600">
              Still having issues?{' '}
              <a
                href="mailto:support@hafiportrait.com"
                className="font-medium text-rose-600 hover:text-rose-700"
              >
                Contact us
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Upload Error Fallback
 * Specific to photo upload errors
 */
export function UploadErrorFallback({
  error: _error,
  errorId,
  reset,
}: Omit<ErrorFallbackProps, 'errorInfo' | 'context' | 'showContactSupport'>) {
  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-amber-100 p-3">
            <Upload className="h-8 w-8 text-amber-600" />
          </div>
        </div>

        <h2 className="mb-2 text-xl font-semibold text-amber-900">
          Upload System Error
        </h2>
        <p className="mb-4 text-sm text-amber-700">
          The upload system encountered an error. Your photos are safe, 
          but you may need to try uploading again.
        </p>

        {errorId && (
          <div className="mb-4 rounded-md bg-amber-100 p-2">
            <p className="text-xs text-amber-800">
              Error ID: {errorId}
            </p>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            Reset Upload System
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full rounded-md border border-amber-600 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            Refresh Page
          </button>
        </div>

        <p className="mt-4 text-xs text-amber-700">
          If the problem persists, check your internet connection and try again.
        </p>
      </div>
    </div>
  )
}

/**
 * Admin Error Fallback
 * Specific to admin dashboard errors
 */
export function AdminErrorFallback({
  error,
  errorInfo,
  errorId,
  reset,
  context = 'Admin Panel',
  showDevDetails: _showDevDetails,
  showContactSupport: _showContactSupport,
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-lg border border-purple-200 bg-white p-6 shadow-lg">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-purple-100 p-3">
            <Settings className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <h2 className="mb-2 text-center text-xl font-semibold text-gray-900">
          Admin Panel Error
        </h2>
        <p className="mb-4 text-center text-sm text-gray-600">
          An error occurred in the {context}. This has been logged for investigation.
        </p>

        {errorId && (
          <div className="mb-4 rounded-md bg-purple-50 p-3">
            <p className="text-sm text-purple-900">
              <strong>Error ID:</strong> <code className="text-xs">{errorId}</code>
            </p>
            <p className="mt-1 text-xs text-purple-700">
              Please include this ID when reporting the issue.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>

          <button
            onClick={() => window.location.href = '/admin'}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>

        {isDev && errorInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-purple-700">
              Technical Details (Admin View)
            </summary>
            <div className="mt-2 max-h-64 overflow-auto rounded-md bg-gray-900 p-3">
              <pre className="text-xs text-green-400">
                <strong className="text-yellow-400">Error:</strong> {error.toString()}
                {'\n\n'}
                <strong className="text-yellow-400">Component Stack:</strong>
                {errorInfo.componentStack}
                {error.stack && (
                  <>
                    {'\n\n'}
                    <strong className="text-yellow-400">Stack Trace:</strong>
                    {'\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Photo Tile Error Fallback
 * Small error UI for individual photo tiles
 */
export function PhotoTileErrorFallback({
  reset,
}: Pick<ErrorFallbackProps, 'reset'>) {
  return (
    <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
      <div className="text-center p-4">
        <AlertCircle className="mx-auto h-6 w-6 text-gray-400 mb-2" />
        <p className="text-xs text-gray-500 mb-2">Failed to load</p>
        <button
          onClick={reset}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
