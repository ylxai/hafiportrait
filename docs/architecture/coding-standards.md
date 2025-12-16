# Coding Standards - Hafiportrait Photography Platform

**Last Updated:** December 2024

---

## Overview

Coding standards untuk memastikan consistency, maintainability, dan quality code di seluruh Hafiportrait platform. Standards ini digunakan oleh developer dan AI agents.

---

## Critical Rules (MUST Follow)

### 1. Type Sharing
**Rule:** Always define shared types in `packages/shared` and import from there.

**Why:** Ensures type consistency between frontend and backend.

**Example:**
```typescript
// ❌ BAD - Duplicate types
// apps/web/src/types/event.ts
interface Event { ... }

// apps/api/src/types/event.ts
interface Event { ... }

// ✅ GOOD - Shared types
// packages/shared/src/types/event.ts
export interface Event {
  id: string;
  slug: string;
  title: string;
  // ...
}

// apps/web/src/pages/EventPage.tsx
import { Event } from '@hafiportrait/shared';

// apps/api/src/services/eventService.ts
import { Event } from '@hafiportrait/shared';
```

### 2. API Service Layer
**Rule:** Never make direct HTTP calls - always use the service layer.

**Why:** Centralized error handling, request/response transformation, and easier testing.

**Example:**
```typescript
// ❌ BAD - Direct axios call
const response = await axios.get('/api/v1/events/test');

// ✅ GOOD - Service layer
import { eventService } from '@/services/eventService';
const event = await eventService.getPublicEvent('test');
```

### 3. Environment Variables
**Rule:** Access environment variables only through config objects, never `process.env` directly in business logic.

**Why:** Type safety, validation, and easier testing.

**Example:**
```typescript
// ❌ BAD - Direct process.env access
const apiUrl = process.env.VITE_API_URL;

// ✅ GOOD - Config object
// config/env.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  cdnUrl: import.meta.env.VITE_CDN_URL,
};

// In component
import { config } from '@/config/env';
const response = await fetch(`${config.apiUrl}/events`);
```

### 4. Error Handling
**Rule:** All API routes must use the standard error handler.

**Why:** Consistent error format, proper logging, and security.

**Example:**
```typescript
// ❌ BAD - Inconsistent error handling
router.get('/events/:id', async (req, res) => {
  try {
    const event = await getEvent(req.params.id);
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GOOD - Standard error handler
import { asyncHandler } from '@/middleware/asyncHandler';
import { AppError } from '@/utils/errors';

router.get('/events/:id', asyncHandler(async (req, res) => {
  const event = await getEvent(req.params.id);
  if (!event) {
    throw new AppError('Event not found', 404);
  }
  res.json({ success: true, data: { event } });
}));
```

### 5. State Management
**Rule:** Never mutate state directly - use proper state management patterns.

**Why:** Predictable state updates, easier debugging, React optimization.

**Example:**
```typescript
// ❌ BAD - Direct mutation
const [photos, setPhotos] = useState([]);
photos.push(newPhoto); // Mutates state directly

// ✅ GOOD - Immutable update
setPhotos([...photos, newPhoto]);

// ✅ GOOD - With Zustand
const addPhoto = (photo: Photo) => {
  set((state) => ({
    photos: [...state.photos, photo],
  }));
};
```

---

## Naming Conventions

### File Naming

| Element | Convention | Example |
|---------|-----------|---------|
| React Components | PascalCase | `PhotoGrid.tsx`, `EventCard.tsx` |
| Hooks | camelCase with 'use' prefix | `useEventPhotos.ts`, `useAuth.ts` |
| Utilities | camelCase | `formatDate.ts`, `validateEmail.ts` |
| Services | camelCase with 'Service' suffix | `eventService.ts`, `photoService.ts` |
| Types | PascalCase | `Event.ts`, `Photo.ts` |
| Constants | UPPER_SNAKE_CASE | `API_ROUTES.ts`, `ERROR_CODES.ts` |

### Code Naming

```typescript
// Components - PascalCase
export const PhotoGrid: React.FC<PhotoGridProps> = () => {};
export const EventCard: React.FC<EventCardProps> = () => {};

// Functions - camelCase
function getEventPhotos(eventId: string) {}
const handlePhotoClick = () => {};

// Hooks - camelCase with 'use'
function useEventPhotos(eventSlug: string) {}
function usePhotoLike() {}

// Types/Interfaces - PascalCase
interface Event {}
type PhotoStatus = 'pending' | 'uploaded' | 'failed';

// Enums - PascalCase
enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

// Constants - UPPER_SNAKE_CASE
const MAX_UPLOAD_SIZE = 10485760;
const API_BASE_URL = 'https://api.hafiportrait.com';

// Private functions/variables - prefix with underscore
function _internalHelper() {}
const _privateCache = new Map();
```

### API Routes

```typescript
// RESTful conventions - kebab-case
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/:id
PUT    /api/v1/events/:id
DELETE /api/v1/events/:id

// Nested resources
GET    /api/v1/events/:id/photos
POST   /api/v1/events/:id/photos

// Actions (avoid if possible, prefer RESTful)
POST   /api/v1/photos/:id/like      // OK
POST   /api/v1/events/:id/archive   // OK
```

