# Security Implementation Guide - Hafiportrait Platform

**Last Updated:** December 2024

---

## Overview

Dokumen ini menjelaskan implementasi security features di Hafiportrait Photography Platform, mencakup authentication, authorization, input validation, rate limiting, dan best practices.

---

## Table of Contents

1. [JWT Secret Management](#jwt-secret-management)
2. [Authentication & Authorization](#authentication--authorization)
3. [Input Validation & Sanitization](#input-validation--sanitization)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Security Headers](#security-headers)
7. [Password Security](#password-security)
8. [Testing](#testing)

---

## JWT Secret Management

### Configuration

JWT secret dikelola melalui `lib/config/security.ts` dengan validasi ketat:

- **Minimum Length:** 32 characters
- **No Default Values:** Default secret akan ditolak
- **Environment Variable:** `NEXTAUTH_SECRET`

### Generate Secure Secret

```bash
# Generate 32-byte base64 encoded secret
openssl rand -base64 32
```

### Validation at Startup

Aplikasi akan **FAIL** saat startup jika:
- JWT secret tidak ada
- JWT secret kurang dari 32 karakter
- JWT secret menggunakan default value

### Usage Example

```typescript
import { securityConfig, getJWTSecret } from '@/lib/config/security'

// Get validated config
const jwtSecret = getJWTSecret() // Returns Uint8Array

// Access other security settings
console.log(securityConfig.bcryptRounds) // 12
console.log(securityConfig.jwtExpirationTime) // "24h"
```

---

## Authentication & Authorization

### Middleware Protection

File `middleware.ts` di root project melindungi routes secara server-side:

**Protected Routes:**
- `/admin/*` - Admin dashboard dan pages
- `/api/admin/*` - Admin API endpoints

**Public Routes:**
- `/` - Landing page
- `/api/auth/*` - Authentication endpoints
- `/api/health` - Health check
- `/gallery/*` - Public gallery access

### Role-Based Access Control (RBAC)

```typescript
import { isAdmin, hasRole } from '@/lib/auth'

// Check if user is admin
if (isAdmin(user)) {
  // Admin-only logic
}

// Check specific role
if (hasRole(user, 'CLIENT')) {
  // Client logic
}
```

### Authentication Flow

1. User login → Validate credentials
2. Generate JWT token dengan user info
3. Set httpOnly cookie untuk web clients
4. Return token dalam response untuk API clients
5. Middleware validates token pada subsequent requests

---

## Input Validation & Sanitization

### Validation Schemas (Zod)

Semua API endpoints menggunakan Zod schemas:

```typescript
import { loginSchema, createEventSchema } from '@/lib/validation/schemas'

// Validate login input
const result = loginSchema.safeParse(body)
if (!result.success) {
  // Handle validation errors
}
```

### Available Schemas

- `loginSchema` - Email & password validation
- `registerSchema` - User registration
- `createEventSchema` - Event creation
- `createCommentSchema` - Comment submission
- `uploadPhotoSchema` - Photo upload

### Sanitization Functions

**Text Sanitization:**
```typescript
import { sanitizeText, sanitizeComment, sanitizeEmail } from '@/lib/security/sanitize'

// Remove all HTML
const cleanName = sanitizeText(userInput)

// Allow safe formatting (b, i, em, strong, br, p)
const cleanComment = sanitizeComment(commentInput)

// Clean and lowercase email
const cleanEmail = sanitizeEmail(emailInput)
```

**Filename Sanitization:**
```typescript
import { sanitizeFilename, sanitizeSlug } from '@/lib/security/sanitize'

// Remove path traversal dan dangerous characters
const safeFilename = sanitizeFilename(uploadedFilename)

// Create URL-safe slug
const slug = sanitizeSlug('My Event Name!') // "my-event-name"
```

### XSS Protection

- All user input di-sanitize sebelum disimpan
- HTML output di-escape saat render
- Content Security Policy (CSP) configured
- Safe HTML tags allowed untuk comments only

---

## Rate Limiting

### Redis-Based Rate Limiting

Menggunakan Redis sorted sets untuk sliding window rate limiting:

```typescript
import { rateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'

// Apply rate limiting
const result = await rateLimit(request, RateLimitPresets.AUTH)

// Rate limit automatically throws RateLimitError if exceeded
```

### Rate Limit Presets

| Endpoint Type | Limit | Window | Preset |
|--------------|-------|--------|--------|
| Auth (login) | 5 requests | 15 minutes | `AUTH` |
| API General | 100 requests | 1 minute | `API` |
| File Upload | 10 uploads | 5 minutes | `UPLOAD` |
| Comments | 5 comments | 1 minute | `COMMENT` |

### Custom Rate Limits

```typescript
import { checkRateLimit } from '@/lib/security/rate-limiter'

const result = await checkRateLimit('user-identifier', {
  windowMs: 60000, // 1 minute
  maxRequests: 50,
  keyPrefix: 'custom-limit',
})
```

### Rate Limit Headers

Responses include standard rate limit headers:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Unix timestamp when limit resets

---

## Error Handling

### Standardized Error Format

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "errors": ["validation error 1", "validation error 2"],
  "requestId": "req_1234567890_abc"
}
```

### Custom Error Classes

```typescript
import { 
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError 
} from '@/lib/errors/types'

// Throw custom error
throw new AuthenticationError('Invalid credentials')

// With context
throw new ValidationError('Invalid input', ['email: Invalid format'])
```

### Error Handler Wrapper

```typescript
import { asyncHandler } from '@/lib/errors/handler'

export const POST = asyncHandler(async (request) => {
  // Your handler logic
  // Errors are automatically caught dan formatted
})
```

### Production vs Development

- **Development:** Full error details dan stack traces
- **Production:** Sanitized error messages, no sensitive info

---

## Security Headers

### Applied Headers

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Custom | XSS protection |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| X-Content-Type-Options | nosniff | Prevent MIME sniffing |
| X-Frame-Options | DENY | Clickjacking protection |
| X-XSS-Protection | 1; mode=block | Legacy XSS protection |
| Referrer-Policy | strict-origin-when-cross-origin | Privacy |
| Permissions-Policy | Restrictive | Feature control |

### Usage

```typescript
import { applySecurityHeaders, createSecureResponse } from '@/lib/security/headers'

// Apply to existing response
const response = NextResponse.json(data)
return applySecurityHeaders(response)

// Create secure response
return createSecureResponse(data, 200)
```

### Content Security Policy

CSP di-configure untuk allow:
- Self-hosted scripts dan styles
- Cloudflare R2 untuk images
- WebSocket untuk Socket.IO
- Development: Hot reload support

---

## Password Security

### Password Requirements

- **Minimum Length:** 12 characters
- **Must Include:**
  - Uppercase letter (A-Z)
  - Lowercase letter (a-z)
  - Number (0-9)
  - Special character (!@#$%^&*)

### Password Validation

```typescript
import { validatePassword, checkPasswordStrength } from '@/lib/validation/password'

const result = validatePassword('UserPassword123!')

if (!result.isValid) {
  console.log(result.errors) // List of validation errors
  console.log(result.suggestions) // Improvement suggestions
}

console.log(result.strength) // WEAK, FAIR, GOOD, or STRONG
```

### Password Hashing

- **Algorithm:** bcrypt
- **Rounds:** 12 (configurable via `BCRYPT_ROUNDS`)
- **Salt:** Auto-generated per password

```typescript
import { hashPassword, verifyPassword } from '@/lib/auth'

// Hash password
const hash = await hashPassword('UserPassword123!')

// Verify password
const isValid = await verifyPassword('UserPassword123!', hash)
```

---

## Testing

### Security Tests

Run security-focused tests:

```bash
# All tests
npm test

# Security-specific tests
npm test -- __tests__/lib/security
npm test -- __tests__/lib/validation
```

### Test Coverage

- JWT validation
- Password strength validation
- Input sanitization (XSS prevention)
- Rate limiting logic
- Error handling
- Middleware route protection

### Manual Security Testing

**Test Rate Limiting:**
```bash
# Should be blocked after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done
```

**Test XSS Prevention:**
```bash
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"guestName":"<script>alert(\"xss\")</script>Test","message":"Hello"}'
```

---

## Security Checklist

### Before Deployment

- [ ] Generate strong JWT secret (32+ characters)
- [ ] Update all default credentials
- [ ] Enable HTTPS in production
- [ ] Configure CORS allowed origins
- [ ] Set up Redis for rate limiting
- [ ] Test all authentication flows
- [ ] Verify rate limiting works
- [ ] Check error handling doesn't leak info
- [ ] Review CSP configuration
- [ ] Test password validation
- [ ] Enable security headers
- [ ] Set up monitoring/logging

### Regular Maintenance

- [ ] Rotate JWT secrets every 90 days
- [ ] Review security logs monthly
- [ ] Update dependencies regularly
- [ ] Audit rate limit effectiveness
- [ ] Review failed login attempts
- [ ] Test security features after updates

---

## Security Incident Response

### If Breach Suspected

1. **Immediate:** Rotate all secrets (JWT, API keys)
2. **Investigate:** Check logs untuk suspicious activity
3. **Invalidate:** Force logout all users
4. **Notify:** Inform affected users
5. **Patch:** Fix vulnerability
6. **Document:** Record incident dan response

### Monitoring

Monitor for:
- Unusual failed login patterns
- Rate limit violations
- Suspicious API access patterns
- Unexpected error spikes

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)

---

## Questions?

Untuk pertanyaan security-related, silakan contact security team atau review dokumentasi di `docs/architecture/coding-standards.md`.
