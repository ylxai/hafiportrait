# 🏗️ Component Architecture - Mobile-First Redesign

## 📊 Component Hierarchy

```
HomePage (app/page.tsx)
│
├── CinematicHero
│   ├── Auto-playing Slideshow (5s interval)
│   ├── Progress Indicators (Stories-style)
│   ├── Gradient Overlays
│   ├── Typography Layer
│   └── Scroll Indicator
│
├── ModernServices
│   ├── Section Header
│   ├── Services Grid (1/2/3 cols)
│   └── Service Cards (6x)
│       ├── Gradient Icon
│       ├── Title & Description
│       └── Hover Arrow
│
├── BentoGallery
│   ├── Section Header
│   ├── Category Filter Tabs
│   ├── Bento Grid Layout
│   │   ├── Square Cards
│   │   ├── Tall Cards (row-span-2)
│   │   └── Wide Cards (col-span-2)
│   └── Story Mode Viewer (Modal)
│       ├── Progress Indicators
│       ├── Close Button
│       ├── Navigation (Tap/Swipe)
│       └── Bottom Actions (Like/Share)
│
├── EditorialPricing
│   ├── Section Header
│   ├── Pricing Grid (3 tiers)
│   │   ├── Intimate Package
│   │   ├── Premium Package (highlighted)
│   │   └── Luxury Package
│   └── Custom Package CTA
│
├── FeaturedEventsCarousel
│   ├── Section Header
│   ├── Carousel Container
│   │   ├── Event Slides (3x)
│   │   ├── Navigation Arrows
│   │   ├── Dot Indicators
│   │   └── Event Details Overlay
│   └── Auto-play Timer
│
├── EditorialAbout
│   ├── Image Column
│   │   ├── Main Image
│   │   └── Floating Stats Card
│   └── Content Column
│       ├── Badge
│       ├── Heading
│       ├── Description
│       ├── Stats Grid (4x)
│       └── CTA Button
│
├── ConversationalForm
│   ├── Progress Indicators (6 steps)
│   ├── Step Container (AnimatePresence)
│   │   ├── Question
│   │   ├── Input Field
│   │   └── Navigation Buttons
│   └── Success Screen
│
├── Footer (reused from old design)
│
├── BottomNavigation (Mobile Only)
│   └── Nav Items (5x)
│       ├── Icon
│       ├── Label
│       └── Active Indicator
│
└── FloatingCTA
    ├── Main FAB Button
    ├── Action Options (expandable)
    │   ├── WhatsApp
    │   ├── Call
    │   └── Book Now
    └── Backdrop Overlay
```

---

## 🔄 Data Flow

### State Management

#### Local Component State
```typescript
// CinematicHero
- currentSlide: number
- isLoaded: boolean

// BentoGallery
- selectedCategory: string
- storyMode: boolean
- currentPhotoIndex: number
- touchStart/touchEnd: number

// FloatingCTA
- isVisible: boolean
- showOptions: boolean

// ConversationalForm
- currentStep: number
- formData: Record<string, string>
- error: string
- isSubmitting: boolean
- isSubmitted: boolean

// BottomNavigation
- activeSection: string
- isVisible: boolean
- lastScrollY: number

// FeaturedEventsCarousel
- currentIndex: number
- direction: number
```

#### No Global State Required
- Each component is self-contained
- Communication via props and DOM events
- Scroll position shared via native browser API

---

## 🎨 Styling Architecture

### Tailwind Utility Classes
```
Primary Approach: Utility-first with Tailwind
Custom Components: Minimal (in globals.css)
Responsive: Mobile-first breakpoints
```

### Design Tokens
```typescript
// Colors
rose-400, rose-500, pink-500  // Primary
cyan, teal, blue              // Brand secondary
gray-50 to gray-900           // Neutrals

// Spacing
section: py-16 md:py-24 lg:py-32
container: px-4 sm:px-6 lg:px-8
gap: gap-6 lg:gap-8
card: p-6 md:p-8

// Border Radius
rounded-2xl: 1rem
rounded-3xl: 1.5rem
rounded-full: 9999px

// Shadows
shadow-lg: large shadow
shadow-xl: extra large
shadow-2xl: 2xl shadow
```

