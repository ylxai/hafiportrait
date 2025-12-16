# Story 6.2: Photo Like Backend & Analytics

**Epic**: 6 - Engagement Features  
**Status**: Ready  
**Priority**: High  
**Story Points**: 5

## Story
**As an** admin/photographer,  
**I want** like data tracked dan aggregated,  
**so that** saya dapat understand which photos resonate most dengan guests.

## Acceptance Criteria
- [ ] API endpoint: POST `/api/gallery/[eventSlug]/photos/[photoId]/like`
- [ ] API endpoint: DELETE `/api/gallery/[eventSlug]/photos/[photoId]/like`
- [ ] Guest identifier validation
- [ ] Prevent duplicate likes
- [ ] Like count aggregation in photos.likesCount
- [ ] Rate limiting: 100 likes per guest per hour
- [ ] IP tracking for abuse detection
- [ ] Like analytics in admin dashboard
- [ ] Bulk like prevention
- [ ] Like data retention policies
- [ ] Optimized like count updates (cached)
- [ ] Performance optimizations

## Technical Implementation

### Tasks
- [ ] Create like API endpoints
- [ ] Implement guest identifier validation
- [ ] Add rate limiting middleware
- [ ] Create like count aggregation logic
- [ ] Add IP tracking
- [ ] Build admin analytics views
- [ ] Implement caching strategy
- [ ] Add abuse detection
- [ ] Write API tests

### Files to Create/Modify
1. `app/api/gallery/[eventSlug]/photos/[photoId]/like/route.ts`
2. `lib/services/like-service.ts`
3. `lib/rate-limit/like-limiter.ts`
4. `app/admin/events/[id]/analytics/engagement/page.tsx`
5. `lib/analytics/engagement-analytics.ts`

## Dev Agent Record

### Agent Model Used
- Claude 3.5 Sonnet

### Debug Log References
None

### Completion Notes
None

### Change Log
None

### File List
None
