# Frontend Architecture - Hafiportrait Photography Platform

**Last Updated:** December 2024  
**Version:** 2.0 - Next.js 15 App Router

---

## Overview

Frontend Hafiportrait menggunakan **Next.js 15** dengan **App Router**, **TypeScript**, dan **Tailwind CSS**. Aplikasi dirancang dengan **mobile-first approach** dan optimized untuk performa di perangkat mobile Android/iOS.

---

## Application Structure

```
app/
├── (auth)/                      # Auth route group
│   ├── login/
│   │   └── page.tsx            # Login page
│   └── layout.tsx              # Auth layout
├── (public)/                    # Public route group (guest access)
│   ├── [slug]/                 # Event gallery
│   │   ├── page.tsx           # Gallery page
│   │   └── photo/
│   │       └── [id]/
│   │           └── page.tsx    # Photo detail modal
│   ├── portfolio/
│   │   └── page.tsx           # Portfolio page
│   └── layout.tsx             # Public layout
├── admin/                       # Admin dashboard
│   ├── page.tsx               # Admin home
│   ├── events/
│   │   ├── page.tsx          # Events list
│   │   ├── new/
│   │   │   └── page.tsx       # Create event
│   │   └── [id]/
│   │       ├── page.tsx       # Event detail
│   │       └── photos/
│   │           └── page.tsx   # Photo management
│   ├── comments/
│   │   └── page.tsx          # Comment moderation
│   ├── analytics/
│   │   └── page.tsx          # Analytics dashboard
│   └── layout.tsx            # Admin layout
├── client/                      # Client dashboard
│   ├── page.tsx               # Client home
│   ├── events/
│   │   └── [id]/
│   │       ├── page.tsx       # Event detail
│   │       └── downloads/
│   │           └── page.tsx   # Download page
│   └── layout.tsx            # Client layout
├── api/                         # API Routes
│   └── [...]                   # See api-specification.md
├── layout.tsx                   # Root layout
├── page.tsx                     # Homepage
├── globals.css                  # Global styles
└── error.tsx                   # Error boundary

components/
├── ui/                          # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   ├── modal.tsx
│   ├── card.tsx
│   ├── dropdown.tsx
│   └── tabs.tsx
├── features/                    # Feature components
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── EventGallery.tsx
│   ├── photos/
│   │   ├── PhotoGrid.tsx
│   │   ├── PhotoCard.tsx
│   │   ├── PhotoModal.tsx
│   │   ├── PhotoUpload.tsx
│   │   └── PhotoLikeButton.tsx
│   ├── comments/
│   │   ├── CommentList.tsx
│   │   ├── CommentForm.tsx
│   │   └── CommentCard.tsx
│   └── realtime/
│       ├── LiveIndicator.tsx
│       ├── RealtimeComments.tsx
│       └── RealtimeNotifications.tsx
└── layouts/
    ├── Header.tsx
    ├── Footer.tsx
    ├── Sidebar.tsx
    └── MobileNav.tsx

lib/
├── prisma.ts                    # Prisma client
├── redis.ts                     # Redis client
├── r2.ts                        # Cloudflare R2 client
├── auth.ts                      # Auth helpers
├── socket.ts                    # Socket.IO client
└── utils.ts                     # Utility functions

hooks/
├── useSocket.ts                 # Socket.IO hook
├── useRealtimeEvent.ts         # Realtime features
├── usePhotoUpload.ts           # Photo upload
└── useInfiniteScroll.ts        # Infinite scroll

stores/
├── authStore.ts                # Auth state
├── uiStore.ts                  # UI state
└── realtimeStore.ts            # Realtime state

types/
├── api.ts                      # API types
├── models.ts                   # Database models
└── components.ts               # Component props
```

---

## Next.js App Router Architecture

### Route Groups

**1. (auth) - Authentication Routes**
- Grouped routes untuk login/register
- Shared layout tanpa main navigation
- Redirect if already authenticated

```typescript
// app/(auth)/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (session) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-primary">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
```

**2. (public) - Public Routes**
- Event galleries untuk guests
- No authentication required
- Access code verification

```typescript
// app/(public)/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { EventGallery } from '@/components/features/events/EventGallery';

export default async function EventPage({
  params,
}: {
  params: { slug: string };
}) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      photos: {
        orderBy: { displayOrder: 'asc' },
      },
    },
  });

  if (!event) {
    notFound();
  }

  return <EventGallery event={event} />;
}

// Generate static paths for static generation
export async function generateStaticParams() {
  const events = await prisma.event.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true },
  });

  return events.map((event) => ({
    slug: event.slug,
  }));
}
```

**3. admin - Admin Dashboard**
- Protected routes for admin
- Event management, analytics
- Photo uploads, moderation

