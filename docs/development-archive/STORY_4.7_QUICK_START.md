# Story 4.7: Photo Deletion & Cleanup - Quick Start Guide

## 🚀 Quick Start untuk Testing

### 1. Verify Build & Setup
```bash
# Build sudah success ✅
npm run build

# Start development server
npm run dev
```

### 2. Akses URLs untuk Testing

**Local Development:**
- 🗑️ Trash Page: http://localhost:3000/admin/photos/trash
- 📸 Photo Management: http://localhost:3000/admin/events/[eventId]/photos

**Production Server:**
- 🗑️ Trash Page: http://124.197.42.88:3000/admin/photos/trash
- 📸 Photo Management: http://124.197.42.88:3000/admin/events/[eventId]/photos

---

## 🧪 Testing Scenarios

### Scenario 1: Soft Delete Photo dari Detail Modal
1. Buka photo management page
2. Click pada photo untuk membuka detail modal
3. Click tombol "Delete Photo" (merah)
4. Verify modal konfirmasi muncul dengan info "30 hari"
5. Click "Hapus"
6. Verify photo hilang dari gallery
7. Verify success notification muncul

**Expected Result:** Photo soft-deleted, masuk ke trash

### Scenario 2: View Trash Page
1. Navigate ke `/admin/photos/trash`
2. Verify deleted photos ditampilkan
3. Verify info ditampilkan:
   - Filename
   - Event name
   - Deletion date
   - Deleted by user
   - Days remaining counter

**Expected Result:** Semua deleted photos visible dengan metadata lengkap

### Scenario 3: Restore Photo dari Trash
1. Di trash page, find a deleted photo
2. Click tombol "Restore" (hijau)
3. Verify success notification
4. Navigate ke event photo gallery
5. Verify photo reappears di gallery

**Expected Result:** Photo restored successfully

### Scenario 4: Permanent Delete (Admin Only)
1. Login sebagai admin
2. Navigate ke trash page
3. Click tombol "Hapus" (merah) pada photo
4. Verify warning modal dengan red styling
5. Verify pesan "permanent" dan "tidak bisa dibatalkan"
6. Click "Hapus Permanen"
7. Verify photo hilang dari trash

**Expected Result:** Photo permanently deleted from storage + database

### Scenario 5: Event Filter di Trash
1. Di trash page, verify event dropdown ada
2. Select specific event dari dropdown
3. Verify hanya photos dari event tersebut yang ditampilkan

**Expected Result:** Filtering works correctly

### Scenario 6: Days Remaining Display
1. Di trash page, check visual indicators
2. Verify color coding:
   - Gray: < 20 days
   - Yellow: 20-24 days
   - Orange: 25-29 days
   - Red: ≥ 30 days (ready for cleanup)

**Expected Result:** Color indicators accurate

---

## 🔑 Test User Credentials

### Admin Account
```
Email: admin@hafiportrait.com
Password: Admin123!
```

### Client Account
```
Email: client@example.com
Password: Client123!
```

---

## 🔌 API Testing dengan cURL

### 1. Soft Delete Photo
```bash
curl -X DELETE \
  http://localhost:3000/api/admin/photos/[PHOTO_ID] \
  -H 'Cookie: auth-token=YOUR_TOKEN'
```

### 2. Restore Photo
```bash
curl -X POST \
  http://localhost:3000/api/admin/photos/[PHOTO_ID]/restore \
  -H 'Cookie: auth-token=YOUR_TOKEN'
```

### 3. Permanent Delete (Admin Only)
```bash
curl -X DELETE \
  http://localhost:3000/api/admin/photos/[PHOTO_ID]/permanent \
  -H 'Cookie: auth-token=YOUR_TOKEN'
```

### 4. List Trash Photos
```bash
curl http://localhost:3000/api/admin/photos/trash?page=1&limit=50 \
  -H 'Cookie: auth-token=YOUR_TOKEN'
```

### 5. Manual Cleanup Trigger
```bash
curl -X POST \
  http://localhost:3000/api/admin/photos/cleanup \
  -H 'Cookie: auth-token=YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"daysOld": 30}'
```

