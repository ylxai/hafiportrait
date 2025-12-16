# Epic 5: Guest Gallery Experience

**Epic Goal**: Create seamless guest-facing event gallery experience dengan multiple access methods (QR code, link, access code), mobile-optimized photo grid, photo detail viewing, dan download functionality tanpa requiring guest registration. Epic ini delivers primary value proposition untuk end users (tamu undangan) dengan focus pada mobile-first, friction-free access.

---

## Story 5.1: Guest Access Entry Page

**As a** wedding guest,  
**I want** to easily access event gallery using access code atau direct link,  
**so that** saya dapat view wedding photos tanpa complicated registration process.

### Acceptance Criteria

1. Access entry page at `/[event-slug]` detects if user has valid access token/cookie
2. If no valid access: displays access gate dengan event name, date, dan cover photo
3. Access form contains: Access Code input field (6 characters, auto-uppercase), Submit button "View Gallery"
4. Optional password field appears jika event has password protection enabled
5. QR code scan direct access: URL with `?code=[access-code]` parameter auto-validates dan bypasses entry form
6. Shared link access: URL with token parameter `?token=[jwt-token]` grants immediate access
7. Form validation: access code format validation (6 alphanumeric), required field validation
8. Submit triggers POST request to `/api/gallery/[event-slug]/access` dengan code (dan password if required)
9. Successful validation: sets httpOnly cookie `gallery_access_[event-id]` dengan JWT containing event access permissions
10. Failed validation: error message "Invalid access code. Please try again." displayed below form
11. Rate limiting: maximum 10 access attempts per IP per hour untuk prevent brute force
12. Mobile responsive: centered form, large input fields (min 44px height), touch-friendly
13. Event not found: displays 404 page "Event not found or has expired"
14. Archived event: displays "This event has been archived" dengan limited access message

---

## Story 5.2: Guest Gallery Photo Grid

**As a** wedding guest,  
**I want** to see beautiful grid of wedding photos optimized untuk mobile viewing,  
**so that** saya dapat easily browse dan enjoy wedding memories.

### Acceptance Criteria

1. Gallery page displays after successful access validation at `/[event-slug]/gallery`
2. Page header shows: event name, event date, welcome message (if configured by admin)
3. Photo grid layout: 3 columns desktop (≥1024px), 2 columns tablet (768-1023px), 2 columns mobile (<768px)
4. Photos displayed as squares (1:1 aspect ratio) using medium thumbnails dengan object-fit: cover
5. Lazy loading: photos load as user scrolls near viewport (IntersectionObserver, load 20 photos ahead)
6. Infinite scroll: automatically loads next batch (50 photos) when reaching bottom
7. Loading skeleton: placeholder squares shown while photos loading
8. Photo tiles clickable: tap/click opens photo detail view
9. Like count badge displayed on each photo tile (heart icon + count) if likes enabled
10. Smooth transitions: fade-in animation when photos load
11. Pull-to-refresh gesture (mobile): refreshes gallery untuk check new uploads
12. Grid performance: smooth scrolling even dengan 500+ photos
13. Empty state: "No photos available yet. Check back soon!" jika event has no photos
14. Network error handling: "Unable to load photos. Please check your connection." dengan retry button

---

## Story 5.3: Photo Detail View & Navigation

**As a** wedding guest,  
**I want** to view photos dalam full-screen detail dengan smooth navigation,  
**so that** saya dapat appreciate photo quality dan easily browse through gallery.

### Acceptance Criteria

1. Tapping photo tile opens full-screen photo detail modal atau dedicated page
2. Photo displayed at maximum viewport size sambil maintaining aspect ratio
3. High-resolution image loads progressively: blur-up technique (thumbnail → full resolution)
4. Navigation arrows (left/right) untuk previous/next photo navigation
5. Close button (X icon) di top-right corner returns to grid view
6. Photo metadata overlay (optional toggle): filename, upload date, photographer credit
7. Like button prominently displayed (heart icon) dengan current like count
8. Comment button shows comment count, opens comment section (if enabled)
9. Download button triggers photo download (if downloads enabled for event)
10. Share button allows sharing individual photo via native share API atau copy link
11. Swipe gestures (mobile): swipe left/right untuk navigate, swipe down untuk close
12. Pinch-to-zoom: allows zooming in untuk see details
13. Keyboard shortcuts (desktop): arrow keys navigate, ESC closes, D downloads
14. Photo counter: "5 of 150" shows current position dalam gallery
15. Preloading: next 2 photos preloaded dalam background untuk instant navigation

