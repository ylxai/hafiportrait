# Epic 8: Analytics & Reporting

**Epic Goal**: Implement comprehensive analytics dan reporting system yang provides insights tentang gallery performance, user engagement, dan business metrics untuk help fotografer understand platform usage dan make data-driven decisions. Epic ini delivers valuable business intelligence through visual dashboards dan exportable reports.

---

## Story 8.1: Analytics Data Collection Infrastructure

**As a** developer,  
**I want** robust analytics data collection system,  
**so that** all relevant user interactions dan metrics are tracked accurately untuk reporting.

### Acceptance Criteria

1. Database schema: `analytics_events` table dengan fields: id, event_id, event_type (view/download/like/comment/share), photo_id (nullable), user_identifier, session_id, ip_address, user_agent, referrer, created_at
2. Analytics service layer: centralized service untuk logging all trackable events
3. Event types tracked: gallery_view, photo_view, photo_download, photo_like, comment_post, qr_scan, access_code_used, share_link_clicked
4. Session tracking: unique session_id generated per visitor session (expires after 30 minutes inactivity)
5. User identification: anonymous user_identifier (UUID) stored dalam localStorage untuk tracking across visits
6. Privacy compliance: IP addresses hashed untuk GDPR compliance, no PII stored
7. Batch insertion: events buffered dan inserted in batches untuk performance (every 10 seconds atau 100 events)
8. Async processing: analytics logging doesn't block main request flow
9. Data retention policy: raw analytics events retained for 90 days, aggregated data kept permanently
10. API endpoint: POST `/api/analytics/track` accepts event data (internal only, not exposed to clients)
11. Client-side tracking: JavaScript tracking library sends events to backend
12. Server-side tracking: backend directly logs events for API calls (downloads, etc.)
13. Event validation: ensures required fields present, rejects invalid events

---

## Story 8.2: Dashboard Analytics Overview

**As an** admin/fotografer,  
**I want** comprehensive analytics dashboard dengan key metrics at a glance,  
**so that** saya dapat quickly understand platform usage dan gallery performance.

### Acceptance Criteria

1. Analytics dashboard at `/admin/analytics` displays platform-wide metrics
2. Key metrics cards: Total Views (all galleries), Total Downloads, Total Unique Visitors, Total Events
3. Time period selector: Today / Last 7 Days / Last 30 Days / Last 90 Days / All Time / Custom Range
4. Comparison metrics: shows change vs previous period (e.g., "+15% vs last week") dengan up/down indicators
5. Top performing events: table showing events dengan most views, sorted by view count
6. Recent activity feed: live atau near-real-time feed of recent platform activities
7. Quick stats: Average photos per event, Average engagement rate, Most popular access method (QR/Link/Code)
8. Geographic distribution: map showing visitor locations by country/region (based on IP geolocation)
9. Device breakdown: pie chart showing desktop vs mobile vs tablet traffic
10. Browser stats: chart showing browser usage (Chrome, Safari, Firefox, etc.)
11. Traffic sources: shows how users found galleries (direct, QR code, social media, etc.)
12. Date range comparison: overlay multiple date ranges on charts untuk trend comparison
13. Export button: download current view as PDF report
14. Auto-refresh: dashboard data refreshes every 5 minutes automatically (with manual refresh button)

---

## Story 8.3: Event-Specific Analytics

**As an** admin/fotografer,  
**I want** detailed analytics untuk each individual event,  
**so that** saya dapat evaluate specific event performance dan understand guest engagement patterns.

### Acceptance Criteria

1. Event analytics page at `/admin/events/:id/analytics`
2. Event metrics cards: Total Views, Unique Visitors, Total Downloads, Photos Viewed, Engagement Rate
3. Engagement rate calculation: (likes + comments + downloads) / total views * 100
4. Visitor timeline: line chart showing visitor count over time (hourly atau daily granularity)
5. Popular photos section: grid of top 10 most viewed photos dengan view counts
6. Most downloaded photos: list of photos dengan download counts
7. Most liked photos: grid dengan like counts
8. Most commented photos: list dengan comment counts
9. Access method breakdown: pie chart showing QR Code vs Direct Link vs Access Code usage percentages
10. Time-based analytics: heatmap showing when guests are most active (hour of day, day of week)
11. Average session duration: how long visitors stay in gallery
12. Photo view depth: average number of photos viewed per visitor
13. Download conversion rate: percentage of visitors who download photos
14. Bounce rate: percentage of visitors who leave immediately (view <2 photos)
15. Traffic sources: referral URLs showing where visitors came from

