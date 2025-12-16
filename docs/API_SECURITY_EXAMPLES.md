# 🔐 API Security Integration Examples

## Quick Reference Guide untuk Hafiportrait Security Implementation

---

## 1. Protected Admin Route dengan Full Security

```typescript
// app/api/admin/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/middleware/security'
import { validateAndSanitizeInput, createEventSchema } from '@/lib/security/input-validation'
import { logSecurityEvent } from '@/lib/security/monitoring'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Apply all security layers
  const security = await withSecurity(request, {
    csrf: true,                    // CSRF protection
    rateLimit: 'ADMIN_API',        // Rate limiting
    requireAuth: true,             // JWT authentication
    requireAdmin: true             // Admin role check
  })

  if (!security.allowed) {
    return security.response
  }

  try {
    // Validate and sanitize input
    const body = await request.json()
    const validation = validateAndSanitizeInput(createEventSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create event dengan validated data
    const event = await prisma.event.create({
      data: {
        ...validation.data,
        clientId: security.user.userId,
        slug: generateSlug(validation.data.name),
        accessCode: generateAccessCode(),
      }
    })

    // Log successful creation
    await logSecurityEvent({
      type: 'EVENT_CREATED',
      userId: security.user.userId,
      severity: 'low',
      details: { eventId: event.id }
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Event creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}
```

---

## 2. Public Endpoint dengan Rate Limiting

```typescript
// app/api/public/contact-form/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/middleware/security'
import { validateAndSanitizeInput, contactFormSchema } from '@/lib/security/input-validation'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  // Apply rate limiting only (no auth required)
  const security = await withSecurity(request, {
    rateLimit: 'PUBLIC_API'
  })

  if (!security.allowed) {
    return security.response
  }

  try {
    const body = await request.json()
    const validation = validateAndSanitizeInput(contactFormSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const message = await prisma.contactMessage.create({
      data: validation.data
    })

    return NextResponse.json({ 
      message: 'Contact form submitted successfully',
      id: message.id 
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
```

---

## 3. Gallery Access dengan Guest Session

```typescript
// app/api/gallery/[eventSlug]/access/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/middleware/security'
import { createGallerySession } from '@/lib/security/gallery-session'
import { validateAndSanitizeInput, accessEventSchema } from '@/lib/security/input-validation'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { eventSlug: string } }
) {
  const security = await withSecurity(request, {
    rateLimit: 'GALLERY_ACCESS'
  })

  if (!security.allowed) {
    return security.response
  }

  try {
    const body = await request.json()
    const validation = validateAndSanitizeInput(accessEventSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Verify access code
    const event = await prisma.event.findFirst({
      where: {
        slug: params.eventSlug,
        accessCode: validation.data.accessCode,
        status: 'ACTIVE'
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }

    // Create secure gallery session
    const { sessionId, guestToken } = await createGallerySession(
      event.id,
      request,
      event.storageDurationDays * 24 // Convert days to hours
    )

    // Set session cookie
    const response = NextResponse.json({
      message: 'Access granted',
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug
      }
    })

    response.cookies.set({
      name: `gallery-session-${event.slug}`,
      value: sessionId,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: event.storageDurationDays * 24 * 60 * 60
    })

    return response
  } catch (error) {
    console.error('Gallery access error:', error)
    return NextResponse.json(
      { error: 'Failed to grant access' },
      { status: 500 }
    )
  }
}
```

---

## 4. Photo Upload dengan Burst Protection

```typescript
// app/api/admin/photos/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/middleware/security'
import { checkUploadBurst, releaseUploadBurst } from '@/lib/security/rate-limit'
import { validateFileUpload } from '@/lib/security/input-validation'
import { getClientIdentifier } from '@/lib/security/rate-limit'

export async function POST(request: NextRequest) {
  const security = await withSecurity(request, {
    csrf: true,
    rateLimit: 'PHOTO_UPLOAD',
    requireAuth: true
  })

  if (!security.allowed) {
    return security.response
  }

  const identifier = getClientIdentifier(request, security.user.userId)

  try {
    // Check burst protection
    const burstCheck = await checkUploadBurst(identifier)
    
    if (!burstCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many concurrent uploads. Please wait.',
          current: burstCheck.current 
        },
        { status: 429 }
      )
    }

    // Process file upload
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      await releaseUploadBurst(identifier)
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFileUpload(file)
    if (!validation.valid) {
      await releaseUploadBurst(identifier)
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Upload logic here...
    const photo = await uploadPhoto(file, security.user.userId)

    // Release burst slot
    await releaseUploadBurst(identifier)

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    await releaseUploadBurst(identifier)
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}
```

