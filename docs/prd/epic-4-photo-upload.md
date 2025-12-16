# Epic 4: Photo Upload & Storage

**Epic Goal**: Implement comprehensive photo upload system dengan bulk upload capability, automatic thumbnail generation, efficient storage management, dan intuitive photo management interface untuk admin. Epic ini delivers core content creation functionality yang enables fotografer untuk populate event galleries dengan wedding photos.

---

## Story 4.1: Photo Upload Interface UI

**As an** admin/photographer,  
**I want** intuitive photo upload interface dengan drag-and-drop support,  
**so that** saya dapat efficiently upload ratusan wedding photos tanpa cumbersome process.

### Acceptance Criteria

1. Photo upload page accessible at `/admin/events/:id/photos/upload`
2. Large drag-and-drop zone dengan clear instructions: "Drag photos here or click to browse"
3. File picker supports multiple file selection (accepts: .jpg, .jpeg, .png, .webp)
4. Visual feedback when dragging files: drop zone highlights dengan border color (#54ACBF)
5. Selected files display as preview grid dengan thumbnails before upload starts
6. Each preview shows: thumbnail, filename, file size, remove button (X icon)
7. Upload queue management: "Upload All" button, "Clear Queue" button, individual remove buttons
8. Maximum files per batch: 500 photos dengan validation message if exceeded
9. File size validation: individual file max 50MB dengan warning for larger files
10. Upload button disabled until at least one file selected
11. Mobile responsive: works dengan mobile camera/gallery picker, smaller thumbnails on mobile
12. Breadcrumb navigation: "Dashboard > Events > [Event Name] > Upload Photos"

---

## Story 4.2: Bulk Photo Upload Processing

**As an** admin/photographer,  
**I want** photos to upload reliably dengan progress tracking,  
**so that** saya dapat monitor upload status dan confidence that all photos are saved.

### Acceptance Criteria

1. "Upload All" button initiates batch upload process
2. Overall progress bar shows total upload percentage: "Uploading 15 of 100 photos (15%)"
3. Individual file progress: each preview shows mini progress bar during its upload
4. Parallel uploads: maximum 5 concurrent uploads untuk balance speed dan stability
5. Upload retry logic: failed uploads automatically retry once, then marked as failed
6. Upload status indicators: uploading (spinner), success (green checkmark), failed (red X)
7. Failed uploads display error message tooltip: "Upload failed: [error reason]"
8. "Retry Failed" button appears if any uploads fail, attempts re-upload of only failed items
9. Upload continues in background, users can navigate away dan return to check status
10. Success notification after completion: "Successfully uploaded 95 of 100 photos. 5 failed."
11. Upload session stored in database untuk potential resume capability
12. Cancel button allows stopping upload process, uploads completed so far are saved

---

## Story 4.3: Image Storage & CDN Integration

**As a** developer,  
**I want** uploaded photos stored securely dengan CDN delivery,  
**so that** images load quickly untuk guests globally dan storage is scalable.

### Acceptance Criteria

1. Photos uploaded to object storage (AWS S3, MinIO, Cloudflare R2, atau compatible service)
2. Storage bucket structure: `photos/[event-id]/originals/[filename]` untuk full-resolution photos
3. Unique filename generation: UUID atau timestamp-based untuk prevent naming conflicts
4. File metadata stored: original filename, upload timestamp, file size, MIME type
5. CDN configured untuk serving photos dengan caching headers (1 year cache duration)
6. Photo URLs generated dengan CDN domain: `https://cdn.yourdomain.com/photos/...`
7. Secure upload: pre-signed URLs generated for direct browser-to-storage upload (untuk large files)
8. Storage redundancy configured: replication atau backup strategy for data durability
9. CORS settings configured untuk allow uploads from application domain
10. Environment variables: STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY, CDN_URL
11. Error handling: storage connection failures return appropriate error messages
12. File upload confirmation: verify file exists dalam storage before marking upload as complete

---

## Story 4.4: Automatic Thumbnail Generation

**As a** system,  
**I want** to automatically generate multiple thumbnail sizes saat photo diupload,  
**so that** gallery loads quickly dengan optimized images for different screen sizes.

### Acceptance Criteria

1. Thumbnail generation triggered automatically after successful photo upload
2. Three thumbnail sizes generated: small (400x400px), medium (800x800px), large (1200x1200px)
3. Thumbnails maintain aspect ratio with crop atau contain strategy (configurable)
4. Image processing library: Sharp (Node.js) atau Pillow (Python) untuk high-performance processing
5. Thumbnails stored in storage: `photos/[event-id]/thumbnails/[size]/[filename]`
6. Thumbnail URLs stored in database: photos table columns thumbnail_small_url, thumbnail_medium_url, thumbnail_large_url
7. Background job processing: thumbnail generation runs asynchronously via queue (BullMQ atau equivalent)
8. Progress tracking: admin can see thumbnail generation status per photo
9. WebP format generation untuk modern browsers dengan JPEG fallback
10. Compression optimization: balance quality dan file size (quality: 85 untuk JPEGs, 80 untuk WebP)
11. EXIF data preservation: orientation data preserved untuk correct display
12. Retry mechanism: failed thumbnail generation retries up to 3 times
13. Fallback: if thumbnail generation fails, original photo served dengan CSS resizing

---

## Story 4.5: Photo Management Grid View

**As an** admin/photographer,  
**I want** to view all uploaded photos untuk specific event dalam organized grid,  
**so that** saya dapat review, manage, dan organize event photos effectively.

### Acceptance Criteria

1. Photo management page at `/admin/events/:id/photos` displays all photos untuk event
2. Grid layout: 4 columns desktop, 3 columns tablet, 2 columns mobile dengan equal-height squares
3. Each photo tile shows: thumbnail (medium size), upload date, file size, selection checkbox
4. Hover effect: overlay displays quick actions (View, Download, Delete)
5. Lazy loading: photos load progressively as user scrolls (IntersectionObserver)
6. Photo count displayed: "Showing 150 photos" at top of grid
7. Sort options dropdown: Upload Date (newest/oldest), File Size (largest/smallest), Filename (A-Z)
8. Select mode: "Select" button enables multi-select dengan checkboxes visible
9. Bulk actions bar appears when items selected: "X photos selected" dengan actions: Download All, Delete Selected
10. Filter options: Show All / Uploaded Today / Uploaded This Week
11. Search functionality: search photos by filename
12. Loading state: skeleton grid shown while photos loading
13. Empty state: "No photos uploaded yet" dengan "Upload Photos" button
14. Pagination atau infinite scroll: handle large photo counts (500+) efficiently

---

## Story 4.6: Photo Detail & Metadata Display

**As an** admin/photographer,  
**I want** to view detailed information about each photo,  
**so that** saya dapat verify upload quality dan manage individual photo properties.

### Acceptance Criteria

1. Click pada photo tile opens photo detail modal atau dedicated page
2. Full-size photo preview displayed dengan zoom capability
3. Metadata panel shows: Filename, Upload Date, File Size, Dimensions (WxH), Format
4. EXIF data displayed (if available): Camera Model, ISO, Aperture, Shutter Speed, Date Taken
5. Photo statistics: Views Count (future), Downloads Count (future), Likes Count
6. Action buttons: Download Original, Replace Photo, Delete Photo
7. Edit capabilities: Add Caption (optional text field), Featured Photo toggle (untuk event cover)
8. Caption auto-saves on blur dengan success indicator
9. Navigation arrows: Previous/Next photo untuk quickly reviewing all photos
10. Keyboard shortcuts: Arrow keys untuk navigation, ESC to close, D untuk download
11. Mobile-friendly: swipe gestures untuk navigation, pinch-to-zoom untuk preview
12. "Set as Event Cover" button designates photo as event thumbnail
13. Delete confirmation: "Are you sure you want to delete this photo? This cannot be undone."

---

## Story 4.7: Photo Deletion & Cleanup

**As an** admin/photographer,  
**I want** to delete unwanted atau incorrect photos,  
**so that** saya dapat maintain gallery quality dan remove mistakes atau duplicates.

### Acceptance Criteria

1. Delete button available on photo detail view dan as quick action dalam grid
2. Single delete: confirmation modal "Delete this photo?"
3. Bulk delete: confirmation modal "Delete X selected photos? This cannot be undone."
4. Soft delete implementation: photos marked deleted but not immediately removed dari storage
5. Database: deleted_at timestamp column tracks soft delete
6. Soft deleted photos excluded dari public gallery queries
7. Admin trash/recycle bin: "Trash" section shows soft-deleted photos dengan Restore option
8. Restore button: removes deleted_at timestamp, photo reappears in gallery
9. Permanent deletion: cron job permanently deletes photos soft-deleted > 30 days ago
10. Storage cleanup: permanent deletion removes original photo dan all thumbnails dari storage
11. Database cleanup: permanent deletion removes database record
12. Cascade delete: deleting event deletes all associated photos (dengan confirmation)
13. API endpoints: DELETE `/api/admin/photos/:id` (soft delete), DELETE `/api/admin/photos/:id/permanent` (hard delete), POST `/api/admin/photos/:id/restore`
14. Delete operation logged untuk audit trail

---

## Story 4.8: Photo Reordering & Organization

**As an** admin/photographer,  
**I want** to reorder photos to control display sequence dalam gallery,  
**so that** guests see photos dalam most compelling atau chronological order.

### Acceptance Criteria

1. "Reorder Mode" toggle button on photo management page enables drag-and-drop reordering
2. Drag handles appear on photo tiles when reorder mode active
3. Drag-and-drop functionality: drag photo tile to new position, other tiles adjust
4. Visual feedback during drag: dragged item slightly elevated (shadow), drop zones highlighted
5. Touch support: long-press dan drag works on mobile devices
6. Auto-save: order saved automatically after drag completes (debounced 1 second)
7. Database: display_order integer column stores photo sequence (1, 2, 3, ...)
8. Gallery display respects display_order: ORDER BY display_order ASC dalam queries
9. Bulk reorder: "Auto-sort" options - Sort by Upload Date, Sort by Filename, Sort by File Size
10. Sort confirmation: "This will reorder all photos. Continue?"
11. Undo button: allows reverting last reorder action (single-level undo)
12. Performance: reordering hundreds of photos remains smooth (optimistic UI updates)
13. API endpoint: PUT `/api/admin/events/:id/photos/reorder` dengan array of photo IDs dalam desired order

---

## Story 4.9: Upload Progress Persistence

**As an** admin/photographer,  
**I want** upload progress to persist if I accidentally close browser atau lose connection,  
**so that** saya don't lose work saat uploading large photo batches.

### Acceptance Criteria

1. Upload session tracked dalam database: upload_sessions table dengan event_id, status, total_files, completed_files, failed_files
2. Browser localStorage atau IndexedDB stores upload queue dan progress state
3. Page refresh during upload shows resume prompt: "Resume previous upload? (X of Y photos remaining)"
4. Resume functionality: continues uploading remaining photos dari queue
5. Connection loss handling: pauses upload, shows "Connection lost. Retrying..." notification
6. Automatic retry: attempts reconnection every 10 seconds for up to 5 minutes
7. Manual retry button: "Retry Upload" available if automatic retry fails
8. Partial upload recovery: already-uploaded photos not re-uploaded pada resume
9. Upload session expires after 24 hours of inactivity
10. "Clear Upload History" button removes persisted data dan clears session
11. Network status indicator: shows online/offline status during upload
12. Background upload support: service worker (future enhancement) enables upload continuation even if page closed

---

## Story 4.10: Photo Upload API & Validation

**As a** backend system,  
**I want** robust photo upload API dengan comprehensive validation,  
**so that** only valid images are accepted dan system remains secure dan stable.

### Acceptance Criteria

1. API endpoint: POST `/api/admin/events/:id/photos/upload` accepts multipart/form-data
2. Authentication required: JWT token validation, only admin/owner can upload to their events
3. File type validation: accepts only image/jpeg, image/png, image/webp MIME types
4. File size validation: maximum 50MB per file dengan appropriate error message
5. Filename sanitization: removes special characters, prevents path traversal attacks
6. Virus scanning integration (optional, for production): scans files before storage
7. Rate limiting: maximum 100 uploads per minute per user untuk prevent abuse
8. Duplicate detection: checks file hash (MD5/SHA256) to prevent uploading same photo twice
9. Event ownership validation: ensures user owns event before allowing upload
10. Storage quota check: validates account hasn't exceeded storage limits (future enhancement)
11. Response format: returns uploaded photo object dengan URLs, IDs, metadata
12. Error responses: 400 (invalid file), 401 (unauthorized), 413 (file too large), 429 (rate limit), 500 (server error)
13. Logging: logs all upload attempts dengan user, event, file details untuk audit
14. Transaction handling: database record only created after successful storage upload

---

**Epic 4 Status**: Ready untuk Development  
**Estimated Effort**: 7-8 development days  
**Dependencies**: Epic 3 (Event Management & Admin Dashboard)  
**Success Metrics**: Admin dapat upload ratusan photos efficiently, thumbnails generated automatically, photos displayed dalam grid, storage integrated