---

## Story 5.4: Photo Download Functionality (Single)

**As a** wedding guest,  
**I want** to download individual photos dalam full resolution,  
**so that** saya dapat save memories untuk personal collection.

### Acceptance Criteria

1. Download button visible dalam photo detail view (icon: download arrow)
2. Download button check: if event settings allow guest downloads (otherwise hidden/disabled)
3. Click download button triggers photo file download dengan original filename atau `[event-name]-photo-[number].jpg`
4. Download analytics tracked: increments download_count untuk photo dalam database
5. Watermark application (if configured): applies subtle watermark before download
6. Download size: full resolution original photo (tidak thumbnail)
7. Download format: same as original (JPEG, PNG, WebP preserved)
8. Mobile handling: iOS Safari dan Android Chrome download behavior supported
9. Progress indication: shows downloading state untuk large files
10. Download error handling: "Download failed. Please try again." notification
11. Rate limiting: maximum 50 downloads per hour per guest untuk prevent abuse
12. Download button disabled dengan tooltip jika rate limit exceeded: "Download limit reached. Please try again later."
13. API endpoint: GET `/api/gallery/[event-slug]/photos/:id/download` returns photo file dengan appropriate headers
14. Security: validates gallery access token before allowing download

---

## Story 5.5: Gallery Filtering & Sorting

**As a** wedding guest,  
**I want** to filter dan sort photos untuk find specific moments,  
**so that** saya dapat quickly access photos saya interested in.

### Acceptance Criteria

1. Filter/sort controls displayed above photo grid (collapsible on mobile)
2. Sort dropdown options: Newest First (default), Oldest First, Most Liked
3. Filter options (if implemented by admin): Show All / Ceremony / Reception / Portrait (photo categories - future enhancement)
4. Date filter: jika event spans multiple days, filter by specific date
5. Sort preference persisted dalam localStorage untuk returning users
6. Applying sort/filter shows loading state dan refreshes grid smoothly
7. Filter/sort state reflected dalam URL query parameters untuk shareable links (e.g., `?sort=most_liked`)
8. "Clear Filters" button resets to default view
9. Results count: "Showing X photos" updates based on active filters
10. Mobile responsive: controls collapse to dropdown menu atau bottom sheet
11. Smooth transitions: no jarring jumps when changing sort/filters
12. API supports sorting dan filtering: GET `/api/gallery/[event-slug]/photos?sort=liked&filter=date:2024-12-15`

---

## Story 5.6: Gallery Search Functionality

**As a** wedding guest,  
**I want** to search photos by caption atau metadata,  
**so that** saya dapat find specific photos atau moments quickly.

### Acceptance Criteria

1. Search bar displayed at top of gallery (sticky position on scroll)
2. Search input placeholder: "Search photos..." dengan search icon
3. Search triggers on keyup dengan debounce (500ms) untuk avoid excessive requests
4. Search matches: photo captions (admin-added), EXIF date/time, filenames (if exposed)
5. Search results display dalam same grid layout dengan result count: "Found X photos"
6. Highlight matching terms dalam captions atau metadata (if displayed)
7. Empty search results: "No photos found matching '[query]'" dengan suggestion to clear search
8. Clear button (X icon) appears dalam search input when text entered
9. Search state persisted untuk back navigation (user can return to search results)
10. Mobile: search bar collapsible, expands on tap (untuk save screen space)
11. Search history (optional): recent searches suggested dalam dropdown
12. API endpoint: GET `/api/gallery/[event-slug]/photos?search=[query]` returns filtered results

---

## Story 5.7: Mobile-First Optimization

**As a** wedding guest using mobile device,  
**I want** gallery optimized specifically untuk mobile experience,  
**so that** saya dapat easily view dan interact dengan photos pada small screen.

### Acceptance Criteria

1. Touch-optimized: all interactive elements minimum 44x44px touch target size
2. Fast initial load: First Contentful Paint < 1.5s on 4G connection
3. Optimized images: WebP format dengan JPEG fallback, appropriate sizes served based on device
4. Responsive images: `<picture>` element atau srcset uses appropriate thumbnail size per viewport
5. Gesture support: swipe untuk navigation, pinch untuk zoom, pull-to-refresh
6. Bottom navigation bar (mobile): sticky bar dengan quick actions (Home, Grid View, Search)
7. Minimal chrome: full-screen photo viewing dengan overlay controls (auto-hide after 3 seconds)
8. Orientation support: layout adjusts for portrait dan landscape modes
9. Network awareness: detects slow connection, loads lower resolution images, shows indicator
10. Offline indicator: displays message when connection lost
11. Reduced motion support: respects `prefers-reduced-motion` untuk accessibility
12. iOS specific: safe area insets respected (notch, home indicator clearance)
13. Android specific: handles back button navigation appropriately
14. Performance budget: total page weight < 2MB initial load, subsequent loads < 500KB per batch

