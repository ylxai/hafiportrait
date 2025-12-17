/**
 * Enhanced Structured Logger
 * Comprehensive logging with error categorization and context
 */

import { 
  ApplicationError, 
  ErrorContext, 
  ErrorSeverity,
  isApiError,
  isValidationError,
  isAuthenticationError,
  isDatabaseError,
  isFileProcessingError,
  isStorageError,
  isNetworkError,
  isRateLimitError
} from '@/lib/types/errors'

/**
 * Helper functions for error categorization
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

function determineErrorSeverity(error: unknown): ErrorSeverity {
  if (isAuthenticationError(error) || isRateLimitError(error)) return 'high'
  if (isDatabaseError(error) || isStorageError(error)) return 'critical'
  if (isValidationError(error)) return 'medium'
  if (isNetworkError(error)) return 'medium'
  return 'low'
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Log Levels
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

/**
 * Log Entry Interface
 */
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  error?: unknown
  stack?: string
  requestId?: string
  user_id?: string
  component?: string
  action?: string
  category?: string
  severity?: ErrorSeverity
  sessionId?: string
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { timestamp, level, message, context, error, stack, ...metadata } = entry
  
  const levelName = LogLevel[level]
  const baseLog = `[${timestamp}] [${levelName}] ${message}`
  
  if (isDevelopment) {
    // Detailed logging for development
    const parts = [baseLog]
    
    if (Object.keys(metadata).length > 0) {
      parts.push(`Metadata: ${JSON.stringify(metadata, null, 2)}`)
    }
    
    if (context && Object.keys(context).length > 0) {
      parts.push(`Context: ${JSON.stringify(context, null, 2)}`)
    }
    
    if (error) {
      parts.push(`Error: ${error}`)
    }
    
    if (stack) {
      parts.push(`Stack: ${stack}`)
    }
    
    return parts.join('\n  ')
  } else {
    // Structured JSON logging for production
    return JSON.stringify({
      ...entry,
      level: levelName
    })
  }
}

/**
 * Enhanced Logger Class
 */
class EnhancedLogger {
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: Partial<LogEntry>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.generateRequestId(),
      ...context
    }
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (!isDevelopment) return
    
    const entry = this.createLogEntry(LogLevel.DEBUG, message, { context })
    console.debug(formatLogEntry(entry)) // eslint-disable-line no-console
  }

  /**
   * Info logging
   */
  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, { context })
    console.info(formatLogEntry(entry)) // eslint-disable-line no-console
  }

  /**
   * Warning logging
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, { context })
    console.warn(formatLogEntry(entry)) // eslint-disable-line no-console
  }

  /**
   * Error logging with enhanced context
   */
  error(
    message: string, 
    error?: unknown,
    context?: {
      user_id?: string
      component?: string
      action?: string
      metadata?: Record<string, unknown>
    }
  ): void {
    const category = error ? categorizeError(error) : 'unknown'
    const severity = error ? determineErrorSeverity(error) : 'medium'
    
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      category,
      severity,
      ...context
    })
    
    console.error(formatLogEntry(entry)) // eslint-disable-line no-console
    
    // In production, you might want to send to external logging service
    if (isProduction && severity === 'critical') {
      this.sendToExternalService(entry)
    }
  }

  /**
   * Critical error logging
   */
  critical(
    message: string, 
    error?: unknown,
    context?: {
      user_id?: string
      component?: string
      action?: string
      metadata?: Record<string, unknown>
    }
  ): void {
    const entry = this.createLogEntry(LogLevel.CRITICAL, message, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      category: error ? categorizeError(error) : 'unknown',
      severity: 'critical' as ErrorSeverity,
      ...context
    })
    
    console.error(formatLogEntry(entry)) // eslint-disable-line no-console
    
    // Always send critical errors to external service
    if (isProduction) {
      this.sendToExternalService(entry)
    }
  }

  /**
   * Structured error logging with full context
   */
  logError(errorContext: ErrorContext): void {
    const { error, severity, category, user_id, sessionId, component, action, metadata } = errorContext
    
    const entry = this.createLogEntry(
      severity === 'critical' ? LogLevel.CRITICAL : LogLevel.ERROR,
      error.message,
      {
        error: error.message,
        stack: error.stack,
        category,
        severity,
        user_id,
        sessionId,
        component,
        action,
        context: metadata
      }
    )
    
    console.error(formatLogEntry(entry)) // eslint-disable-line no-console
    
    if (isProduction && (severity === 'critical' || severity === 'high')) {
      this.sendToExternalService(entry)
    }
  }

  /**
   * API request logging
   */
  apiRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
    user_id?: string
  ): void {
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO
    
    const entry = this.createLogEntry(level, `API ${method} ${path}`, {
      context: {
        method,
        path,
        status,
        duration,
        user_id
      }
    })
    
    if (level === LogLevel.ERROR) {
      console.error(formatLogEntry(entry)) // eslint-disable-line no-console
    } else if (level === LogLevel.WARN) {
      console.warn(formatLogEntry(entry)) // eslint-disable-line no-console
    } else if (isDevelopment || status >= 400) {
      console.info(formatLogEntry(entry)) // eslint-disable-line no-console
    }
  }

  /**
   * Database operation logging
   */
  dbOperation(
    operation: string,
    table: string,
    duration: number,
    error?: unknown
  ): void {
    if (error) {
      this.error(`Database ${operation} failed on ${table}`, error, {
        component: 'database',
        action: operation,
        metadata: { table, duration }
      })
    } else if (isDevelopment) {
      this.debug(`Database ${operation} on ${table}`, {
        operation,
        table,
        duration
      })
    }
  }

  /**
   * Send to external logging service (placeholder)
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement integration with external logging service
    // Examples: Sentry, LogRocket, DataDog, CloudWatch, etc.
    console.error('CRITICAL ERROR - Would send to external service:', entry) // eslint-disable-line no-console
  }
}

/**
 * Global logger instance
 */
export const logger = new EnhancedLogger()

/**
 * Application error logging - Uses ApplicationError type
 */
export function logApplicationError(error: ApplicationError, context?: Record<string, any>): void {
  const errorContext: ErrorContext = {
    error,
    severity: 'medium', // Default severity for application errors
    category: error.code || 'application',
    component: context?.component || 'unknown',
    action: context?.action || 'unknown',
    user_id: context?.user_id,
    metadata: context
  }
  
  logger.logError(errorContext)
  
  // Additional handling based on error code
  if (error.code?.includes('CRITICAL') || error.message?.includes('critical')) {
    logger.critical(`Critical Application Error: ${error.code}`, error, context)
  }
}

/**
 * Legacy compatibility (deprecated - use logger.error instead)
 */
export const logError = (message: string, error?: unknown) => {
  logger.error(message, error)
}

export default logger
