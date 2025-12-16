# API Specification - Hafiportrait Photography Platform

**Last Updated:** December 2024  
**Version:** 2.0 - Next.js API Routes

---

## Overview

Hafiportrait menggunakan **Next.js 15 API Routes** (App Router) dengan dokumentasi **OpenAPI 3.1** standard. API dirancang untuk:
- Frontend consumption (Next.js pages/components)
- External integrations (mobile apps, third-party services)
- Webhooks untuk event notifications
- Realtime updates via Socket.IO

**Base URL:**
- Development: `http://localhost:3000/api`
- VPS Dev: `https://dev.hafiportrait.com/api`
- Production: `https://hafiportrait.com/api`

**API Structure:** File-based routing in `app/api/` directory

---

## Authentication

### Authentication Methods

**1. JWT Token (Admin/Client) - NextAuth.js**
```http
Authorization: Bearer <jwt_token>
Cookie: next-auth.session-token=<session>
```

**2. Guest Session (Cookie-based)**
```http
Cookie: guest_session=<session_id>
```

**3. API Key (External integrations)**
```http
X-API-Key: <api_key>
```

### NextAuth.js Configuration

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
});

export { handler as GET, handler as POST };
```

### Authentication Middleware

```typescript
// lib/auth.ts
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const session = await getServerSession();

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  return session;
}

// Usage in API route
export async function GET(req: NextRequest) {
  const session = await requireAuth(req, ['ADMIN']);
  if (session instanceof NextResponse) return session;

  // Protected logic here
  return NextResponse.json({ data: 'protected data' });
}
```

---

## API Routes Structure

```
app/api/
├── auth/
│   └── [...nextauth]/
│       └── route.ts              # NextAuth endpoints
├── events/
│   ├── route.ts                  # GET /api/events, POST /api/events
│   ├── [id]/
│   │   ├── route.ts             # GET, PUT, DELETE /api/events/[id]
│   │   └── photos/
│   │       └── route.ts          # GET, POST /api/events/[id]/photos
│   └── [slug]/
│       ├── public/
│       │   └── route.ts          # GET /api/events/[slug]/public
│       └── verify-access/
│           └── route.ts          # POST /api/events/[slug]/verify-access
├── photos/
│   ├── [id]/
│   │   ├── route.ts             # GET, DELETE /api/photos/[id]
│   │   ├── like/
│   │   │   └── route.ts          # POST, DELETE /api/photos/[id]/like
│   │   ├── comments/
│   │   │   └── route.ts          # GET, POST /api/photos/[id]/comments
│   │   └── download/
│   │       └── route.ts          # GET /api/photos/[id]/download
│   └── upload/
│       └── route.ts              # POST /api/photos/upload
├── comments/
│   ├── route.ts                  # GET /api/comments (admin)
│   └── [id]/
│       ├── route.ts             # GET, DELETE /api/comments/[id]
│       ├── approve/
│       │   └── route.ts          # PUT /api/comments/[id]/approve
│       └── reject/
│           └── route.ts          # PUT /api/comments/[id]/reject
├── admin/
│   ├── analytics/
│   │   └── route.ts              # GET /api/admin/analytics
│   └── editing-requests/
│       └── route.ts              # GET /api/admin/editing-requests
├── client/
│   ├── downloads/
│   │   └── route.ts              # POST /api/client/downloads
│   └── editing-requests/
│       └── route.ts              # POST /api/client/editing-requests
├── socket/
│   └── route.ts                  # Socket.IO endpoint
├── webhooks/
│   └── whatsapp/
│       └── route.ts              # POST /api/webhooks/whatsapp
└── health/
    └── route.ts                  # GET /api/health
```

---

## API Endpoints

### Health Check

#### GET /api/health

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      storage: 'unknown',
    },
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = 'healthy';
  } catch {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await redis.ping();
    health.checks.redis = 'healthy';
  } catch {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const status = health.status === 'healthy' ? 200 : 503;
  return NextResponse.json(health, { status });
}
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-15T10:00:00Z",
  "uptime": 12345.67,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "storage": "healthy"
  }
}
```

---

### Events API

