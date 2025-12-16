# Epic 3: Event Management & Admin Dashboard

**Epic Goal**: Build comprehensive admin dashboard untuk fotografer dengan full event lifecycle management capabilities termasuk create, edit, delete events, generate unique access codes & QR codes, configure event settings, dan view event overview. Epic ini provides core event management infrastructure yang menjadi foundation untuk photo upload dan guest access features.

---

## Story 3.1: Admin Dashboard Enhancement & Navigation

**As an** admin/photographer,  
**I want** fully functional dashboard navigation dengan clear menu structure,  
**so that** saya dapat easily access all admin features dan manage multiple events efficiently.

### Acceptance Criteria

1. Admin dashboard sidebar (desktop) atau hamburger menu (mobile) dengan menu items: Dashboard, Events, Portfolio, Analytics, Messages, Settings, Logout
2. Dashboard home page displays key metrics cards: Total Events (active count), Total Photos (across all events), Recent Activity (last 5 actions)
3. Quick actions section: "Create New Event", "Upload Photos", "View Messages" buttons dengan icon
4. Recent events widget shows 5 most recent events dengan quick links to manage each event
5. Sidebar active state: current page highlighted dengan background color (#54ACBF)
6. Mobile responsive: sidebar collapses to hamburger menu, overlay modal on small screens
7. User profile dropdown di top-right corner: displays admin name, role, logout option
8. Dashboard breadcrumb navigation shows current location: "Dashboard > Events > Event Name"
9. Sidebar logo/brand clickable, navigates back to dashboard home
10. Navigation persists across pages, maintaining state (selected menu item)

---

## Story 3.2: Event Creation Form

**As an** admin/photographer,  
**I want** to create new wedding event dengan comprehensive information,  
**so that** saya dapat prepare gallery space untuk upcoming wedding dan generate access methods untuk guests.

### Acceptance Criteria

1. "Create New Event" button pada dashboard navigates to `/admin/events/create`
2. Form fields: Event Name (text, required, max 100 chars), Client Name (text, required), Event Date (date picker, required), Event Slug (text, auto-generated dari event name, editable, unique validation)
3. Additional fields: Event Description (textarea, optional, max 500 chars), Storage Duration (number input, default 30 days, min 30, max 365)
4. Access settings: Privacy toggle (Public - appears on landing page / Private - requires direct link), Auto-generate Access Code (checkbox, checked by default)
5. Client information: Client Email (email, required untuk notifications), Client Phone (tel, optional)
6. Form validation: client-side validation untuk required fields, slug uniqueness check via API
7. Slug auto-generation: converts event name to URL-friendly format (lowercase, hyphens, removes special chars) while typing
8. Preview section shows generated event URL: `https://yourdomain.com/[slug]` dan access code (if enabled)
9. Submit button "Create Event" dengan loading state during submission
10. Success: redirects to event detail page dengan success notification: "Event created successfully!"
11. Error handling: displays validation errors inline, server errors as notification banner
12. API endpoint: POST `/api/admin/events` creates event record dengan auto-generated access_code (6-digit alphanumeric)
13. Database: event record created dengan status: "draft", expires_at calculated dari event_date + storage_duration

---

## Story 3.3: QR Code Generation & Display

**As an** admin/photographer,  
**I want** QR code automatically generated untuk each event,  
**so that** guests dapat quickly scan dan access event gallery tanpa manual typing URLs.

### Acceptance Criteria

1. QR code generated immediately after event creation using QR code library (qrcode npm package atau equivalent)
2. QR code encodes event gallery URL: `https://yourdomain.com/[event-slug]?code=[access-code]`
3. QR code stored as image file (PNG) in storage system with naming: `qr-codes/[event-id].png`
4. QR code URL saved in database: events.qr_code_url field
5. Event detail page displays QR code image dengan "Download QR Code" button
6. Download button triggers file download dengan filename: `[event-name]-qr-code.png`
7. QR code styling: includes small logo atau "Hafiportrait" text in center (optional enhancement)
8. QR code size: 512x512px untuk high-resolution printing
9. "Regenerate QR Code" button available jika admin changes access code
10. API endpoint: POST `/api/admin/events/:id/regenerate-qr` generates new QR code
11. QR code preview displayed in event creation success modal
12. Print-friendly layout: separate page atau modal untuk printing QR code dengan event name dan instructions

---

## Story 3.4: Events List View

**As an** admin/photographer,  
**I want** to see all my events in organized list atau grid view,  
**so that** saya dapat quickly find dan manage specific events.

### Acceptance Criteria

1. Events list page at `/admin/events` displays all events sorted by created_at DESC (most recent first)
2. View toggle: List view (table) dan Grid view (cards) switchable via buttons
3. List view columns: Event Name, Client Name, Event Date, Status, Photos Count, Actions
4. Grid view cards show: thumbnail/cover image, event name, event date, status badge, quick action buttons
5. Status badges color-coded: Draft (gray), Active (green #10B981), Archived (orange #F59E0B)
6. Search functionality: search bar filters events by name atau client name (real-time filter)
7. Filter dropdown: filter by Status (All, Draft, Active, Archived), Date Range (This Month, Last 3 Months, All Time)
8. Sorting options: Sort by Date (newest/oldest), Name (A-Z), Photos Count (most/least)
9. Pagination: 20 events per page dengan pagination controls (Previous, Page numbers, Next)
10. Quick actions per event: View (navigates to public gallery), Edit, Manage Photos, Archive/Activate, Delete
11. Empty state: jika no events exist, display "No events yet" dengan CTA button "Create Your First Event"
12. Mobile responsive: table switches to stacked cards, filters collapse to dropdown menu

---

## Story 3.5: Event Detail & Edit Page

**As an** admin/photographer,  
**I want** to view complete event details dan edit event information,  
**so that** saya dapat keep event information up-to-date dan accurate.

### Acceptance Criteria

1. Event detail page at `/admin/events/:id` displays comprehensive event information
2. Page sections: Event Info (editable), Access Methods (QR code, link, access code), Gallery Stats, Actions
3. Event Info section displays: Event Name, Client Name, Event Date, Slug, Description, Storage Duration, Status
4. "Edit" button enables inline editing atau navigates to edit form with pre-filled values
5. Edit form identical to creation form dengan all fields editable except: slug (warning if changed - breaks existing links)
6. Access Methods section displays: Public URL (copyable), Access Code (copyable dengan "Copy" button), QR Code (downloadable)
7. Gallery Stats section shows: Total Photos (count), Total Views (placeholder for future), Total Downloads, Total Comments/Likes
8. Actions section: "Manage Photos" (navigates to photo upload page), "View Public Gallery" (opens public page in new tab), "Archive Event", "Delete Event"
9. Archive button toggles event status between "active" dan "archived" dengan confirmation
10. Delete button shows confirmation modal: "Are you sure? This action cannot be undone. All photos will be deleted."
11. Status change reflected in database: PUT `/api/admin/events/:id` endpoint
12. Delete action: DELETE `/api/admin/events/:id` endpoint, cascades delete to related photos dan comments
13. Success/error notifications for all actions
14. Breadcrumb: "Dashboard > Events > [Event Name]"

---

## Story 3.6: Access Code Management

**As an** admin/photographer,  
**I want** to manage event access codes dan visibility settings,  
**so that** saya dapat control who can access event gallery dan when.

### Acceptance Criteria

1. Event detail page includes "Access Settings" section dengan collapsible/expandable panel
2. Access Code display: current code shown dengan "Copy to Clipboard" button (clipboard API atau fallback)
3. "Generate New Code" button creates new random 6-character alphanumeric code (uppercase)
4. Code regeneration shows confirmation: "Generating new code will invalidate old code. Continue?" 
5. Privacy toggle: Public (visible on landing page) / Private (requires direct link only)
6. Optional password protection toggle: when enabled, requires password in addition to access code
7. Password field: text input (min 4 chars) only visible when password protection enabled
8. Guest access toggle: Enable/Disable guest access entirely (untuk temporarily closing gallery)
9. Expiry settings: Auto-archive option with date picker (gallery becomes unavailable after date)
10. All settings changes saved via PUT `/api/admin/events/:id/access-settings` endpoint
11. Settings changes reflected immediately, success notification displayed
12. Copy to clipboard functionality dengan visual feedback: "Copied!" tooltip appears briefly
13. Access code validation on public gallery: guests must enter correct code to view photos

---

## Story 3.7: Event Status Management & Archiving

**As an** admin/photographer,  
**I want** to archive completed events atau activate draft events,  
**so that** saya dapat organize events by lifecycle stage dan manage storage efficiently.

### Acceptance Criteria

1. Event status enum: draft, active, archived implemented in database dan application logic
2. Draft status: event created but not yet visible to guests, gallery page shows "Coming Soon" message
3. Active status: event fully accessible to guests, appears in public listing (if not private)
4. Archived status: event read-only, photos viewable but no new uploads/downloads, displays "Archived Event" banner
5. Status change buttons pada event detail page: "Activate" (draft→active), "Archive" (active→archived), "Reactivate" (archived→active)
6. Status change confirmation modal dengan explanation of what happens (e.g., "Archiving will make event read-only")
7. Bulk actions pada events list: select multiple events, apply status change to selected
8. Auto-archive feature: cron job atau scheduled task checks events daily, auto-archives events past expiry date
9. Archived events styling: grayed out dalam list, clear visual indicator
10. Database query optimization: status indexed untuk fast filtering
11. API endpoint: PUT `/api/admin/events/:id/status` with body `{ "status": "active|archived|draft" }`
12. Activity log: status changes logged dengan timestamp dan admin user (for audit trail)

---

## Story 3.8: Event Duplication Feature

**As an** admin/photographer,  
**I want** to duplicate existing event dengan all settings,  
**so that** saya dapat quickly create similar events tanpa re-entering all information.

### Acceptance Criteria

1. "Duplicate" button available pada event detail page dan events list quick actions
2. Duplicate action creates new event copy dengan: same event name + " (Copy)", same settings (description, storage duration, privacy)
3. New event gets: new unique slug (append "-copy" atau "-2"), new access code, new QR code
4. Photos NOT duplicated (new event starts with empty gallery)
5. Status reset to "draft" for new duplicated event
6. Client information copied but with clear indication it's a duplicate
7. Duplication shows confirmation modal: "Duplicate Event?" with explanation "Settings will be copied, photos will not"
8. Success: redirects to new duplicated event edit page dengan notification "Event duplicated successfully. Update details as needed."
9. API endpoint: POST `/api/admin/events/:id/duplicate` returns new event object
10. Event date set to null atau today's date in duplicated event (requires admin to set new date)

---

## Story 3.9: Event Search & Filtering

**As an** admin/photographer dengan many events,  
**I want** powerful search dan filtering capabilities,  
**so that** saya dapat quickly find specific events tanpa scrolling through entire list.

### Acceptance Criteria

1. Search bar di top of events list dengan placeholder "Search events by name or client..."
2. Search triggers on keyup dengan debounce (300ms) untuk avoid excessive API calls
3. Search matches: event name, client name, event description (case-insensitive partial match)
4. Filter panel with options: Status (All/Draft/Active/Archived), Date Range (custom date picker atau presets), Has Photos (Yes/No)
5. Date range presets: Today, This Week, This Month, Last 3 Months, Custom Range
6. Multiple filters combinable (e.g., Active events from last month with photos)
7. Filter count badge shows number of active filters
8. "Clear Filters" button resets all filters to defaults
9. URL query parameters untuk persist filters (e.g., `/admin/events?status=active&date=this-month`) untuk shareable links
10. Filter state persisted dalam localStorage untuk returning to page dengan same filters
11. Search results count displayed: "Showing X of Y events"
12. API endpoint: GET `/api/admin/events` accepts query params: `search`, `status`, `date_from`, `date_to`, `has_photos`
13. Empty state for filtered results: "No events found matching your criteria" dengan button to clear filters

---

## Story 3.10: Event Settings & Configuration

**As an** admin/photographer,  
**I want** to configure event-specific settings dan preferences,  
**so that** saya dapat customize gallery behavior untuk different clients atau event types.

### Acceptance Criteria

1. Event settings page accessible from event detail via "Settings" tab atau button
2. Display settings: Gallery Layout (Grid/Masonry), Photos per Page (20/50/100/All), Sort Order (Upload Date/Name)
3. Download settings: Allow Guest Downloads toggle, Watermark on Downloads toggle, Max Download Size Limit (optional)
4. Interaction settings: Allow Comments toggle, Allow Likes toggle, Require Moderation (comments) toggle
5. Notification settings: Email Notifications (to client) toggle, WhatsApp Notifications toggle
6. Branding settings: Custom welcome message untuk gallery page, Custom thank you message after download
7. Advanced: Custom CSS class untuk styling (future enhancement), Custom domain mapping (future)
8. All settings have sensible defaults pre-selected during event creation
9. Settings changes auto-save dengan visual indicator (saving spinner → checkmark "Saved")
10. Settings stored in database: separate `event_settings` JSON column atau related table
11. API endpoint: PUT `/api/admin/events/:id/settings` dengan settings object
12. Settings validation: ensure toggles boolean, numeric limits within range
13. Help tooltips untuk each setting explaining what it does

---

**Epic 3 Status**: Ready untuk Development  
**Estimated Effort**: 6-7 development days  
**Dependencies**: Epic 1 (Foundation & Core Infrastructure)  
**Success Metrics**: Admin dapat create, edit, archive events; QR codes generated; access codes working; settings configurable
