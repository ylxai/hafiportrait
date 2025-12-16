# 🔒 Security Quick Reference - Hafiportrait Platform

Panduan cepat untuk menggunakan security features yang telah diimplementasikan.

---

## 🚀 Quick Start

### 1. Setup Environment Variables

```bash
# Generate JWT secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="your-generated-secret-here"
REDIS_URL="redis://localhost:6379"
```

### 2. Verify Installation

```bash
npm run type-check  # Should pass
npm test            # Run tests
```

---

## 📋 Common Use Cases

### Protect New API Route

```typescript
import { asyncHandler, successResponse } from '@/lib/errors/handler'
import { rateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { getUserFromRequest } from '@/lib/auth'

export const POST = asyncHandler(async (request) => {
  // Apply rate limiting
  await rateLimit(request, RateLimitPresets.API)
  
  // Get authenticated user
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new AuthenticationError('Login required')
  }
  
  // Your logic here
  
  return successResponse({ message: 'Success' })
})
```

### Validate User Input

```typescript
import { createEventSchema } from '@/lib/validation/schemas'
import { sanitizeText } from '@/lib/security/sanitize'
import { ValidationError } from '@/lib/errors/types'

const body = await request.json()

// Sanitize input
if (body.name) body.name = sanitizeText(body.name)

// Validate with Zod
const validation = createEventSchema.safeParse(body)
if (!validation.success) {
  throw new ValidationError('Invalid input', validation.error.errors)
}

const data = validation.data // Type-safe!
```

### Check User Permissions

```typescript
import { isAdmin, hasRole } from '@/lib/auth'

const user = await getUserFromRequest(request)

if (!isAdmin(user)) {
  throw new AuthorizationError('Admin access required')
}

// Or check specific role
if (!hasRole(user, 'CLIENT')) {
  throw new AuthorizationError('Client access required')
}
```

### Sanitize User Content

```typescript
import { 
  sanitizeText,      // Remove ALL HTML
  sanitizeComment,   // Allow safe tags
  sanitizeEmail,     // Clean + lowercase
  sanitizeFilename,  // Prevent path traversal
  sanitizeSlug       // URL-safe
} from '@/lib/security/sanitize'

const name = sanitizeText(userInput)           // "Hello World"
const comment = sanitizeComment(htmlInput)      // "Hello <b>world</b>"
const email = sanitizeEmail('Test@Example.com') // "test@example.com"
const file = sanitizeFilename('../../../etc')   // "etc"
const slug = sanitizeSlug('My Event!')          // "my-event"
```

### Apply Security Headers

```typescript
import { applySecurityHeaders, createSecureResponse } from '@/lib/security/headers'

// Option 1: Apply to existing response
const response = NextResponse.json(data)
return applySecurityHeaders(response)

// Option 2: Create secure response
return createSecureResponse(data, 200)
```

### Log Security Events

```typescript
import { logSecurityEvent } from '@/lib/security/headers'

logSecurityEvent({
  type: 'AUTH_FAILED',
  identifier: email,
  details: { reason: 'invalid_password', attempts: 5 }
})
```

---

## 🎯 Validation Schemas

### Available Schemas

```typescript
import {
  loginSchema,          // Email + password
  registerSchema,       // Email + password + name
  createEventSchema,    // Event creation
  createCommentSchema,  // Comment submission
  uploadPhotoSchema,    // Photo upload
  paginationSchema,     // Page + limit
  idParamSchema,        // CUID validation
  slugParamSchema,      // Slug validation
} from '@/lib/validation/schemas'
```

### Usage

```typescript
const result = loginSchema.safeParse(body)
if (!result.success) {
  // Handle errors
  const errors = result.error.errors.map(e => e.message)
}
```

---

## 🚦 Rate Limiting Presets

```typescript
import { RateLimitPresets } from '@/lib/security/rate-limiter'

// AUTH: 5 requests per 15 minutes
await rateLimit(request, RateLimitPresets.AUTH)

// API: 100 requests per minute
await rateLimit(request, RateLimitPresets.API)

// UPLOAD: 10 uploads per 5 minutes
await rateLimit(request, RateLimitPresets.UPLOAD)

// COMMENT: 5 comments per minute
await rateLimit(request, RateLimitPresets.COMMENT)
```

### Custom Rate Limit

```typescript
import { checkRateLimit } from '@/lib/security/rate-limiter'

const result = await checkRateLimit('user-id', {
  windowMs: 60000,      // 1 minute
  maxRequests: 50,      // 50 requests
  keyPrefix: 'custom'
})
```