### Database Tables/Columns

```sql
-- Tables: snake_case, plural
users
events
photo_likes
editing_requests

-- Columns: snake_case
user_id
created_at
full_name
storage_key
```

---

## TypeScript Standards

### Type Definitions

```typescript
// ✅ Use interfaces for objects
interface User {
  id: string;
  email: string;
  role: UserRole;
}

// ✅ Use type for unions, intersections, primitives
type EventStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
type PhotoWithLikes = Photo & { likeCount: number };

// ✅ Use enums for constants with multiple uses
enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT',
}

// ✅ Prefer const assertions for single-use constants
const ROUTES = {
  HOME: '/',
  ADMIN: '/admin',
} as const;
```

### Avoid `any`

```typescript
// ❌ BAD
function processData(data: any) {
  return data.value;
}

// ✅ GOOD - Use specific type
function processData(data: { value: string }) {
  return data.value;
}

// ✅ GOOD - Use generic
function processData<T extends { value: unknown }>(data: T) {
  return data.value;
}

// ✅ OK for truly unknown data
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return data.value;
  }
}
```

### Null Safety

```typescript
// ✅ Use optional chaining
const photoCount = event?.photos?.length ?? 0;

// ✅ Use nullish coalescing
const title = event.title ?? 'Untitled Event';

// ✅ Type guards
function isEvent(data: unknown): data is Event {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'slug' in data
  );
}
```

---

## React Best Practices

### Component Structure

```typescript
// Standard component structure
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types
interface PhotoGridProps {
  eventSlug: string;
  onPhotoClick?: (photoId: string) => void;
}

// Component
export const PhotoGrid: React.FC<PhotoGridProps> = ({ 
  eventSlug, 
  onPhotoClick 
}) => {
  // Hooks (in order: state, effects, queries, mutations, custom hooks)
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  
  const { data, isLoading } = useEventPhotos(eventSlug);
  
  useEffect(() => {
    // Effect logic
  }, [eventSlug]);
  
  // Event handlers
  const handlePhotoClick = (photoId: string) => {
    onPhotoClick?.(photoId);
  };
  
  // Early returns
  if (isLoading) return <LoadingSpinner />;
  if (!data) return <ErrorMessage />;
  
  // Render
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {data.photos.map((photo) => (
        <PhotoCard 
          key={photo.id} 
          photo={photo} 
          onClick={handlePhotoClick} 
        />
      ))}
    </div>
  );
};
```

### Props Destructuring

```typescript
// ✅ GOOD - Destructure props
export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary',
  onClick 
}) => {
  return <button className={variant} onClick={onClick}>{children}</button>;
};

// ❌ BAD - Using props object
export const Button: React.FC<ButtonProps> = (props) => {
  return <button className={props.variant} onClick={props.onClick}>
    {props.children}
  </button>;
};
```

### Conditional Rendering

```typescript
// ✅ GOOD - Conditional rendering
{isLoading && <Spinner />}
{error && <ErrorMessage error={error} />}
{data && <DataDisplay data={data} />}

// ✅ GOOD - Ternary for either/or
{isAuthenticated ? <Dashboard /> : <Login />}

// ❌ BAD - Multiple ternaries (hard to read)
{isLoading ? <Spinner /> : error ? <Error /> : data ? <Display /> : null}

// ✅ GOOD - Early returns instead
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <DataDisplay data={data} />;
```

---

## Backend Best Practices

### Route Handler Structure

```typescript
// Standard route handler pattern
import { asyncHandler } from '@/middleware/asyncHandler';
import { validateBody } from '@/middleware/validation';
import { authenticate, requireRole } from '@/middleware/auth';

router.post(
  '/events',
  authenticate,
  requireRole(['ADMIN']),
  validateBody(createEventSchema),
  asyncHandler(async (req, res) => {
    const eventData = req.body;
    const event = await eventService.createEvent(eventData);
    
    res.status(201).json({
      success: true,
      data: { event },
    });
  })
);
```

### Service Layer Pattern

```typescript
// services/eventService.ts
export class EventService {
  constructor(private prisma: PrismaClient) {}
  
  async createEvent(data: CreateEventInput): Promise<Event> {
    // Validation
    this.validateEventData(data);
    
    // Business logic
    const accessCode = this.generateAccessCode();
    const storageExpiresAt = this.calculateExpiryDate(data.storageDurationMonths);
    
    // Database operation
    const event = await this.prisma.event.create({
      data: {
        ...data,
        accessCode,
        storageExpiresAt,
      },
    });
    
    // Post-processing
    await this.queueQRCodeGeneration(event.id);
    
    return event;
  }
  
  private validateEventData(data: CreateEventInput): void {
    // Validation logic
  }
  
  private generateAccessCode(): string {
    // Generation logic
  }
}
```

### Repository Pattern

