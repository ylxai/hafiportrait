# Story 6.4: Comment Submission & Storage

**Epic**: 6 - Engagement Features  
**Status**: Ready  
**Priority**: High  
**Story Points**: 5

## Story
**As a** guest,  
**I want** my comment to post reliably dan appear immediately,  
**so that** saya see confirmation that my message was received.

## Acceptance Criteria
- [ ] API endpoint: POST `/api/gallery/[eventSlug]/comments`
- [ ] Request body validation: name, email, message, relationship
- [ ] Backend validation: sanitize inputs, prevent XSS
- [ ] Moderation system: pending/approved status
- [ ] Rate limiting: 5 comments per guest per hour
- [ ] Profanity filter (optional)
- [ ] Duplicate detection
- [ ] Optimistic UI feedback
- [ ] Admin notification for new comments
- [ ] Error handling dengan specific messages
- [ ] Comment ID returned in response

## Technical Implementation

### Tasks
- [ ] Create comment submission API endpoint
- [ ] Implement input sanitization
- [ ] Add rate limiting for comments
- [ ] Create moderation logic
- [ ] Implement profanity filter
- [ ] Add duplicate detection
- [ ] Create notification system
- [ ] Write API tests

### Files to Create/Modify
1. `app/api/gallery/[eventSlug]/comments/route.ts`
2. `lib/services/comment-service.ts`
3. `lib/validation/comment-validation.ts`
4. `lib/moderation/profanity-filter.ts`
5. `lib/rate-limit/comment-limiter.ts`

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
