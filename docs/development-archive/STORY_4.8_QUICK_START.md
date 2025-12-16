# 🚀 STORY 4.8 QUICK START GUIDE
## Photo Reordering & Organization

**Status:** ✅ Ready for Testing  
**Build:** ✓ Successful  
**Server:** Running on http://124.197.42.88:3000

---

## 📋 QUICK TESTING CHECKLIST

### Prerequisites
- ✅ Server running (`npm run dev`)
- ✅ Admin account logged in
- ✅ Event dengan photos tersedia

---

## 🧪 TESTING SCENARIOS

### 1. **Basic Drag-and-Drop** (2 minutes)

**Steps:**
1. Navigate ke `/admin/events/[eventId]/photos`
2. Hover over photo → lihat drag handle (GripVertical icon) muncul
3. Drag photo ke posisi baru
4. Perhatikan:
   - ✅ Photo jadi semi-transparent saat di-drag
   - ✅ Drop overlay muncul
   - ✅ Photos lain bergeser untuk beri ruang
5. Drop photo
6. Verifikasi:
   - ✅ Toast "Photos reordered successfully" muncul
   - ✅ Undo button tersedia
   - ✅ Photo tetap di posisi baru setelah page refresh

**Expected Result:** Photo berhasil pindah posisi dan persist ke database.

---

### 2. **Undo Functionality** (1 minute)

**Steps:**
1. Drag photo ke posisi baru
2. Klik "Undo" button di toast (dalam 10 detik)
3. Verifikasi:
   - ✅ Photo kembali ke posisi semula
   - ✅ Order restored di database
   - ✅ Toast menghilang

**Expected Result:** Undo berhasil restore previous order.

---

### 3. **Auto-Sort by Upload Date** (2 minutes)

**Steps:**
1. Klik "Auto-Sort" button di toolbar
2. Pilih "Upload Date"
3. Toggle "Ascending" atau "Descending"
4. Klik salah satu option (misal: Upload Date)
5. Confirmation modal muncul:
   - ✅ Preview message: "Reorder all photos by Upload Date (Ascending)?"
6. Klik "Confirm"
7. Verifikasi:
   - ✅ Loading overlay muncul
   - ✅ Page reload
   - ✅ Photos tersusun by upload date

**Expected Result:** Photos sorted by selected criteria.

---

### 4. **Auto-Sort Options Test** (3 minutes)

Test semua 4 sort options:

**A. File Name Sort:**
1. Auto-Sort → File Name → Ascending
2. Verify photos sorted alphabetically

**B. File Size Sort:**
1. Auto-Sort → File Size → Descending
2. Verify largest photos first

**C. Date Taken (EXIF) Sort:**
1. Auto-Sort → Date Taken → Ascending
2. Verify photos sorted by EXIF date
3. Photos without EXIF fall back to upload date

**D. Direction Toggle:**
1. Sort by any criteria → Ascending
2. Sort same criteria → Descending
3. Verify order reverses

**Expected Result:** All sort options work correctly.

---

### 5. **Mobile Touch Support** (3 minutes)

**Testing on Mobile/Tablet:**
1. Open page on mobile browser atau Chrome DevTools (mobile view)
2. Long-press on photo (trigger drag)
3. Perhatikan:
   - ✅ 8px movement required before drag starts
   - ✅ Page tidak scroll saat dragging
   - ✅ Visual feedback clear
4. Drag to new position
5. Drop photo
6. Verify reorder works

**Expected Result:** Touch drag-and-drop works smoothly on mobile.

---

### 6. **Error Handling** (2 minutes)

**Test Network Error:**
1. Open DevTools → Network tab
2. Set "Offline" mode
3. Drag photo ke posisi baru
4. Observe:
   - ✅ Photos revert to original position
   - ✅ Error alert: "Failed to reorder photos. Please try again."
5. Re-enable network
6. Retry drag → should work

**Expected Result:** Graceful error handling with revert.

---

### 7. **Large Photo Set** (3 minutes)

**Test with 50+ Photos:**
1. Upload 50+ photos ke event (if not available)
2. Test drag-and-drop performance:
   - ✅ Smooth drag animation
   - ✅ No lag or stuttering
   - ✅ Quick API response
3. Test auto-sort:
   - ✅ Sorts all photos efficiently
   - ✅ Loading state visible
   - ✅ Page reload smooth

