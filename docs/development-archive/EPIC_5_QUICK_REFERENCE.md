# Epic 5: Guest Gallery System - Quick Reference

**Status**: ✅ 67% Complete (4/6 stories)  
**Updated**: December 13, 2024

---

## 🚀 Quick Access URLs

### Guest Routes
```
http://124.197.42.88:3000/[event-slug]                    # Access entry page
http://124.197.42.88:3000/[event-slug]?code=ABC123        # QR code direct access
http://124.197.42.88:3000/[event-slug]/gallery            # Gallery grid page
```

### API Endpoints
```
POST   /api/gallery/[eventSlug]/access                    # Validate access code
GET    /api/gallery/[eventSlug]/access?code=XXX           # QR code validation
GET    /api/gallery/[eventSlug]/photos                    # Get photos (paginated)
GET    /api/gallery/[eventSlug]/photos/[id]/download      # Download photo
```

---

## 📁 Key Files & Components

### Pages
```
app/[eventSlug]/page.tsx              # Access entry page
app/[eventSlug]/gallery/page.tsx      # Gallery grid page
```

### Components
```
components/gallery/GuestAccessForm.tsx    # Access code form
components/gallery/GalleryHeader.tsx      # Event info header
components/gallery/PhotoGrid.tsx          # Infinite scroll grid
components/gallery/PhotoTile.tsx          # Photo tile component
components/gallery/PhotoLightbox.tsx      # Full-screen viewer
```

### Libraries
```
lib/gallery/auth.ts                   # JWT, cookies, validation
lib/gallery/rate-limit.ts             # Rate limiting logic
```

### API Routes
```
app/api/gallery/[eventSlug]/access/route.ts
app/api/gallery/[eventSlug]/photos/route.ts
app/api/gallery/[eventSlug]/photos/[photoId]/download/route.ts
```

---

## 🗄️ Database Tables

### GuestSession
```sql
-- Tracks guest access sessions
id, sessionId, eventId, guestToken, ipAddress, userAgent
createdAt, expiresAt, lastAccessAt
```

### PhotoDownload
```sql
-- Tracks photo downloads
id, photoId, guestId, ipAddress, userAgent, downloadedAt
```

### PhotoView
```sql
-- Ready for view tracking (not yet implemented)
id, photoId, guestId, ipAddress, viewedAt
```

### EventSettings
```sql
-- Event configuration (schema ready, UI pending)
id, eventId, allowGuestDownloads, allowGuestLikes
allowGuestComments, requirePasswordAccess, accessPassword
welcomeMessage, showPhotographerCredit
```

---

## 🔑 Authentication Flow

### Access Code Entry
1. Guest visits `/[event-slug]`
2. Enters 6-character access code
3. POST to `/api/gallery/[eventSlug]/access`
4. Server validates code, creates JWT token
5. Sets httpOnly cookie `gallery_access_[eventId]`
6. Redirects to `/[event-slug]/gallery`

### QR Code Direct Access
1. Guest scans QR code
2. Redirected to `/[event-slug]?code=ABC123`
3. GET to `/api/gallery/[eventSlug]/access?code=ABC123`
4. Server validates, sets cookie, redirects to gallery

### Session Validation
1. Every protected route checks for cookie
2. JWT token validated
3. If invalid/expired, redirect to entry page

---

## 🔐 Security Features

### JWT Tokens
- **Algorithm**: HS256
- **Expiration**: 30 days
- **Payload**: eventId, eventSlug, sessionId, iat, exp
- **Storage**: HttpOnly secure cookie

### Rate Limiting
- **Access Attempts**: 10 per hour per IP
- **Downloads**: 50 per hour per guest
- **Implementation**: In-memory store with cleanup

### Cookie Configuration
```javascript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  expires: expiresAt, // 30 days
  path: '/',
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile */
< 768px        { grid-cols: 2 }

/* Tablet */
768px - 1023px { grid-cols: 3 }

/* Desktop */
≥ 1024px       { grid-cols: 4 }
```

---

## 🎨 Component Props

### GuestAccessForm
```typescript
interface GuestAccessFormProps {
  eventSlug: string;
  eventName?: string;
  eventDate?: string | null;
  coverPhotoUrl?: string | null;
}
```

### PhotoGrid
```typescript
interface PhotoGridProps {
  eventId: string;
  eventSlug: string;
}
```

