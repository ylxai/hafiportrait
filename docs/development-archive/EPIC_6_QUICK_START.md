# 🚀 Epic 6: Quick Start Guide

**Hafiportrait Photography Platform - Engagement Features**  
**Date**: December 13, 2024  
**Status**: ✅ READY TO USE

---

## ⚡ QUICK DEPLOYMENT

### 1. Update Database (REQUIRED)
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 2. Verify Build
```bash
# Check for errors
npm run build
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm run build && npm start
```

---

## 🎯 FEATURES OVERVIEW

### For Wedding Guests

#### 1. Like Photos
- **Where**: Gallery page (`/gallery/[eventSlug]`)
- **How**: Click heart icon atau double-tap photo
- **Features**:
  - Instant visual feedback
  - Like count updates
  - Persistent across sessions
  - Rate limited (100/hour)

#### 2. Leave Comments/Ucapan
- **Where**: Gallery page, scroll to "Messages" section
- **How**: Click "Leave a Message" button
- **Fields**:
  - Name (required)
  - Email (optional)
  - Message (10-500 chars)
  - Relationship (optional: Family/Friend/Colleague/Other)
- **Features**:
  - Character counter
  - Real-time validation
  - Spam prevention
  - Rate limited (5/hour)

### For Photographers/Admins

#### 3. View Analytics
- **Where**: `/admin/events/[id]/analytics`
- **Metrics**:
  - Total likes, views, downloads
  - Average engagement
  - Most liked photos
  - 7-day trends
  - Recent activity
- **Actions**:
  - Export CSV
  - View detailed stats
  - Identify top content

#### 4. Moderate Comments
- **Where**: `/admin/events/[id]/comments`
- **Features**:
  - View all comments
  - Filter by status (pending/approved/rejected)
  - Search comments
  - Bulk approve/reject/delete
  - Export CSV
  - See statistics

---

## 📂 KEY FILES REFERENCE

### React Components

**Like System**:
```typescript
// components/gallery/LikeButton.tsx
import LikeButton from '@/components/gallery/LikeButton';

<LikeButton
  photoId={photo.id}
  eventSlug={eventSlug}
  initialLikesCount={photo.likesCount}
  size="md"
  showCount={true}
/>
```

**Comment System**:
```typescript
// components/gallery/comments/CommentSection.tsx
import CommentSection from '@/components/gallery/comments/CommentSection';

<CommentSection
  eventSlug={eventSlug}
  photoId={photoId} // optional
  allowComments={true}
/>
```

### API Endpoints

**Guest APIs**:
```
POST   /api/gallery/[eventSlug]/photos/[photoId]/like
DELETE /api/gallery/[eventSlug]/photos/[photoId]/like
GET    /api/gallery/[eventSlug]/comments
POST   /api/gallery/[eventSlug]/comments
```

**Admin APIs**:
```
GET   /api/admin/events/[id]/analytics
GET   /api/admin/events/[id]/analytics?action=export
GET   /api/admin/events/[id]/comments
PATCH /api/admin/events/[id]/comments
POST  /api/admin/events/[id]/comments (export)
```

---

## 🔧 CONFIGURATION

### Event Settings

Enable/disable features per event in EventSettings:

```typescript
// Database: event_settings table
{
  allowGuestLikes: true,              // Enable/disable likes
  allowGuestComments: true,           // Enable/disable comments
  requireCommentModeration: false,    // Auto-approve or manual review
}
```

### Rate Limits

Default limits (adjustable in code):
- **Likes**: 100 per hour per guest
- **Comments**: 5 per hour per guest

Files to modify:
- `app/api/gallery/[eventSlug]/photos/[photoId]/like/route.ts`
- `app/api/gallery/[eventSlug]/comments/route.ts`

---

## 🧪 TESTING CHECKLIST

### Guest Features
- [ ] Click like button on photo tile
- [ ] Double-tap photo to like
- [ ] Unlike photo by clicking again
- [ ] Like count updates correctly
- [ ] Likes persist after page refresh
- [ ] Submit comment with all fields
- [ ] Submit comment with minimal fields
- [ ] Character counter works
- [ ] Validation shows errors
- [ ] Success message appears
- [ ] Comment appears in list