### Animation Patterns
```typescript
// Framer Motion Variants
fadeIn: { opacity: 0 → 1 }
fadeInUp: { opacity: 0, y: 30 → opacity: 1, y: 0 }
slideInRight: { x: 300, opacity: 0 → x: 0, opacity: 1 }
scale: { scale: 0.9 → 1 }

// Transition Timing
duration: 300ms (hover), 600ms (page)
ease: ease-out, ease-in-out
delay: 0.1s increments for stagger
```

---

## 🔧 Hooks Architecture

### Custom Hooks

#### useScrollAnimation
```typescript
// Purpose: Intersection Observer for scroll-triggered animations
// Returns: { ref, isVisible }
// Usage: Fade-in elements on scroll into view
```

#### useScrollDirection
```typescript
// Purpose: Detect scroll up/down
// Returns: 'up' | 'down' | null
// Usage: Auto-hide bottom navigation
```

#### useScrollProgress
```typescript
// Purpose: Track scroll percentage
// Returns: number (0-100)
// Usage: Progress bars, scroll indicators
```

#### useMediaQuery
```typescript
// Purpose: Responsive breakpoint detection
// Returns: boolean
// Usage: Conditional rendering for mobile/desktop
```

#### useIsMobile / useIsTablet / useIsDesktop
```typescript
// Purpose: Device-specific rendering
// Returns: boolean
// Usage: Show/hide components based on device
```

#### useTouchGestures
```typescript
// Purpose: Detect swipe gestures
// Returns: { direction, distance }
// Usage: Swipe navigation in gallery
```

---

## 📦 Component Props

### CinematicHero
```typescript
// No props - self-contained
// Configuration via internal heroSlides array
```

### BentoGallery
```typescript
// No props - uses sample data
// Future: Accept photos array from API
interface BentoGalleryProps {
  photos?: Photo[]
  categories?: string[]
}
```

### EditorialPricing
```typescript
// No props - uses internal pricingTiers
// Future: Accept packages from API
interface PricingProps {
  packages?: PricingTier[]
}
```

### ConversationalForm
```typescript
// No props - self-contained form
// Future: Accept onSubmit callback
interface FormProps {
  onSubmit?: (data: FormData) => Promise<void>
}
```

### BottomNavigation
```typescript
// No props - auto-detects sections
```

### FloatingCTA
```typescript
// No props - configured internally
// Future: Accept contact info
interface FloatingCTAProps {
  whatsappNumber?: string
  phoneNumber?: string
}
```

---

## 🔌 Integration Points

### API Endpoints (Future)
```typescript
// Hero Slideshow
GET /api/hero-slides
Response: { slides: HeroSlide[] }

// Gallery Photos
GET /api/portfolio?category={category}
Response: { photos: Photo[] }

// Pricing Packages
GET /api/pricing
Response: { packages: PricingTier[] }

// Featured Events
GET /api/events/featured
Response: { events: Event[] }

// Contact Form
POST /api/contact
Body: { name, email, whatsapp, package, date, message }
Response: { success: boolean, message: string }
```

### Admin Integration
```typescript
// Upload Hero Images
POST /api/admin/hero-slides/upload
Body: FormData (image file)

// Manage Featured Events
POST /api/admin/events/featured
Body: { eventId, featured: boolean }

// Update Pricing
PUT /api/admin/pricing/{id}
Body: PricingTier
```

---

## 🎯 Performance Optimizations

### Code Splitting
```typescript
// Automatic route-based splitting by Next.js
// Heavy components use dynamic imports

// Example:
const BentoGallery = dynamic(
  () => import('./BentoGallery'),
  { loading: () => <Skeleton /> }
)
```

### Image Loading
```typescript
// Lazy loading with Intersection Observer
// Blur-up placeholders for better perceived performance
// Responsive images with srcset

<div className="bg-gradient-to-br from-rose-200 to-purple-200">
  {/* Gradient placeholder */}
</div>
```

