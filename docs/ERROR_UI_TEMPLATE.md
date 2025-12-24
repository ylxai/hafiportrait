# Error UI Implementation Template

## Pattern for Adding Error Handling to Admin Pages

### Status: 2/12 pages complete

**Completed:**
- ✅ app/admin/dashboard/page.tsx
- ✅ app/admin/events/page.tsx  
- ✅ app/admin/messages/page.tsx

**Remaining:**
- [ ] app/admin/packages/page.tsx
- [ ] app/admin/packages/categories/page.tsx
- [ ] app/admin/portfolio/page.tsx
- [ ] app/admin/pricing/page.tsx
- [ ] app/admin/additional-services/page.tsx
- [ ] app/admin/events/[id]/page.tsx
- [ ] app/admin/events/create/page.tsx
- [ ] app/admin/landing-page/bento-grid/page.tsx
- [ ] app/admin/landing-page/form-submissions/page.tsx
- [ ] app/admin/landing-page/hero-slideshow/page.tsx

---

## Implementation Steps

### Step 1: Add Import

```tsx
import ErrorAlert from '@/components/ui/ErrorAlert'
```

Add after other imports at the top of the file.

---

### Step 2: Add Error State

```tsx
const [error, setError] = useState<string | null>(null)
```

Add right after the loading state declaration.

**Example:**
```tsx
export default function MyPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)  // ← Add this
  // ...
}
```

---

### Step 3: Update Fetch Logic

**Before:**
```tsx
const fetchData = async () => {
  try {
    const response = await fetch('/api/endpoint')
    if (!response.ok) {
      throw new Error('Failed to fetch')
    }
    const data = await response.json()
    setData(data)
  } catch (error) {
    console.error('Error:', error)  // ❌ Silent error
  } finally {
    setLoading(false)
  }
}
```

**After:**
```tsx
const fetchData = async () => {
  try {
    setError(null)  // ← Clear previous errors
    const response = await fetch('/api/endpoint')
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to fetch (${response.status})`)
    }
    
    const data = await response.json()
    setData(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    setError(message)  // ← Set error for display
    console.error('Error:', error)
  } finally {
    setLoading(false)
  }
}
```

**Key changes:**
1. Add `setError(null)` at start of try block
2. Parse error response for better messages
3. Include status code in error
4. Set error state in catch block
5. Use proper TypeScript error checking

---

### Step 4: Add ErrorAlert to Render

Add ErrorAlert component early in the return statement, typically after the header.

**Example:**
```tsx
return (
  <div className="space-y-6">
    {/* Error Alert */}
    <ErrorAlert error={error} onDismiss={() => setError(null)} />
    
    {/* Header */}
    <div className="flex items-center justify-between">
      <h1>Page Title</h1>
    </div>
    
    {/* Rest of content */}
    {/* ... */}
  </div>
)
```

**For pages with AdminLayout:**
```tsx
return (
  <AdminLayout>
    <div className="space-y-6">
      {/* Error Alert */}
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      
      {/* Content */}
    </div>
  </AdminLayout>
)
```

---

## Complete Example: Events Page

See `app/admin/events/page.tsx` for full implementation.

**Key parts:**
```tsx
'use client'

import { useState } from 'react'
import ErrorAlert from '@/components/ui/ErrorAlert'

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/events', {
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch events (${response.status})`)
      }

      const data = await response.json()
      setEvents(data.events || [])
      setLoading(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch events'
      setError(message)
      console.error('Error fetching events:', error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ErrorAlert error={error} onDismiss={() => setError(null)} />
      
      {/* Rest of page */}
    </div>
  )
}
```

---

## Testing Checklist

After implementing error UI on a page:

- [ ] Error state added with proper TypeScript type
- [ ] ErrorAlert component imported
- [ ] ErrorAlert rendered in JSX
- [ ] setError(null) added at start of fetch
- [ ] Error response properly parsed
- [ ] Error message set in catch block
- [ ] TypeScript compiles without errors
- [ ] Page loads without runtime errors
- [ ] Error displays when API fails
- [ ] Error can be dismissed

---

## Common Issues & Solutions

### Issue: "ErrorAlert is not defined"
**Solution:** Check import path: `import ErrorAlert from '@/components/ui/ErrorAlert'`

### Issue: TypeScript error "Type 'unknown' is not assignable"
**Solution:** Use proper error typing:
```tsx
const message = error instanceof Error ? error.message : 'An error occurred'
```

### Issue: Error not displaying
**Solution:** Verify ErrorAlert is inside the returned JSX and error state is being set.

### Issue: Error persists after successful retry
**Solution:** Add `setError(null)` at the start of the try block.

---

## Estimated Time per Page

- Simple page (1 fetch): ~5-10 minutes
- Complex page (multiple fetches): ~15-20 minutes

**Total for 10 remaining pages: ~2 hours**

---

## Help & Support

If you encounter issues:
1. Check TypeScript errors first
2. Verify import paths
3. Compare with completed examples (events/messages pages)
4. Test error display by temporarily breaking API endpoint

---

**Created:** $(date)
**Status:** Template ready for implementation
**Completed:** 2/12 pages (17%)
**Remaining:** 10 pages (83%)