### PhotoLightbox
```typescript
interface PhotoLightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  eventSlug: string;
}
```

---

## ⌨️ Keyboard Shortcuts

### Lightbox Navigation
- **Arrow Left**: Previous photo
- **Arrow Right**: Next photo
- **Escape**: Close lightbox
- **D**: Download current photo (planned)

---

## 📊 API Response Formats

### Access Validation (Success)
```json
{
  "success": true,
  "event": {
    "id": "...",
    "name": "...",
    "slug": "...",
    "eventDate": "...",
    "location": "...",
    "description": "..."
  }
}
```

### Access Validation (Error)
```json
{
  "error": "Invalid access code"
}
```

### Photos List
```json
{
  "photos": [
    {
      "id": "...",
      "filename": "...",
      "originalUrl": "...",
      "thumbnailSmallUrl": "...",
      "thumbnailMediumUrl": "...",
      "thumbnailLargeUrl": "...",
      "width": 4000,
      "height": 3000,
      "likesCount": 5,
      "caption": "..."
    }
  ],
  "hasMore": true,
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

## 🔧 Configuration

### Environment Variables
```bash
DATABASE_URL=...              # Postgres connection
JWT_SECRET=...                # JWT signing secret
R2_ACCOUNT_ID=...             # Cloudflare R2
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
R2_PUBLIC_URL=...
```

### Rate Limiting Config
```typescript
// Access attempts
maxAttempts: 10,
windowMs: 60 * 60 * 1000  // 1 hour

// Downloads
maxDownloads: 50,
windowMs: 60 * 60 * 1000  // 1 hour
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Access with valid code
- [ ] Access with invalid code
- [ ] QR code scan flow
- [ ] Gallery grid loading
- [ ] Infinite scroll
- [ ] Photo lightbox
- [ ] Navigation (arrows, swipe)
- [ ] Download functionality
- [ ] Rate limiting enforcement
- [ ] Mobile responsive
- [ ] Error handling

### Test Events
```
Event: wedding-sarah-john
Access Code: ABC123
Photos: 150+
```

---

## 🐛 Common Issues & Solutions

### Issue: "Unauthorized" when accessing gallery
**Solution**: Clear cookies and re-enter access code

### Issue: Photos not loading
**Solution**: Check network tab, verify API endpoint accessible

### Issue: Download not working
**Solution**: Check rate limit, verify R2 URL accessible

### Issue: Infinite scroll not triggering
**Solution**: Ensure IntersectionObserver supported, check hasMore flag

---

## 📈 Performance Tips

### Image Optimization
- Use `thumbnailMediumUrl` for grid (400px)
- Use `originalUrl` for lightbox/download
- Implement lazy loading (already done)
- Enable browser caching

### API Optimization
- Paginate with 50 photos per request
- Use indexes on eventId, deletedAt
- Consider Redis for rate limiting (production)

### Client-Side
- Implement photo preloading (future)
- Use service worker for offline (future)
- Optimize re-renders with React.memo

---

## 🚀 Deployment Checklist

- [x] Database migrations applied
- [x] Environment variables set
- [x] Build successful
- [x] Routes accessible
- [ ] Redis for rate limiting (recommended)
- [ ] CDN configured
- [ ] Monitoring setup
- [ ] Error tracking (Sentry)

---

## 📞 Support & Troubleshooting

### Check Logs
```bash
# Next.js logs
npm run dev

# Database migrations
npx prisma migrate status

# Check build
npm run build
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm run dev
```

---

## 🔮 Next Steps (Epic 6)

### Planned Features
1. **Photo Likes**: Real-time like system
2. **Comments**: Guest comments with moderation
3. **Social Sharing**: WhatsApp, Instagram, Facebook
4. **Live Updates**: Socket.IO integration
5. **Photo View Analytics**: Track engagement

---

## 📚 Related Documentation

- [EPIC_5_IMPLEMENTATION_SUMMARY.md](./EPIC_5_IMPLEMENTATION_SUMMARY.md)
- [RINGKASAN_EPIC_5_BAHASA_INDONESIA.md](./RINGKASAN_EPIC_5_BAHASA_INDONESIA.md)
- [docs/prd/epic-5-guest-gallery.md](./docs/prd/epic-5-guest-gallery.md)
- Story files: `docs/stories/story-5.*.md`

---

**Last Updated**: December 13, 2024  
**Status**: Ready for QA Testing
