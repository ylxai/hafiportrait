/**
 * Standardized API Response Helpers
 * Provides consistent response formats across all API endpoints
 */

import { NextResponse } from 'next/server'
import { ApiSuccessResponse, ApiErrorResponse, ValidationErrorResponse } from '@/lib/types/api'

/**
 * Create a standardized success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    [key: string]: any
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  }

  if (message) {
    response.message = message
  }

  if (meta) {
    response.meta = meta
  }

  return NextResponse.json(response)
}

/**
 * Create a standardized error response
 */
export function errorResponse(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any,
  field?: string
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      message,
      ...(code && { code }),
      ...(details && { details }),
      ...(field && { field }),
    },
  }

  return NextResponse.json(response, { status: statusCode })
}

/**
 * Create a standardized validation error response
 */
export function validationErrorResponse(
  errors: Array<{
    field: string
    message: string
    code?: string
  }>
): NextResponse<ValidationErrorResponse> {
  const response: ValidationErrorResponse = {
    success: false,
    error: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors,
    },
  }

  return NextResponse.json(response, { status: 400 })
}

/**
 * Common error responses
 */
export const commonErrors = {
  unauthorized: () => errorResponse('Unauthorized', 401, 'UNAUTHORIZED'),
  forbidden: () => errorResponse('Forbidden', 403, 'FORBIDDEN'),
  notFound: (resource: string = 'Resource') => 
    errorResponse(`${resource} not found`, 404, 'NOT_FOUND'),
  badRequest: (message: string = 'Bad request') => 
    errorResponse(message, 400, 'BAD_REQUEST'),
  serverError: (message: string = 'Internal server error') => 
    errorResponse(message, 500, 'SERVER_ERROR'),
  conflict: (message: string = 'Resource already exists') => 
    errorResponse(message, 409, 'CONFLICT'),
  tooManyRequests: () => 
    errorResponse('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'),
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: any): NextResponse<ValidationErrorResponse> {
  if (error.errors && Array.isArray(error.errors)) {
    const validationErrors = error.errors.map((err: any) => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))
    return validationErrorResponse(validationErrors)
  }
  
  return errorResponse('Validation failed', 400, 'VALIDATION_ERROR', error) as NextResponse<ValidationErrorResponse>
}

/**
 * Handle Prisma errors
 */
export function handlePrismaError(error: any): NextResponse<ApiErrorResponse> {
  // P2002: Unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field'
    return errorResponse(
      `${field} already exists`,
      409,
      'DUPLICATE_ENTRY',
      error.meta,
      field
    )
  }

  // P2025: Record not found
  if (error.code === 'P2025') {
    return errorResponse('Record not found', 404, 'NOT_FOUND')
  }

  // P2003: Foreign key constraint violation
  if (error.code === 'P2003') {
    return errorResponse(
      'Related record not found',
      400,
      'FOREIGN_KEY_VIOLATION',
      error.meta
    )
  }

  // Default Prisma error
  return errorResponse(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    process.env.NODE_ENV === 'development' ? error : undefined
  )
}

/**
 * Generic error handler
 */
export function handleError(error: unknown): NextResponse {
  console.error('API Error:', error)

  // Zod validation error
  if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
    return handleZodError(error)
  }

  // Prisma error
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && error.code.startsWith('P')) {
    return handlePrismaError(error)
  }

  // Standard Error object
  if (error instanceof Error) {
    return errorResponse(
      error.message || 'An unexpected error occurred',
      500,
      'SERVER_ERROR',
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined
    )
  }

  // Unknown error
  return errorResponse('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
}

/**
 * Direct export convenience functions
 */
export const unauthorizedResponse = () => commonErrors.unauthorized()
export const forbiddenResponse = () => commonErrors.forbidden()
export const notFoundResponse = (resource?: string) => commonErrors.notFound(resource)
