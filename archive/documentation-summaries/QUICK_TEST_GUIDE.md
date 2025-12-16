# 🚀 Quick Test Guide - Admin Landing Page Integration

## ⚡ Fast Testing Steps

### 1️⃣ Start Development Server
```bash
npm run dev
```

### 2️⃣ Login ke Admin
```
URL: http://localhost:3000/admin/login
Username: nandika
Password: Hantu@112233
```

### 3️⃣ Test Hero Slideshow Management

**Navigate:** Landing Page → Hero Slideshow

**Quick Test:**
1. ✅ Upload test image (any photo 1920x1080)
2. ✅ Click "Settings" → Change timing to 3 seconds
3. ✅ Click "Preview" → Verify slideshow works
4. ✅ Drag to reorder slides (if multiple)
5. ✅ Toggle slide active/inactive

**Expected:** Slide appears, preview works, settings save

### 4️⃣ Test Bento Grid Management

**Navigate:** Landing Page → Bento Grid

**Quick Test:**
1. ✅ Check if portfolio photos load
2. ✅ Click any photo to add to bento grid
3. ✅ Change size dropdown (Medium → Large)
4. ✅ Click photo again to remove

**Expected:** Photos add/remove instantly, size changes reflect

### 5️⃣ Test Form Submissions

**Navigate:** Landing Page → Form Submissions

**Quick Test:**
1. ✅ Open new tab: http://localhost:3000
2. ✅ Scroll to contact form (bottom of page)
3. ✅ Fill out form with test data
4. ✅ Submit form
5. ✅ Return to admin tab
6. ✅ Refresh form submissions page
7. ✅ Verify submission appears
8. ✅ Change status to "Contacted"
9. ✅ Add internal note

**Expected:** Submission appears, status updates, notes save

### 6️⃣ Verify Frontend Integration

**Open:** http://localhost:3000

**Check:**
- ✅ Hero slideshow displays uploaded photos
- ✅ Slideshow auto-plays (if enabled)
- ✅ Bento grid shows selected photos
- ✅ Conversational form works
- ✅ Form submission saves to database

---

## 🎯 Success Checklist

```
✅ Build completed successfully
✅ Admin login works
✅ Hero slideshow management loads
✅ Can upload photos
✅ Can configure slideshow settings
✅ Bento grid management loads
✅ Can add/remove photos from grid
✅ Form submissions page loads
✅ Public form submits successfully
✅ Submissions appear in admin
✅ Frontend displays dynamic content
```

---

## 🐛 Common Issues & Solutions

### Issue: "Can't upload photos"
**Solution:** Check R2 storage configuration in `.env.local`

### Issue: "No photos in bento grid"
**Solution:** First upload photos to Portfolio, then add to bento grid

### Issue: "Form submissions not showing"
**Solution:** Refresh page, check database connection

### Issue: "Slideshow not auto-playing"
**Solution:** Check settings, ensure autoplay is enabled

---

## 📊 Database Check

```bash
# Check if tables exist
export DATABASE_URL='postgresql://...'
npx prisma studio

# Tables to verify:
# - hero_slideshow
# - slideshow_settings
# - form_submissions
# - portfolio_photos (with bento columns)
```

---

## 🎨 Test Data Examples

**Hero Slide:**
- Title: "Your Wedding Day"
- Subtitle: "Captured Perfectly"
- Image: 1920x1080 landscape photo

**Bento Grid:**
- Select 8-12 best portfolio photos
- Mix of sizes: 2 Large, 4 Medium, 2 Wide, 2 Tall

**Form Submission:**
- Name: "Test Client"
- WhatsApp: "+62 812 3456 7890"
- Email: "test@example.com"
- Package: "Premium Wedding"
- Date: "December 2024"
- Message: "Interested in booking"

---

## ✅ Integration Complete!

**What's Working:**
1. ✅ **Hero Slideshow** - Fully manageable from admin
2. ✅ **Bento Grid** - Dynamic photo selection
3. ✅ **Form System** - Lead capture & tracking
4. ✅ **Admin UI** - Beautiful, intuitive interface
5. ✅ **Frontend** - Seamless data integration
6. ✅ **Mobile Ready** - Responsive design

**Ready for Production! 🚀**

