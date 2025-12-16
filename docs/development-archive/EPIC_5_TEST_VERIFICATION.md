# Epic 5: Test & Verification Checklist

**Date**: December 13, 2024  
**Status**: Ready for Manual Testing

---

## 🧪 MANUAL TEST SCENARIOS

### Test 1: Guest Access via Access Code ✅

**Prerequisites**:
- Have an active event in database
- Know the event slug and access code

**Steps**:
1. Navigate to `http://124.197.42.88:3000/[event-slug]`
2. See access form with event name and cover photo
3. Enter 6-character access code (e.g., `ABC123`)
4. Click "Lihat Gallery"
5. Should redirect to `/[event-slug]/gallery`
6. Gallery should display with photo grid

**Expected Results**:
- ✅ Access form displays correctly
- ✅ Input accepts only alphanumeric, max 6 chars
- ✅ Auto-uppercase conversion works
- ✅ Valid code redirects to gallery
- ✅ Invalid code shows error message
- ✅ Cookie `gallery_access_[eventId]` is set

---

### Test 2: Guest Access via QR Code ✅

**Prerequisites**:
- QR code generated for event

**Steps**:
1. Scan QR code or visit: `http://124.197.42.88:3000/[event-slug]?code=ABC123`
2. Should automatically validate and redirect
3. Should land directly in gallery

**Expected Results**:
- ✅ No manual code entry needed
- ✅ Direct redirect to gallery
- ✅ Cookie is set
- ✅ Gallery displays immediately

---

### Test 3: Photo Grid Display ✅

**Prerequisites**:
- Logged in to gallery
- Event has photos

**Steps**:
1. View gallery page
2. Observe photo grid layout
3. Scroll down to trigger infinite scroll
4. Check on different screen sizes

**Expected Results**:
- ✅ Photos display in responsive grid (2/3/4 cols)
- ✅ Square aspect ratio maintained
- ✅ Images lazy load as you scroll
- ✅ Infinite scroll loads next 50 photos
- ✅ Loading skeletons shown while loading
- ✅ Like count badges visible if > 0

**Mobile Test** (< 768px):
- ✅ 2 columns grid
- ✅ Touch-friendly tap targets

**Tablet Test** (768-1023px):
- ✅ 3 columns grid

**Desktop Test** (≥ 1024px):
- ✅ 4 columns grid

---

### Test 4: Photo Lightbox Navigation ✅

**Prerequisites**:
- In gallery with multiple photos

**Steps**:
1. Tap/click any photo
2. Lightbox opens full-screen
3. Try navigation methods:
   - Click left/right arrows
   - Press arrow keys (desktop)
   - Swipe left/right (mobile)
4. Check photo counter (e.g., "5 of 150")
5. Press ESC or click X to close

**Expected Results**:
- ✅ Lightbox opens immediately
- ✅ Full-screen display
- ✅ High-res image loads progressively
- ✅ Navigation arrows work
- ✅ Keyboard shortcuts work
- ✅ Swipe gestures work (mobile)
- ✅ Photo counter displays correctly
- ✅ Controls auto-hide after 3 seconds
- ✅ Mouse/touch brings controls back
- ✅ Close button works
- ✅ ESC key closes lightbox

---

### Test 5: Photo Download ✅

**Prerequisites**:
- In photo lightbox

**Steps**:
1. Open photo in lightbox
2. Click download button
3. Verify file downloads
4. Check filename is original or formatted
5. Verify file quality is original

**Expected Results**:
- ✅ Download button visible
- ✅ Click triggers download
- ✅ File downloads with correct name
- ✅ File is original quality
- ✅ Format preserved (JPEG/PNG)
- ✅ Works on mobile browsers

**Rate Limiting Test**:
1. Download 50 photos in quick succession
2. Try to download 51st photo
3. Should see rate limit error

**Expected**:
- ✅ First 50 downloads succeed
- ✅ 51st shows error: "Download limit reached"
- ✅ Error shows reset time

---

### Test 6: Rate Limiting - Access Attempts ✅

**Steps**:
1. Clear cookies
2. Visit access page
3. Enter wrong code 10 times
4. Try 11th attempt

