# Error Boundaries - Hafiportrait Photography Platform

Comprehensive React Error Boundary system for graceful error handling throughout the application.

## 📋 Overview

This error boundary system provides production-ready error handling with:
- **Graceful degradation** - Components fail independently without crashing the entire app
- **User-friendly error messages** - Different UI for different user types (Admin, Client, Guest)
- **Integrated logging** - Automatic error logging with context information
- **Recovery mechanisms** - Retry buttons and reset functionality
- **Mobile-optimized** - Error screens designed for mobile-first experience

## 🏗️ Architecture

### Base Components

#### `BaseErrorBoundary`
Core error boundary implementation that all other boundaries extend from.

**Features:**
- Error catching via `componentDidCatch`
- Integration with `lib/logger/index.ts`
- Customizable fallback UI
- Error context tracking
- Development mode details

**Usage:**
```tsx
import { BaseErrorBoundary } from '@/components/error-boundaries'

<BaseErrorBoundary
  errorContext="My Component"
  onError={(error) => console.log(error)}
  fallback={(error, errorInfo, reset) => <CustomErrorUI />}
>
  <MyComponent />
</BaseErrorBoundary>
```

### Specialized Boundaries

#### `RootErrorBoundary`
Top-level boundary for the entire application.

**Location:** `app/layout.tsx`

**Features:**
- Catches all unhandled errors
- User-type aware messages (admin, client, guest)
- Critical error logging
- Production error tracking ready

**Usage:**
```tsx
<RootErrorBoundary userType="guest">
  <App />
</RootErrorBoundary>
```

#### `GalleryErrorBoundary`
Specialized for photo gallery components.

**Locations:**
- `app/[eventSlug]/gallery/page.tsx` - Main gallery page
- Individual PhotoTile components

**Features:**
- Gallery-specific error messages
- Graceful photo loading failures
- Retry mechanisms for failed photos
- Toast notifications for errors

**Usage:**
```tsx
import { GalleryErrorBoundary } from '@/components/error-boundaries'

<GalleryErrorBoundary errorContext="Gallery Photos" eventSlug="wedding-2024">
  <PhotoGrid />
</GalleryErrorBoundary>
```

#### `PhotoTileErrorBoundary`
Wraps individual photo tiles for isolated error handling.

**Features:**
- Isolated failures - one photo error doesn't break the grid
- Minimal error UI for small tiles
- Silent error logging (non-intrusive)

**Usage:**
```tsx
import { PhotoTileErrorBoundary } from '@/components/error-boundaries'

{photos.map(photo => (
  <PhotoTileErrorBoundary key={photo.id} photoId={photo.id}>
    <PhotoTile photo={photo} />
  </PhotoTileErrorBoundary>
))}
```

#### `UploadErrorBoundary`
Specialized for upload components and processes.

**Locations:**
- `app/admin/events/[id]/photos/upload/page.tsx` - Standard upload
- `app/admin/events/[id]/upload-persistent/page.tsx` - Persistent upload

**Features:**
- Upload state preservation
- Detailed error messages for upload failures
- Recovery without losing uploaded data
- Progress state protection

**Usage:**
```tsx
import { UploadErrorBoundary } from '@/components/error-boundaries'

<UploadErrorBoundary 
  errorContext="Photo Upload" 
  eventId={eventId}
  onReset={() => preserveUploadState()}
>
  <PhotoUploader />
</UploadErrorBoundary>
```

#### `AdminErrorBoundary`
Specialized for admin dashboard components.

**Locations:**
- `app/admin/layout.tsx` - Admin layout wrapper
- `app/admin/events/[id]/photos/page.tsx` - Photo management
- `app/admin/photos/trash/page.tsx` - Trash management

**Features:**
- Admin-level error details
- Technical error information shown
- Error reporting integration ready
- Developer-friendly error display

**Usage:**
```tsx
import { AdminErrorBoundary } from '@/components/error-boundaries'

<AdminErrorBoundary errorContext="Photo Management Grid" showDevDetails={true}>
  <DraggablePhotoGrid />
</AdminErrorBoundary>
```

## 🎨 Error Fallback UI Components

### `GeneralErrorFallback`
Generic error screen with recovery options.

**Features:**
- User-type aware messaging
- Multiple action buttons (retry, home, support)
- Error ID for support tickets
- Optional developer details

### `GalleryErrorFallback`
Gallery-specific error screen.

**Features:**
- Photo icon and gallery context
- Reload and refresh options
- Support contact information

### `UploadErrorFallback`
Upload-specific error screen.

**Features:**
- Upload icon and context
- State preservation messaging
- System reset option
- Connection troubleshooting hints

### `AdminErrorFallback`
Admin panel error screen.

**Features:**
- Technical error details
- Error ID for reporting
- Component stack traces (dev mode)
- Admin-level actions

### `PhotoTileErrorFallback`
Minimal error UI for individual photo tiles.

