/**
 * Security Module Barrel Export
 * Centralized exports untuk all security features
 */

// CSRF Protection
export {
  generateCSRFSecret,
  generateCSRFToken,
  validateCSRFToken,
  withCSRFProtection,
  generateCSRFTokenForClient,
  createCSRFProtectedResponse,
} from './csrf'

// Session Management
export {
  SESSION_CONFIG,
  generateSessionId,
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  setAuthCookies,
  clearAuthCookies,
  cleanupExpiredTokens,
} from './session'

// Gallery Sessions
export {
  GALLERY_SESSION_CONFIG,
  generateSecureToken,
  generateGuestToken,
  createGallerySession,
  validateGallerySession,
  invalidateGallerySession,
  invalidateEventSessions,
  getActiveEventSessions,
  cleanupExpiredGallerySessions,
  extendGallerySession,
} from './gallery-session'

// Rate Limiting
export {
  RATE_LIMITS,
  checkRateLimit,
  withRateLimit,
  addRateLimitHeaders,
  checkUploadBurst,
  releaseUploadBurst,
  clearRateLimit,
} from './rate-limit'

export type { RateLimitTier } from './rate-limit'

// Socket Authentication
export {
  verifySocketAuth,
  canAccessEventRoom,
  canInteractWithPhoto,
  canPerformAdminAction,
  hasSocketPermission,
  sanitizeSocketData,
  SOCKET_PERMISSIONS,
  SOCKET_RATE_LIMITS,
  createSocketAuthMiddleware,
} from './socket-auth'

export type { SocketAuthPayload, SocketEvent } from './socket-auth'

// Input Validation
export {
  emailSchema,
  phoneSchema,
  urlSchema,
  slugSchema,
  access_codeSchema,
  sanitizedTextSchema,
  richTextSchema,
  loginSchema,
  registerSchema,
  createEventSchema,
  updateEventSchema,
  accessEventSchema,
  uploadPhotoSchema,
  updatePhotoSchema,
  likePhotoSchema,
  createCommentSchema,
  moderateCommentSchema,
  contactFormSchema,
  formSubmissionSchema,
  createPackageSchema,
  updatePackageSchema,
  createPortfolioPhotoSchema,
  validateFileUpload,
  sanitizeHtml,
  sanitizeFilename,
  validateAndSanitizeInput,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_PER_UPLOAD,
} from './input-validation'

// Monitoring
export {
  logSecurityEvent,
  trackFailedLogin,
  clearFailedLogin,
  getSecurityStats,
} from './monitoring'

export type { SecurityEvent, SecurityEventType } from './monitoring'
