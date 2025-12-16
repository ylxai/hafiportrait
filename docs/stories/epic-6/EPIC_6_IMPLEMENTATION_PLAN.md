# Epic 6: Realtime Engagement Features - Implementation Plan

**Status**: In Progress  
**Started**: December 13, 2024  
**Target Completion**: December 14, 2024

## Executive Summary

Epic 6 menambahkan real-time engagement features ke Hafiportrait platform, enabling guests untuk like photos dan leave comments/ucapan. Features ini akan meningkatkan guest interaction dan create vibrant wedding photo experience.

## Implementation Strategy

### Phase 1: Core Like Functionality (Stories 6.1, 6.2)
**Duration**: 4-5 hours  
**Priority**: Critical

1. **Story 6.1: Likes Frontend** (CURRENT)
   - LikeButton component dengan heart icon
   - Optimistic UI updates
   - localStorage persistence
   - Guest identifier system
   - Double-tap gesture (mobile)
   - Heart animations

2. **Story 6.2: Likes Backend**
   - Like API endpoints
   - Rate limiting
   - Like count aggregation
   - Admin analytics

### Phase 2: Comments System (Stories 6.3, 6.4)
**Duration**: 4-5 hours  
**Priority**: Critical

3. **Story 6.3: Comments UI**
   - CommentForm component
   - CommentList display
   - Form validation
   - Character counter
   - Emoji support

4. **Story 6.4: Comments Backend**
   - Comment submission API
   - Input sanitization
   - Moderation system
   - Rate limiting
   - Profanity filter

### Phase 3: Real-time Features (Story 6.5)
**Duration**: 6-8 hours  
**Priority**: High

5. **Story 6.5: Socket.IO Integration**
   - Socket.IO server setup
   - Room-based connections
   - Real-time like updates
   - Real-time comment updates
   - Connection management

### Phase 4: Admin Features (Story 6.6)
**Duration**: 3-4 hours  
**Priority**: Medium

6. **Story 6.6: Comment Moderation**
   - Moderation dashboard
   - Approve/reject actions
   - Bulk operations
   - Export functionality

## Technical Architecture

### Database Models (Already Exist)
```prisma
model PhotoLike {
  id        String   @id @default(cuid())
  guestId   String
  photoId   String
  createdAt DateTime @default(now())
  
  @@unique([photoId, guestId])
}

model Comment {
  id         String   @id @default(cuid())
  guestName  String
  message    String   @db.Text
  isApproved Boolean  @default(false)
  eventId    String
  photoId    String?
  createdAt  DateTime @default(now())
}
```

### Key Components

#### Frontend Components
- `components/gallery/LikeButton.tsx`
- `components/gallery/HeartAnimation.tsx`
- `components/gallery/comments/CommentForm.tsx`
- `components/gallery/comments/CommentList.tsx`
- `components/providers/SocketProvider.tsx`

#### API Endpoints
- `POST /api/gallery/[eventSlug]/photos/[photoId]/like`
- `DELETE /api/gallery/[eventSlug]/photos/[photoId]/like`
- `POST /api/gallery/[eventSlug]/comments`
- `GET /api/gallery/[eventSlug]/comments`
- `PUT /api/admin/events/[id]/comments/[commentId]`

#### Hooks
- `hooks/useGuestIdentifier.ts` - Guest ID management
- `hooks/usePhotoLikes.ts` - Like functionality
- `hooks/useComments.ts` - Comment management
- `hooks/useSocket.ts` - Socket connection
- `hooks/useRealtimeLikes.ts` - Real-time like updates
- `hooks/useRealtimeComments.ts` - Real-time comment updates

### Real-time Architecture

```
Guest Browser (A) ──┐
                    │
Guest Browser (B) ──┼──> Socket.IO Server ──> Redis (optional)
                    │         │
Guest Browser (C) ──┘         │
                              ▼
                    Room: event-{eventId}
                    
Events:
- like:added { photoId, guestId, newCount }
- like:removed { photoId, guestId, newCount }
- comment:added { comment }
- comment:approved { commentId }
```

## Success Metrics

### Performance Targets
- Like button response: < 50ms (optimistic UI)
- Real-time update latency: < 200ms
- Comment submission: < 500ms
- Socket connection time: < 1s

### User Experience
- Zero page reloads for interactions
- Smooth animations (60fps)
- Mobile-optimized gestures
- Offline-friendly (queued actions)

### Security & Abuse Prevention
- Rate limiting: 100 likes/hour, 5 comments/hour
- Input sanitization (XSS prevention)
- Duplicate detection
- IP tracking for abuse detection

## Dependencies

### Already Installed ✅
- socket.io ^4.7.2
- socket.io-client ^4.7.2
- sanitize-html ^2.17.0
- zod ^3.22.4

### Database ✅
- PhotoLike model exists
- Comment model exists
- EventSettings has allowGuestLikes, allowGuestComments

## Testing Strategy

### Unit Tests
- LikeButton component
- CommentForm validation
- Guest identifier generation
- Rate limiting logic

### Integration Tests
- Like/unlike flow
- Comment submission flow
- Real-time updates
- Moderation actions

### E2E Tests
- Guest like photos across devices
- Comment submission and display
- Admin moderation workflow
- Real-time sync between multiple browsers

## Rollout Plan

### Step 1: Core Features (No Real-time)
- Implement likes dengan polling
- Implement comments dengan manual refresh
- Test thoroughly

### Step 2: Add Real-time
- Integrate Socket.IO
- Migrate to real-time updates
- Test with multiple concurrent users

### Step 3: Polish & Optimize
- Add animations
- Optimize performance
- Mobile optimization

### Step 4: Admin Features
- Moderation dashboard
- Analytics
- Export functionality

## Risk Mitigation

### Risk: Socket.IO Connection Issues
**Mitigation**: Fallback to polling every 30 seconds

### Risk: Spam/Abuse
**Mitigation**: Rate limiting, honeypot, IP tracking, moderation

### Risk: Performance dengan Many Concurrent Users
**Mitigation**: Room-based connections, Redis for scaling (future)

### Risk: Database Load dari Like Count Updates
**Mitigation**: Optimistic UI, debounced writes, cached counts

## Current Status

✅ Database models ready  
✅ Socket.IO installed  
✅ Epic 5 foundation solid  
🚀 Starting with Story 6.1 (Likes Frontend)

## Next Steps

1. Implement Story 6.1: LikeButton component
2. Create guest identifier system
3. Build optimistic UI
4. Add animations
5. Integrate into existing gallery

---

**Let's build amazing real-time engagement features!** 🎉
