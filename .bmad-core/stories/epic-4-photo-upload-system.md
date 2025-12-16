# Story: Epic 4 - Photo Upload System

**Status:** Ready for Development
**Priority:** HIGH
**Epic:** Photo Upload & Storage
**Created:** 2024-12-13
**Sprint:** Photo Upload Sprint

---

## Story

Sebagai photographer/admin, saya perlu comprehensive photo upload system dengan bulk upload capability, automatic thumbnail generation, efficient Cloudflare R2 storage integration, dan intuitive photo management interface, sehingga dapat efficiently upload ratusan wedding photos dan populate event galleries dengan optimized images untuk guest viewing.

---

## Acceptance Criteria

### 1. Photo Upload Interface UI (CRITICAL) 🎯
- [ ] Photo upload page accessible at `/admin/events/[id]/photos/upload`
- [ ] Large drag-and-drop zone dengan clear instructions
- [ ] File picker supports multiple file selection (accepts: .jpg, .jpeg, .png, .webp)
- [ ] Visual feedback saat dragging files (border highlight #54ACBF)
- [ ] Selected files display as preview grid dengan thumbnails
- [ ] Each preview shows: thumbnail, filename, file size, remove button
- [ ] Upload queue management: "Upload All", "Clear Queue", individual remove
- [ ] Maximum 500 photos per batch dengan validation
- [ ] File size validation: max 50MB per file
- [ ] Mobile responsive dengan camera/gallery picker support
- [ ] Breadcrumb navigation working

### 2. Bulk Upload Processing (CRITICAL) 🎯
- [ ] "Upload All" initiates batch upload to Cloudflare R2
- [ ] Overall progress bar showing total percentage
- [ ] Individual file progress indicators
- [ ] Parallel uploads: max 5 concurrent untuk stability
- [ ] Automatic retry logic untuk failed uploads
- [ ] Status indicators: uploading, success, failed
- [ ] "Retry Failed" button untuk re-upload failures only
- [ ] Upload continues in background
- [ ] Success notification dengan summary
- [ ] Cancel functionality dengan partial save
- [ ] Upload session stored dalam database

### 3. Cloudflare R2 Storage Integration (CRITICAL) 🎯
- [ ] Photos uploaded to Cloudflare R2 bucket
- [ ] Storage structure: `photos/[event-id]/originals/[unique-filename]`
- [ ] Unique filename generation (UUID-based)
- [ ] File metadata stored: original name, timestamp, size, MIME type
- [ ] CDN delivery via R2 public URL
- [ ] Photo URLs: `https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev/...`
- [ ] Pre-signed URLs untuk secure direct upload
- [ ] CORS configured correctly
- [ ] Environment variables utilized (R2_*)
- [ ] Error handling untuk storage failures
- [ ] Upload confirmation sebelum marking complete

### 4. Automatic Thumbnail Generation (CRITICAL) 🎯
- [ ] Three sizes generated: small (400px), medium (800px), large (1200px)
- [ ] Thumbnails maintain aspect ratio
- [ ] Sharp library untuk image processing
- [ ] Storage path: `photos/[event-id]/thumbnails/[size]/[filename]`
- [ ] Database columns: thumbnail_small_url, thumbnail_medium_url, thumbnail_large_url
- [ ] Asynchronous processing (dapat gunakan queue atau immediate)
- [ ] WebP format generation dengan JPEG fallback
- [ ] Compression optimization (quality: 85 JPEG, 80 WebP)
- [ ] EXIF orientation preserved
- [ ] Retry mechanism untuk failed generation
- [ ] Fallback ke original jika thumbnail fails

### 5. Photo Management Grid View (HIGH) 📊
- [ ] Photo management page at `/admin/events/[id]/photos`
- [ ] Grid layout: 4 cols desktop, 3 tablet, 2 mobile
- [ ] Each tile shows: thumbnail, upload date, file size, checkbox
- [ ] Hover overlay dengan quick actions (View, Download, Delete)
- [ ] Lazy loading dengan IntersectionObserver
- [ ] Photo count displayed
- [ ] Sort options: date, size, filename
- [ ] Multi-select mode dengan bulk actions
- [ ] Bulk actions: Download All, Delete Selected
- [ ] Filter: All, Today, This Week
- [ ] Search by filename
- [ ] Loading skeleton states
- [ ] Empty state dengan "Upload Photos" CTA
- [ ] Pagination atau infinite scroll

### 6. Photo Detail & Metadata Display (HIGH) 📝
- [ ] Click photo opens detail modal
- [ ] Full-size preview dengan zoom
- [ ] Metadata panel: filename, date, size, dimensions, format
- [ ] EXIF data (if available): camera, ISO, aperture, shutter, date taken
- [ ] Statistics: views, downloads (prepared untuk future)
- [ ] Action buttons: Download, Replace, Delete
- [ ] Caption field dengan auto-save
- [ ] "Featured Photo" toggle untuk event cover
- [ ] Previous/Next navigation
- [ ] Keyboard shortcuts (arrows, ESC, D)
- [ ] Mobile swipe gestures dan pinch-to-zoom
- [ ] Delete confirmation modal

### 7. Photo Deletion & Cleanup (MEDIUM) 🗑️
- [ ] Delete button dalam detail view dan grid
- [ ] Single delete confirmation modal
- [ ] Bulk delete confirmation
- [ ] Soft delete implementation (deleted_at timestamp)
- [ ] Soft deleted photos excluded dari public queries
- [ ] Admin "Trash" section dengan Restore option
- [ ] Permanent deletion cron (30 days old)
- [ ] Storage cleanup: removes original + thumbnails
- [ ] Cascade delete saat event deleted
- [ ] API endpoints: DELETE soft, DELETE permanent, POST restore
- [ ] Delete operations logged untuk audit

### 8. Photo Reordering & Organization (MEDIUM) 🔢
- [ ] "Reorder Mode" toggle enables drag-and-drop
- [ ] Drag handles appear dalam reorder mode
- [ ] Drag-and-drop functionality working smoothly
- [ ] Visual feedback during drag (shadow, highlights)
- [ ] Touch support: long-press dan drag
- [ ] Auto-save after drag (debounced 1s)
- [ ] Database: display_order column
- [ ] Gallery respects display_order (ORDER BY)
- [ ] Bulk reorder: "Auto-sort" options
- [ ] Sort confirmation modal
- [ ] Single-level undo functionality
- [ ] Performance: smooth dengan hundreds of photos
- [ ] API: PUT `/api/admin/events/:id/photos/reorder`

### 9. Database Schema Extensions (CRITICAL) 💾
- [ ] Photos table updated dengan new fields:
  - [ ] fileSize: Int (bytes)
  - [ ] mimeType: String
  - [ ] width: Int
  - [ ] height: Int
  - [ ] thumbnailSmallUrl: String
  - [ ] thumbnailMediumUrl: String
  - [ ] thumbnailLargeUrl: String
  - [ ] caption: String (optional)
  - [ ] isFeatured: Boolean (untuk event cover)
  - [ ] uploadedBy: String (user ID)
  - [ ] deletedAt: DateTime (soft delete)
- [ ] Migration created dan applied
- [ ] Indexes optimized untuk queries
- [ ] Prisma client regenerated

### 10. API Endpoints Implementation (CRITICAL) 🔌
- [ ] POST `/api/admin/events/[id]/photos/upload` - Upload handler
- [ ] GET `/api/admin/events/[id]/photos` - List photos
- [ ] GET `/api/admin/photos/[photoId]` - Photo detail
- [ ] PUT `/api/admin/photos/[photoId]` - Update photo
- [ ] DELETE `/api/admin/photos/[photoId]` - Soft delete
- [ ] DELETE `/api/admin/photos/[photoId]/permanent` - Hard delete
- [ ] POST `/api/admin/photos/[photoId]/restore` - Restore deleted
- [ ] PUT `/api/admin/events/[id]/photos/reorder` - Reorder photos
- [ ] All endpoints dengan authentication
- [ ] All endpoints dengan validation
- [ ] Rate limiting implemented
- [ ] Proper error responses
- [ ] Logging untuk audit trail

---

## Tasks

### Task 1: Database Schema Extension & Migration ✅
**Priority:** CRITICAL
**Status:** Not Started

Extend Photo model dengan fields untuk metadata, thumbnails, dan soft delete.

#### Subtasks:
- [ ] Update Prisma schema dengan new Photo fields
- [ ] Add thumbnailSmallUrl, thumbnailMediumUrl, thumbnailLargeUrl
- [ ] Add fileSize, mimeType, width, height
- [ ] Add caption (optional), isFeatured (Boolean)
- [ ] Add uploadedBy (relation to User)
- [ ] Add deletedAt (DateTime, optional) untuk soft delete
- [ ] Create migration file
- [ ] Run migration pada development database
- [ ] Generate Prisma client
- [ ] Test database queries
- [ ] Create indexes untuk performance
- [ ] Document schema changes

**Testing:**
- [ ] Migration runs successfully
- [ ] All existing data preserved
- [ ] New queries work correctly
- [ ] Indexes improve query performance

---

### Task 2: Cloudflare R2 Storage Utility Setup ✅
**Priority:** CRITICAL
**Status:** Not Started

Setup utility functions untuk Cloudflare R2 upload, delete, dan URL generation.

#### Subtasks:
- [ ] Create `/lib/storage/r2.ts` utility file
- [ ] Initialize S3Client dengan R2 credentials
- [ ] Implement `uploadToR2()` function
- [ ] Implement `deleteFromR2()` function
- [ ] Implement `getR2Url()` function
- [ ] Implement `generatePresignedUrl()` untuk direct upload
- [ ] Add error handling dan retry logic
- [ ] Add file validation (type, size)
- [ ] Add filename sanitization
- [ ] Test dengan actual R2 bucket
- [ ] Document functions dengan JSDoc

**Testing:**
- [ ] Upload file to R2 successfully
- [ ] File accessible via public URL
- [ ] Delete removes file dari R2
- [ ] Error handling works correctly
- [ ] Presigned URLs work untuk direct upload

---

### Task 3: Image Processing & Thumbnail Generation ✅
**Priority:** CRITICAL
**Status:** Not Started

Implement automatic thumbnail generation dalam multiple sizes using Sharp.

#### Subtasks:
- [ ] Install Sharp library: `npm install sharp`
- [ ] Create `/lib/storage/image-processor.ts`
- [ ] Implement `generateThumbnails()` function
- [ ] Support three sizes: 400px, 800px, 1200px
- [ ] Maintain aspect ratio dengan smart cropping
- [ ] Generate WebP dan JPEG formats
- [ ] Optimize compression (quality settings)
- [ ] Preserve EXIF orientation
- [ ] Extract metadata (dimensions, EXIF data)
- [ ] Upload thumbnails to R2
- [ ] Handle errors gracefully
- [ ] Add progress callback untuk UI updates

**Testing:**
- [ ] Thumbnails generated correctly
- [ ] Aspect ratio maintained
- [ ] File sizes optimized
- [ ] WebP dan JPEG both generated
- [ ] Orientation preserved
- [ ] Performance acceptable (<2s per image)

---

### Task 4: Photo Upload API Endpoint ✅
**Priority:** CRITICAL
**Status:** Not Started

Create secure API endpoint untuk handling bulk photo uploads dengan validation.

#### Subtasks:
- [ ] Create `/app/api/admin/events/[id]/photos/upload/route.ts`
- [ ] Implement POST handler
- [ ] Add authentication check (JWT validation)
- [ ] Add event ownership validation
- [ ] Parse multipart/form-data uploads
- [ ] Validate file types (MIME validation)
- [ ] Validate file sizes (max 50MB)
- [ ] Generate unique filenames (UUID)
- [ ] Upload original to R2
- [ ] Generate thumbnails asynchronously
- [ ] Save photo record dalam database
- [ ] Return photo object dengan URLs
- [ ] Add rate limiting (100 uploads/min)
- [ ] Add comprehensive error handling
- [ ] Add logging untuk audit trail

**Testing:**
- [ ] Single file upload works
- [ ] Multiple file upload works
- [ ] Validation rejects invalid files
- [ ] Authentication required
- [ ] Ownership check prevents unauthorized uploads
- [ ] Error responses correct
- [ ] Rate limiting enforced
- [ ] Database records created correctly

---

### Task 5: Photo Upload UI Component ✅
**Priority:** CRITICAL
**Status:** Not Started

Create drag-and-drop photo upload interface dengan preview dan progress tracking.

#### Subtasks:
- [ ] Create `/app/admin/events/[id]/photos/upload/page.tsx`
- [ ] Create `/components/admin/PhotoUploader.tsx` component
- [ ] Implement drag-and-drop zone
- [ ] Implement file input untuk browsing
- [ ] Show file previews dalam grid
- [ ] Display filename, size untuk each file
- [ ] Add remove button untuk each preview
- [ ] Implement "Upload All" button
- [ ] Implement "Clear Queue" button
- [ ] Add file validation (client-side)
- [ ] Show validation errors
- [ ] Disable upload until files selected
- [ ] Add mobile support (camera/gallery)
- [ ] Make responsive (mobile-first)
- [ ] Add breadcrumb navigation
- [ ] Style dengan Tailwind CSS

**Testing:**
- [ ] Drag-and-drop works correctly
- [ ] File input works correctly
- [ ] Previews display correctly
- [ ] Remove buttons work
- [ ] Validation shows errors
- [ ] Mobile file picker works
- [ ] Responsive layout correct
- [ ] Accessibility: keyboard navigation

---

### Task 6: Upload Progress & Status Tracking ✅
**Priority:** CRITICAL
**Status:** Not Started

Implement real-time upload progress tracking dengan retry functionality.

#### Subtasks:
- [ ] Create upload progress state management (Zustand)
- [ ] Implement overall progress bar
- [ ] Implement individual file progress bars
- [ ] Add status indicators (uploading, success, failed)
- [ ] Implement parallel uploads (max 5 concurrent)
- [ ] Add automatic retry logic (1 retry per file)
- [ ] Add "Retry Failed" button
- [ ] Show upload statistics
- [ ] Add cancel functionality
- [ ] Persist upload session dalam database
- [ ] Show success notification dengan summary
- [ ] Handle network errors gracefully
- [ ] Update UI optimistically
- [ ] Add loading states

**Testing:**
- [ ] Progress bars update correctly
- [ ] Parallel uploads work (5 concurrent)
- [ ] Retry works untuk failed uploads
- [ ] Cancel stops remaining uploads
- [ ] Success notification shows correct count
- [ ] Error handling works correctly
- [ ] UI remains responsive during upload

---

### Task 7: Photo Management Grid View ✅
**Priority:** HIGH
**Status:** Not Started

Create photo management page dengan grid layout, sorting, filtering, dan bulk actions.

#### Subtasks:
- [ ] Create `/app/admin/events/[id]/photos/page.tsx`
- [ ] Create `/components/admin/PhotoGrid.tsx` component
- [ ] Implement responsive grid layout (4/3/2 columns)
- [ ] Create PhotoCard component
- [ ] Show thumbnail, date, size, checkbox
- [ ] Add hover overlay dengan quick actions
- [ ] Implement lazy loading (IntersectionObserver)
- [ ] Add photo count display
- [ ] Implement sort dropdown (date, size, filename)
- [ ] Implement filter buttons (All, Today, Week)
- [ ] Implement search input
- [ ] Add "Select" mode toggle
- [ ] Implement bulk actions bar
- [ ] Add "Download All" functionality
- [ ] Add "Delete Selected" functionality
- [ ] Add loading skeleton
- [ ] Add empty state
- [ ] Implement pagination atau infinite scroll

**Testing:**
- [ ] Grid layout responsive
- [ ] Lazy loading works
- [ ] Sort options work correctly
- [ ] Filters work correctly
- [ ] Search works correctly
- [ ] Multi-select works
- [ ] Bulk actions work
- [ ] Empty state displays
- [ ] Performance good dengan 100+ photos

---

### Task 8: Photo Detail Modal & Metadata ✅
**Priority:** HIGH
**Status:** Not Started

Create photo detail modal dengan full preview, metadata display, dan actions.

#### Subtasks:
- [ ] Create `/components/admin/PhotoDetailModal.tsx`
- [ ] Implement full-size image preview
- [ ] Add zoom functionality (pinch dan click)
- [ ] Create metadata panel
- [ ] Display basic info: filename, date, size, dimensions
- [ ] Display EXIF data jika available
- [ ] Add action buttons: Download, Replace, Delete
- [ ] Implement caption field dengan auto-save
- [ ] Add "Featured Photo" toggle
- [ ] Implement Previous/Next navigation
- [ ] Add keyboard shortcuts (arrows, ESC, D)
- [ ] Implement mobile swipe gestures
- [ ] Add delete confirmation modal
- [ ] Style dengan Tailwind CSS
- [ ] Make accessible (ARIA labels, focus management)

**Testing:**
- [ ] Modal opens/closes correctly
- [ ] Image preview works
- [ ] Zoom functionality works
- [ ] Metadata displays correctly
- [ ] Caption auto-saves
- [ ] Navigation works (prev/next)
- [ ] Keyboard shortcuts work
- [ ] Mobile gestures work
- [ ] Delete confirmation works

---

### Task 9: Photo Deletion & Trash System ✅
**Priority:** MEDIUM
**Status:** Not Started

Implement soft delete dengan trash/restore functionality dan permanent deletion.

#### Subtasks:
- [ ] Create DELETE `/api/admin/photos/[photoId]/route.ts`
- [ ] Implement soft delete (set deletedAt)
- [ ] Update queries to exclude soft-deleted photos
- [ ] Create `/app/admin/events/[id]/photos/trash/page.tsx`
- [ ] Display soft-deleted photos dalam trash view
- [ ] Add "Restore" button dalam trash
- [ ] Create POST `/api/admin/photos/[photoId]/restore/route.ts`
- [ ] Implement restore functionality (clear deletedAt)
- [ ] Create DELETE permanent endpoint
- [ ] Implement permanent deletion (remove dari R2 + DB)
- [ ] Create cron job untuk auto-permanent delete (30 days)
- [ ] Add cascade delete untuk events
- [ ] Add confirmation modals
- [ ] Add audit logging
- [ ] Update UI untuk show trash option

**Testing:**
- [ ] Soft delete works
- [ ] Deleted photos not visible dalam main view
- [ ] Trash view shows deleted photos
- [ ] Restore works correctly
- [ ] Permanent delete removes dari storage
- [ ] Cascade delete works
- [ ] Confirmation modals prevent accidents

---

### Task 10: Photo Reordering System ✅
**Priority:** MEDIUM
**Status:** Not Started

Implement drag-and-drop photo reordering untuk controlling gallery display order.

#### Subtasks:
- [ ] Add "Reorder Mode" toggle button
- [ ] Install DnD library: `npm install @dnd-kit/core @dnd-kit/sortable`
- [ ] Implement drag-and-drop functionality
- [ ] Add drag handles dalam reorder mode
- [ ] Show visual feedback during drag
- [ ] Implement touch support (long-press)
- [ ] Auto-save order after drag (debounced)
- [ ] Create PUT `/api/admin/events/[id]/photos/reorder/route.ts`
- [ ] Update display_order dalam database
- [ ] Add "Auto-sort" options
- [ ] Implement sort confirmations
- [ ] Add single-level undo
- [ ] Optimize untuk large photo counts
- [ ] Test performance dengan 500+ photos

**Testing:**
- [ ] Drag-and-drop works smoothly
- [ ] Touch support works
- [ ] Order saves correctly
- [ ] Auto-sort options work
- [ ] Undo functionality works
- [ ] Performance acceptable dengan many photos
- [ ] Gallery displays dalam correct order

---

### Task 11: Photo Management API Endpoints ✅
**Priority:** HIGH
**Status:** Not Started

Create remaining API endpoints untuk photo listing, detail, update, dan delete.

#### Subtasks:
- [ ] Create GET `/api/admin/events/[id]/photos/route.ts`
- [ ] Implement photo listing dengan pagination
- [ ] Add sorting dan filtering support
- [ ] Create GET `/api/admin/photos/[photoId]/route.ts`
- [ ] Implement photo detail retrieval
- [ ] Create PUT `/api/admin/photos/[photoId]/route.ts`
- [ ] Implement photo update (caption, featured)
- [ ] Add authentication untuk all endpoints
- [ ] Add authorization (ownership check)
- [ ] Add rate limiting
- [ ] Add input validation (Zod)
- [ ] Add error handling
- [ ] Add logging
- [ ] Document endpoints

**Testing:**
- [ ] List endpoint returns correct data
- [ ] Pagination works correctly
- [ ] Sorting works correctly
- [ ] Filtering works correctly
- [ ] Detail endpoint returns full data
- [ ] Update endpoint saves changes
- [ ] Authentication required
- [ ] Authorization prevents unauthorized access
- [ ] Error responses correct

---

### Task 12: Integration Testing & Polish ✅
**Priority:** HIGH
**Status:** Not Started

Comprehensive testing dan final polish untuk photo upload system.

#### Subtasks:
- [ ] Test complete upload flow end-to-end
- [ ] Test dengan large photo batches (100+ photos)
- [ ] Test error scenarios (network failures, invalid files)
- [ ] Test mobile experience thoroughly
- [ ] Verify R2 storage working correctly
- [ ] Verify thumbnail generation working
- [ ] Test photo management grid
- [ ] Test photo detail modal
- [ ] Test deletion dan restore
- [ ] Test reordering
- [ ] Check performance dengan large galleries
- [ ] Verify responsive design pada all screen sizes
- [ ] Check accessibility (keyboard, screen readers)
- [ ] Fix any bugs found
- [ ] Polish UI/UX
- [ ] Add loading states dimana missing
- [ ] Add error messages yang helpful
- [ ] Optimize images dan assets
- [ ] Review code quality
- [ ] Update documentation

**Testing:**
- [ ] All user flows work correctly
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile experience excellent
- [ ] Accessibility requirements met
- [ ] Error handling comprehensive
- [ ] UI polished dan consistent

---

## Dev Notes

### Technical Architecture

**Frontend:**
- Next.js 15 App Router
- React 19 dengan Server Components
- Tailwind CSS untuk styling
- Zustand untuk upload state management
- @dnd-kit/core untuk drag-and-drop
- Sharp untuk image processing (server-side)

**Backend:**
- Next.js API Routes
- Cloudflare R2 untuk storage (S3-compatible)
- Prisma ORM dengan NeonDB PostgreSQL
- AWS SDK untuk S3 operations
- Sharp untuk image processing

**Storage Structure:**
```
photos/
  [event-id]/
    originals/
      [uuid].jpg
    thumbnails/
      small/
        [uuid].webp
        [uuid].jpg
      medium/
        [uuid].webp
        [uuid].jpg
      large/
        [uuid].webp
        [uuid].jpg
```

**Performance Considerations:**
- Lazy loading untuk photo grids
- Progressive image loading
- Parallel uploads (max 5 concurrent)
- Thumbnail generation asynchronous
- CDN caching via R2 public URL
- Database query optimization dengan indexes

**Security:**
- JWT authentication required
- Event ownership validation
- File type validation (MIME + extension)
- File size limits (50MB)
- Rate limiting (100 uploads/min)
- Filename sanitization
- Soft delete untuk recovery

**Mobile Optimization:**
- Touch gestures support
- Mobile camera/gallery picker
- Responsive grid layouts
- Optimized thumbnail sizes
- Progressive loading
- Touch-friendly buttons

### Environment Variables Required
```bash
R2_PUBLIC_URL=https://pub-99b01fc471a343c6ba5c1eae285ddf9e.r2.dev
R2_ENDPOINT=https://0a21532cc7638a2a70023eadd7ca9165.r2.cloudflarestorage.com
R2_ACCESS_KEY=c8919ca89140cf24f68bde8f76dffa48
R2_SECRET_KEY=2592753bdea15840b6e7e9bc13449b0a7b5290490e264274cd52c8456d426f5a
R2_BUCKET=photos
R2_REGION=auto
```

### Dependencies to Install
```bash
npm install sharp @dnd-kit/core @dnd-kit/sortable
```

### Database Migration
```bash
npx prisma migrate dev --name add_photo_metadata_and_thumbnails
npx prisma generate
```

---

## Testing

### Unit Tests
- [ ] R2 utility functions
- [ ] Image processing functions
- [ ] API endpoint handlers
- [ ] File validation logic
- [ ] Thumbnail generation

### Integration Tests
- [ ] Complete upload flow
- [ ] Photo management operations
- [ ] Delete dan restore flow
- [ ] Reordering functionality
- [ ] API endpoint integration

### E2E Tests
- [ ] Upload photos from admin
- [ ] Manage photos dalam grid
- [ ] View photo details
- [ ] Delete dan restore photos
- [ ] Reorder photos

### Performance Tests
- [ ] Upload 100+ photos simultaneously
- [ ] Load gallery dengan 500+ photos
- [ ] Thumbnail generation speed
- [ ] API response times
- [ ] Mobile performance

---

## Dev Agent Record

### Agent Model Used
- Claude 3.5 Sonnet (Initial Implementation)

### Debug Log References
- None yet

### Completion Notes
- [ ] All tasks completed dan tested
- [ ] Photo upload system fully functional
- [ ] Cloudflare R2 integration working
- [ ] Thumbnail generation automatic
- [ ] Photo management intuitive
- [ ] Mobile experience optimized
- [ ] Performance acceptable
- [ ] Security implemented
- [ ] Documentation complete

### File List
**To be populated during development**

### Change Log
- 2024-12-13: Story created untuk Epic 4 implementation

---

## Status: Ready for Development

**Next Steps:**
1. Start dengan Task 1: Database Schema Extension
2. Setup Cloudflare R2 utilities (Task 2)
3. Implement image processing (Task 3)
4. Build upload API (Task 4)
5. Create upload UI (Task 5)
6. Continue dengan remaining tasks dalam order

**Blocking Issues:** None

**Questions/Clarifications:**
- None yet

---