**Expected Results**:
- ✅ First 10 attempts process normally
- ✅ 11th attempt shows: "Too many attempts. Please try again in X minutes."
- ✅ After 1 hour, can try again

---

### Test 7: Session Persistence ✅

**Steps**:
1. Access gallery with valid code
2. Close browser
3. Reopen browser
4. Visit same event slug (without code)

**Expected Results**:
- ✅ Cookie persists after browser close
- ✅ Automatically redirected to gallery
- ✅ No need to re-enter code
- ✅ Session valid for 30 days

---

### Test 8: Error Handling ✅

**Test 8a: Event Not Found**
1. Visit non-existent slug: `/fake-event-slug`
2. Expected: 404 page

**Test 8b: Archived Event**
1. Visit archived event
2. Expected: "Event has been archived" message

**Test 8c: Invalid Access Code**
1. Enter wrong code
2. Expected: "Invalid access code. Please try again."

**Test 8d: Network Error**
1. Disconnect internet
2. Try to load photos
3. Expected: Error message with retry button

**Test 8e: Photo Load Failure**
1. Break image URL temporarily
2. Expected: Placeholder with reload icon

---

### Test 9: Mobile Gestures ✅

**Prerequisites**:
- Testing on mobile device or touch emulation

**Swipe Tests**:
1. In lightbox, swipe left → Next photo
2. In lightbox, swipe right → Previous photo
3. In lightbox, swipe down → Close lightbox

**Touch Tests**:
1. All buttons should be min 44px
2. Tap targets should not overlap
3. Scroll should be smooth
4. No accidental taps

**Expected Results**:
- ✅ Swipe gestures responsive
- ✅ Minimum distance threshold works
- ✅ No conflicts between gestures
- ✅ Touch targets adequate size

---

### Test 10: Performance ✅

**Load Time Test**:
1. Clear cache
2. Visit gallery (first visit)
3. Measure load times

**Expected**:
- ✅ First Contentful Paint < 1.5s
- ✅ Time to Interactive < 3s
- ✅ Largest Contentful Paint < 2.5s

**Scroll Performance Test**:
1. Gallery with 500+ photos
2. Scroll continuously
3. Monitor frame rate

**Expected**:
- ✅ Smooth 60fps scrolling
- ✅ No jank or lag
- ✅ Images load progressively

**Memory Test**:
1. Browse through 200+ photos
2. Check memory usage

**Expected**:
- ✅ No memory leaks
- ✅ Reasonable memory consumption

---

### Test 11: Multi-Device Testing ✅

**Devices to Test**:
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Desktop (Chrome)
- [ ] Desktop (Firefox)
- [ ] Desktop (Safari)

**Features to Verify on Each**:
- Access page displays correctly
- Form inputs work
- Photo grid renders properly
- Lightbox opens and functions
- Download works
- Navigation gestures/keys work

---

### Test 12: Security Testing ✅

**JWT Token Test**:
1. Inspect cookie in DevTools
2. Verify HttpOnly flag
3. Verify Secure flag (production)
4. Try to modify token
5. Access gallery with modified token

**Expected**:
- ✅ Cookie has HttpOnly flag
- ✅ Cookie has Secure flag (prod)
- ✅ Cannot access cookie via JS
- ✅ Modified token rejected

**SQL Injection Test**:
1. Try SQL injection in access code: `' OR '1'='1`
2. Expected: Validation rejects input

**XSS Test**:
1. Try XSS in access code: `<script>alert('xss')</script>`
2. Expected: Sanitized, no execution

---

## 📋 BROWSER COMPATIBILITY CHECKLIST

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] iOS Chrome
- [ ] Android Chrome
- [ ] Android Firefox

### Features to Test Per Browser
- [ ] Access form
- [ ] Photo grid
- [ ] Lightbox
- [ ] Keyboard shortcuts
- [ ] Download functionality
- [ ] Touch gestures (mobile)

---

## 🎯 ACCEPTANCE TESTING