---

## ⚠️ Error Handling

### Custom Errors

```typescript
import {
  AuthenticationError,   // 401
  AuthorizationError,    // 403
  ValidationError,       // 400
  NotFoundError,         // 404
  ConflictError,         // 409
  RateLimitError,        // 429
  DatabaseError          // 500
} from '@/lib/errors/types'

throw new AuthenticationError('Login required')
throw new ValidationError('Invalid input', ['email: required'])
throw new NotFoundError('Event not found')
```

### Async Handler

```typescript
import { asyncHandler } from '@/lib/errors/handler'

// Automatically catches and formats errors
export const POST = asyncHandler(async (request) => {
  // Your code - errors auto-handled
})
```

---

## 🔐 Password Validation

```typescript
import { validatePassword, checkPasswordStrength } from '@/lib/validation/password'

const result = validatePassword('UserPass123!')

if (!result.isValid) {
  console.log(result.errors)      // ["Password must contain..."]
  console.log(result.suggestions) // ["Consider using 16+ chars..."]
}

console.log(result.strength) // "WEAK" | "FAIR" | "GOOD" | "STRONG"
```

---

## 🛡️ Middleware (Automatic)

Routes automatically protected:
- `/admin/*` - Requires authentication + ADMIN role
- `/api/admin/*` - Requires authentication + ADMIN role

Public routes (no auth):
- `/` - Landing page
- `/api/auth/*` - Auth endpoints
- `/api/health` - Health check
- `/gallery/*` - Public galleries

---

## 📊 Security Headers

Automatically applied to all responses:
- ✅ Content-Security-Policy
- ✅ Strict-Transport-Security (production)
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy
- ✅ Permissions-Policy

---

## 🧪 Testing

```bash
# All tests
npm test

# Specific test file
npm test -- __tests__/lib/auth.test.ts

# With coverage
npm test -- --coverage

# Type checking
npm run type-check
```

---

## 🔍 Debugging

### View Security Logs (Development)

```bash
# Console will show:
✅ Security Configuration Loaded
📝 Request logs: GET /api/events - 192.168.1.1
🔐 Security Event: AUTH_FAILED
❌ Error occurred: ...
```

### Check Rate Limit Status

```typescript
import { getRateLimitStatus, getClientIdentifier } from '@/lib/security/rate-limiter'

const identifier = getClientIdentifier(request)
const status = await getRateLimitStatus(identifier, RateLimitPresets.AUTH)

console.log(status.remaining) // Remaining requests
console.log(status.reset)     // Reset timestamp
```

---

## ⚙️ Configuration

### Environment Variables

```env
# Required
NEXTAUTH_SECRET="32+ characters"
REDIS_URL="redis://localhost:6379"

# Optional
JWT_EXPIRATION="24h"
BCRYPT_ROUNDS="12"
ALLOWED_ORIGINS="http://localhost:3000"
```

### Security Config Access

```typescript
import { securityConfig } from '@/lib/config/security'

console.log(securityConfig.bcryptRounds)        // 12
console.log(securityConfig.jwtExpirationTime)   // "24h"
console.log(securityConfig.nodeEnv)             // "development"
```

---

## 🚨 Common Issues

### "JWT secret is too short"
```bash
# Generate new secret
openssl rand -base64 32

# Add to .env.local
NEXTAUTH_SECRET="<generated-secret>"
```

### "Redis connection failed"
```bash
# Start Redis locally
redis-server

# Or update connection string
REDIS_URL="redis://your-redis-server:6379"
```

### "Rate limit exceeded"
```bash
# Wait for reset time (15 minutes for auth)
# Or reset manually (admin only):
await resetRateLimit(identifier, 'rate-limit:auth')
```

---

## 📚 Full Documentation

- **Complete Guide:** `docs/SECURITY.md`
- **Implementation Summary:** `SECURITY_IMPLEMENTATION_SUMMARY.md`
- **Architecture:** `docs/architecture.md`
- **Story Details:** `.bmad-core/stories/security-fixes-critical.md`

---

## ✅ Security Checklist

Before going to production:
- [ ] JWT secret is 32+ characters
- [ ] Redis is configured and running
- [ ] HTTPS is enabled
- [ ] ALLOWED_ORIGINS is set correctly
- [ ] All tests pass
- [ ] Security headers verified
- [ ] Rate limiting tested
- [ ] Error messages don't leak info

---

**Need Help?** Check `docs/SECURITY.md` for detailed documentation.
