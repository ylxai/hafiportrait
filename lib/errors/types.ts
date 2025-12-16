/**
 * Error types dan custom error classes untuk aplikasi
 */

export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: Record<string, any>) {
    super(message, ErrorCode.UNAUTHORIZED, 401, true, context)
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
}

/**
 * Authorization error (insufficient permissions)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, ErrorCode.INSUFFICIENT_PERMISSIONS, 403, true, context)
    Object.setPrototypeOf(this, AuthorizationError.prototype)
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  public readonly errors: string[]

  constructor(message: string = 'Validation failed', errors: string[] = [], context?: Record<string, any>) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, true, context)
    this.errors = errors
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', context?: Record<string, any>) {
    super(message, ErrorCode.NOT_FOUND, 404, true, context)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

/**
 * Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists', context?: Record<string, any>) {
    super(message, ErrorCode.CONFLICT, 409, true, context)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends AppError {
  public readonly retryAfter?: number

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number, context?: Record<string, any>) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, context)
    this.retryAfter = retryAfter
    Object.setPrototypeOf(this, RateLimitError.prototype)
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, ErrorCode.DATABASE_ERROR, 500, false, context)
    Object.setPrototypeOf(this, DatabaseError.prototype)
  }
}
