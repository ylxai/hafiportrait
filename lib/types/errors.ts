/**
 * Error Type Definitions
 * Comprehensive error interfaces for better error handling and type safety
 */

/**
 * Base Error Interface
 */
export interface BaseError {
  message: string
  code?: string
  timestamp?: string
  requestId?: string
  stack?: string
}

/**
 * API Error Types
 */
export interface ApiError extends BaseError {
  status: number
  endpoint?: string
  method?: string
  details?: Record<string, unknown>
}

export interface ValidationError extends BaseError {
  field?: string
  value?: unknown
  constraints?: string[]
}

export interface AuthenticationError extends BaseError {
  reason: 'invalid_credentials' | 'token_expired' | 'token_invalid' | 'unauthorized'
  user_id?: string
}

export interface AuthorizationError extends BaseError {
  requiredRole?: string
  currentRole?: string
  resource?: string
  action?: string
}

/**
 * Database Error Types
 */
export interface DatabaseError extends BaseError {
  operation: 'create' | 'read' | 'update' | 'delete'
  table?: string
  constraint?: string
  query?: string
}

export interface PrismaError extends DatabaseError {
  prismaCode?: string
  meta?: Record<string, unknown>
}

/**
 * File Processing Error Types
 */
export interface FileProcessingError extends BaseError {
  filename?: string
  file_size?: number
  mime_type?: string
  stage: 'upload' | 'validation' | 'processing' | 'storage' | 'cleanup'
}

export interface ImageProcessingError extends FileProcessingError {
  dimensions?: { width: number; height: number }
  format?: string
  operation?: 'resize' | 'compress' | 'convert' | 'metadata_extraction'
}

export interface StorageError extends BaseError {
  provider: 'r2' | 'local' | 'redis'
  operation: 'read' | 'write' | 'delete' | 'list'
  path?: string
  bucket?: string
}

/**
 * Network and External Service Errors
 */
export interface NetworkError extends BaseError {
  url?: string
  method?: string
  statusCode?: number
  response?: Record<string, unknown>
  timeout?: boolean
}

export interface ExternalServiceError extends BaseError {
  service: 'whatsapp' | 'email' | 'sms' | 'analytics' | 'cdn'
  operation?: string
  serviceResponse?: Record<string, unknown>
}

/**
 * Business Logic Error Types
 */
export interface BusinessLogicError extends BaseError {
  type: 'invalid_state' | 'business_rule_violation' | 'quota_exceeded' | 'resource_not_found'
  resource?: string
  currentState?: string
  expectedState?: string
}

export interface EventError extends BusinessLogicError {
  event_id?: string
  eventSlug?: string
  access_code?: string
}

export interface PhotoError extends BusinessLogicError {
  photo_id?: string
  event_id?: string
  filename?: string
}

/**
 * Rate Limiting and Security Errors
 */
export interface RateLimitError extends BaseError {
  limit: number
  windowMs: number
  remaining: number
  resetTime: Date
  client_id?: string
}

export interface SecurityError extends BaseError {
  type: 'csrf' | 'injection' | 'malicious_upload' | 'suspicious_activity'
  clientIp?: string
  userAgent?: string
  details?: Record<string, unknown>
}

/**
 * Cron Job and Background Task Errors
 */
export interface CronJobError extends BaseError {
  jobName: string
  scheduled: Date
  executed: Date
  duration?: number
  retries?: number
}

/**
 * Error Union Types
 */
export type ApplicationError = 
  | ApiError
  | ValidationError
  | AuthenticationError
  | AuthorizationError
  | DatabaseError
  | PrismaError
  | FileProcessingError
  | ImageProcessingError
  | StorageError
  | NetworkError
  | ExternalServiceError
  | BusinessLogicError
  | EventError
  | PhotoError
  | RateLimitError
  | SecurityError
  | CronJobError

/**
 * Error Severity Levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Error Context Interface
 */
export interface ErrorContext {
  error: ApplicationError
  severity: ErrorSeverity
  category: string
  user_id?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, unknown>
}

/**
 * Error Handler Response
 */
export interface ErrorHandlerResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: Record<string, unknown>
  }
  timestamp: string
  requestId?: string
}

/**
 * Error Recovery Strategies
 */
export type ErrorRecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'user_action_required'
  | 'ignore'
  | 'escalate'

export interface ErrorRecoveryConfig {
  strategy: ErrorRecoveryStrategy
  maxRetries?: number
  retryDelay?: number
  fallbackValue?: unknown
  userMessage?: string
}

/**
 * Type Guards for Error Types
 */
export function isApiError(error: unknown): error is ApiError {
  return typeof error === 'object' && error !== null && 'status' in error
}

export function isValidationError(error: unknown): error is ValidationError {
  return typeof error === 'object' && error !== null && 'field' in error
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return typeof error === 'object' && error !== null && 'reason' in error
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return typeof error === 'object' && error !== null && 'operation' in error
}

export function isFileProcessingError(error: unknown): error is FileProcessingError {
  return typeof error === 'object' && error !== null && 'stage' in error
}

export function isStorageError(error: unknown): error is StorageError {
  return typeof error === 'object' && error !== null && 'provider' in error
}

export function isNetworkError(error: unknown): error is NetworkError {
  return typeof error === 'object' && error !== null && 'url' in error
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return typeof error === 'object' && error !== null && 'limit' in error && 'windowMs' in error
}