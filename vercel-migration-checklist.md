# 🚀 Vercel Migration Checklist - Hafiportrait Photography

## 📋 Overview
Migration dari VPS (PM2) ke Vercel Serverless Platform

**Status:** 🟡 Ready for Migration (dengan beberapa changes)

---

## ✅ PRE-MIGRATION TASKS (VPS)

### 1. Storage Migration ke R2 - ⚠️ CRITICAL
**Priority:** P0 (BLOCKER)  
**Status:** ⚠️ TODO

**Current State:**
- Storage: `/home/eouser/storage` (425MB)
- Config: `USE_LOCAL_STORAGE=true`

**Required Changes:**
```bash
# 1. Backup existing photos
cd /home/eouser
tar -czf storage-backup-$(date +%Y%m%d).tar.gz storage/

# 2. Upload to R2 using rclone or AWS CLI
# Install rclone: https://rclone.org/install/
rclone copy /home/eouser/storage/ r2:photos --progress

# 3. Verify all files uploaded
rclone ls r2:photos | wc -l  # Should match local file count

# 4. Update .env
USE_LOCAL_STORAGE=false
# Remove: STORAGE_BASE_PATH
# Remove: STORAGE_PUBLIC_URL

# 5. Test locally with R2
npm run dev
# Test upload, download, delete photos

# 6. Verify database photo URLs
# Check if any photos have local paths in database
```

**Testing:**
- [ ] Upload new photo (should go to R2)
- [ ] Download existing photo (should come from R2)
- [ ] View gallery (all thumbnails load)
- [ ] Delete photo (removes from R2)

---

### 2. Redis Migration ke Upstash - ⚠️ REQUIRED
**Priority:** P0 (BLOCKER)  
**Status:** ⚠️ TODO

**Current State:**
- Redis: Local `redis://localhost:6379`

**Required Changes:**
```bash
# 1. Sign up Upstash
# https://console.upstash.com/

# 2. Create Redis Database
# Region: Choose closest to your users (e.g., US-East for NeonDB)

# 3. Get connection string
# Format: redis://default:PASSWORD@HOST:6379

# 4. Test locally
REDIS_URL="redis://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379"
npm run dev

# 5. Verify rate limiting works
# Try multiple requests quickly
```

**Upstash Setup:**
1. Go to: https://console.upstash.com/
2. Create Database
   - Name: `hafiportrait-production`
   - Region: `us-east-1` (same as NeonDB)
   - Type: `Regional`
   - TLS: `Enabled`
3. Copy: REST URL or Redis URL
4. Format for .env:
   ```
   REDIS_URL=redis://default:PASSWORD@HOST.upstash.io:6379
   ```

**Free Tier Limits:**
- 10,000 commands/day
- Max 256 MB
- TLS connection
- (Should be sufficient for moderate traffic)

---

### 3. Socket.IO Removal - ✅ PARTIALLY DONE
**Priority:** P1 (IMPORTANT)  
**Status:** 🟢 50% Complete

**Already Done:**
- ✅ `SOCKET_IO_ENABLED=false` in .env
- ✅ Ably integration in `useAblyChannel.ts`
- ✅ Ably publishing in upload route
- ✅ PhotoGrid using Ably

**Still TODO:**
- [ ] Remove Socket.IO dependencies from package.json
- [ ] Delete `server/socket-server.ts`
- [ ] Delete `server/socket-server-entry.ts`
- [ ] Remove `useSocket.ts` or mark as deprecated
- [ ] Remove `lib/socket-broadcast.ts` or migrate to Ably
- [ ] Update all components still using Socket.IO

**Commands:**
```bash
# 1. Find all Socket.IO usage
grep -r "socket\.io\|useSocket" --include="*.ts" --include="*.tsx"

# 2. Remove from package.json
npm uninstall socket.io socket.io-client

# 3. Delete server files
rm -rf server/

# 4. Verify build works
npm run build
```

---

### 4. Environment Variables Audit - ⚠️ TODO
**Priority:** P1 (IMPORTANT)  
**Status:** ⚠️ TODO

**Current .env.production Analysis:**