### Animation Performance
```typescript
// GPU-accelerated properties only
transform: translateX(), translateY(), scale()
opacity: 0-1

// Avoid:
width, height, top, left (causes reflow)
```

### Bundle Optimization
```typescript
// Tree-shaking: Import only what's needed
import { motion } from 'framer-motion'  // ✅
// Not: import * as motion from 'framer-motion'  // ❌

// Lucide icons: Individual imports
import { Camera, Heart } from 'lucide-react'  // ✅
```

---

## 🧪 Testing Strategy

### Unit Tests (Future)
```typescript
// Component rendering
test('CinematicHero renders with slides')
test('BentoGallery filters by category')
test('ConversationalForm validates input')

// Hook behavior
test('useScrollDirection detects scroll up/down')
test('useMediaQuery matches breakpoints')
test('useTouchGestures detects swipe left/right')
```

### Integration Tests (Future)
```typescript
// User flows
test('User can navigate through contact form')
test('User can view photos in story mode')
test('User can switch between pricing packages')

// Navigation
test('Bottom nav scrolls to correct section')
test('FAB opens action menu')
```

### E2E Tests (Future)
```typescript
// Critical paths
test('Complete booking flow')
test('View gallery and like photos')
test('Submit contact form')

// Mobile-specific
test('Swipe through gallery on mobile')
test('Bottom nav works on mobile')
test('Touch interactions work correctly')
```

---

## 🔐 Security Considerations

### Form Validation
```typescript
// Client-side validation
- Email format check
- Phone number format check
- Required fields check
- Length validation

// Server-side validation (required)
- Sanitize all inputs
- Rate limiting
- CSRF protection
- XSS prevention
```

### API Protection
```typescript
// All admin endpoints require authentication
// Public endpoints have rate limiting
// Input validation on all endpoints
// SQL injection prevention (Prisma ORM)
```

---

## 📱 Mobile-Specific Considerations

### Touch Events
```typescript
// Native touch event handling
onTouchStart, onTouchMove, onTouchEnd

// Prevent default for custom interactions
e.preventDefault() for swipe gestures

// Touch target sizes
Minimum: 44x44px (iOS HIG)
Recommended: 48x48px
```

### Viewport Configuration
```typescript
// In layout.tsx
viewport: {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,  // Allow zoom for accessibility
  userScalable: true,
}
```

### Safe Areas
```typescript
// iOS notch support
padding-bottom: env(safe-area-inset-bottom)

// Applied on BottomNavigation
className="safe-bottom"
```

---

## 🎨 Design System Reference

### Component Variants

#### Buttons
```typescript
btn-primary: Gradient background
btn-secondary: White background
btn-ghost: Transparent background
```

#### Cards
```typescript
card: White with shadow
card-hover: Lift on hover
card-gradient: Gradient header
```

#### Inputs
```typescript
input: Border + focus ring
textarea: Multi-line input
select: Dropdown (styled)
```

#### Sections
```typescript
section: Vertical padding
container-custom: Max width + horizontal padding
```

---

## 🚀 Deployment Architecture

### Build Process
```bash
1. npm run build
2. Next.js optimizes pages
3. Static assets generated
4. Server chunks created
5. Image optimization
```

### Hosting Options
```typescript
// Vercel (Recommended)
- Zero config deployment
- Automatic HTTPS
- CDN distribution
- Edge functions support

// Netlify
- Similar to Vercel
- Good alternative

// Self-hosted
- Docker container
- Node.js server
- Nginx reverse proxy
```

---

## 📊 Metrics to Track

### Performance Metrics
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### User Engagement
- Time on page
- Scroll depth
- Gallery views
- Story mode usage
- Form completion rate
- CTA click rate

### Conversion Metrics
- Contact form submissions
- WhatsApp clicks
- Phone call clicks
- Package selection distribution

---

**Architecture Version**: 1.0.0
**Last Updated**: December 2024
**Maintained by**: AI UX Expert - Sally