```typescript
// repositories/eventRepository.ts
export class EventRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findBySlug(slug: string): Promise<Event | null> {
    return this.prisma.event.findUnique({
      where: { slug },
      include: {
        client: true,
        analytics: true,
      },
    });
  }
  
  async findActiveEvents(): Promise<Event[]> {
    return this.prisma.event.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { eventDate: 'desc' },
    });
  }
}
```

---

## Error Handling Patterns

### Custom Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public details?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}
```

### Error Handler Middleware

```typescript
// middleware/errorHandler.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationError && { details: err.details }),
      },
    });
  }
  
  // Log unexpected errors
  logger.error('Unexpected error:', err);
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  });
};
```

---

## Code Organization

### Import Order

```typescript
// 1. External dependencies
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal absolute imports (aliases)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { eventService } from '@/services/eventService';

// 3. Shared package imports
import { Event } from '@hafiportrait/shared';

// 4. Relative imports
import { PhotoCard } from './PhotoCard';
import './PhotoGrid.css';

// 5. Types
import type { PhotoGridProps } from './types';
```

### Barrel Exports

```typescript
// components/ui/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';

// Usage
import { Button, Input, Modal } from '@/components/ui';
```

---

## Comments & Documentation

### When to Comment

```typescript
// ✅ GOOD - Complex business logic
// Calculate storage expiry date based on event date and duration
// Events expire after the configured months AFTER the event date
const storageExpiresAt = addMonths(eventData.eventDate, storageDurationMonths);

// ✅ GOOD - Non-obvious workarounds
// Workaround for Safari bug with date parsing
// https://bugs.webkit.org/show_bug.cgi?id=123456
const parsedDate = new Date(dateString.replace(/-/g, '/'));

// ❌ BAD - Obvious code
// Set the title to the event title
const title = event.title;

// ❌ BAD - Commented out code (use git instead)
// const oldFunction = () => {
//   ...
// }
```

### JSDoc for Public APIs

```typescript
/**
 * Fetches event photos with optional filtering and pagination
 * 
 * @param eventSlug - The unique slug of the event
 * @param options - Optional filtering and pagination parameters
 * @returns Promise resolving to paginated photo list
 * @throws {NotFoundError} If event doesn't exist
 * @throws {ForbiddenError} If user doesn't have access
 * 
 * @example
 * const photos = await getEventPhotos('wedding-2024', {
 *   page: 1,
 *   limit: 30,
 *   sortBy: 'likes'
 * });
 */
export async function getEventPhotos(
  eventSlug: string,
  options?: PhotoQueryOptions
): Promise<PaginatedPhotos> {
  // Implementation
}
```

---

## Performance Best Practices

### React Performance

```typescript
// ✅ Memoize expensive computations
const sortedPhotos = useMemo(
  () => photos.sort((a, b) => b.likeCount - a.likeCount),
  [photos]
);

// ✅ Memoize callbacks
const handleClick = useCallback((id: string) => {
  onPhotoClick(id);
}, [onPhotoClick]);

// ✅ Use React.memo for pure components
export const PhotoCard = React.memo<PhotoCardProps>(({ photo }) => {
  return <div>...</div>;
});
```

### Database Queries

```typescript
// ✅ GOOD - Select only needed fields
const events = await prisma.event.findMany({
  select: {
    id: true,
    slug: true,
    title: true,
  },
});

// ❌ BAD - Select all fields unnecessarily
const events = await prisma.event.findMany();

// ✅ GOOD - Use pagination
const photos = await prisma.photo.findMany({
  take: limit,
  skip: (page - 1) * limit,
});

// ✅ GOOD - Use proper indexes
await prisma.event.findUnique({
  where: { slug }, // slug is indexed
});
```

---

## Security Best Practices

```typescript
// ✅ Always validate input
const createEventSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  title: z.string().min(5).max(200),
});

// ✅ Sanitize user input
import sanitizeHtml from 'sanitize-html';
const cleanComment = sanitizeHtml(userComment, { allowedTags: [] });

// ✅ Use parameterized queries (Prisma does this automatically)
await prisma.user.findUnique({ where: { email } });

// ❌ NEVER expose sensitive data
// BAD
res.json({ user: { ...user, passwordHash: user.passwordHash } });

// GOOD
res.json({ user: { id: user.id, email: user.email, fullName: user.fullName } });
```

---

## Testing Standards

```typescript
// ✅ Descriptive test names
describe('EventService', () => {
  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      // Test implementation
    });
    
    it('should throw ValidationError for invalid slug', async () => {
      // Test implementation
    });
  });
});

// ✅ Arrange-Act-Assert pattern
it('should like photo and increase count', async () => {
  // Arrange
  const photo = await createTestPhoto();
  const initialLikes = photo.likeCount;
  
  // Act
  await photoService.likePhoto(photo.id, 'session-123');
  
  // Assert
  const updated = await prisma.photo.findUnique({ where: { id: photo.id } });
  expect(updated.likeCount).toBe(initialLikes + 1);
});
```

---

**Next:** [Architecture Summary](./README.md)