| Variable | Status | Action Needed |
|----------|--------|---------------|
| `DATABASE_URL` | ✅ Ready | None - NeonDB cloud-based |
| `DIRECT_URL` | ✅ Ready | None |
| `REDIS_URL` | ❌ Local | **CHANGE to Upstash** |
| `NEXTAUTH_SECRET` | ✅ Ready | None - already secure |
| `JWT_EXPIRATION` | ✅ Ready | None |
| `BCRYPT_ROUNDS` | ✅ Ready | None |
| `ALLOWED_ORIGINS` | ⚠️ Review | Add Vercel preview URLs |
| `NODE_ENV` | ✅ Ready | Auto-set by Vercel |
| `NEXTAUTH_URL` | ⚠️ Update | Use Vercel URL initially |
| `NEXT_PUBLIC_API_URL` | ⚠️ Update | Use Vercel URL initially |
| `R2_*` | ✅ Ready | None - already configured |
| `USE_LOCAL_STORAGE` | ❌ TRUE | **CHANGE to false** |
| `STORAGE_BASE_PATH` | ❌ Local path | **REMOVE for Vercel** |
| `STORAGE_PUBLIC_URL` | ❌ Local | **REMOVE for Vercel** |
| `SOCKET_IO_ENABLED` | ✅ FALSE | None - already disabled |
| `ABLY_API_KEY` | ✅ Ready | None |
| `NEXT_PUBLIC_ABLY_AUTH_URL` | ✅ Ready | None |
| `CRON_SECRET` | ✅ Ready | None |
| `MAX_LARGE_FILE_CONCURRENT` | ✅ Ready | None |
| `LARGE_FILE_THRESHOLD_MB` | ✅ Ready | None |
| `MAX_BATCH_SIZE_MB` | ✅ Ready | None |

**Critical Changes Required:**
```bash
# In Vercel Dashboard:
USE_LOCAL_STORAGE=false
REDIS_URL=redis://default:PASSWORD@HOST.upstash.io:6379

# Remove these (not needed):
# STORAGE_BASE_PATH
# STORAGE_PUBLIC_URL
# SOCKET_PORT
# NEXT_PUBLIC_SOCKET_URL (optional: keep for documentation)
```

---

### 5. Code Audit for VPS-specific Logic - ⚠️ TODO
**Priority:** P2 (MEDIUM)  
**Status:** ⚠️ TODO

**Check for:**
```bash
# 1. File system operations
grep -r "fs\.write\|fs\.read\|mkdirSync" app/ lib/ --include="*.ts"

# 2. Process-specific code
grep -r "process\.env\.PM2\|cluster\." app/ lib/ --include="*.ts"

# 3. Server listeners
grep -r "\.listen\|createServer" app/ lib/ server/ --include="*.ts"

# 4. Local paths
grep -r "/home/\|/var/\|/tmp/" app/ lib/ --include="*.ts"
```

**Expected Findings:**
- `lib/storage/local-storage.ts` - OK (controlled by env var)
- `server/socket-server.ts` - Will be removed
- Others - Need review

---

## 🚀 VERCEL SETUP TASKS

### 6. Create Vercel Project - ⚠️ TODO
**Priority:** P0 (BLOCKER)  
**Status:** ⚠️ TODO

**Steps:**
1. **Sign in to Vercel:**
   - https://vercel.com/login
   - Use GitHub OAuth

2. **Import Repository:**
   - New Project > Import Git Repository
   - Select: `hafiportrait-photography` (or your repo name)
   - Framework Preset: Next.js (auto-detected)

3. **Configure Build Settings:**
   ```
   Framework: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   Node Version: 20.x
   ```

4. **Skip Environment Variables for now**
   - We'll add them in next step

5. **Deploy to Preview First**
   - Don't assign custom domain yet

---

### 7. Add Environment Variables - ⚠️ TODO
**Priority:** P0 (BLOCKER)  
**Status:** ⚠️ TODO

**Method 1: Manual Copy (Recommended for first time)**

1. Go to: Project Settings > Environment Variables
2. Add one by one from `vercel-environment.txt`
3. **Important:** Select correct environments:
   - Production: For main branch
   - Preview: For PR/branch previews
   - Development: For local `vercel dev`

**Critical Variables (Add these first):**
```
DATABASE_URL (Production only - secure)
NEXTAUTH_SECRET (All environments)
USE_LOCAL_STORAGE=false (All environments)
R2_ACCESS_KEY (Production only - secure)
R2_SECRET_KEY (Production only - secure)
ABLY_API_KEY (All environments)
REDIS_URL (All environments)
```

**Method 2: Vercel CLI (Advanced)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Add variables
vercel env add DATABASE_URL production
# (paste value when prompted)

