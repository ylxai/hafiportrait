# Epic 2: Landing Page - Quick Reference Guide

## 🚀 Quick Start

### Run Development Server
```bash
npm run dev
# Server: http://localhost:3000
```

### Build for Production
```bash
npm run build
npm start
```

---

## 📍 Landing Page Sections

### Navigation Flow
1. **Hero** → Full viewport with CTA buttons
2. **Services** → 6 feature cards (#services)
3. **Portfolio** → Photo gallery with lightbox (#portfolio)
4. **Pricing** → 3 pricing tiers (#pricing)
5. **Events** → Recent active events (#events)
6. **Contact** → Contact form (#contact)
7. **Footer** → Links and social media

### Smooth Scroll Links
- All section IDs are linked for smooth navigation
- CTA buttons use `scrollToSection()` function
- Footer "Back to Top" scrolls to page top

---

## 🎨 Design System

### Brand Colors
```css
--brand-cyan: #A7EBF2    /* Light accent */
--brand-teal: #54ACBF    /* Primary */
--brand-blue: #26658C    /* Secondary */
--brand-dark: #023859    /* Dark accent */
--brand-navy: #011C40    /* Footer/dark bg */
```

### Tailwind Classes
```
btn-primary    → Teal button with white text
btn-secondary  → Gray button
input          → Form input styling
card           → White card with shadow
```

### Custom Animations
```css
animate-fade-in         → Base fade in
animate-fade-in-delay-1 → Fade in with 0.2s delay
animate-fade-in-delay-2 → Fade in with 0.4s delay
animate-fade-in-delay-3 → Fade in with 0.6s delay
```

---

## 🔌 API Endpoints

### Portfolio API
```bash
GET /api/portfolio
Response: { success: true, photos: [], count: 0 }
```

### Active Events API
```bash
GET /api/events/active
Response: { success: true, events: [], count: 0 }
```

### Contact Form API
```bash
POST /api/contact
Body: {
  name: string (required)
  email: string (required, email format)
  phone: string (optional)
  message: string (required, min 10 chars)
}
Response: { success: true, message: "...", id: "..." }
```

---

## 📦 Component Props

### HeroSection
- No props (self-contained)
- Uses smooth scroll for CTA buttons

### ServicesSection
- No props (static feature cards)
- Icons from lucide-react

### PortfolioGallery
- Fetches data from API on mount
- Lightbox with keyboard navigation (ESC, arrows)
- Empty state handling

### PricingSection
- Static pricing data
- Scroll to contact on CTA click

### FeaturedEvents
- Fetches data from API on mount
- Links to event pages via slug
- Indonesian date formatting

### ContactSection
- Form validation (client + server)
- Sanitization on server
- Success/error states

### Footer
- Social media links (update in component)
- Contact info (update in component)
- Back to top functionality

---

## 🗄️ Database Models

### PortfolioPhoto
```typescript
{
  id: string
  filename: string
  originalUrl: string
  thumbnailUrl: string
  displayOrder: number
  isFeatured: boolean
  category: string | null
  description: string | null
  createdAt: DateTime
  updatedAt: DateTime
}
```

### ContactMessage
```typescript
{
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: string  // 'new', 'read', 'replied'
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## 🛠️ Customization Guide

### Update Pricing
Edit: `app/components/landing/PricingSection.tsx`
```typescript
const pricingPackages = [
  {
    name: 'Basic',
    price: '5.000.000',
    description: '...',
    features: [...],
    popular: false
  },
  // ... add/edit packages
]
```

### Update Services
Edit: `app/components/landing/ServicesSection.tsx`
```typescript
const features = [
  {
    icon: QrCode,  // Lucide icon
    title: '...',
    description: '...'
  },
  // ... add/edit features
]
```

### Update Contact Info
Edit: `app/components/landing/Footer.tsx`
- Email: `info@hafiportrait.com`
- Phone: `+62 812 3456 7890`
- Social links: Update href attributes

### Update Hero Text
Edit: `app/components/landing/HeroSection.tsx`
- Headline, subheadline, CTA text

---

## 🔍 SEO Configuration

### Update Meta Tags
Edit: `app/layout.tsx`
```typescript
export const metadata: Metadata = {
  title: '...',
  description: '...',
  keywords: '...',
  // ... update as needed
}
```

### Canonical URL
Update in `<head>` section of layout

---

## 🐛 Common Issues

### Build Errors
1. **Prisma import errors**: Use `import prisma from '@/lib/prisma'`
2. **Bcrypt in middleware**: Keep middleware lightweight (no bcrypt)
3. **ESLint warnings**: Check `.eslintrc.json` rules

### Runtime Issues
1. **Images not loading**: Check Next.js Image config in `next.config.js`
2. **API 500 errors**: Check database connection (DATABASE_URL)
3. **Contact form fails**: Verify Zod validation schema

---

## 📝 Testing Checklist

### Manual Testing
- [ ] Hero section displays correctly
- [ ] Smooth scroll navigation works
- [ ] All sections visible and styled
- [ ] Contact form validates input
- [ ] Contact form submits successfully
- [ ] Portfolio empty state shows
- [ ] Events empty state shows
- [ ] Footer links work
- [ ] Mobile responsive on all sections
- [ ] Lightbox keyboard navigation works

### API Testing
```bash
# Portfolio
curl http://localhost:3000/api/portfolio

# Events
curl http://localhost:3000/api/events/active

# Contact
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Test message here"}'
```

---

## 🚀 Deployment

### Environment Variables
```bash
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-32-chars-minimum"
REDIS_URL="redis://localhost:6379"
```

### Pre-Deployment
1. Run `npm run build` - should succeed
2. Test all API endpoints
3. Verify database migrations
4. Check environment variables
5. Test on mobile viewport

### Vercel Deployment
```bash
vercel deploy
# Follow prompts
```

---

## 📚 File Locations

### Components
```
app/components/landing/
├── HeroSection.tsx
├── ServicesSection.tsx
├── PortfolioGallery.tsx
├── PricingSection.tsx
├── FeaturedEvents.tsx
├── ContactSection.tsx
└── Footer.tsx
```

### API Routes
```
app/api/
├── portfolio/route.ts
├── events/active/route.ts
└── contact/route.ts
```

### Configuration
```
next.config.js       → Next.js config
tailwind.config.ts   → Tailwind config
.eslintrc.json       → ESLint rules
prisma/schema.prisma → Database schema
```

---

## 💡 Tips

1. **Performance**: Use Next.js Image component for all images
2. **Accessibility**: All buttons have aria-labels
3. **Mobile**: Test on actual devices, not just browser DevTools
4. **Forms**: Always sanitize input on server-side
5. **Database**: Use indexes for frequently queried fields

---

**Quick Reference Version:** 1.0
**Last Updated:** December 12, 2024
**Contact:** James (Full Stack Developer)