---

## 5. Login dengan Enhanced Session

```typescript
// app/api/auth/login/route.ts (Enhanced Version)
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword } from '@/lib/auth'
import { createAccessToken, createRefreshToken, setAuthCookies } from '@/lib/security/session'
import { withSecurity } from '@/lib/middleware/security'
import { validateAndSanitizeInput, loginSchema } from '@/lib/security/input-validation'
import { logSecurityEvent, trackFailedLogin, clearFailedLogin } from '@/lib/security/monitoring'
import { getClientIdentifier } from '@/lib/security/rate-limit'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const security = await withSecurity(request, {
    csrf: true,
    rateLimit: 'AUTH_LOGIN'
  })

  if (!security.allowed) {
    return security.response
  }

  const identifier = getClientIdentifier(request)

  try {
    const body = await request.json()
    const validation = validateAndSanitizeInput(loginSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        name: true,
        role: true
      }
    })

    if (!user) {
      trackFailedLogin(identifier)
      await logSecurityEvent({
        type: 'AUTH_LOGIN_FAILED',
        ipAddress: identifier,
        severity: 'medium',
        details: { email, reason: 'user_not_found' }
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      const blocked = trackFailedLogin(identifier)
      await logSecurityEvent({
        type: 'AUTH_LOGIN_FAILED',
        userId: user.id,
        ipAddress: identifier,
        severity: blocked ? 'high' : 'medium',
        details: { reason: 'invalid_password', blocked }
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Clear failed login attempts
    clearFailedLogin(identifier)

    // Create tokens (7 days access + 30 days refresh)
    const accessToken = await createAccessToken({
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      role: user.role
    })

    const refreshToken = await createRefreshToken(user.id)

    // Log successful login
    await logSecurityEvent({
      type: 'AUTH_LOGIN_SUCCESS',
      userId: user.id,
      ipAddress: identifier,
      severity: 'low'
    })

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role
      }
    })

    setAuthCookies(response, accessToken, refreshToken)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
```

---

## 6. Client-Side Integration

### React Hook for CSRF Token

```typescript
// hooks/useCsrfToken.ts
import { useState, useEffect } from 'react'

export function useCsrfToken() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/csrf-token')
      .then(res => res.json())
      .then(data => {
        setCsrfToken(data.csrfToken)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch CSRF token:', err)
        setLoading(false)
      })
  }, [])

  return { csrfToken, loading }
}
```

### Secure API Client

```typescript
// lib/api-client.ts
export class SecureApiClient {
  private csrfToken: string | null = null

  async fetchCsrfToken() {
    const response = await fetch('/api/auth/csrf-token')
    const data = await response.json()
    this.csrfToken = data.csrfToken
  }

  async request(url: string, options: RequestInit = {}) {
    // Ensure CSRF token is available for mutations
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || '')) {
      if (!this.csrfToken) {
        await this.fetchCsrfToken()
      }

      options.headers = {
        ...options.headers,
        'x-csrf-token': this.csrfToken!,
        'Content-Type': 'application/json'
      }
    }

    const response = await fetch(url, options)

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After')
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`)
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new SecureApiClient()
```

---

## 7. Socket.IO Client Connection

```typescript
// lib/socket-client.ts
import { io, Socket } from 'socket.io-client'

export function createSecureSocketConnection(
  accessToken?: string,
  guestSessionId?: string,
  eventId?: string
): Socket {
  const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
    auth: {
      token: accessToken,           // For admin/photographer
      guestSessionId: guestSessionId, // For guests
      eventId: eventId
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  })

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  return socket
}
```

---

## Summary

All API endpoints in Hafiportrait Photography Platform are now protected dengan:

✅ **CSRF Protection** - All state-changing operations  
✅ **Rate Limiting** - Prevent abuse  
✅ **Authentication** - JWT + Refresh tokens  
✅ **Authorization** - Role-based access  
✅ **Input Validation** - XSS & SQL injection prevention  
✅ **Security Monitoring** - Audit logging  

Use `withSecurity()` middleware untuk consistent security implementation across all routes.
