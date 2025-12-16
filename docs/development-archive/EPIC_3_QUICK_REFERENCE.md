# Epic 3: Admin Dashboard - Quick Reference Guide

## 🚀 Quick Start

### Access Admin Dashboard
1. Navigate to: `http://localhost:3000/admin/login`
2. Login dengan admin credentials
3. Dashboard akan terbuka di: `/admin/dashboard`

---

## 📁 File Structure

```
app/
├── admin/
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard overview
│   ├── events/
│   │   ├── page.tsx              # Events list
│   │   ├── create/
│   │   │   └── page.tsx          # Create event
│   │   └── [id]/
│   │       └── page.tsx          # Event detail/edit
│   ├── messages/
│   │   └── page.tsx              # Contact messages
│   ├── portfolio/
│   │   └── page.tsx              # Portfolio (placeholder)
│   ├── photos/
│   │   └── page.tsx              # Photos (placeholder)
│   └── settings/
│       └── page.tsx              # Settings (placeholder)
├── components/
│   └── admin/
│       ├── AdminLayout.tsx       # Main layout
│       ├── EventForm.tsx         # Event form component
│       ├── StatCard.tsx          # Statistics card
│       ├── QuickActions.tsx      # Quick actions
│       └── RecentActivity.tsx    # Activity feed
└── api/
    └── admin/
        ├── dashboard/
        │   └── route.ts          # GET statistics
        ├── events/
        │   ├── route.ts          # GET list, POST create
        │   └── [id]/
        │       ├── route.ts      # GET, PATCH, DELETE
        │       └── generate-qr/
        │           └── route.ts  # POST generate QR
        └── messages/
            ├── route.ts          # GET list
            └── [id]/
                └── route.ts      # GET, PATCH, DELETE

lib/
└── utils/
    ├── slug.ts                   # Slug & access code utilities
    └── qrcode.ts                 # QR code generation
```

---

## 🎯 Core Features

### 1. Dashboard (`/admin/dashboard`)
- **Statistics Cards:** Events, Photos, Views, Downloads, Messages
- **Recent Activity:** Last 10 actions
- **Quick Actions:** Create Event, Upload Photos, View Messages
- **Recent Events:** 5 most recent events

### 2. Events Management (`/admin/events`)
- **List View:** Grid or Table
- **Search:** By event name or slug
- **Filter:** By status (Draft, Active, Archived)
- **Actions:** View, Edit, Delete

### 3. Create Event (`/admin/events/create`)
- **Required:** Name, Slug, Client Email
- **Optional:** Phone, Date, Location, Description
- **Auto-generate:** Slug, Access Code

### 4. Event Detail (`/admin/events/[id]`)
- **View:** All event information
- **Edit:** Update event details
- **QR Code:** Generate and download
- **Delete:** With confirmation
- **Copy:** URLs and access codes

### 5. Messages (`/admin/messages`)
- **List:** All contact form submissions
- **Filter:** By status (New, Read, Replied)
- **Actions:** Mark as read, Reply, Delete
- **Export:** Download as CSV

---

## 🔌 API Endpoints

### Dashboard
```typescript
GET /api/admin/dashboard
Response: {
  statistics: {
    totalEvents, activeEvents, totalPhotos,
    totalViews, totalDownloads, newMessages
  },
  recentEvents: Event[]
}
```

### Events
```typescript
// List events
GET /api/admin/events?page=1&limit=20&search=&status=all
Response: { events: Event[], pagination: {...} }

// Create event
POST /api/admin/events
Body: { name, slug, clientEmail, ... }
Response: { message, event }

// Get event
GET /api/admin/events/:id
Response: { event }

// Update event
PATCH /api/admin/events/:id
Body: { name?, status?, ... }
Response: { message, event }

// Delete event
DELETE /api/admin/events/:id
Response: { message }

// Generate QR
POST /api/admin/events/:id/generate-qr
Response: { message, qrCodeUrl }
```

### Messages
```typescript
// List messages
GET /api/admin/messages?status=all
Response: { messages: Message[], pagination: {...} }

// Update message
PATCH /api/admin/messages/:id
Body: { status: 'new' | 'read' | 'replied' }
Response: { message, data }

// Delete message
DELETE /api/admin/messages/:id
Response: { message }
```

---

## 🎨 Component Usage

