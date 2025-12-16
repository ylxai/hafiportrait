# Epic 7: Client Features & Batch Download

**Epic Goal**: Build specialized features untuk klien (mempelai) termasuk batch photo download capability, photo editing request workflow dengan WhatsApp notification integration, dan client-specific dashboard untuk managing their event. Epic ini empowers clients dengan tools untuk efficiently manage dan utilize their wedding photos.

---

## Story 7.1: Client Role & Authentication

**As a** client (mempelai),  
**I want** dedicated login credentials dan role-based access,  
**so that** saya memiliki elevated privileges untuk manage my own event compared to regular guests.

### Acceptance Criteria

1. Database: users.role enum includes "client" value (alongside "admin")
2. Client user created during event creation: admin specifies client email, system generates temporary password
3. Client invitation email sent: contains login credentials, event gallery link, welcome message
4. Client login page: same `/admin/login` page but routes to client dashboard based on role
5. Client dashboard accessible at `/client/dashboard` (separate dari admin dashboard)
6. Role-based routing: clients cannot access admin routes, admins can access both
7. API middleware: validates user role for protected endpoints (admin-only vs client-allowed)
8. Client account: associated dengan their event(s) via events.client_id foreign key
9. Password reset flow: clients can reset password via "Forgot Password" link
10. Client profile page: allows updating name, email, password, notification preferences
11. Multiple event support: clients dengan multiple events see all their events dalam dashboard
12. Session management: JWT token includes role claim untuk authorization checks

---

## Story 7.2: Client Dashboard Overview

**As a** client (mempelai),  
**I want** personalized dashboard showing my event information dan quick actions,  
**so that** saya dapat easily access my wedding gallery dan management features.

### Acceptance Criteria

1. Client dashboard displays: "Welcome, [Client Name]!" greeting
2. Event card(s) showing: event name, event date, cover photo, status badge, photo count
3. Quick action buttons per event: View Gallery, Download Photos, Request Editing, Manage Comments
4. Gallery statistics: total photos uploaded, total downloads, total likes, total comments
5. Recent activity feed: shows recent uploads, comments, likes on their event (last 10 activities)
6. Direct access link: shareable gallery URL dengan copy button
7. QR code display: shows event QR code dengan download option
8. Access code display: shows current access code, "Regenerate" button (dengan confirmation)
9. Event settings access: link to view/edit event settings (limited compared to admin)
10. Help section: FAQs atau links to documentation for using platform
11. Notification preferences: toggle email dan WhatsApp notifications
12. Mobile responsive: card layout stacks vertically, touch-friendly buttons

---

## Story 7.3: Batch Photo Selection Interface

**As a** client (mempelai),  
**I want** to select multiple photos at once untuk batch operations,  
**so that** saya dapat efficiently work dengan large numbers of photos.

### Acceptance Criteria