**Expected Result:** Good performance dengan large datasets.

---

### 8. **Multiple Reorders** (2 minutes)

**Test Sequential Operations:**
1. Drag photo A to position 1
2. Immediately drag photo B to position 2
3. Use undo for last operation
4. Drag photo C to position 3
5. Use auto-sort
6. Verify:
   - ✅ Each operation tracked correctly
   - ✅ Undo only affects last operation
   - ✅ Final state correct

**Expected Result:** Sequential operations handled correctly.

---

### 9. **Integration with Photo Detail** (2 minutes)

**Test Modal Integration:**
1. Reorder photos dengan drag-and-drop
2. Click photo to open detail modal
3. Verify:
   - ✅ Modal opens correctly
   - ✅ Navigation arrows work
   - ✅ Photo order matches grid order
4. Close modal
5. Grid still shows correct order

**Expected Result:** Detail modal respects new order.

---

### 10. **Persistence Test** (1 minute)

**Test Data Persistence:**
1. Reorder photos
2. Refresh page (F5)
3. Verify order maintained
4. Logout → Login again
5. Navigate back to photos
6. Verify order still correct

**Expected Result:** Order persists across sessions.

---

## 🐛 KNOWN ISSUES TO WATCH

### Potential Issues:
- [ ] Concurrent edits from multiple users
- [ ] Very large file sets (500+ photos)
- [ ] Slow network connections
- [ ] Browser compatibility (older browsers)

### Report Issues:
Format: `[Story 4.8] Issue description - Browser/Device - Steps to reproduce`

---

## 📊 PERFORMANCE BENCHMARKS

### Target Metrics:
- **Drag Response Time:** < 16ms (60fps)
- **API Reorder Time:** < 500ms for 100 photos
- **Auto-Sort Time:** < 2s for 100 photos
- **Page Load Time:** < 3s

### Monitor:
- Network tab untuk API call times
- Console untuk errors atau warnings
- Performance tab untuk rendering issues

---

## 🔍 DEBUGGING TIPS

### Check Console Logs:
```javascript
// Reorder operation log
console.log('📦 Reordering photos:', photoOrders);

// Auto-sort log  
console.log('🔄 Auto-sorting by:', sortBy, direction);

// Error log
console.error('Error reordering photos:', error);
```

### Check Network Tab:
- `PATCH /api/admin/events/[id]/photos/reorder` → Should return 200
- `POST /api/admin/events/[id]/photos/auto-sort` → Should return 200

### Check Database:
```sql
-- Verify display_order values
SELECT id, filename, display_order 
FROM photos 
WHERE event_id = 'xxx' AND deleted_at IS NULL
ORDER BY display_order ASC;
```

---

## ✅ SIGN-OFF CHECKLIST

Before marking story as DONE:

- [ ] All 10 testing scenarios pass
- [ ] No console errors
- [ ] Mobile touch support works
- [ ] Error handling tested
- [ ] Performance acceptable
- [ ] Data persists correctly
- [ ] Integration with other features works
- [ ] No TypeScript errors in build
- [ ] Documentation complete

---

## 🎯 SUCCESS CRITERIA

Story 4.8 is COMPLETE when:

✅ **Functional Requirements:**
- Drag-and-drop reordering works smoothly
- Auto-sort with 4 options functional
- Undo works within 10-second window
- Mobile touch support operational

✅ **Technical Requirements:**
- No build errors
- No runtime errors
- Transaction-safe updates
- Proper error handling

✅ **UX Requirements:**
- Smooth animations
- Clear visual feedback
- Intuitive interactions
- Responsive on all devices

✅ **Quality Assurance:**
- All tests pass
- Performance acceptable
- Browser compatible
- Mobile-friendly

---

## 📞 SUPPORT

**Issues or Questions?**
- Check console logs first
- Verify API responses in Network tab
- Review story file: `docs/stories/story-4.8-photo-reordering-organization.md`
- Check implementation summary: `RINGKASAN_STORY_4.8_BAHASA_INDONESIA.md`

**Quick Commands:**
```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Check logs
tail -f /tmp/dev-server.log
```

---

**Happy Testing! 🎉**

Jika semua testing scenarios pass, Story 4.8 siap untuk production deployment!