---

## Story 8.4: Photo-Level Analytics

**As an** admin/fotografer,  
**I want** to see analytics untuk individual photos,  
**so that** saya dapat understand which photos resonate most dan optimize future selections.

### Acceptance Criteria

1. Photo analytics accessible from photo detail view dalam admin area
2. Photo metrics: View Count, Download Count, Like Count, Comment Count, Share Count
3. View timeline: chart showing photo views over time since upload
4. Engagement score: calculated metric combining all interaction types dengan weighted formula
5. Comparison metrics: how this photo performs vs event average
6. Viewer retention: how long visitors spend viewing this photo (average time)
7. Device breakdown: which devices most commonly view this photo
8. Download rate: percentage of viewers who downloaded this photo
9. Social sharing: if photo shared, shows share count dan platforms
10. Photo ranking: "Top 10%" atau "Top 25%" badge if photo performs exceptionally
11. Related photos: "Viewers who liked this also liked..." suggestions based on user behavior
12. Export photo stats: download analytics for specific photo as CSV
13. Bulk photo analytics: compare multiple selected photos side-by-side

---

## Story 8.5: Download Analytics & Tracking

**As an** admin/fotografer,  
**I want** detailed download analytics,  
**so that** saya dapat understand download patterns dan verify value delivery to clients.

### Acceptance Criteria

1. Download analytics section dalam dashboard dan event analytics
2. Total downloads metric: aggregate count across all events atau specific event
3. Download timeline: chart showing downloads over time dengan spike detection
4. Download by user: top downloaders list (anonymous identifiers) dengan download counts
5. Download by photo: most downloaded photos dengan counts
6. Batch download tracking: separate metrics untuk single vs batch downloads
7. Download size tracking: total data transferred (GB/TB) untuk bandwidth monitoring
8. Average downloads per visitor: metric showing how many photos typical visitor downloads
9. Download completion rate: percentage of initiated downloads that completed successfully
10. Failed download tracking: logs dan reports download failures untuk troubleshooting
11. Peak download times: identifies when downloads most frequent
12. Client download analytics: separate tracking untuk client batch downloads vs guest downloads
13. Download source tracking: where download initiated (gallery page, photo detail, batch selection)
14. Export download report: detailed CSV dengan individual download records

---

## Story 8.6: Engagement Metrics & Visualization

**As an** admin/fotografer,  
**I want** clear visualization of engagement metrics,  
**so that** saya dapat understand how guests interact dengan galleries beyond just viewing.

### Acceptance Criteria

1. Engagement dashboard shows: Total Likes, Total Comments, Like Rate, Comment Rate
2. Like rate calculation: total likes / total photo views * 100
3. Comment rate: total comments / total unique visitors * 100
4. Engagement funnel: visualization showing View → Like → Comment → Download conversion rates
5. Engagement timeline: multi-line chart showing likes, comments, downloads over time
6. Top engagers: list of most active guests (by engagement actions) dengan anonymized identifiers
7. Engagement by photo: heatmap showing which photos get most engagement
8. Sentiment analysis (optional): basic sentiment from comment text (positive/neutral/negative percentages)
9. Comment word cloud: visual representation of most common words dalam comments
10. Engagement comparison: compare engagement across multiple events
11. Social proof metrics: "X% of visitors liked photos" untuk testimonial use
12. Engagement goals: set targets dan track progress (e.g., "Goal: 100 comments")
13. Engagement alerts: notifications when engagement milestones reached

---

## Story 8.7: Business Intelligence Reports

**As an** admin/fotografer running a business,  
**I want** business-focused reports dan metrics,  
**so that** saya dapat make informed decisions about service offerings dan pricing.

### Acceptance Criteria

1. Business reports section at `/admin/analytics/business`
2. Revenue proxy metrics: number of events, average photos per event, premium features used
3. Client satisfaction proxy: engagement rates, average session duration, return visits
4. Portfolio performance: which portfolio photos get most views on landing page
5. Conversion funnel: visitors → contact form submissions → events created
6. Event lifecycle analysis: average time dari event creation to completion to archiving
7. Storage utilization: total storage used, cost projection, growth trends
8. Feature adoption: which features most used (QR codes, batch downloads, editing requests, etc.)
9. Client retention: repeat clients (multiple events) identification
10. Popular pricing tiers: which packages dari price list get most inquiries (from contact form messages)
11. Geographic market analysis: where clients dan visitors are located
12. Monthly/quarterly reports: automated report generation dengan executive summary
13. Export business reports: PDF format dengan charts untuk client presentations atau business planning
14. Comparison reports: year-over-year, month-over-month comparisons

