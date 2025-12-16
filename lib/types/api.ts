/**
 * API Response Type Definitions
 */

/**
 * Standard API Success Response
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    [key: string]: any
  }
}

/**
 * Standard API Error Response
 */
export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: any
    field?: string
  }
}

/**
 * Validation Error Response
 */
export interface ValidationErrorResponse {
  success: false
  error: {
    message: string
    code: 'VALIDATION_ERROR'
    details: Array<{
      field: string
      message: string
      code?: string
    }>
  }
}

/**
 * API Response Union Type
 */
export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse | ValidationErrorResponse
