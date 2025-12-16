# Story 5.5: Social Sharing & Engagement

**Epic**: Epic 5 - Guest Gallery Experience  
**Status**: Not Started  
**Estimated Effort**: 0.5 day  
**Priority**: P1 (High)

---

## Story Description

**As a** wedding guest,  
**I want** to share photos on social media dan engage dengan photos,  
**so that** saya dapat share memories dengan friends dan family.

---

## Acceptance Criteria

- [ ] Social media share buttons (WhatsApp, Instagram, Facebook)
- [ ] Open Graph meta tags untuk rich link previews
- [ ] Photo viewing analytics (guest engagement tracking)
- [ ] Like functionality untuk photos
- [ ] Native share API support untuk mobile
- [ ] Copy link functionality
- [ ] Share count tracking

---

## Dev Agent Record

### Status
Not Started

### File List
- `components/gallery/ShareButton.tsx`
- `components/gallery/LikeButton.tsx`
- `app/[event-slug]/gallery/opengraph-image.tsx`
- `app/api/gallery/[event-slug]/photos/[photoId]/like/route.ts`
