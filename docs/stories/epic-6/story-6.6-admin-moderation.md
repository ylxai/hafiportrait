# Story 6.6: Admin Comment Moderation

**Epic**: 6 - Engagement Features  
**Status**: Ready  
**Priority**: Medium  
**Story Points**: 5

## Story
**As an** admin/photographer,  
**I want** to review dan moderate guest comments,  
**so that** gallery maintains appropriate content.

## Acceptance Criteria
- [ ] Moderation dashboard at `/admin/events/[id]/comments`
- [ ] Comments table: name, message preview, status, timestamp, actions
- [ ] Status badges: Pending/Approved/Rejected
- [ ] Filter tabs: All/Pending/Approved/Rejected
- [ ] Quick actions: Approve, Reject, Delete
- [ ] Bulk actions for multiple comments
- [ ] Comment detail modal
- [ ] Notification badge for pending count
- [ ] Auto-approve toggle in event settings
- [ ] Flagged comments highlighted
- [ ] Search functionality
- [ ] Export comments as CSV

## Technical Implementation

### Tasks
- [ ] Create moderation dashboard page
- [ ] Build comments management table
- [ ] Implement approve/reject/delete actions
- [ ] Add bulk action functionality
- [ ] Create comment detail modal
- [ ] Add search and filtering
- [ ] Implement CSV export
- [ ] Add notification badge
- [ ] Write admin tests

### Files to Create/Modify
1. `app/admin/events/[id]/comments/page.tsx`
2. `components/admin/comments/CommentModerationTable.tsx`
3. `components/admin/comments/CommentDetailModal.tsx`
4. `components/admin/comments/BulkActions.tsx`
5. `app/api/admin/events/[id]/comments/route.ts`
6. `lib/services/comment-moderation-service.ts`

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
