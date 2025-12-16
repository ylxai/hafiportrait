# Story 6.3: Comments/Ucapan Section UI

**Epic**: 6 - Engagement Features  
**Status**: Ready  
**Priority**: High  
**Story Points**: 5

## Story
**As a** wedding guest,  
**I want** to leave congratulations messages on gallery,  
**so that** saya dapat share well-wishes dengan mempelai dan guests.

## Acceptance Criteria
- [ ] Comments section below photo grid atau "Messages" tab
- [ ] Comment form: Name (required, max 50), Message (required, 10-500 chars)
- [ ] Optional: Email input, Relationship dropdown
- [ ] Submit button dengan loading state
- [ ] Form validation dengan character counter
- [ ] Comments display: name, message, timestamp (relative)
- [ ] Sort: newest first (default), oldest first option
- [ ] Optional: Comment threading/replies
- [ ] Emoji support in textarea
- [ ] Comment count badge in gallery header
- [ ] Empty state message
- [ ] Mobile responsive design
- [ ] Spam prevention: honeypot field

## Technical Implementation

### Tasks
- [ ] Create CommentForm component
- [ ] Create CommentList component
- [ ] Create CommentCard component
- [ ] Implement form validation
- [ ] Add character counter
- [ ] Add emoji support
- [ ] Create sort/filter UI
- [ ] Add honeypot spam prevention
- [ ] Implement mobile responsive layout
- [ ] Write component tests

### Components to Create
1. `components/gallery/comments/CommentForm.tsx`
2. `components/gallery/comments/CommentList.tsx`
3. `components/gallery/comments/CommentCard.tsx`
4. `components/gallery/comments/CommentSection.tsx`
5. `hooks/useComments.ts`

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
