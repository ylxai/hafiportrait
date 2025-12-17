import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError, ValidationError, RateLimitError, ErrorCode } from './types'
import { Prisma } from '@prisma/client'
import {
  ErrorHandlerResponse,
  ErrorSeverity,
  isApiError,
  isValidationError,
  isAuthenticationError,
  isDatabaseError,
  isFileProcessingError,
  isStorageError,
  isNetworkError,
  isRateLimitError,
} from '@/lib/types/errors'

/**
 * Standard error response format (using new interface)
 */
type ErrorResponse = ErrorHandlerResponse

/**
 * Determine error severity based on error type
 */
function determineErrorSeverity(error: unknown): ErrorSeverity {
  if (isAuthenticationError(error) || isRateLimitError(error)) return 'high'
  if (isDatabaseError(error) || isStorageError(error)) return 'critical'
  if (isValidationError(error)) return 'medium'
  if (isNetworkError(error)) return 'medium'
  return 'low'
}

/**
 * Categorize error for logging and monitoring
 */
function categorizeError(error: unknown): string {
  if (isApiError(error)) return 'api'
  if (isAuthenticationError(error)) return 'auth'
  if (isDatabaseError(error)) return 'database'
  if (isFileProcessingError(error)) return 'file_processing'
  if (isStorageError(error)) return 'storage'
  if (isNetworkError(error)) return 'network'
  if (isValidationError(error)) return 'validation'
  if (isRateLimitError(error)) return 'rate_limit'
  return 'unknown'
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

/**
 * Log error dengan context
 */
function logError(error: Error, context?: Record<string, any>): void {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const timestamp = new Date().toISOString()

  if (isDevelopment) {
    console.error('\n❌ Error occurred:', {
      timestamp,
      message: error.message,
      stack: error.stack,
      context,
    })
  } else {
    // Production: log minimal info
    console.error('Error:', {
      timestamp,
      message: error.message,
      name: error.name,
      ...(context && { context }),
    })
  }
}

/**
 * Handle AppError instances
 */
function handleAppError(
  error: AppError,
  requestId: string
): NextResponse<ErrorResponse> {
  const severity = determineErrorSeverity(error)
  const category = categorizeError(error)

  logError(error, {
    requestId,
    code: error.code,
    severity,
    category,
    ...error.context,
  })

  const response: ErrorResponse = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
    },
    timestamp: new Date().toISOString(),
    requestId,
  }

  // Add validation errors jika ada
  if (error instanceof ValidationError && error.errors.length > 0) {
    response.error.details = { validationErrors: error.errors }
  }

  const nextResponse = NextResponse.json(response, { status: error.statusCode })

  // Add rate limit headers jika rate limit error
  if (error instanceof RateLimitError && error.retryAfter) {
    nextResponse.headers.set('Retry-After', error.retryAfter.toString())
    nextResponse.headers.set('X-RateLimit-Reset', error.retryAfter.toString())
  }

  return nextResponse
}

/**
 * Handle Zod validation errors
 */
function handleZodError(
  error: ZodError,
  requestId: string
): NextResponse<ErrorResponse> {
  const errors = error.errors.map((err) => {
    const path = err.path.join('.')
    return path ? `${path}: ${err.message}` : err.message
  })

  logError(error, { requestId, validationErrors: errors })

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'Validation failed',
        code: ErrorCode.VALIDATION_ERROR,
        details: { validationErrors: errors },
      },
      timestamp: new Date().toISOString(),
      requestId,
    },
    { status: 400 }
  )
}
/**
 * Handle Prisma errors
 */
function handlePrismaError(
  error: Error,
  requestId: string
): NextResponse<ErrorResponse> {
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Prisma unique constraint violation
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'field'
      logError(error, { requestId, prismaCode: error.code })

      return NextResponse.json(
        {
          success: false,
          error: {
            message: `A record with this ${field} already exists`,
            code: ErrorCode.CONFLICT,
          },
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 409 }
      )
    }
    // Record not found
    if (error.code === 'P2025') {
      logError(error, { requestId, prismaCode: error.code })

      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Record not found',
            code: ErrorCode.NOT_FOUND,
          },
          timestamp: new Date().toISOString(),
          requestId,
        },
        { status: 404 }
      )
    }
  }
  // Generic Prisma error
  logError(error, { requestId, type: 'PrismaError' })

  return NextResponse.json(
    {
      success: false,
      error: {
        message: isDevelopment ? error.message : 'Database operation failed',
        code: ErrorCode.DATABASE_ERROR,
      },
      timestamp: new Date().toISOString(),
      requestId,
    },
    { status: 500 }
  )
}
/**
 * Main error handler
 * Converts errors to standardized NextResponse
 */
export function handleError(
  error: unknown,
  context?: Record<string, any>
): NextResponse<ErrorResponse> {
  const requestId = generateRequestId()
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Handle AppError
  if (error instanceof AppError) {
    return handleAppError(error, requestId)
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return handleZodError(error, requestId)
  }

  // Handle Prisma errors
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientValidationError
  ) {
    return handlePrismaError(error as Error, requestId)
  }

  // Handle standard Error
  if (error instanceof Error) {
    logError(error, { requestId, ...context })

    return NextResponse.json(
      {
        success: false,
        error: {
          message: isDevelopment ? error.message : 'An unexpected error occurred',
          code: ErrorCode.INTERNAL_ERROR,
        },
        timestamp: new Date().toISOString(),
        requestId,
      },
      { status: 500 }
    )
  }
  // Handle unknown errors
  console.error('Unknown error type:', error)

  return NextResponse.json(
    {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: ErrorCode.INTERNAL_ERROR,
      },
      timestamp: new Date().toISOString(),
      requestId,
    },
    { status: 500 }
  )
}
/**
 * Async handler wrapper untuk API routes
 * Automatically catches dan handles errors
 * Supports both Request and NextRequest
 */
export function asyncHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleError(error)
    }
  }
}

/**
 * Success response helper
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
    },
    { status }
  )
}