# Or pull from Vercel (after manual setup)
vercel env pull .env.local
```

**Verification:**
```bash
# Check all variables are set
vercel env ls
```

---

### 8. Configure Custom Domain - ⚠️ TODO (LAST STEP)
**Priority:** P3 (NICE TO HAVE)  
**Status:** ⚠️ TODO (Do this last!)

**Wait until after successful preview deployment!**

1. **Test on Vercel Preview URL first:**
   - `https://hafiportrait-photography-xxx.vercel.app`
   - Test all features thoroughly
   - Monitor for 24-48 hours

2. **Then Configure Custom Domain:**
   - Project Settings > Domains
   - Add: `hafiportrait.photography`
   - Add: `www.hafiportrait.photography`

3. **Update DNS Records:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP)
   ```

4. **Update Environment Variables:**
   ```
   NEXTAUTH_URL=https://hafiportrait.photography
   NEXT_PUBLIC_API_URL=https://hafiportrait.photography/api
   NEXT_PUBLIC_BASE_URL=https://hafiportrait.photography
   ALLOWED_ORIGINS=https://hafiportrait.photography,https://www.hafiportrait.photography
   ```

5. **Redeploy:**
   - Settings > General > Redeploy

---

## 🧪 TESTING CHECKLIST

### 9. Preview Environment Testing - ⚠️ TODO
**Priority:** P0 (BLOCKER)  
**Status:** ⚠️ TODO

**Test Cases:**

**Authentication:**
- [ ] Admin login works
- [ ] JWT tokens issued correctly
- [ ] Session persistence
- [ ] Logout works

**Photo Upload:**
- [ ] Single photo upload to R2
- [ ] Bulk photo upload (10+ photos)
- [ ] Large files (>10MB)
- [ ] Thumbnail generation
- [ ] EXIF data extraction
- [ ] Progress tracking

**Gallery:**
- [ ] Public gallery view loads
- [ ] Photos display correctly (from R2)
- [ ] Infinite scroll works
- [ ] Lightbox works
- [ ] Download photos
- [ ] Like photos (guest)

**Real-time Features (Ably):**
- [ ] New photo notification appears
- [ ] Like counter updates in real-time
- [ ] Multiple users see updates
- [ ] Reconnection after disconnect

**Admin Dashboard:**
- [ ] Stats load correctly
- [ ] Event management (CRUD)
- [ ] Photo management
- [ ] Delete photos (removes from R2)
- [ ] Comment moderation

**API Endpoints:**
- [ ] Rate limiting works (Redis/Upstash)
- [ ] Error handling
- [ ] CORS headers correct
- [ ] Response times acceptable

**Performance:**
- [ ] Cold start < 3 seconds
- [ ] Warm requests < 500ms
- [ ] Image loading optimized
- [ ] No memory errors
- [ ] Check Vercel Analytics

**Cron Jobs:**
- [ ] Cron endpoints protected (CRON_SECRET)
- [ ] Manual trigger: `/api/cron/cleanup-photos`
- [ ] Check Vercel Logs for scheduled runs

---

## 📊 MONITORING & VALIDATION

### 10. Production Monitoring - ⚠️ TODO
**Priority:** P1 (IMPORTANT)  
**Status:** ⚠️ TODO

**Day 1 After Migration:**
- [ ] Monitor Vercel Dashboard (Analytics)
- [ ] Check error rate in Logs
- [ ] Verify all API routes working
- [ ] Monitor R2 bandwidth usage
- [ ] Monitor Upstash Redis usage
- [ ] Check Ably message count
- [ ] User feedback (test accounts)

**Week 1 After Migration:**
- [ ] Performance comparison vs VPS
- [ ] Cost analysis (Vercel + services)
- [ ] Error trend analysis
- [ ] Optimization opportunities
- [ ] SEO check (if applicable)

**Rollback Plan:**
- [ ] Keep VPS running for 1 week
- [ ] Database backed up
- [ ] R2 photos duplicated
- [ ] Can revert DNS quickly

---

## 💰 COST TRACKING

### Current VPS Cost (Estimate):
- VPS: ~$20/month
- **Total: $20/month**

### Projected Vercel Cost:
```
Vercel Pro:           $20/month  (required for custom domain)
Upstash Redis:        $0/month   (free tier)
Cloudflare R2:        $0/month   (10GB free, then $0.015/GB)
Ably:                 $0/month   (3M messages/month free)
NeonDB:               $0/month   (already using)
────────────────────────────────────────────────────
TOTAL:                ~$20/month (same as VPS!)
```

**Cost Monitoring:**
- [ ] Setup billing alerts in Vercel
- [ ] Monitor R2 usage in Cloudflare
- [ ] Monitor Ably usage in dashboard
- [ ] Track bandwidth usage

---

## 🚨 KNOWN ISSUES & SOLUTIONS

### Issue 1: Socket.IO Removal
**Problem:** Beberapa komponen masih menggunakan Socket.IO  
**Solution:** Migrate fully ke Ably (already 50% done)  
**Impact:** Low - Ably already working

### Issue 2: Local Storage
**Problem:** 425MB photos di local VPS storage  
**Solution:** Upload semua ke R2 sebelum migrasi  
**Impact:** HIGH - BLOCKER

### Issue 3: Redis Local
**Problem:** Redis berjalan di localhost  
**Solution:** Migrate ke Upstash (5 menit setup)  
**Impact:** MEDIUM - Required for rate limiting

### Issue 4: Cold Starts
**Problem:** Vercel serverless bisa cold start 1-3 detik  
**Solution:** 
- Use Vercel Pro (faster cold starts)
- Optimize bundle size
- Consider Edge Functions for critical paths  
**Impact:** Low - acceptable trade-off

---

## ✅ FINAL CHECKLIST BEFORE GO-LIVE

**Pre-Migration (VPS):**
- [ ] ✅ Backup database (Neon auto-backup enabled)
- [ ] ⚠️ Upload semua photos ke R2
- [ ] ⚠️ Setup Upstash Redis
- [ ] ⚠️ Remove Socket.IO dependencies
- [ ] ✅ Test dengan `USE_LOCAL_STORAGE=false` locally
- [ ] ⚠️ Verify all tests passing
- [ ] ⚠️ Code review completed

**Vercel Setup:**
- [ ] ⚠️ Project created and linked
- [ ] ⚠️ Environment variables configured
- [ ] ⚠️ Preview deployment successful
- [ ] ⚠️ All test cases passed
- [ ] ⚠️ Performance acceptable

**Go-Live:**
- [ ] ⚠️ Custom domain configured
- [ ] ⚠️ DNS updated
- [ ] ⚠️ SSL certificate active (auto by Vercel)
- [ ] ⚠️ Monitor for 1 hour after switch
- [ ] ⚠️ Test from multiple locations
- [ ] ⚠️ User acceptance testing

**Post-Migration:**
- [ ] ⚠️ Keep VPS running for 1 week (rollback option)
- [ ] ⚠️ Monitor costs daily
- [ ] ⚠️ Monitor errors and performance
- [ ] ⚠️ Collect user feedback
- [ ] ⚠️ Document lessons learned

---

## 📞 SUPPORT & RESOURCES

**Vercel Documentation:**
- https://vercel.com/docs
- https://vercel.com/docs/concepts/next.js/overview

**Upstash Redis:**
- https://docs.upstash.com/redis
- Dashboard: https://console.upstash.com

**Cloudflare R2:**
- https://developers.cloudflare.com/r2/
- Dashboard: https://dash.cloudflare.com

**Ably:**
- https://ably.com/docs
- Dashboard: https://ably.com/dashboard

**Community:**
- Vercel Discord: https://vercel.com/discord
- Next.js Discord: https://nextjs.org/discord

---

## 📅 ESTIMATED TIMELINE

**Total Time: 5-7 Days**

- **Day 1-2:** Storage migration ke R2
- **Day 2:** Redis setup (Upstash)
- **Day 3:** Socket.IO removal
- **Day 3-4:** Vercel setup & preview testing
- **Day 5:** Production testing (preview URL)
- **Day 6-7:** Custom domain & monitoring

**Rollback Window:** Keep VPS for 7 days after migration

---

## 🎉 SUCCESS CRITERIA

Migration dianggap sukses jika:
- ✅ All features working on Vercel
- ✅ Performance equal or better than VPS
- ✅ No critical errors in 24 hours
- ✅ User can upload, view, download photos
- ✅ Real-time features working (Ably)
- ✅ Cost within budget ($20-30/month)
- ✅ Zero downtime migration

---

**Last Updated:** 2026-01-21  
**Status:** 🟡 Ready for Migration (pending: R2 upload, Upstash setup)
