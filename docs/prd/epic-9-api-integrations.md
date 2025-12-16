# Epic 9: API & External Integrations

**Epic Goal**: Create comprehensive REST API documentation dan endpoints untuk enable external application integration (mobile apps, third-party services), refine WhatsApp integration untuk broader notification scenarios, dan implement webhook system untuk real-time event notifications. Epic ini opens platform untuk ecosystem integrations dan custom client implementations.

---

## Story 9.1: REST API Architecture & Standards

**As a** developer integrating with platform,  
**I want** well-designed REST API dengan clear standards,  
**so that** integration is straightforward dan API behavior is predictable.

### Acceptance Criteria

1. API versioning: all endpoints prefixed dengan `/api/v1/` untuk future version management
2. RESTful principles: proper HTTP methods (GET/POST/PUT/DELETE), resource-based URLs
3. Consistent response format: all responses follow standard structure `{ success, data, error, meta }`
4. HTTP status codes: proper codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error)
5. Error response format: `{ success: false, error: { code, message, details } }`
6. Pagination standard: `{ data: [], meta: { page, per_page, total, total_pages } }`
7. Rate limiting headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
8. CORS configuration: proper CORS headers untuk cross-origin requests
9. Content-Type negotiation: supports JSON (default), optional XML atau form-data
10. Request ID tracking: unique `X-Request-ID` header untuk each request, included in responses
11. API health check: `/api/v1/health` endpoint returns API status dan version
12. Deprecation handling: deprecated endpoints return `Warning` header dengan sunset date

---

## Story 9.2: API Authentication & Authorization

**As an** API consumer,  
**I want** secure authentication mechanism untuk API access,  
**so that** data is protected dan I can authorize users appropriately.

### Acceptance Criteria

1. API key authentication: developers can generate API keys dalam admin dashboard
2. API keys management page: `/admin/settings/api-keys` untuk creating, viewing, revoking keys
3. API key format: secure random string (32+ characters), prefixed dengan `hfp_` (e.g., `hfp_abc123...`)
4. Key scopes: define permissions per key (read_events, write_events, read_photos, write_photos, etc.)
5. Authentication header: `Authorization: Bearer {api_key}` atau `X-API-Key: {api_key}`
6. JWT tokens: API also accepts JWT tokens dari regular authentication untuk user-specific operations
7. Rate limiting: API keys have configurable rate limits (default: 1000 requests/hour)
8. Key expiration: optional expiration date untuk temporary access
9. Key revocation: instant revocation, revoked keys return 401 Unauthorized
10. Usage tracking: track API calls per key untuk monitoring dan billing (future)
11. Test mode keys: separate test keys untuk sandbox environment
12. Key security: keys hashed dalam database, only shown once during creation
13. IP whitelist (optional): restrict API key usage to specific IP addresses
14. Webhook signatures: webhook payloads signed dengan secret untuk verification

---

## Story 9.3: Events API Endpoints

**As an** API consumer,  
**I want** complete CRUD operations untuk events via API,  
**so that** external applications can manage events programmatically.

### Acceptance Criteria

1. `GET /api/v1/events` - List all events dengan pagination, filtering, sorting
2. `GET /api/v1/events/:id` - Get single event details including photos count, settings, access codes
3. `POST /api/v1/events` - Create new event dengan all required fields
4. `PUT /api/v1/events/:id` - Update event information
5. `DELETE /api/v1/events/:id` - Delete event (soft delete) dengan cascade to photos
6. `GET /api/v1/events/:id/stats` - Get event statistics (views, downloads, engagement)
7. Query parameters: `?status=active`, `?sort=created_at:desc`, `?page=1&per_page=20`
8. Response includes: event object dengan all fields, photos array (optional expand), statistics
9. Authorization: requires API key dengan `read_events` atau `write_events` scope
10. Validation: comprehensive input validation dengan clear error messages
11. Filtering support: filter by status, date range, client, has_photos
12. Nested resources: support for expanding related data `?expand=photos,client`
13. Field selection: `?fields=id,name,slug,created_at` untuk reduce payload size
14. Search: `?search=wedding` searches event names dan client names

---

## Story 9.4: Photos API Endpoints

**As an** API consumer,  
**I want** to upload, retrieve, dan manage photos via API,  
**so that** external applications can integrate photo management workflows.

### Acceptance Criteria

