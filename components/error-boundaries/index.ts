/**
 * Error Boundaries - Central Export
 * 
 * Comprehensive error boundary system for the Hafiportrait Photography Platform
 * 
 * Usage:
 * ```tsx
 * import { RootErrorBoundary, GalleryErrorBoundary } from '@/components/error-boundaries'
 * 
 * <RootErrorBoundary userType="guest">
 *   <App />
 * </RootErrorBoundary>
 * ```
 */

// Base error boundary
export { BaseErrorBoundary } from './BaseErrorBoundary'
export type { ErrorBoundaryProps } from './BaseErrorBoundary'

// Root error boundary
export { RootErrorBoundary } from './RootErrorBoundary'

// Specialized error boundaries
export { GalleryErrorBoundary, PhotoTileErrorBoundary } from './GalleryErrorBoundary'
export { UploadErrorBoundary } from './UploadErrorBoundary'
export { AdminErrorBoundary } from './AdminErrorBoundary'

// Error fallback UI components
export {
  GeneralErrorFallback,
  GalleryErrorFallback,
  UploadErrorFallback,
  AdminErrorFallback,
  PhotoTileErrorFallback,
} from './ErrorFallbackUI'
export type { ErrorFallbackProps } from './ErrorFallbackUI'