```typescript
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login');
  }

  return (
    <div className="flex h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {children}
      </main>
    </div>
  );
}
```

---

## Component Architecture

### Server Components (Default)

Next.js 15 menggunakan Server Components by default.

```typescript
// app/(public)/[slug]/page.tsx (Server Component)
import { prisma } from '@/lib/prisma';

export default async function EventPage({ params }) {
  // Fetch data directly in server component
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
  });

  return (
    <div>
      <h1>{event.title}</h1>
      {/* Pass data to client components */}
      <PhotoGrid photos={event.photos} />
    </div>
  );
}
```

### Client Components

Use `'use client'` directive untuk interactive components.

```typescript
// components/features/photos/PhotoLikeButton.tsx
'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

export function PhotoLikeButton({ photoId, initialLikes }) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = async () => {
    setIsLiked(true);
    setLikes(likes + 1);

    await fetch(`/api/photos/${photoId}/like`, {
      method: 'POST',
    });
  };

  return (
    <button onClick={handleLike} disabled={isLiked}>
      <Heart className={isLiked ? 'fill-red-500' : ''} />
      <span>{likes}</span>
    </button>
  );
}
```

---

## Data Fetching

### Server-Side Data Fetching

```typescript
// app/admin/events/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export default async function EventsPage() {
  const session = await getServerSession();
  
  const events = await prisma.event.findMany({
    where: { /* filters */ },
    include: { _count: { select: { photos: true } } },
  });

  return (
    <div>
      <h1>Events</h1>
      {events.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

// Revalidate every 60 seconds
export const revalidate = 60;
```

### Client-Side Data Fetching (TanStack Query)

```typescript
// components/features/photos/PhotoGrid.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function PhotoGrid({ eventSlug }) {
  const { data, isLoading } = useQuery({
    queryKey: ['photos', eventSlug],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventSlug}/photos`);
      return res.json();
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {data.photos.map(photo => (
        <PhotoCard key={photo.id} photo={photo} />
      ))}
    </div>
  );
}
```

### TanStack Query Setup

```typescript
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

```typescript
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

---

## State Management

### Zustand Stores

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

```typescript
// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  isMobileMenuOpen: boolean;
  isPhotoModalOpen: boolean;
  selectedPhotoId: string | null;
  toggleMobileMenu: () => void;
  openPhotoModal: (id: string) => void;
  closePhotoModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  isPhotoModalOpen: false,
  selectedPhotoId: null,
  
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  openPhotoModal: (id) =>
    set({ isPhotoModalOpen: true, selectedPhotoId: id }),
  
  closePhotoModal: () =>
    set({ isPhotoModalOpen: false, selectedPhotoId: null }),
}));
```

---

## Realtime Features Integration

### Socket.IO Client Setup

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
  }

  return socket;
}
```

### Realtime Hook

```typescript
// hooks/useRealtimeEvent.ts
'use client';

import { useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeEvent(eventSlug: string) {
  const queryClient = useQueryClient();
  const socket = getSocket();

  useEffect(() => {
    socket.emit('join:event', eventSlug);

    socket.on('photo:liked', (data) => {
      queryClient.invalidateQueries(['photo', data.photoId]);
    });

    socket.on('comment:added', (data) => {
      queryClient.invalidateQueries(['comments', data.photoId]);
    });

    return () => {
      socket.emit('leave:event', eventSlug);
      socket.off('photo:liked');
      socket.off('comment:added');
    };
  }, [eventSlug, socket, queryClient]);

  return { socket };
}
```

### Live Comments Component

```typescript
// components/features/comments/LiveCommentList.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { useRealtimeEvent } from '@/hooks/useRealtimeEvent';

export function LiveCommentList({ photoId, eventSlug }) {
  useRealtimeEvent(eventSlug); // Enable realtime updates

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', photoId],
    queryFn: async () => {
      const res = await fetch(`/api/photos/${photoId}/comments`);
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentCard key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
```

---

## Mobile-First Design

### Responsive Layout

```typescript
// components/layouts/Header.tsx
'use client';

import { Menu, X } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const { isMobileMenuOpen, toggleMobileMenu } = useUIStore();

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Logo />
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            <NavLink href="/portfolio">Portfolio</NavLink>
            <NavLink href="/admin">Admin</NavLink>
          </nav>
          
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col gap-4">
            <NavLink href="/portfolio">Portfolio</NavLink>
            <NavLink href="/admin">Admin</NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
```

### Touch Gestures

```typescript
// hooks/useSwipeGesture.ts
'use client';

import { useState, TouchEvent } from 'react';

export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void
) {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight();
    }
  };

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
```

### Mobile Photo Modal