---

## 📊 Database Verification

### Check Soft-Deleted Photos
```sql
SELECT 
  id, 
  filename, 
  deleted_at, 
  deleted_by_id,
  event_id
FROM photos 
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

### Check Photos Ready for Cleanup
```sql
SELECT 
  id, 
  filename, 
  deleted_at,
  AGE(NOW(), deleted_at) as age
FROM photos 
WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days'
ORDER BY deleted_at ASC;
```

### Verify Active Photos (Non-Deleted)
```sql
SELECT 
  COUNT(*) as total_active_photos
FROM photos 
WHERE deleted_at IS NULL;
```

---

## 🛠️ Troubleshooting

### Issue: "Photo not found" saat delete
**Solution:** Verify photo ID correct dan user punya permission

### Issue: Restore button tidak muncul
**Solution:** Check user authentication dan role

### Issue: Permanent delete gagal
**Solution:** 
- Verify user adalah admin
- Check storage permissions
- Check file URLs masih valid

### Issue: Trash page kosong
**Solution:**
- Verify ada photos yang soft-deleted
- Check filter settings
- Verify authentication

### Issue: Cron job tidak running
**Solution:**
- Verify `CRON_SECRET` di environment
- Check cron endpoint accessible
- Review server logs

---

## 📝 Environment Variables Checklist

```env
# Required untuk Story 4.7
DATABASE_URL='postgresql://...'
NEXTAUTH_SECRET='your-secret'
CRON_SECRET='your-cron-secret'  # ⚠️ Required untuk automated cleanup

# Vercel Blob (if using)
BLOB_READ_WRITE_TOKEN='your-token'
```

---

## 🎯 Key Features untuk Test

### ✅ Must Test
1. ✅ Soft delete dari photo modal
2. ✅ View deleted photos di trash
3. ✅ Restore photo functionality
4. ✅ Permanent delete (admin)
5. ✅ Event filtering di trash
6. ✅ Days remaining display
7. ✅ Authorization checks

### 🔧 Optional Test
- Pagination di trash page
- Manual cleanup trigger
- Cron job simulation
- Error handling scenarios
- Edge cases (already deleted, not found, etc.)

---

## 📈 Success Metrics

### Functionality
- ✅ All delete operations work without errors
- ✅ Photos correctly excluded from gallery when deleted
- ✅ Restore brings photos back successfully
- ✅ Permanent delete removes all files

### Performance
- ✅ Trash page loads quickly (<2s)
- ✅ Delete operations complete quickly (<1s)
- ✅ No memory leaks during bulk operations

### UX
- ✅ Clear confirmation messages
- ✅ Appropriate warning for permanent actions
- ✅ Loading states visible
- ✅ Error messages helpful

---

## 🚨 Known Limitations

1. **Bulk Delete:** Not yet implemented (coming in future story)
2. **Search in Trash:** Not available yet
3. **Email Notifications:** Not implemented for expiring photos
4. **Undo outside Trash:** Can only restore from trash page

---

## 📞 Support & Documentation

- **Implementation Summary:** `STORY_4.7_IMPLEMENTATION_SUMMARY.md`
- **Story File:** `docs/stories/story-4.7-photo-deletion-cleanup.md`
- **API Docs:** Check route files for detailed comments

---

## ✨ Quick Verification Commands

```bash
# 1. Check build status
npm run build

# 2. Run development server
npm run dev

# 3. Check database migration applied
npx prisma migrate status

# 4. Generate Prisma client (if needed)
npx prisma generate

# 5. View schema
npx prisma studio
```

---

## 🎉 Ready to Test!

Semua komponen sudah ready:
- ✅ Database migration applied
- ✅ API endpoints created
- ✅ Frontend components built
- ✅ Build successful
- ✅ Cron job configured

**Start testing sekarang untuk verify semua functionality works as expected!**

---

**Questions? Issues? Check the Implementation Summary or Story file for detailed information.**