#### GET /api/events (Admin)

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await requireAuth(req, ['ADMIN']);
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: { photos: true, comments: true }
        }
      },
      orderBy: { eventDate: 'desc' },
    }),
    prisma.event.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req, ['ADMIN']);
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  
  // Validate with Zod
  const eventSchema = z.object({
    slug: z.string().min(3),
    title: z.string().min(3),
    eventDate: z.string().datetime(),
    clientId: z.string().uuid().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
  });

  const validated = eventSchema.parse(body);

  // Generate access code
  const accessCode = generateAccessCode();

  const event = await prisma.event.create({
    data: {
      ...validated,
      accessCode,
      status: 'ACTIVE',
      storageExpiresAt: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
      ),
    },
  });

  // Generate QR code (async job)
  await generateQRCode(event.id, event.slug, accessCode);

  return NextResponse.json({
    success: true,
    data: { event },
  }, { status: 201 });
}
```

#### GET /api/events/[slug]/public

Public endpoint untuk guest access.

```typescript
// app/api/events/[slug]/public/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    select: {
      slug: true,
      title: true,
      eventDate: true,
      location: true,
      description: true,
      allowComments: true,
      allowDownloads: true,
      _count: {
        select: { photos: true }
      },
      photos: {
        where: { isFeatured: true },
        take: 1,
        select: {
          thumbnailKey: true,
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: 'Event not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { event },
  });
}
```

#### POST /api/events/[slug]/verify-access

Verify access code dan create guest session.

```typescript
// app/api/events/[slug]/verify-access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { accessCode } = await req.json();

  const event = await prisma.event.findFirst({
    where: {
      slug: params.slug,
      accessCode,
      status: 'ACTIVE',
    },
  });

  if (!event) {
    return NextResponse.json(
      { error: 'Invalid access code' },
      { status: 401 }
    );
  }

  // Create guest session
  const sessionId = uuidv4();
  await prisma.guestSession.create({
    data: {
      sessionId,
      eventId: event.id,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    },
  });

  // Set cookie
  cookies().set('guest_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      event: {
        slug: event.slug,
        title: event.title,
      },
    },
  });
}
```

---

### Photos API

#### POST /api/photos/upload

Multi-part file upload ke Cloudflare R2.

```typescript
// app/api/photos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { uploadToR2, generateThumbnail } from '@/lib/r2';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const session = await requireAuth(req, ['ADMIN']);
  if (session instanceof NextResponse) return session;

  const formData = await req.formData();
  const files = formData.getAll('photos') as File[];
  const eventId = formData.get('eventId') as string;

  if (!files.length || !eventId) {
    return NextResponse.json(
      { error: 'Missing files or eventId' },
      { status: 400 }
    );
  }

  const uploadedPhotos = [];

  for (const file of files) {
    // Upload original
    const storageKey = `events/${eventId}/${Date.now()}-${file.name}`;
    await uploadToR2(storageKey, file);

    // Generate thumbnail
    const thumbnailKey = `thumbnails/${storageKey}`;
    await generateThumbnail(file, thumbnailKey);

    // Save to database
    const photo = await prisma.photo.create({
      data: {
        eventId,
        filename: file.name,
        storageKey,
        thumbnailKey,
        fileSize: file.size,
        mimeType: file.type,
        width: 0, // TODO: Extract from EXIF
        height: 0,
        uploadedAt: new Date(),
      },
    });

    uploadedPhotos.push(photo);
  }

  return NextResponse.json({
    success: true,
    data: { photos: uploadedPhotos },
  });
}