**Features:**
- Compact design (fits in tile grid)
- Simple retry button
- Non-intrusive styling

## 🔌 Integration Points

### Logger Integration
```typescript
import { logger } from '@/lib/logger'

// Automatic logging in BaseErrorBoundary
logger.error('Error caught by boundary', {
  code: ErrorCode.INTERNAL_ERROR,
  message: error.message,
  context: { errorId, boundary, componentStack }
})
```

### Toast Notifications
```typescript
import { toast } from 'sonner'

// Automatic toast on errors
toast.error('Gallery Error', {
  description: 'Unable to load photos. Please try refreshing.',
  duration: 5000
})
```

### Error Types
Uses existing `ApplicationError` types from `lib/types/errors.ts`:
- ErrorCode
- ErrorSeverity
- ApplicationError

## 📱 Mobile Optimization

All error screens are mobile-first with:
- Responsive layouts
- Touch-friendly buttons
- Appropriate spacing for small screens
- Clear, concise messaging

## 🔍 Development Mode

In development, error boundaries show additional information:
- Full error messages
- Component stack traces
- Error stack traces
- Debug details

Set `showDevDetails={true}` for components that should always show details.

## 🚀 Production Considerations

### Error Tracking Integration
Error boundaries are ready for integration with error tracking services:

```typescript
// In BaseErrorBoundary componentDidCatch
if (process.env.NODE_ENV === 'production') {
  // TODO: Integrate with Sentry, LogRocket, etc.
  sendToErrorTracking({
    errorId,
    error,
    errorInfo,
    userContext,
    environment: 'production'
  })
}
```

### Performance
- Error boundaries have minimal performance impact
- Only active when errors occur
- Efficient error state management
- No unnecessary re-renders

## 🧪 Testing Error Boundaries

### Trigger Error for Testing
```tsx
// Development only - test error boundary
const ErrorTrigger = () => {
  if (Math.random() > 0.5) {
    throw new Error('Test error for boundary')
  }
  return <div>Component loaded</div>
}

// Wrap in error boundary to test
<GalleryErrorBoundary>
  <ErrorTrigger />
</GalleryErrorBoundary>
```

### Common Error Scenarios Covered
- ✅ Component rendering errors
- ✅ API fetch failures (when thrown in components)
- ✅ Image loading failures
- ✅ Upload process errors
- ✅ State management errors
- ✅ Unexpected null/undefined values

## 📦 File Structure

```
components/error-boundaries/
├── index.ts                      # Central exports
├── BaseErrorBoundary.tsx         # Core boundary implementation
├── RootErrorBoundary.tsx         # App-level boundary
├── GalleryErrorBoundary.tsx      # Gallery-specific boundary
├── UploadErrorBoundary.tsx       # Upload-specific boundary
├── AdminErrorBoundary.tsx        # Admin-specific boundary
├── ErrorFallbackUI.tsx           # Fallback UI components
└── README.md                     # This file
```

## 🎯 Best Practices

### When to Use Each Boundary

1. **RootErrorBoundary**: Always wrap entire app in layout.tsx
2. **GalleryErrorBoundary**: Wrap gallery pages and PhotoGrid components
3. **PhotoTileErrorBoundary**: Wrap individual PhotoTile components
4. **UploadErrorBoundary**: Wrap PhotoUploader components
5. **AdminErrorBoundary**: Wrap admin dashboard sections and critical admin components
6. **BaseErrorBoundary**: For custom scenarios with custom fallback UI

### Error Context Best Practices
Always provide descriptive error context:
```tsx
// Good
<AdminErrorBoundary errorContext="Event Photo Management Grid">

// Less helpful
<AdminErrorBoundary errorContext="Component">
```

### Nesting Boundaries
Boundaries can be nested for granular error handling:
```tsx
<RootErrorBoundary userType="admin">
  <AdminErrorBoundary errorContext="Admin Panel">
    <UploadErrorBoundary errorContext="Photo Upload">
      <PhotoUploader />
    </UploadErrorBoundary>
  </AdminErrorBoundary>
</RootErrorBoundary>
```

## 🔧 Customization

### Custom Fallback UI
```tsx
<BaseErrorBoundary
  fallback={(error, errorInfo, reset) => (
    <div>
      <h1>Custom Error UI</h1>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <MyComponent />
</BaseErrorBoundary>
```

### Custom Error Handler
```tsx
<GalleryErrorBoundary
  onError={(error) => {
    // Custom error handling
    trackAnalytics('gallery_error', { error: error.message })
    notifyAdmin(error)
  }}
>
  <PhotoGrid />
</GalleryErrorBoundary>
```

## 🆘 Support

For issues or questions about error boundaries:
1. Check error logs in `lib/logger/index.ts`
2. Review error context in console (dev mode)
3. Check Error ID in user-facing error screens
4. Review this documentation for best practices

## 📄 License

Part of the Hafiportrait Photography Platform - Internal use only.