```typescript
// components/features/photos/PhotoModal.tsx
'use client';

import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function PhotoModal({ photo, onClose, onNext, onPrev }) {
  const swipeHandlers = useSwipeGesture(onNext, onPrev);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={onClose} className="text-white">
          <X size={24} />
        </button>
      </div>

      {/* Photo */}
      <div
        className="h-full flex items-center justify-center"
        {...swipeHandlers}
      >
        <img
          src={photo.url}
          alt={photo.filename}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Navigation */}
      <div className="absolute inset-y-0 left-0 flex items-center p-4">
        <button onClick={onPrev} className="text-white">
          <ChevronLeft size={32} />
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center p-4">
        <button onClick={onNext} className="text-white">
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Like & Comment */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex gap-4">
          <PhotoLikeButton photoId={photo.id} />
          <CommentButton photoId={photo.id} />
        </div>
      </div>
    </div>
  );
}
```

---

## Image Optimization

### Next.js Image Component

```typescript
// components/features/photos/PhotoCard.tsx
import Image from 'next/image';

export function PhotoCard({ photo }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg">
      <Image
        src={photo.thumbnailUrl}
        alt={photo.filename}
        fill
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        className="object-cover hover:scale-105 transition-transform"
        placeholder="blur"
        blurDataURL={photo.blurHash}
      />
    </div>
  );
}
```

### Progressive Image Loading

```typescript
// components/ui/ProgressiveImage.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';

export function ProgressiveImage({ src, thumbnail, alt }) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative">
      {/* Thumbnail (blurred) */}
      <Image
        src={thumbnail}
        alt=""
        fill
        className={`object-cover transition-opacity ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        priority
      />
      
      {/* Full image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoadingComplete={() => setIsLoaded(true)}
      />
    </div>
  );
}
```

---

## Performance Optimization

### Code Splitting dengan Dynamic Imports

```typescript
// app/admin/analytics/page.tsx
import dynamic from 'next/dynamic';

const AnalyticsChart = dynamic(
  () => import('@/components/features/analytics/AnalyticsChart'),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

export default function AnalyticsPage() {
  return (
    <div>
      <h1>Analytics</h1>
      <AnalyticsChart />
    </div>
  );
}
```

### Suspense Boundaries

```typescript
// app/admin/events/page.tsx
import { Suspense } from 'react';
import { EventList } from '@/components/features/events/EventList';
import { EventListSkeleton } from '@/components/skeletons/EventListSkeleton';

export default function EventsPage() {
  return (
    <div>
      <h1>Events</h1>
      <Suspense fallback={<EventListSkeleton />}>
        <EventList />
      </Suspense>
    </div>
  );
}
```

### Streaming Server Side Rendering

```typescript
// app/(public)/[slug]/page.tsx
import { Suspense } from 'react';

export default function EventPage({ params }) {
  return (
    <div>
      {/* Stream header immediately */}
      <EventHeader slug={params.slug} />
      
      {/* Stream photos when ready */}
      <Suspense fallback={<PhotoGridSkeleton />}>
        <PhotoGrid slug={params.slug} />
      </Suspense>
    </div>
  );
}
```

---

## Design System

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#A7EBF2',
          DEFAULT: '#54ACBF',
          dark: '#26658C',
        },
        accent: {
          DEFAULT: '#023859',
          dark: '#011C40',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

### Typography Setup

```typescript
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

---

## Form Handling

### React Hook Form + Zod

```typescript
// components/features/events/EventForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const eventSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(3),
  eventDate: z.string(),
  location: z.string().optional(),
  description: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

export function EventForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="slug">Slug</label>
        <input
          {...register('slug')}
          type="text"
          className="input"
        />
        {errors.slug && (
          <p className="text-red-500 text-sm">{errors.slug.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="title">Title</label>
        <input
          {...register('title')}
          type="text"
          className="input"
        />
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? 'Menyimpan...' : 'Simpan Event'}
      </button>
    </form>
  );
}
```

---

## Testing

### Component Testing dengan Vitest

```typescript
// components/features/photos/PhotoCard.test.tsx
import { render, screen } from '@testing-library/react';
import { PhotoCard } from './PhotoCard';

describe('PhotoCard', () => {
  const mockPhoto = {
    id: '1',
    filename: 'test.jpg',
    thumbnailUrl: '/test.jpg',
  };

  it('renders photo correctly', () => {
    render(<PhotoCard photo={mockPhoto} />);
    expect(screen.getByAltText('test.jpg')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    render(<PhotoCard photo={mockPhoto} onClick={onClick} />);
    
    const card = screen.getByRole('button');
    await userEvent.click(card);
    
    expect(onClick).toHaveBeenCalledWith(mockPhoto.id);
  });
});
```

---

**Next:** [Database Architecture (NeonDB)](./database.md)
