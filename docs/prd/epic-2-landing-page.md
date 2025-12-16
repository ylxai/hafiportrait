# Epic 2: Landing Page & Public Portfolio

**Epic Goal**: Create comprehensive public-facing landing page dengan hero section yang engaging, price list display, manually-managed portfolio gallery showcase, active events listing, dan functional contact form. Epic ini establishes platform's marketing presence dan enables photographers to showcase their work untuk attract new clients.

---

## Story 2.1: Hero Section Design Implementation

**As a** visitor,  
**I want** to see an attractive hero section dengan compelling visuals dan clear value proposition,  
**so that** saya immediately understand the service offering dan tertarik untuk explore further.

### Acceptance Criteria

1. Hero section occupies full viewport height (100vh) pada initial page load dengan background gradient using brand colors
2. Hero content displays centered: brand logo/name, headline "Instant Wedding Photo Gallery", subheadline describing key benefits
3. Two primary CTA buttons: "View Our Portfolio" (navigates to portfolio section dengan smooth scroll) dan "Contact Us" (navigates to contact form)
4. Background: subtle animation atau high-quality hero image dengan overlay untuk text readability
5. Mobile responsive: text sizes scale appropriately, CTAs stack vertically pada screens < 768px
6. Typography: headline menggunakan elegant serif atau clean sans-serif font, minimum 36px pada mobile, 48px+ pada desktop
7. CTA buttons styled dengan brand primary color (#54ACBF), hover state dengan darker shade (#26658C), min 44px height untuk touch
8. Scroll indicator (animated down arrow) displayed at bottom of hero section
9. Hero section accessible: proper heading hierarchy (h1 untuk headline), alt text untuk images
10. Page load performance: hero section renders within 1 second, images optimized dan lazy loaded

---

## Story 2.2: Services & Features Section

**As a** potential client,  
**I want** to understand what services dan features platform offers,  
**so that** saya dapat evaluate apakah ini suitable untuk wedding photography needs saya.

### Acceptance Criteria

1. "Our Services" section positioned below hero dengan clear section heading
2. Three feature cards displayed: "Instant Gallery Access", "Mobile-First Experience", "Secure & Easy Sharing"
3. Each feature card contains: icon (dapat SVG atau icon library), feature title, 2-3 sentence description
4. Feature descriptions highlight key benefits: no registration for guests, QR code access, batch downloads, analytics
5. Cards layout: grid 3 columns pada desktop (≥1024px), 2 columns pada tablet (768-1023px), 1 column pada mobile (<768px)
6. Cards styled dengan soft shadows, rounded corners (8-12px), padding untuk comfortable reading
7. Hover effect pada cards: slight elevation increase (shadow depth) dan subtle color shift
8. Section background: alternating color (#F9FAFB light gray) untuk visual separation dari hero
9. Section padding: comfortable spacing (60-80px vertical) untuk breathing room
10. Responsive typography: feature titles 20-24px, descriptions 14-16px dengan proper line height (1.6)

---

## Story 2.3: Price List Display

**As a** potential client,  
**I want** to see transparent pricing information untuk photography packages,  
**so that** saya dapat make informed decisions dan understand service costs upfront.

### Acceptance Criteria

1. "Pricing" section dengan heading "Our Packages" positioned after services section
2. Price cards display untuk minimum 3 packages: Basic, Professional, Premium (atau custom names)
3. Each price card shows: package name, price (format: Rp X.XXX.XXX), list of included features (4-6 items)
4. Featured package (recommended) highlighted dengan border color (#54ACBF) dan "Most Popular" badge
5. Cards layout: 3 columns pada desktop, stacks to single column pada mobile dengan proper spacing
6. Each card includes CTA button "Choose Package" atau "Contact Us" linking to contact form
7. Pricing information admin-managed: prices dan features configurable via admin dashboard (hardcoded untuk MVP, database-driven untuk future)
8. Visual hierarchy: price prominently displayed dengan larger font size (28-32px) dan bold weight
9. Feature list uses checkmark icons for visual clarity
10. Section styling: clean white background, generous padding, price cards dengan subtle shadows
11. Responsive behavior: maintain readability dan touch-friendly buttons pada all screen sizes

---

## Story 2.4: Portfolio Gallery Management (Admin)

**As an** admin/photographer,  
**I want** to upload dan manage portfolio photos dari admin dashboard,  
**so that** saya dapat showcase my best work untuk attract potential clients pada landing page.

### Acceptance Criteria

1. Admin dashboard includes "Portfolio" menu item navigating to `/admin/portfolio`
2. Portfolio management page displays grid of current portfolio photos dengan thumbnails
3. "Upload Photos" button opens upload interface (drag-and-drop area atau file picker)
4. Multiple file selection supported, accepts image formats: JPG, JPEG, PNG, WEBP
5. Upload progress indicator shows percentage untuk each uploading photo
6. After upload, photos automatically generate thumbnails (300x300px) untuk gallery display
7. Each portfolio item dalam admin view shows: thumbnail, upload date, action buttons (Delete, Set as Featured)
8. Delete button with confirmation dialog: "Are you sure you want to delete this photo?"
9. Reorder functionality: drag-and-drop untuk change photo display order pada landing page
10. Maximum portfolio size: 50 photos (validation prevents upload beyond limit)
11. Database schema: `portfolio_photos` table dengan fields: id, photo_url, thumbnail_url, display_order, is_featured, uploaded_at
12. API endpoints: POST `/api/admin/portfolio` (upload), DELETE `/api/admin/portfolio/:id`, PUT `/api/admin/portfolio/reorder`

---

## Story 2.5: Public Portfolio Gallery Display

**As a** visitor,  
**I want** to view beautiful portfolio of wedding photos,  
**so that** saya dapat assess photographer's style dan quality sebelum deciding to hire.

### Acceptance Criteria

1. "Portfolio" section pada landing page displays grid of portfolio photos uploaded by admin
2. Grid layout: 4 columns pada desktop (≥1024px), 3 columns pada tablet (768-1023px), 2 columns pada mobile (<768px)
3. Photos displayed as squares (aspect ratio 1:1) dengan object-fit: cover untuk consistent grid
4. Lazy loading implemented: photos load as user scrolls near them (IntersectionObserver)
5. Hover effect pada desktop: subtle zoom (scale: 1.05) dan overlay dengan opacity
6. Click pada photo opens lightbox/modal dengan full-size image view
7. Lightbox features: close button (X), navigation arrows (previous/next), keyboard support (ESC to close, arrows to navigate)
8. Lightbox mobile-friendly: swipe gestures untuk navigation, pinch-to-zoom for detail view
9. Portfolio section heading "Our Work" dengan optional subtitle/description
10. Empty state: jika no portfolio photos exist, display message "Portfolio coming soon"
11. Featured photo (marked by admin) dapat displayed larger atau positioned prominently
12. Performance: progressive image loading (blur-up technique), images served dari CDN

---

## Story 2.6: Active Events Listing

**As a** visitor atau potential guest,  
**I want** to see list of active wedding events,  
**so that** saya dapat find dan access gallery untuk specific event saya was invited to.

### Acceptance Criteria

1. "Recent Events" section displays list of active events (status: active) from database
2. Event cards show: event name, date, thumbnail/cover photo, "View Gallery" button
3. Maximum 6 most recent events displayed pada landing page (sorted by created_at DESC)
4. "View Gallery" button links to event-specific page `/[event-slug]`
5. Events layout: 3 columns pada desktop, 2 columns pada tablet, 1 column pada mobile
6. Event cards styled consistently dengan portfolio cards: shadows, rounded corners, hover effects
7. Event date formatted human-readable: "December 15, 2024" atau "15 Des 2024" untuk Indonesian locale
8. Cover photo: uses first uploaded photo untuk event, atau default placeholder image jika no photos yet
9. Section includes "View All Events" link navigating to dedicated events page (future enhancement)
10. Empty state: jika no active events, display encouraging message: "No events available yet. Check back soon!"
11. API endpoint: GET `/api/events/active` returns public event data (excludes access codes)
12. Privacy consideration: events marked as private by admin tidak appear in public listing

---

## Story 2.7: Contact Form Implementation

**As a** potential client,  
**I want** to send inquiry atau contact request melalui website form,  
**so that** saya dapat easily reach photographer untuk booking atau questions tanpa manual email.

### Acceptance Criteria

1. "Contact Us" section positioned at bottom of landing page before footer
2. Form fields: Name (text, required), Email (email, required), Phone (tel, optional), Message (textarea, required, min 10 chars)
3. Submit button "Send Message" dengan loading state during form submission
4. Client-side validation: required fields highlighted, email format validated, error messages shown inline
5. Form submission sends POST request to `/api/contact` endpoint dengan form data
6. Backend validation: sanitize inputs, validate email format, store message in `contact_messages` table
7. Success state: form clears, success message displayed: "Thank you! We'll get back to you soon." (green notification)
8. Error state: error message displayed jika submission fails: "Something went wrong. Please try again." (red notification)
9. Email notification sent to admin email address dengan contact form data (using nodemailer atau SMTP service)
10. Database schema: `contact_messages` table dengan fields: id, name, email, phone, message, status (new/read), created_at
11. Admin dashboard includes "Messages" section to view dan manage contact form submissions
12. Form accessible: proper labels, keyboard navigation, ARIA attributes untuk screen readers
13. Mobile responsive: form fields stack vertically, adequate spacing untuk touch input

---

## Story 2.8: Footer Design & Information

**As a** visitor,  
**I want** comprehensive footer dengan important links dan information,  
**so that** saya dapat easily navigate dan find additional resources atau contact details.

### Acceptance Criteria

1. Footer background uses dark brand color (#011C40) dengan white atau light text (#F9FAFB)
2. Footer divided into 3-4 columns pada desktop: About, Quick Links, Contact Info, Social Media
3. About column displays brief company description (2-3 sentences) dan logo
4. Quick Links: Portfolio, Pricing, Contact, Terms of Service (placeholder), Privacy Policy (placeholder)
5. Contact Info: email address (clickable mailto: link), phone number (clickable tel: link), business address
6. Social Media: Instagram, Facebook, WhatsApp icons (linked to respective profiles atau contact)
7. Bottom footer bar displays copyright: "© 2024 Hafiportrait. All rights reserved." centered
8. Footer responsive: columns stack vertically pada mobile, maintains readability
9. Links styled dengan hover effect: color change to brand accent (#A7EBF2)
10. Footer includes "Back to Top" button (fixed position atau within footer) untuk easy navigation
11. Social media icons appropriately sized (24-32px) dengan adequate spacing untuk touch targets

---

## Story 2.9: Landing Page Performance Optimization

**As a** visitor with potentially slow internet connection,  
**I want** landing page to load quickly dan smoothly,  
**so that** saya dapat access information tanpa frustration dari slow loading times.

### Acceptance Criteria

1. Total page load time < 3 seconds pada 4G connection (measured dengan Lighthouse atau GTmetrix)
2. First Contentful Paint (FCP) < 1.5 seconds
3. Largest Contentful Paint (LCP) < 2.5 seconds untuk passing Core Web Vitals
4. All images optimized: compressed tanpa significant quality loss, modern formats (WebP dengan fallback)
5. Critical CSS inlined untuk above-the-fold content, remaining CSS lazy loaded
6. JavaScript code-split: separate bundles untuk landing page vs admin dashboard
7. Lazy loading implemented untuk images below fold dan portfolio gallery
8. Font loading optimized: font-display: swap, preload critical fonts
9. Static assets served dengan proper cache headers (1 year untuk immutable assets)
10. CDN configured untuk serving images dan static assets globally
11. Lighthouse performance score ≥ 90 pada mobile, ≥ 95 pada desktop
12. Minimal render-blocking resources: async/defer attributes for non-critical scripts

---

## Story 2.10: SEO & Meta Tags Optimization

**As a** business owner (photographer),  
**I want** landing page optimized untuk search engines,  
**so that** potential clients dapat find my photography services melalui Google searches.

### Acceptance Criteria

1. HTML title tag: "Hafiportrait - Professional Wedding Photography & Instant Gallery Platform"
2. Meta description (150-160 chars): compelling summary including key services dan benefits
3. Open Graph tags untuk social media sharing: og:title, og:description, og:image (hero atau featured portfolio photo), og:url
4. Twitter Card tags: twitter:card, twitter:title, twitter:description, twitter:image
5. Canonical URL specified to prevent duplicate content issues
6. Structured data (JSON-LD) implemented untuk Organization schema dengan business details
7. XML sitemap generated including landing page dan active event pages
8. robots.txt configured untuk allow search engine crawling
9. Semantic HTML: proper heading hierarchy (h1, h2, h3), nav, main, footer elements
10. Image alt attributes: descriptive alt text for all images untuk accessibility dan SEO
11. Page URL slug: clean dan descriptive URLs for sections (using anchor links or separate pages)
12. Mobile-friendly test passes (Google Mobile-Friendly Test)

---

**Epic 2 Status**: Ready untuk Development  
**Estimated Effort**: 5-6 development days  
**Dependencies**: Epic 1 (Foundation & Core Infrastructure)  
**Success Metrics**: Landing page live dengan all sections, portfolio gallery functional, contact form submissions working, Lighthouse score ≥ 90