---

## Story 5.8: Gallery Session & Access Management

**As a** guest,  
**I want** my gallery access to remain valid untuk reasonable duration,  
**so that** saya don't have to re-enter access code every time saya return.

### Acceptance Criteria

1. Gallery access token (JWT) issued dengan 30-day expiration upon successful access validation
2. Token stored dalam httpOnly secure cookie untuk security
3. Token refresh: automatically refreshes when user actively uses gallery (within 7 days of expiry)
4. Multi-device support: token valid across devices (guest dapat access dari phone dan laptop)
5. Logout functionality: "End Session" link dalam gallery clears access token
6. Session information displayed: "Accessing as Guest" dalam gallery header
7. Token contains: event_id, access_level (guest/client), issued_at, expires_at
8. Backend validates token on every API request untuk gallery resources
9. Expired token: redirects to access entry page dengan message "Session expired. Please enter access code again."
10. Revoked access: admin dapat revoke access codes, existing tokens become invalid
11. Security: token cannot be forged, signed dengan secret key, verified on backend
12. Token rotation: new token issued if access code changed by admin, old tokens invalidated

---

## Story 5.9: Gallery Loading Performance

**As a** guest dengan potentially slow internet,  
**I want** gallery to load quickly dan progressively,  
**so that** saya can start viewing photos tanpa waiting untuk everything to load.

### Acceptance Criteria

1. Progressive enhancement: basic content loads first, enhancements load after
2. Critical CSS inlined: above-fold styles inlined dalam HTML untuk fast render
3. Image lazy loading: only visible dan near-visible images loaded initially
4. Thumbnail optimization: appropriate size thumbnails served (400px untuk mobile, 800px untuk desktop)
5. CDN delivery: all images served dari CDN dengan proper cache headers
6. HTTP/2 multiplexing: parallel resource loading untuk faster page load
7. Compression: images compressed dengan optimal quality/size balance
8. Code splitting: gallery JavaScript loaded separately dari landing page
9. Service worker (future): caches previously viewed photos untuk instant revisit
10. Loading priorities: LCP image (first photo) highest priority, others lower
11. Skeleton screens: placeholder content shown immediately while actual content loads
12. Performance monitoring: Real User Monitoring tracks actual load times
13. Performance targets: LCP < 2.5s, FID < 100ms, CLS < 0.1 on 4G mobile

---

## Story 5.10: Gallery Error Handling & Edge Cases

**As a** guest,  
**I want** clear error messages dan graceful handling when things go wrong,  
**so that** saya understand what happened dan know what to do next.

### Acceptance Criteria

1. Network errors: "Connection lost. Please check your internet." dengan retry button
2. Server errors (500): "Something went wrong. Please try again later." dengan automatic retry after 5 seconds
3. Photo load failures: failed images show placeholder dengan reload icon
4. Invalid access attempts: clear error messages explaining why access denied
5. Event expired: "This event gallery has expired and is no longer available."
6. Event not found: 404 page dengan link back to main site
7. Download failures: "Download failed. Please try again." dengan retry option
8. Rate limit exceeded: "Too many requests. Please wait X minutes before trying again."
9. Browser compatibility: detects unsupported browsers, shows upgrade message
10. JavaScript disabled: basic functionality works, message encouraging enable JS for full experience
11. Image format not supported: fallback to JPEG if WebP not supported
12. Timeout handling: requests timeout after 30 seconds dengan appropriate message
13. Partial content loading: shows successfully loaded photos even if some failed
14. Error reporting: errors logged untuk admin visibility (without exposing details to guest)

---

**Epic 5 Status**: Ready untuk Development  
**Estimated Effort**: 7-8 development days  
**Dependencies**: Epic 3 (Event Management), Epic 4 (Photo Upload & Storage)  
**Success Metrics**: Guests dapat access gallery via QR/link/code tanpa registration, mobile experience smooth, photos load quickly, download works