1. `GET /api/v1/events/:event_id/photos` - List all photos untuk event dengan pagination
2. `GET /api/v1/photos/:id` - Get single photo details dengan URLs, metadata, stats
3. `POST /api/v1/events/:event_id/photos` - Upload single atau multiple photos
4. `DELETE /api/v1/photos/:id` - Delete photo (soft delete)
5. `PUT /api/v1/photos/:id` - Update photo metadata (caption, display_order, featured)
6. `GET /api/v1/photos/:id/download` - Get photo download URL (temporary signed URL)
7. Upload support: multipart/form-data untuk file uploads, accepts multiple files
8. Response includes: photo object dengan original_url, thumbnail_urls (all sizes), metadata
9. Batch operations: `POST /api/v1/photos/batch` accepts array of operations
10. Photo filtering: `?sort=created_at`, `?liked=true`, `?featured=true`
11. Thumbnail selection: `?thumbnail=medium` returns specific thumbnail size URL
12. Direct upload URLs: `POST /api/v1/photos/upload-url` returns pre-signed URL untuk direct S3 upload
13. Upload webhooks: trigger webhook when upload completes dan thumbnails generated
14. Metadata extraction: API returns EXIF data dari uploaded photos

---

## Story 9.5: Gallery Access API

**As a** mobile app developer,  
**I want** API endpoints untuk guest gallery access,  
**so that** I can build custom mobile app untuk viewing galleries.

### Acceptance Criteria

1. `POST /api/v1/gallery/:slug/access` - Validate access code dan return access token
2. `GET /api/v1/gallery/:slug/photos` - List gallery photos (requires valid access token)
3. `GET /api/v1/gallery/:slug/photo/:id` - Get single photo detail
4. `POST /api/v1/gallery/:slug/photo/:id/like` - Like photo
5. `DELETE /api/v1/gallery/:slug/photo/:id/like` - Unlike photo
6. `GET /api/v1/gallery/:slug/comments` - Get gallery comments
7. `POST /api/v1/gallery/:slug/comments` - Post new comment
8. `GET /api/v1/gallery/:slug/info` - Get gallery information (event name, date, settings)
9. Access token: JWT token returned after successful access validation
10. Token expiration: 30-day expiration, refresh mechanism provided
11. Anonymous tracking: API tracks analytics events dari API requests
12. Rate limiting: guest API calls rate limited per access token
13. Image URLs: returns CDN URLs untuk all thumbnail sizes
14. Pagination: supports cursor-based pagination untuk large photo sets
15. Real-time updates: optional long-polling endpoint untuk new photos/comments

---

## Story 9.6: API Documentation (OpenAPI/Swagger)

**As a** developer integrating with API,  
**I want** comprehensive interactive API documentation,  
**so that** I can quickly understand endpoints, test requests, dan implement integration.

### Acceptance Criteria

1. OpenAPI 3.0 specification file generated (`swagger.yaml` atau `openapi.json`)
2. Interactive documentation hosted at `/api/docs` using Swagger UI atau ReDoc
3. Documentation includes: all endpoints, request/response schemas, authentication methods, examples
4. Try-it-out functionality: developers can test API calls directly dari documentation
5. Code samples: automatic generation of code samples dalam multiple languages (JavaScript, Python, PHP, cURL)
6. Schema definitions: all data models documented dengan field types, constraints, descriptions
7. Authentication documentation: clear examples of how to authenticate requests
8. Error codes: comprehensive list of error codes dengan descriptions dan resolution steps
9. Rate limiting: documented limits dan best practices
10. Changelog: API changelog showing version history dan breaking changes
11. Postman collection: exportable Postman collection untuk easy testing
12. SDK documentation: if SDKs provided, link to SDK-specific documentation
13. Getting started guide: quick-start tutorial for common integration scenarios
14. Webhook documentation: how to receive dan verify webhook events

---

## Story 9.7: WhatsApp Integration Enhancement

**As an** admin/fotografer,  
**I want** comprehensive WhatsApp notification system,  
**so that** I stay informed about all critical platform events via my preferred communication channel.

### Acceptance Criteria

1. WhatsApp Business API integrated (Twilio, MessageBird, atau official WhatsApp Business API)
2. Admin settings: configure WhatsApp number, enable/disable per notification type
3. Notification types: New editing request, New comment (if moderation enabled), Event milestone (100 views, 50 downloads, etc.), System alerts (storage nearly full, etc.)
4. Message templates: pre-approved templates for each notification type (required for WhatsApp Business API)
5. Template variables: dynamic content (event name, client name, counts, etc.) inserted into templates
6. Rich messages: includes emojis, formatting (bold, italic), buttons dengan links where supported
7. Deep links: WhatsApp messages include direct links to relevant admin dashboard pages
8. Delivery status tracking: track sent, delivered, read status untuk each notification
9. Fallback mechanism: if WhatsApp delivery fails, fall back to SMS atau email
10. Opt-in/opt-out: clients can opt-in to receive WhatsApp notifications, easy opt-out mechanism
11. Rate limiting: respect WhatsApp rate limits, queue messages if needed
12. Sandbox mode: testing mode untuk development without sending actual messages
13. Cost tracking: monitor message volume untuk WhatsApp API usage costs
14. Multi-language support: notification templates available dalam Indonesian dan English

