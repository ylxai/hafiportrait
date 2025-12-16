# Epic 6: Engagement Features (Like & Comments)

**Epic Goal**: Enable social engagement dalam event galleries melalui like functionality dan comment/ucapan system yang allows guests to interact dengan photos dan express sentiments, plus provide comment moderation tools untuk admin. Epic ini increases guest engagement dan creates interactive experience around wedding memories.

---

## Story 6.1: Photo Like Functionality (Frontend)

**As a** wedding guest,  
**I want** to like photos that I enjoy,  
**so that** saya dapat express appreciation dan contribute to photo popularity.

### Acceptance Criteria

1. Like button (heart icon) displayed on photo tiles dalam grid view dan detail view
2. Unlike button state: filled heart (red #EF4444) when liked, outline heart (gray) when not liked
3. Like count displayed next to heart icon: e.g., "❤ 24"
4. Tap/click heart icon toggles like state dengan smooth animation (heart "pop" effect)
5. Optimistic UI: like count updates immediately, actual API call happens in background
6. Like state persisted: guest's likes remembered across sessions (via localStorage atau cookie)
7. Anonymous likes: no registration required, likes tracked per device/browser using anonymous identifier
8. Double-tap gesture (mobile): double-tap photo untuk quick like (Instagram-style)
9. Like animation: heart animation appears briefly at tap location on double-tap
10. Visual feedback: button scales slightly on tap untuk indicate interaction
11. Disabled state: like button disabled dengan tooltip if event settings disable likes
12. Like history: guests can view their liked photos via "My Likes" filter option

---

## Story 6.2: Photo Like Backend & Analytics

**As an** admin/photographer,  
**I want** like data tracked dan aggregated,  
**so that** saya dapat understand which photos resonate most dengan guests dan optimize future galleries.

### Acceptance Criteria

1. Database schema: `photo_likes` table dengan fields: id, photo_id (FK), guest_identifier (UUID atau hashed ID), ip_address, created_at
2. API endpoint: POST `/api/gallery/[event-slug]/photos/:id/like` creates like record
3. API endpoint: DELETE `/api/gallery/[event-slug]/photos/:id/like` removes like record
4. Guest identifier: generated on first visit, stored dalam localStorage, sent dengan like requests
5. Like validation: prevents duplicate likes dari same guest_identifier untuk same photo
6. Like count aggregation: `photos.likes_count` column updated via database trigger atau async job
7. Rate limiting: maximum 100 likes per guest per hour untuk prevent abuse/spam
8. IP tracking: stores IP address untuk potential abuse detection
9. Like analytics: admin dashboard shows most liked photos, like trends over time
10. Bulk like prevention: detects dan blocks suspicious patterns (e.g., liking 50 photos in 10 seconds)
11. Like data retention: likes persisted for event lifetime, deleted when event permanently deleted
12. API response includes: updated like count, user's current like status for photo
13. Performance: like count updates optimized (debounced writes, cached counts)

---

## Story 6.3: Comments/Ucapan Section UI

**As a** wedding guest,  
**I want** to leave congratulations messages atau comments on gallery,  
**so that** saya dapat share well-wishes dengan mempelai dan other guests.

### Acceptance Criteria

1. Comments section positioned below photo grid atau accessible via "Messages" tab
2. Comment form contains: Name input (required, max 50 chars), Message textarea (required, min 10 chars, max 500 chars)
3. Optional: Email input (for potential reply), Relationship dropdown (Family/Friend/Colleague/Other)
4. Submit button "Post Message" dengan loading state during submission
5. Form validation: required field validation, character limits enforced dengan counter
6. Posted comments display dalam list: commenter name, message text, timestamp (relative: "2 hours ago")
7. Comment list sorted: newest first (default) dengan option untuk oldest first
8. Comment threading (optional): guests can reply to specific comments
9. Emoji support: textarea allows emoji input, renders correctly
10. Comment count badge: shows total comment count dalam gallery header
11. Empty state: "Be the first to leave a message!" when no comments exist
12. Mobile responsive: form fields stack vertically, textarea expandable
13. Character counter: shows remaining characters as user types: "450/500"
14. Spam prevention: honeypot field atau simple challenge (hidden field) untuk detect bots

---

## Story 6.4: Comment Submission & Storage

**As a** guest,  
**I want** my comment to post reliably dan appear immediately,  
**so that** saya see confirmation that my message was received.

### Acceptance Criteria

1. API endpoint: POST `/api/gallery/[event-slug]/comments` creates comment record
2. Request body: `{ name, email, message, relationship, guest_identifier }`
3. Backend validation: sanitize inputs (prevent XSS), validate required fields, check length limits
4. Database schema: `comments` table dengan fields: id, event_id (FK), photo_id (nullable, for photo-specific comments), name, email, message, guest_identifier, ip_address, status (pending/approved/rejected), created_at
5. Moderation system: if event requires moderation, status set to "pending"; otherwise "approved"
6. Rate limiting: maximum 5 comments per guest per hour untuk prevent spam
7. Profanity filter: optional filter checks for inappropriate language, flags for moderation
8. Duplicate detection: prevents posting identical message multiple times within short timeframe
9. Optimistic UI: comment appears immediately in list dengan "pending" indicator if moderation enabled
10. Notification: admin receives notification (email/WhatsApp) for new comments requiring moderation
11. Comment ID returned: response includes comment object dengan ID untuk potential edit/delete
12. Error handling: validation errors returned dengan specific field messages

---

## Story 6.5: Comment Display & Real-time Updates

**As a** wedding guest,  
**I want** to see other guests' comments as they're posted,  
**so that** saya can read well-wishes dan feel connected to wedding community.

### Acceptance Criteria

1. Comments load dengan gallery page, initially showing 20 most recent comments
2. "Load More" button shows additional 20 comments when clicked
3. Real-time updates (optional): new comments appear automatically via polling (every 30 seconds) atau WebSocket
4. Comment cards styled consistently: name in bold, message in regular weight, timestamp in muted color
5. Long messages truncated: "Read more" link expands full message
6. Comment reactions (optional): guests can react to comments dengan predefined reactions (heart, clap, laugh)
7. Sort options: Newest First / Oldest First / Most Popular (by reactions)
8. Filter options: Show All / Family / Friends (based on relationship field)
9. Comment search: search bar filters comments by name atau message content
10. Pagination state persisted: returning users see same scroll position
11. Smooth animations: comments fade in when loaded
12. Loading state: skeleton cards shown while comments loading
13. Empty state filtering: "No comments match your filter" when filter returns no results

---

## Story 6.6: Admin Comment Moderation Dashboard

**As an** admin/photographer,  
**I want** to review dan moderate guest comments,  
**so that** saya dapat ensure gallery maintains appropriate content dan remove spam atau inappropriate messages.

### Acceptance Criteria

1. Moderation dashboard accessible at `/admin/events/:id/comments`
2. Comments displayed dalam table/list: commenter name, message preview (first 100 chars), status, timestamp, actions
3. Status badges: Pending (yellow), Approved (green), Rejected (red)
4. Filter tabs: All / Pending / Approved / Rejected
5. Quick actions per comment: Approve button, Reject button, Delete button, View Full button
6. Bulk actions: select multiple comments, bulk approve/reject/delete
7. Comment detail modal: displays full message, commenter info, IP address, submission time
8. Approve action: changes status to "approved", comment appears publicly
9. Reject action: changes status to "rejected", comment hidden from public view
10. Delete action: soft deletes comment dengan confirmation "Delete permanently?"
11. Notification indicator: badge shows count of pending comments requiring review
12. Auto-approve option: toggle dalam event settings to auto-approve all comments (skips moderation)
13. Flagged comments: comments flagged by profanity filter highlighted untuk priority review
14. Search functionality: search comments by name, message content, atau email
15. Export comments: button to export all comments as CSV untuk backup atau printing

---

## Story 6.7: Comment Notification System

**As an** admin/photographer,  
**I want** to receive notifications when new comments are posted,  
**so that** saya dapat promptly moderate dan respond to guest messages.

### Acceptance Criteria

1. Email notification sent to admin when new comment posted requiring moderation
2. Email subject: "[Hafiportrait] New comment on [Event Name]"
3. Email body: includes commenter name, message content, direct link to moderate dalam admin dashboard
4. WhatsApp notification (if enabled): brief message sent to admin WhatsApp with comment summary
5. Notification settings: admin can configure notification preferences (email only, WhatsApp only, both, none)
6. Digest mode option: batch notifications sent once per hour instead of immediately (untuk high-volume events)
7. Notification throttling: maximum 10 notifications per hour to avoid overwhelming admin
8. Notification preferences stored dalam admin profile atau event settings
9. Unsubscribe option: email notifications include unsubscribe link
10. Priority notifications: flagged comments (profanity detected) trigger immediate notification regardless of settings
11. Notification queue: queued via background job system untuk reliability
12. Failed notification retry: retry sending failed notifications up to 3 times

---

## Story 6.8: Guest Comment Management

**As a** guest,  
**I want** to edit atau delete my own comments,  
**so that** saya dapat correct mistakes atau remove messages I regret posting.

### Acceptance Criteria

1. "Edit" dan "Delete" buttons appear on comments posted by current guest (matched by guest_identifier)
2. Edit button opens inline editor dengan pre-filled message dalam textarea
3. Edit form: includes Save dan Cancel buttons
4. Edit restrictions: comments editable for 1 hour after posting, then locked
5. Edit indication: edited comments show "(edited)" label with timestamp
6. Delete button shows confirmation: "Delete your comment?"
7. Delete action: soft deletes comment, shows "Comment deleted" placeholder
8. Delete undo: "Undo" button available for 10 seconds after delete
9. API endpoints: PUT `/api/gallery/[event-slug]/comments/:id`, DELETE `/api/gallery/[event-slug]/comments/:id`
10. Authorization: validates guest_identifier matches comment owner before allowing edit/delete
11. Edit history (optional): tracks edit history untuk admin visibility (audit trail)
12. Moderation impact: editing comment resets to "pending" status if moderation enabled

---

## Story 6.9: Comment Spam Prevention

**As an** admin/photographer,  
**I want** robust spam prevention for comments,  
**so that** gallery remains free dari spam dan unwanted content.

### Acceptance Criteria

1. Rate limiting: maximum 5 comments per guest per hour, maximum 2 comments per minute
2. Honeypot field: hidden field dalam form, submission rejected if filled (bot detection)
3. Time-based challenge: minimum 3 seconds between page load dan form submission (humans need time to read dan type)
4. IP-based blocking: admin can block specific IP addresses from commenting
5. Profanity filter: configurable word list checks for inappropriate language, auto-flags comments
6. Duplicate detection: identical messages from same guest within 1 hour rejected
7. Link detection: comments containing URLs flagged for moderation atau auto-rejected
8. Character pattern detection: excessive repeated characters (e.g., "aaaaaaaa") flagged as spam
9. Captcha integration (optional): reCAPTCHA atau hCaptcha for high-spam events (admin-enabled)
10. Blacklist: admin can add specific words atau phrases to auto-reject
11. Trust score: guests who posted approved comments build trust, skip some checks
12. Spam reports: guests can report comments as spam, admin reviews reported comments

---

## Story 6.10: Engagement Analytics Dashboard

**As an** admin/photographer,  
**I want** analytics showing engagement metrics (likes dan comments),  
**so that** saya can understand guest interaction patterns dan gallery performance.

### Acceptance Criteria

1. Engagement analytics page at `/admin/events/:id/analytics/engagement`
2. Key metrics cards: Total Likes, Total Comments, Engagement Rate (interactions / unique visitors)
3. Most liked photos: grid showing top 10 photos by like count dengan thumbnails
4. Most commented photos: list of photos dengan most comments attached
5. Engagement timeline: line chart showing likes dan comments over time (daily aggregation)
6. Comment sentiment analysis (optional): basic sentiment analysis (positive/neutral/negative) of comments
7. Top commenters: list of guests who commented most frequently
8. Engagement by time: heatmap showing when guests are most active (hour of day, day of week)
9. Like vs. comment ratio: pie chart showing distribution of interaction types
10. Geographic data (optional): map showing visitor locations based on IP addresses
11. Date range filter: view analytics for specific time periods
12. Export functionality: download engagement report as PDF atau CSV
13. Comparison view: compare engagement across multiple events

---

**Epic 6 Status**: Ready untuk Development  
**Estimated Effort**: 6-7 development days  
**Dependencies**: Epic 5 (Guest Gallery Experience)  
**Success Metrics**: Guests dapat like photos dan post comments tanpa registration, admin dapat moderate comments, engagement analytics available
