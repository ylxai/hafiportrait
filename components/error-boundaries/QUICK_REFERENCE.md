# Error Boundaries Quick Reference

## 🚀 Quick Import

```tsx
import {
  RootErrorBoundary,
  GalleryErrorBoundary,
  PhotoTileErrorBoundary,
  UploadErrorBoundary,
  AdminErrorBoundary,
  BaseErrorBoundary,
} from '@/components/error-boundaries'
```

## 📋 Cheat Sheet

### Gallery Component
```tsx
<GalleryErrorBoundary errorContext="Gallery Photos" eventSlug="event-slug">
  <PhotoGrid />
</GalleryErrorBoundary>
```

### Individual Photos
```tsx
{photos.map(photo => (
  <PhotoTileErrorBoundary key={photo.id} photoId={photo.id}>
    <PhotoTile photo={photo} />
  </PhotoTileErrorBoundary>
))}
```

### Upload Component
```tsx
<UploadErrorBoundary errorContext="Photo Upload" eventId={eventId}>
  <PhotoUploader />
</UploadErrorBoundary>
```

### Admin Component
```tsx
<AdminErrorBoundary errorContext="Photo Management">
  <PhotoManagementGrid />
</AdminErrorBoundary>
```

### Custom Boundary
```tsx
<BaseErrorBoundary
  errorContext="Custom Feature"
  onError={(error) => console.log(error)}
  fallback={(error, errorInfo, reset) => (
    <CustomErrorUI error={error} onReset={reset} />
  )}
>
  <CustomComponent />
</BaseErrorBoundary>
```

## 🔍 When to Use Which

| Scenario | Boundary | Props |
|----------|----------|-------|
| Entire app | `RootErrorBoundary` | `userType` |
| Gallery page | `GalleryErrorBoundary` | `errorContext`, `eventSlug` |
| Photo tile | `PhotoTileErrorBoundary` | `photoId` |
| Upload page | `UploadErrorBoundary` | `errorContext`, `eventId`, `onReset` |
| Admin panel | `AdminErrorBoundary` | `errorContext`, `showDevDetails` |
| Custom case | `BaseErrorBoundary` | `errorContext`, `fallback`, `onError` |

## 🎯 Props Reference

### Common Props (All Boundaries)
- `children` - React nodes to wrap
- `errorContext` - String describing the component/feature
- `onError` - Custom error handler function

### Specific Props

#### RootErrorBoundary
- `userType`: `'admin' | 'client' | 'guest'` - User type for tailored messages

#### GalleryErrorBoundary
- `eventSlug`: `string` - Event identifier
- `fallbackType`: `'full' | 'tile'` - UI size variant

#### PhotoTileErrorBoundary
- `photoId`: `string` - Photo identifier

#### UploadErrorBoundary
- `eventId`: `string` - Event identifier
- `onReset`: `() => void` - Reset handler to preserve upload state

#### AdminErrorBoundary
- `showDevDetails`: `boolean` - Show technical details (default: true)

#### BaseErrorBoundary
- `fallback`: `(error, errorInfo, reset) => ReactNode` - Custom UI
- `showDevDetails`: `boolean` - Show dev details

## 🧪 Testing

```tsx
import { ErrorBoundaryTest } from '@/components/error-boundaries/ErrorBoundaryTest'

// In your component (dev only)
<GalleryErrorBoundary>
  <ErrorBoundaryTest type="render" />
</GalleryErrorBoundary>
```

Test types:
- `render` - Immediate error
- `async` - Async error
- `event` - Click-triggered error
- `delayed` - Delayed error

## 💡 Best Practices

### ✅ Do
```tsx
// Good: Specific context
<AdminErrorBoundary errorContext="Event Photo Management Grid">
  <DraggablePhotoGrid />
</AdminErrorBoundary>

// Good: Handle errors
<UploadErrorBoundary 
  errorContext="Photo Upload"
  onError={(error) => logToAnalytics(error)}
>
  <PhotoUploader />
</UploadErrorBoundary>
```

### ❌ Don't
```tsx
// Bad: Generic context
<AdminErrorBoundary errorContext="Component">
  <DraggablePhotoGrid />
</AdminErrorBoundary>

// Bad: No context
<GalleryErrorBoundary>
  <PhotoGrid />
</GalleryErrorBoundary>
```

## 🔧 Common Patterns

### Nested Boundaries
```tsx
<RootErrorBoundary userType="admin">
  <AdminErrorBoundary errorContext="Admin Panel">
    <UploadErrorBoundary errorContext="Photo Upload" eventId={id}>
      <PhotoUploader />
    </UploadErrorBoundary>
  </AdminErrorBoundary>
</RootErrorBoundary>
```

### Conditional Boundary
```tsx
{isAdmin ? (
  <AdminErrorBoundary errorContext="Admin Features">
    <AdminFeatures />
  </AdminErrorBoundary>
) : (
  <GalleryErrorBoundary errorContext="Public Gallery">
    <PublicGallery />
  </GalleryErrorBoundary>
)}
```

### With State Preservation
```tsx
const [uploadState, setUploadState] = useState(loadState())

<UploadErrorBoundary 
  errorContext="Upload"
  eventId={eventId}
  onReset={() => {
    saveState(uploadState)
    toast.success('Upload state preserved')
  }}
>
  <PhotoUploader state={uploadState} />
</UploadErrorBoundary>
```

## 🐛 Troubleshooting

### Error not caught?
- Ensure error is thrown during render
- For async errors, re-throw in render
- Check boundary is wrapping component

### Infinite loop?
- Check fallback UI doesn't error
- Ensure reset clears error state
- Add error count limit

### Details not showing?
- Set `showDevDetails={true}`
- Check `NODE_ENV === 'development'`
- Open browser console

## 📱 Mobile Considerations

All error UIs are mobile-optimized:
- Responsive layouts
- Touch-friendly buttons (44px min)
- Clear, concise messaging
- Appropriate spacing

## 🔗 Links

- Full docs: `components/error-boundaries/README.md`
- Implementation guide: `components/error-boundaries/IMPLEMENTATION_GUIDE.md`
- Testing: `components/error-boundaries/ErrorBoundaryTest.tsx`

## 📊 Coverage Status

✅ Root layout
✅ Admin layout  
✅ Gallery pages
✅ Photo tiles
✅ Upload pages
✅ Photo management
✅ Trash management

## 🆘 Quick Help

```tsx
// Need help? Check:
1. This quick reference
2. README.md for detailed docs
3. IMPLEMENTATION_GUIDE.md for examples
4. Use ErrorBoundaryTest for testing
5. Check browser console for errors
```

---

**Last Updated**: 2024
**Version**: 1.0.0