---

## Story 8.8: Real-Time Analytics Dashboard

**As an** admin/fotografer during an active event,  
**I want** real-time analytics showing current activity,  
**so that** saya dapat monitor gallery usage as event happens dan engage dengan guests.

### Acceptance Criteria

1. Real-time dashboard accessible from event detail page: "View Live Analytics" button
2. Current active visitors: number of guests currently viewing gallery (last 5 minutes)
3. Live activity feed: scrolling list of recent actions (John liked photo, Maria downloaded photo, etc.)
4. Real-time metrics: views, likes, comments, downloads updating live (WebSocket atau polling every 5 seconds)
5. Activity map: animated visualization showing activity hotspots (which photos being viewed)
6. Recent comments stream: latest comments appearing in real-time
7. Peak concurrent users: maximum simultaneous visitors reached
8. Activity alerts: desktop notifications untuk significant events (e.g., 100th download)
9. Celebration milestones: visual celebrations when milestones hit (confetti animation for 1000th view, etc.)
10. Performance monitoring: server response times, error rates displayed untuk health check
11. Network status: CDN performance, image loading speeds
12. Mobile optimization: real-time dashboard works on mobile untuk monitoring on-the-go
13. Auto-refresh toggle: ability to pause/resume live updates
14. Full-screen mode: distraction-free monitoring view

---

## Story 8.9: Custom Reports & Data Export

**As an** admin/fotografer,  
**I want** to create custom reports dan export data,  
**so that** saya dapat analyze data dalam external tools atau create presentations.

### Acceptance Criteria

1. Custom report builder at `/admin/analytics/reports/custom`
2. Report configuration: select metrics, dimensions, date range, filters
3. Available metrics: all tracked metrics (views, downloads, likes, comments, etc.)
4. Available dimensions: time (hour/day/week/month), event, photo, device, location, etc.
5. Filter options: filter by event, date range, device type, location, etc.
6. Visualization selection: table, line chart, bar chart, pie chart, heatmap
7. Report preview: shows data visualization before saving
8. Save report: name dan save custom report untuk future use
9. Scheduled reports: schedule reports to generate automatically (daily/weekly/monthly)
10. Export formats: CSV, Excel (XLSX), PDF, JSON
11. Email delivery: send scheduled reports via email automatically
12. Report templates: pre-built report templates untuk common use cases (Event Summary, Monthly Business Review, etc.)
13. Data segmentation: group data by custom segments (weekday vs weekend, mobile vs desktop, etc.)
14. API access: provide API endpoint untuk programmatic data export (untuk future integrations)

---

## Story 8.10: Analytics Performance & Optimization

**As a** developer,  
**I want** analytics system optimized untuk handle large data volumes,  
**so that** reports load quickly dan system remains performant as data grows.

### Acceptance Criteria

1. Database indexing: proper indexes on analytics_events table (event_id, created_at, event_type, etc.)
2. Data aggregation: pre-aggregate common metrics daily via scheduled job (reduces query complexity)
3. Aggregation tables: `analytics_daily`, `analytics_monthly` tables store pre-calculated metrics
4. Query optimization: complex queries use aggregated tables instead of raw events
5. Caching strategy: cache frequently accessed metrics (Redis) dengan 5-minute TTL
6. Pagination: large result sets paginated (max 1000 records per page)
7. Lazy loading: dashboard components load incrementally untuk faster initial render
8. Query timeout: long-running queries timeout after 30 seconds dengan appropriate message
9. Background processing: heavy analytics calculations run as background jobs
10. Data archiving: raw events older than 90 days archived to separate cold storage
11. Query monitoring: slow queries logged dan alerted untuk optimization
12. Load testing: analytics endpoints tested under load (1000+ concurrent requests)
13. Chart rendering optimization: use efficient charting library (Chart.js, Recharts, etc.) dengan data point limits
14. API rate limiting: analytics API endpoints rate limited untuk prevent abuse

---

**Epic 8 Status**: Ready untuk Development  
**Estimated Effort**: 6-7 development days  
**Dependencies**: Epic 5 (Guest Gallery), Epic 6 (Engagement Features), Epic 7 (Client Features)  
**Success Metrics**: Analytics accurately tracked, dashboards load quickly, reports exportable, insights actionable