---

## Story 9.8: Webhook System Implementation

**As an** API consumer,  
**I want** webhook notifications untuk real-time events,  
**so that** my application can react immediately to platform events tanpa polling.

### Acceptance Criteria

1. Webhook configuration page: `/admin/settings/webhooks` untuk managing webhook endpoints
2. Webhook registration: add webhook URL, select event types to subscribe to, optional secret key
3. Event types: `event.created`, `event.updated`, `photo.uploaded`, `photo.liked`, `comment.posted`, `download.completed`, `editing_request.created`
4. Webhook payload: JSON format dengan event type, timestamp, data object, signature
5. Signature verification: HMAC-SHA256 signature dalam `X-Webhook-Signature` header
6. Retry mechanism: failed webhooks retry with exponential backoff (3 attempts: immediate, 5 min, 1 hour)
7. Webhook logs: track delivery status, response codes, retry attempts
8. Test webhook: "Send Test Event" button untuk verify endpoint configuration
9. Timeout: webhook requests timeout after 10 seconds
10. Status codes: only 200-299 responses considered successful
11. Payload examples: documentation shows sample payload untuk each event type
12. Webhook security: validate endpoint URL (must be HTTPS), reject localhost URLs in production
13. Event filtering: optional filters untuk reduce webhook noise (e.g., only photos dengan 10+ likes)
14. Webhook dashboard: shows delivery statistics, success rates, recent failures

---

## Story 9.9: Third-Party Integration Examples

**As a** platform administrator,  
**I want** pre-built integration examples untuk popular services,  
**so that** common integration scenarios are easier to implement.

### Acceptance Criteria

1. Integration marketplace page: `/admin/integrations` showcasing available integrations
2. Zapier integration: pre-built Zaps untuk connecting dengan 3000+ apps
3. Google Drive integration: auto-backup photos to Google Drive folder
4. Dropbox integration: sync event photos to Dropbox
5. Social media: share gallery link to Facebook, Instagram, Twitter
6. Email marketing: sync client emails to Mailchimp atau similar services
7. Calendar integration: add event dates to Google Calendar
8. Slack integration: send notifications to Slack channels
9. Mobile app example: React Native atau Flutter sample app using API
10. Integration documentation: step-by-step guides untuk each integration
11. OAuth support: OAuth 2.0 flow implemented untuk integrations requiring user authorization
12. Integration templates: starter code templates dalam GitHub repository
13. Community integrations: directory of community-built integrations
14. Integration analytics: track which integrations are most used

---

## Story 9.10: API Client SDKs

**As a** developer,  
**I want** official client libraries untuk popular languages,  
**so that** API integration is faster dan more reliable dengan type safety dan error handling.

### Acceptance Criteria

1. JavaScript/TypeScript SDK: npm package `@hafiportrait/sdk-js`
2. Python SDK: PyPI package `hafiportrait-sdk`
3. PHP SDK: Composer package `hafiportrait/sdk-php`
4. SDK features: authentication handling, automatic retries, error handling, rate limit awareness
5. Type definitions: TypeScript types atau Python type hints untuk all methods
6. Method coverage: SDK methods untuk all major API endpoints
7. Documentation: README dengan installation instructions, quick start, API reference
8. Code examples: comprehensive examples untuk common use cases
9. Error handling: SDK throws typed exceptions untuk different error scenarios
10. Async support: async/await support dalam JavaScript, asyncio dalam Python
11. Pagination helpers: built-in methods untuk handling paginated responses
12. File upload helpers: simplified methods untuk photo uploads dengan progress callbacks
13. Testing utilities: mock client untuk testing applications using SDK
14. Version compatibility: SDK version clearly indicates compatible API version
15. Changelog: SDK changelog tracks breaking changes dan new features

---

**Epic 9 Status**: Ready untuk Development  
**Estimated Effort**: 6-7 development days  
**Dependencies**: All previous epics (requires stable core functionality)  
**Success Metrics**: API documented dan functional, external apps can integrate successfully, webhooks deliver reliably, SDKs available dan easy to use