// Enable large file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
```

#### POST /api/photos/[id]/like

Like a photo (guest or authenticated user).

```typescript
// app/api/photos/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = cookies().get('guest_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session required' },
      { status: 401 }
    );
  }

  // Check if already liked
  const existing = await prisma.photoLike.findFirst({
    where: {
      photoId: params.id,
      sessionId,
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Already liked' },
      { status: 409 }
    );
  }

  await prisma.photoLike.create({
    data: {
      photoId: params.id,
      sessionId,
      ipAddress: req.ip || 'unknown',
    },
  });

  // Get updated like count
  const likeCount = await prisma.photoLike.count({
    where: { photoId: params.id },
  });

  return NextResponse.json({
    success: true,
    data: { likeCount },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = cookies().get('guest_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session required' },
      { status: 401 }
    );
  }

  await prisma.photoLike.deleteMany({
    where: {
      photoId: params.id,
      sessionId,
    },
  });

  const likeCount = await prisma.photoLike.count({
    where: { photoId: params.id },
  });

  return NextResponse.json({
    success: true,
    data: { likeCount },
  });
}
```

#### GET /api/photos/[id]/download

Generate signed URL untuk download.

```typescript
// app/api/photos/[id]/download/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateSignedUrl } from '@/lib/r2';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = cookies().get('guest_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session required' },
      { status: 401 }
    );
  }

  const photo = await prisma.photo.findUnique({
    where: { id: params.id },
    include: { event: true },
  });

  if (!photo) {
    return NextResponse.json(
      { error: 'Photo not found' },
      { status: 404 }
    );
  }

  if (!photo.event.allowDownloads) {
    return NextResponse.json(
      { error: 'Downloads not allowed for this event' },
      { status: 403 }
    );
  }

  // Generate signed URL (valid for 1 hour)
  const downloadUrl = await generateSignedUrl(
    photo.storageKey,
    3600
  );

  // Track download
  await prisma.photoDownload.create({
    data: {
      photoId: photo.id,
      eventId: photo.eventId,
      sessionId,
      downloadType: 'SINGLE',
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    },
  });

  return NextResponse.json({
    success: true,
    data: { downloadUrl },
  });
}
```

---

### Comments API

#### POST /api/photos/[id]/comments

Post new comment.

```typescript
// app/api/photos/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const commentSchema = z.object({
  authorName: z.string().min(2).max(100),
  authorEmail: z.string().email().optional(),
  content: z.string().min(1).max(500),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const sessionId = cookies().get('guest_session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Session required' },
      { status: 401 }
    );
  }

  const body = await req.json();
  const validated = commentSchema.parse(body);

  const photo = await prisma.photo.findUnique({
    where: { id: params.id },
    include: { event: true },
  });

  if (!photo || !photo.event.allowComments) {
    return NextResponse.json(
      { error: 'Comments not allowed' },
      { status: 403 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      photoId: photo.id,
      eventId: photo.eventId,
      ...validated,
      sessionId,
      ipAddress: req.ip || 'unknown',
      status: photo.event.requireModeration ? 'PENDING' : 'APPROVED',
    },
  });

  return NextResponse.json({
    success: true,
    data: { comment },
  }, { status: 201 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const comments = await prisma.comment.findMany({
    where: {
      photoId: params.id,
      status: 'APPROVED',
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: { comments },
  });
}
```

---

### Admin API

#### PUT /api/comments/[id]/approve

```typescript
// app/api/comments/[id]/approve/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(req, ['ADMIN']);
  if (session instanceof NextResponse) return session;

  const comment = await prisma.comment.update({
    where: { id: params.id },
    data: { status: 'APPROVED' },
  });

  return NextResponse.json({
    success: true,
    data: { comment },
  });
}
```

---

## Error Handling

### Standard Error Response

```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export function errorResponse(error: APIError | Error) {
  const isAPIError = error instanceof APIError;
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code: isAPIError ? error.code : 'INTERNAL_ERROR',
        message: error.message,
        details: isAPIError ? error.details : undefined,
        timestamp: new Date().toISOString(),
      },
    },
    { status: isAPIError ? error.statusCode : 500 }
  );
}
```

### Usage in Routes

```typescript
// app/api/example/route.ts
import { errorResponse, APIError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    // Your logic here
  } catch (error) {
    if (error instanceof APIError) {
      return errorResponse(error);
    }
    
    console.error('Unexpected error:', error);
    return errorResponse(
      new APIError(500, 'INTERNAL_ERROR', 'An unexpected error occurred')
    );
  }
}
```

---

## Rate Limiting

```typescript
// lib/rate-limit.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function rateLimit(
  req: NextRequest,
  limit: number = 100,
  window: number = 60
) {
  const identifier = req.ip || 'anonymous';
  const key = `ratelimit:${identifier}`;

  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }

  if (current > limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + window * 1000).toString(),
        },
      }
    );
  }

  return null;
}
```

---

**Next:** [Frontend Architecture (Next.js)](./frontend.md)