### Admin Features
- [ ] View analytics dashboard
- [ ] See correct metrics
- [ ] View trend chart
- [ ] View top photos table
- [ ] Export analytics CSV
- [ ] View comments moderation
- [ ] Filter by status
- [ ] Search comments
- [ ] Approve single comment
- [ ] Reject single comment
- [ ] Delete single comment
- [ ] Bulk select comments
- [ ] Bulk approve
- [ ] Bulk reject
- [ ] Bulk delete
- [ ] Export comments CSV

### Mobile Testing
- [ ] Like button responsive
- [ ] Double-tap works on mobile
- [ ] Comment form mobile-friendly
- [ ] Character counter visible
- [ ] Validation messages clear
- [ ] Analytics dashboard responsive
- [ ] Moderation table scrollable

---

## 🐛 TROUBLESHOOTING

### Issue: Likes not persisting
**Solution**: Check browser localStorage enabled

### Issue: Comments not appearing
**Solution**: Check `allowGuestComments` setting in EventSettings

### Issue: Rate limit errors
**Solution**: Wait 1 hour or adjust rate limits in code

### Issue: Analytics showing 0
**Solution**: Ensure photos have likes/views/downloads

### Issue: Build errors
**Solution**: 
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## 📊 ANALYTICS EXPLAINED

### Engagement Score
```
Score = (likes × 0.5) + (views × 0.3) + (downloads × 0.2)
```

Higher weight on likes as they indicate active engagement.

### Trend Chart
Shows daily like counts for last 7 days. Helps identify:
- Peak engagement days
- Growing/declining interest
- Best posting times

### Top Photos
Sorted by likes count. Shows which photos resonate most with guests.

---

## 🔐 SECURITY FEATURES

### Input Protection
✅ XSS prevention (DOMPurify)  
✅ SQL injection prevention (Prisma)  
✅ Character limits enforced  
✅ Email validation  
✅ Honeypot spam trap  

### Rate Limiting
✅ Prevents spam  
✅ Prevents abuse  
✅ Per-guest tracking  
✅ IP-based backup  

### Content Moderation
✅ Pending approval workflow  
✅ Profanity filter (extensible)  
✅ Spam detection  
✅ Admin controls  

---

## 📱 MOBILE OPTIMIZATION

All features are mobile-first:
- Touch-optimized buttons
- Responsive layouts
- Smooth animations
- Easy-to-use forms
- Accessible controls

---

## 🚀 PERFORMANCE TIPS

### For Guests
- Likes use optimistic UI (instant feedback)
- Comments load on-demand
- Images lazy-loaded
- Minimal JavaScript

### For Admins
- Analytics cached server-side
- Pagination for large lists
- Efficient database queries
- CSV export streams data

---

## 📈 FUTURE ENHANCEMENTS

Ready to implement:
- [ ] WhatsApp notifications
- [ ] Email alerts for admins
- [ ] Comment threading (replies)
- [ ] Emoji reactions
- [ ] Advanced charts
- [ ] Real-time sync (Socket.IO custom server)

---

## 🆘 SUPPORT

### Common Questions

**Q: How do guests know they can like photos?**  
A: Heart icons are visible on all photos in gallery.

**Q: Do guests need to log in?**  
A: No! Anonymous likes/comments with guest identifier.

**Q: Can I disable features?**  
A: Yes, via EventSettings: `allowGuestLikes`, `allowGuestComments`.

**Q: How do I export data?**  
A: Click "Export CSV" in analytics or moderation pages.

**Q: Can I customize rate limits?**  
A: Yes, edit numbers in API route files.

---

## ✅ DEPLOYMENT CHECKLIST

Before going live:
- [x] Code compiled without errors
- [x] All components created
- [x] Database schema updated
- [x] Dependencies installed
- [ ] Run `npx prisma db push`
- [ ] Test all features manually
- [ ] Configure EventSettings
- [ ] Set rate limits appropriately
- [ ] Test on mobile devices
- [ ] Monitor for first few days

---

## 🎉 YOU'RE READY!

Epic 6 features are now available in your platform:

✅ **Like System** - Guests can express appreciation  
✅ **Comments** - Guests can leave messages  
✅ **Analytics** - Track engagement metrics  
✅ **Moderation** - Control content quality  
✅ **Real-time Foundation** - Ready for live updates  

**Start using**:
1. Update database: `npx prisma db push`
2. Start server: `npm run dev`
3. Create/open event in admin
4. Visit gallery as guest
5. Like photos and leave comments!

---

**Epic 6 Implementation**: COMPLETE ✅  
**Quick Start Guide**: v1.0  
**Date**: December 13, 2024  

**Happy Photographing! 📸❤️**
