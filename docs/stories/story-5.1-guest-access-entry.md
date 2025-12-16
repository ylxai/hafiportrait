# Story 5.1: Guest Access Entry Page

**Epic**: Epic 5 - Guest Gallery Experience  
**Status**: Complete  
**Estimated Effort**: 1 day  
**Priority**: P0 (Critical - Foundation)

---

## Story Description

**As a** wedding guest,  
**I want** to easily access event gallery using access code atau direct link,  
**so that** saya dapat view wedding photos tanpa complicated registration process.

---

## Acceptance Criteria

- [x] Access entry page at `/[event-slug]` detects if user has valid access token/cookie
- [x] If no valid access: displays access gate dengan event name, date, dan cover photo
- [x] Access form contains: Access Code input field (6 characters, auto-uppercase), Submit button "View Gallery"
- [x] Optional password field appears jika event has password protection enabled
- [x] QR code scan direct access: URL with `?code=[access-code]` parameter auto-validates dan bypasses entry form
- [x] Shared link access: URL with token parameter `?token=[jwt-token]` grants immediate access
- [x] Form validation: access code format validation (6 alphanumeric), required field validation
- [x] Submit triggers POST request to `/api/gallery/[event-slug]/access` dengan code
- [x] Successful validation: sets httpOnly cookie `gallery_access_[event-id]` dengan JWT
- [x] Failed validation: error message "Invalid access code. Please try again."
- [x] Rate limiting: maximum 10 access attempts per IP per hour
- [x] Mobile responsive: centered form, large input fields (min 44px height)
- [x] Event not found: displays 404 page
- [x] Archived event: displays "This event has been archived" message

---

## Technical Implementation

### Database Schema
```prisma
model GuestSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  eventId     String
  guestToken  String   // JWT token
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())
  expiresAt   DateTime
  lastAccessAt DateTime @default(now())
  
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@index([eventId])
  @@index([sessionId])
  @@map("guest_sessions")
}
```

### API Endpoints
- `POST /api/gallery/[event-slug]/access` - Validate access code and create session ✅
- `GET /api/gallery/[event-slug]/access?code=XXX` - QR code direct access ✅

### Components
- `app/[event-slug]/page.tsx` - Main entry page ✅
- `components/gallery/GuestAccessForm.tsx` - Access form component ✅
- `lib/gallery/auth.ts` - Gallery authentication utilities ✅
- `lib/gallery/rate-limit.ts` - Rate limiting utilities ✅

---

## Dev Notes

- JWT with 30-day expiration for guest tokens ✅
- Token stored in httpOnly secure cookie ✅
- Rate limiting using in-memory store (10 attempts/hour) ✅
- Mobile-first design dengan touch-optimized inputs ✅

---

## Testing Requirements

- [x] Test access with valid code
- [x] Test access with invalid code
- [x] Test QR code direct access with ?code parameter
- [x] Test token validation
- [x] Test rate limiting
- [x] Test mobile responsive layout
- [x] Test event not found scenario
- [x] Test archived event scenario

---

## Dev Agent Record

### Agent Model Used
- Claude 3.5 Sonnet

### Debug Log References
- None

### Completion Notes
- Story 5.1 completed successfully
- Database schema updated with GuestSession, PhotoDownload, PhotoView, EventSettings tables
- Gallery authentication system implemented with JWT tokens
- Rate limiting implemented for access attempts
- Mobile-responsive access form created

### File List
- `app/[eventSlug]/page.tsx` - Entry page with access gate
- `app/api/gallery/[eventSlug]/access/route.ts` - Access validation API
- `components/gallery/GuestAccessForm.tsx` - Access form component
- `lib/gallery/auth.ts` - Gallery auth utilities (JWT, cookies, validation)
- `lib/gallery/rate-limit.ts` - Rate limiting utilities
- `prisma/schema.prisma` - Updated with guest gallery tables

### Change Log
- 2024-12-13: Story created and implemented
- 2024-12-13: Database migration completed (add_guest_gallery_tables)
- 2024-12-13: All acceptance criteria met, story marked complete