1. Client gallery view at `/client/events/:id/gallery` displays all event photos dalam grid
2. "Select Photos" button enables selection mode dengan checkboxes on each photo tile
3. Checkbox overlay appears on photo tiles (top-right corner) when selection mode active
4. Click photo tile toggles selection state (checked/unchecked) dengan visual feedback
5. Select all checkbox dalam toolbar: "Select All" / "Deselect All" toggle
6. Selection counter: "X photos selected" displays dalam sticky toolbar at top
7. Bulk actions toolbar appears when photos selected: Download Selected, Request Editing, Add to Album (future)
8. Selection persists across pagination atau scrolling (tracks selected photo IDs)
9. Filter dan sort options available: sort by date, filter by liked photos, filter by commented photos
10. Visual distinction: selected photos have colored border atau overlay (brand color #54ACBF)
11. Keyboard shortcuts: Ctrl/Cmd+A selects all, Escape exits selection mode
12. Mobile gesture: long-press photo enters selection mode, subsequent taps toggle selection
13. Performance: handles selection of hundreds of photos smoothly

---

## Story 7.4: Batch Photo Download Implementation

**As a** client (mempelai),  
**I want** to download multiple selected photos as single ZIP file,  
**so that** saya dapat efficiently save all wedding photos untuk personal archive.

### Acceptance Criteria

1. "Download Selected" button active when at least one photo selected
2. Click download button shows confirmation modal: "Download X photos (estimated size: Y MB)?"
3. Size calculation: backend estimates total ZIP file size based on photo sizes
4. Confirmation includes options: Resolution (Original / High / Medium), Include EXIF data (yes/no)
5. Start download button triggers download preparation
6. Backend creates ZIP file containing selected photos dengan organized naming: `[event-name]-photo-001.jpg`, `[event-name]-photo-002.jpg`, etc.
7. Progress indicator: shows ZIP creation progress (percentage) dengan ability to cancel
8. ZIP generation: async background job handles creation untuk large batches (50+ photos)
9. Download link delivered: when ready, download link appears atau auto-starts download
10. Link expiration: download link valid for 24 hours, then deleted untuk save storage
11. Email notification (optional): download link sent to client email if generation takes >1 minute
12. Maximum batch size: 500 photos per download untuk prevent timeout, shows warning if exceeded
13. API endpoint: POST `/api/client/events/:id/batch-download` with photo IDs array
14. Download analytics: tracks batch downloads dalam analytics (count, photos downloaded, file size)
15. Error handling: "Download preparation failed" dengan retry option if ZIP creation fails

---

## Story 7.5: Photo Editing Request Form

**As a** client (mempelai),  
**I want** to request photo editing atau retouching dari fotografer,  
**so that** saya dapat get specific photos enhanced according to my preferences.

### Acceptance Criteria

1. "Request Editing" button available dalam photo detail view dan batch selection toolbar
2. Single photo request: click button opens editing request form modal
3. Multiple photos request: select photos in batch mode, click "Request Editing for Selected"
4. Request form fields: Request Type dropdown (Retouching / Color Correction / Background Change / Custom), Description textarea (required, max 500 chars), Priority (Normal / Urgent)
5. Photo preview: shows thumbnail(s) of photos being requested
6. Additional uploads: allow uploading reference images atau examples (optional, max 3 files)
7. Due date field (optional): client can specify desired completion date
8. Submit button: "Send Request" dengan loading state
9. Form validation: required fields, description minimum 20 characters
10. Confirmation modal: "Request sent successfully! Photographer will be notified."
11. Request tracking: client can view status of all editing requests dalam dashboard
12. Database schema: `editing_requests` table dengan fields: id, event_id, client_id, photo_ids (array), request_type, description, priority, status (pending/in_progress/completed/declined), due_date, created_at, updated_at
13. API endpoint: POST `/api/client/events/:id/editing-requests` creates request record

---

## Story 7.6: WhatsApp Notification Integration (Editing Requests)

**As a** fotografer,  
**I want** to receive WhatsApp notification when client submits editing request,  
**so that** saya dapat respond promptly dan maintain excellent client service.

### Acceptance Criteria

1. WhatsApp notification sent immediately after editing request submitted
2. Notification message format: 
   ```
   🎨 New Editing Request
   Event: [Event Name]
   Client: [Client Name]
   Photos: [X] photos
   Type: [Request Type]
   Priority: [Normal/Urgent]
   
   View details: [Dashboard Link]
   ```
3. WhatsApp Business API integration: using Twilio, MessageBird, atau similar service
4. Phone number configuration: admin sets WhatsApp number dalam settings
5. Dashboard link: deep link to specific editing request dalam admin dashboard
6. Notification preferences: admin can enable/disable WhatsApp notifications per notification type
7. Rate limiting: batch multiple requests within 5 minutes into single notification untuk avoid spam
8. Retry mechanism: failed notification attempts retry 3 times dengan exponential backoff
9. Fallback: if WhatsApp fails, send SMS atau email notification
10. Delivery confirmation: system logs notification delivery status
11. Environment variables: WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER, WHATSAPP_FROM_NUMBER
12. Testing mode: sandbox mode for testing without sending actual WhatsApp messages
13. Cost consideration: notification count tracking untuk monitor API usage costs

---

## Story 7.7: Editing Request Management (Admin)

**As an** admin/fotografer,  
**I want** to view, manage, dan respond to editing requests dalam dashboard,  
**so that** saya dapat organize editing workflow dan communicate with clients.

### Acceptance Criteria

1. Editing requests page at `/admin/editing-requests` shows all requests across events
2. Request list displays: client name, event name, request type, priority badge, status, submission date
3. Filter tabs: All / Pending / In Progress / Completed / Declined
4. Priority badges: Urgent (red), Normal (gray) dengan visual prominence
5. Click request opens detail view: full description, photo previews, reference images, client contact
6. Status update dropdown: change status to In Progress / Completed / Declined
7. Response textarea: admin can add notes atau replies to client
8. Status change notification: email sent to client when status changes to Completed atau Declined
9. Photo preview: clicking photo opens full-size view with direct link to original
10. Bulk actions: select multiple requests, bulk update status
11. Search functionality: search requests by client name, event name, atau description
12. Sort options: by date, priority, status
13. Request counter: badge showing pending request count dalam admin navigation
14. Export requests: download requests as CSV untuk record-keeping
15. API endpoint: GET `/api/admin/editing-requests`, PUT `/api/admin/editing-requests/:id`

---

## Story 7.8: Client Notification System

**As a** client (mempelai),  
**I want** to receive notifications about my event activities,  
**so that** saya stay informed about new photos, editing request updates, dan gallery engagement.

### Acceptance Criteria

1. Email notifications sent for: New photos uploaded, Editing request status change, New comments on gallery (digest mode)
2. Notification preferences page: clients can toggle notification types on/off
3. Email templates: professional branded emails dengan event name, relevant details, action links
4. Photo upload notification: "X new photos added to your gallery" dengan link to view
5. Editing request update: "Your editing request is now [status]" dengan admin notes
6. Comment digest: daily atau weekly summary of new comments (configurable frequency)
7. WhatsApp notifications (optional): brief notifications to client WhatsApp if enabled
8. Notification frequency settings: Immediate / Daily Digest / Weekly Digest / Off
9. Unsubscribe option: email footer includes unsubscribe link
10. Notification queue: queued via background job untuk reliable delivery
11. Notification history: clients can view past notifications dalam dashboard
12. In-app notifications: notification bell icon dalam dashboard shows unread notifications
13. Push notifications (future): browser push notifications for real-time updates

---

## Story 7.9: Client Comment Management

**As a** client (mempelai),  
**I want** to manage comments pada my event gallery,  
**so that** saya dapat ensure appropriate content dan respond to guests.

### Acceptance Criteria

1. Comments management page at `/client/events/:id/comments` displays all event comments
2. Comment list shows: commenter name, message, timestamp, status (if moderation enabled)
3. Actions per comment: Approve (if moderation enabled), Delete, Reply (optional)
4. Filter options: All Comments / Approved / Pending / Recent (last 24 hours)
5. Search functionality: search comments by name atau message content
6. Reply feature: clients can reply to comments, appears as threaded reply
7. Reply indication: client replies shown dengan special badge "From Mempelai" atau similar
8. Delete confirmation: "Delete this comment?" dengan explanation it's permanent
9. Bulk actions: select multiple comments, bulk approve atau delete
10. Comment analytics: summary showing total comments, recent activity trend
11. Export comments: download all comments as PDF atau text file untuk keepsake
12. Notification: client notified of pending comments requiring approval (if moderation enabled)
13. API endpoints: GET `/api/client/events/:id/comments`, DELETE `/api/client/comments/:id`, POST `/api/client/comments/:id/reply`

---

## Story 7.10: Client Gallery Customization

**As a** client (mempelai),  
**I want** to customize certain aspects of my gallery presentation,  
**so that** gallery reflects our wedding theme dan personal preferences.

### Acceptance Criteria

1. Gallery customization page at `/client/events/:id/customize`
2. Welcome message editor: custom message displayed at top of gallery (max 200 chars)
3. Thank you message: custom message shown after guests download photos (optional)
4. Featured photos: client can mark up to 10 photos as featured (appears at top of gallery)
5. Gallery cover photo: select which photo appears as event thumbnail
6. Color theme (optional): choose from predefined color themes atau use default brand colors
7. Hide photos: client can hide specific photos from public view (keeps in their access but hides from guests)
8. Reorder featured photos: drag-and-drop to arrange featured photo order
9. Preview mode: "Preview Gallery" button shows how gallery appears to guests
10. Changes auto-save: settings saved automatically dengan "Saved" indicator
11. Reset button: "Reset to Defaults" restores original settings
12. Settings stored in database: `event_customization` JSON column atau related table
13. API endpoint: PUT `/api/client/events/:id/customization` dengan customization object
14. Changes reflected immediately: guests see updates without cache delays

---

**Epic 7 Status**: Ready untuk Development  
**Estimated Effort**: 7-8 development days  
**Dependencies**: Epic 5 (Guest Gallery), Epic 6 (Engagement Features)  
**Success Metrics**: Clients dapat login, batch download works, editing requests submitted successfully, WhatsApp notifications delivered, client dapat manage gallery settings