### Story 5.1 - Access Entry Page
- [ ] Access page loads
- [ ] Form displays correctly
- [ ] 6-char input validation
- [ ] Auto-uppercase works
- [ ] QR code redirect works
- [ ] Valid code creates session
- [ ] Invalid code shows error
- [ ] Rate limiting enforced
- [ ] Mobile responsive
- [ ] Event not found handled
- [ ] Archived event handled

### Story 5.2 - Photo Grid
- [ ] Gallery displays after access
- [ ] Header shows event info
- [ ] Responsive grid layout
- [ ] Square aspect ratio
- [ ] Lazy loading works
- [ ] Infinite scroll works
- [ ] Loading skeletons shown
- [ ] Photos clickable
- [ ] Like badges display
- [ ] Empty state works
- [ ] Error handling works

### Story 5.3 - Photo Detail
- [ ] Lightbox opens on click
- [ ] Full-screen display
- [ ] High-res loads progressively
- [ ] Navigation arrows work
- [ ] Close button works
- [ ] Photo counter displays
- [ ] Download button visible
- [ ] Swipe gestures work
- [ ] Keyboard shortcuts work
- [ ] Auto-hide controls work
- [ ] Pinch-to-zoom works

### Story 5.4 - Download
- [ ] Download button visible
- [ ] Click downloads file
- [ ] Original quality preserved
- [ ] Format preserved
- [ ] Filename correct
- [ ] Mobile download works
- [ ] Rate limiting enforced
- [ ] Error handling works
- [ ] Download tracked in DB

---

## 🔍 DATABASE VERIFICATION

### Check Tables Created
```sql
-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('guest_sessions', 'photo_downloads', 'photo_views', 'event_settings');
```

### Check Data Integrity
```sql
-- Check guest session created
SELECT * FROM guest_sessions ORDER BY created_at DESC LIMIT 5;

-- Check download tracking
SELECT * FROM photo_downloads ORDER BY downloaded_at DESC LIMIT 10;

-- Verify indexes
SELECT * FROM pg_indexes WHERE tablename IN ('guest_sessions', 'photo_downloads');
```

---

## 🚀 DEPLOYMENT VERIFICATION

### Pre-Deployment
- [ ] All tests pass locally
- [ ] Build succeeds without errors
- [ ] No console errors in browser
- [ ] Environment variables configured
- [ ] Database migrations applied

### Post-Deployment
- [ ] Health check endpoint responds
- [ ] Access page accessible
- [ ] Gallery loads correctly
- [ ] Downloads work
- [ ] Rate limiting active
- [ ] Error tracking configured
- [ ] Monitoring active

---

## ✅ SIGN-OFF CHECKLIST

### Development Sign-Off
- [x] All P0 stories completed
- [x] Code review completed
- [x] Manual testing completed
- [x] Documentation complete
- [x] Build successful

### QA Sign-Off
- [ ] Test scenarios executed
- [ ] All critical paths tested
- [ ] Cross-browser testing done
- [ ] Mobile testing done
- [ ] Performance validated
- [ ] Security tested

### Product Owner Sign-Off
- [ ] Features meet requirements
- [ ] User experience acceptable
- [ ] Business value delivered
- [ ] Ready for production

---

## 📊 TEST RESULTS TEMPLATE

```markdown
## Test Session: [Date]
Tester: [Name]
Environment: [Local/Staging/Production]
Browser: [Browser Name & Version]
Device: [Device Type]

### Results:

Story 5.1: [PASS/FAIL]
- Access Code: [PASS/FAIL]
- QR Code: [PASS/FAIL]
- Rate Limiting: [PASS/FAIL]

Story 5.2: [PASS/FAIL]
- Grid Layout: [PASS/FAIL]
- Infinite Scroll: [PASS/FAIL]
- Lazy Loading: [PASS/FAIL]

Story 5.3: [PASS/FAIL]
- Lightbox: [PASS/FAIL]
- Navigation: [PASS/FAIL]
- Gestures: [PASS/FAIL]

Story 5.4: [PASS/FAIL]
- Download: [PASS/FAIL]
- Rate Limit: [PASS/FAIL]

### Issues Found:
1. [Description]
2. [Description]

### Overall: [PASS/FAIL]
```

---

**Testing Status**: Ready for QA  
**Last Updated**: December 13, 2024