### AdminLayout
```tsx
import AdminLayout from '@/app/components/admin/AdminLayout'

export default function Page() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Your content */}
      </div>
    </AdminLayout>
  )
}
```

### StatCard
```tsx
import StatCard from '@/app/components/admin/StatCard'
import { Calendar } from 'lucide-react'

<StatCard
  title="Total Events"
  value={25}
  icon={Calendar}
  trend={{ value: "5 active", positive: true }}
  loading={false}
/>
```

### EventForm
```tsx
import EventForm from '@/app/components/admin/EventForm'

<EventForm
  onSubmit={handleSubmit}
  initialData={eventData}  // Optional
  isEdit={false}
/>
```

---

## 🔧 Utility Functions

### Slug Generation
```typescript
import { generateSlug, generateAccessCode } from '@/lib/utils/slug'

const slug = generateSlug("Sarah & John Wedding")
// Result: "sarah-john-wedding"

const code = generateAccessCode()
// Result: "A3X7K9" (6-digit alphanumeric)
```

### QR Code Generation
```typescript
import { generateQRCode } from '@/lib/utils/qrcode'

const url = "https://example.com/event-slug?code=ABC123"
const qrDataUrl = await generateQRCode(url)
// Result: data:image/png;base64,...
```

---

## 🎨 Styling Guide

### Colors
```css
/* Primary Colors */
--brand-teal: #54ACBF;
--brand-navy: #011C40;

/* Status Colors */
--status-draft: #F3F4F6;    /* Gray */
--status-active: #10B981;   /* Green */
--status-archived: #F59E0B; /* Orange */
```

### Common Classes
```css
/* Buttons */
.btn-primary: bg-brand-teal text-white rounded-lg hover:bg-brand-teal/90
.btn-secondary: bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200

/* Cards */
.card: bg-white rounded-lg shadow-sm p-6
.card-hover: hover:shadow-md transition-shadow

/* Status Badges */
.badge-draft: bg-gray-100 text-gray-800
.badge-active: bg-green-100 text-green-800
.badge-archived: bg-orange-100 text-orange-800
```

---

## 🔒 Authentication

### Check Auth
```typescript
const token = localStorage.getItem('auth-token')
const response = await fetch('/api/admin/...', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
})
```

### Protect Routes
All admin routes are automatically protected by `AdminLayout` component which checks authentication on mount.

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution:** Ensure you're logged in and token is valid
```typescript
localStorage.getItem('auth-token') // Should return valid JWT
```

### Issue: Slug Already Exists
**Solution:** Modify slug or append unique identifier
```typescript
// API will return 409 Conflict
// User must change event name or manually edit slug
```

### Issue: QR Code Not Generating
**Solution:** Check event exists and has valid slug/accessCode
```typescript
// Ensure event has:
// - Valid slug
// - Valid accessCode
// - Both must be non-null
```

---

## 📊 Database Queries

### Get Events with Photo Count
```typescript
const events = await prisma.event.findMany({
  include: {
    _count: {
      select: { photos: true, comments: true }
    }
  }
})
```

### Filter Events by Status
```typescript
const activeEvents = await prisma.event.findMany({
  where: { status: 'ACTIVE' }
})
```

### Get Messages by Status
```typescript
const newMessages = await prisma.contactMessage.findMany({
  where: { status: 'new' },
  orderBy: { createdAt: 'desc' }
})
```

---

## 🎯 Testing Checklist

### Manual Testing
- [ ] Login to admin dashboard
- [ ] View dashboard statistics
- [ ] Create new event
- [ ] Edit event details
- [ ] Generate QR code
- [ ] Download QR code
- [ ] Search events
- [ ] Filter events by status
- [ ] Delete event (with confirmation)
- [ ] View messages
- [ ] Mark message as read
- [ ] Reply to message
- [ ] Export messages to CSV
- [ ] Test mobile responsive design

---

## 🚀 Deployment

### Environment Variables
```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"
```

### Build & Deploy
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Start production
npm start
```

---

## 📞 Support

For issues or questions, refer to:
- Story file: `.bmad-core/stories/epic-3-admin-dashboard.md`
- Implementation summary: `EPIC_3_IMPLEMENTATION_SUMMARY.md`
- Code comments in relevant files

---

**Last Updated:** December 12, 2024  
**Version:** 1.0.0  
**Status:** Core Features Complete ✅
