# Analisis Sistem Error Handling dan Logging Hafiportrait

## Overview
Dokumen ini menganalisis secara menyeluruh sistem error handling dan logging dalam proyek Hafiportrait, termasuk isu silent failures, inconsistent error response, dan potensi information leakage.

## 1. Silent Failures dalam Error Handling

### Deskripsi Masalah
Banyak try-catch hanya melakukan logging ke console tanpa action recovery yang sesuai.

### Lokasi Kode
- `/server/socket-server.js` - Redis adapter fallback
- `/middleware.ts` - Auth checking
- Banyak API routes di `/app/api/*`

### Penyebab
```typescript
// Contoh dari socket server
try {
    io.adapter(createAdapter(pubClient, subClient));
} catch (error) {
    console.warn('⚠ Redis adapter setup failed, running without clustering:', error.message);
    return null; // Sistem tetap berjalan tapi dengan kapabilitas berkurang
}
```

### Dampak
- Sistem tetap berjalan dalam state tidak optimal
- Tidak ada notifikasi ke admin tentang critical failures
- Degraded functionality tanpa diketahui

### Solusi Rekomendasi
```typescript
// Implementasi error handling dengan state management
class ErrorHandler {
  private criticalErrors: Set<string> = new Set();
  
  async handleCriticalError(error: Error, context: string) {
    console.error(`CRITICAL ERROR in ${context}:`, error);
    
    // Log ke external monitoring service
    await this.logToMonitoring(error, context, 'critical');
    
    // Kirim notifikasi ke admin jika perlu
    if (this.isCriticalError(context)) {
      await this.sendAdminNotification(error, context);
    }
    
    // Tergantung pada error, bisa throw atau lanjut dengan fallback
    if (context === 'redis_connection' && process.env.NODE_ENV === 'production') {
      throw new Error('Critical Redis connection failed in production');
    }
  }
  
  private isCriticalError(context: string): boolean {
    return this.criticalErrors.has(context);
  }
}

// Gunakan di socket server
const setupRedisAdapter = async () => {
  try {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();
    
    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));
    
    console.log('✓ Redis adapter connected successfully');
    return { pubClient, subClient };
  } catch (error) {
    // Gunakan error handler untuk error kritis
    if (process.env.NODE_ENV === 'production') {
      await errorHandler.handleCriticalError(error, 'redis_connection');
    } else {
      console.warn('⚠ Redis adapter setup failed, running without clustering:', error.message);
    }
    
    return null;
  }
};
```

## 2. Inconsistent Error Response Format

### Deskripsi Masalah
Format error response tidak konsisten di seluruh API, tidak semua error memberikan user-friendly messages.

### Lokasi Kode
- Berbagai API routes di `/app/api/*`
- Error boundaries
- Client-side error handling

### Penyebab
- Tidak ada standard error response format
- Beberapa error internal ditampilkan ke user
- Tidak ada translation dari internal error ke user-friendly message

### Dampak
- Pengalaman user yang buruk
- Debugging yang sulit
- Potensi security information disclosure

### Solusi Rekomendasi
```typescript
// Standard error response format
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId?: string;
  };
  data?: never;
}

// Error response builder
class ErrorFormatter {
  static format(error: any, reqId?: string): ErrorResponse {
    // Log internal error untuk debugging
    console.error(`API Error [${reqId}]:`, error);
    
    // Tentukan error type dan format pesan yang user-friendly
    const errorInfo = this.determineErrorInfo(error);
    
    return {
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.userMessage,
        details: errorInfo.details,
        timestamp: new Date().toISOString(),
        requestId: reqId
      }
    };
  }
  
  private static determineErrorInfo(error: any) {
    // Mapping internal errors ke user-friendly errors
    if (error instanceof ValidationError) {
      return {
        code: 'VALIDATION_ERROR',
        userMessage: 'Input tidak valid. Silakan periksa kembali data yang dimasukkan.',
        details: error.details
      };
    } else if (error.message?.includes('P2002')) { // Prisma unique constraint
      return {
        code: 'DUPLICATE_ERROR',
        userMessage: 'Data sudah ada sebelumnya.',
        details: { field: this.extractFieldFromConstraint(error.message) }
      };
    } else if (error.code === 'ER_DUP_ENTRY') {
      return {
        code: 'DUPLICATE_ERROR',
        userMessage: 'Data sudah digunakan.',
        details: { field: this.extractFieldFromMysql(error.message) }
      };
    } else {
      // Untuk error internal, jangan tampilkan detail ke user
      return {
        code: 'INTERNAL_ERROR',
        userMessage: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
        details: process.env.NODE_ENV === 'development' ? { internal: error.message } : undefined
      };
    }
  }
  
  private static extractFieldFromConstraint(message: string) {
    // Extract field name dari constraint error
    const match = message.match(/Unique constraint failed on the fields: \(`(\w+)`\)/);
    return match ? match[1] : 'unknown';
  }
}

// Gunakan di API routes
export const POST = asyncHandler(async (request: NextRequest) => {
  try {
    // Logic disini
    
  } catch (error) {
    const reqId = request.headers.get('x-request-id') || crypto.randomUUID();
    return NextResponse.json(
      ErrorFormatter.format(error, reqId),
      { status: this.getHttpStatus(error) }
    );
  }
});
```

## 3. Logging Tanpa Context yang Cukup

### Deskripsi Masalah
Error hanya mencatat informasi dasar tanpa request context, user info, atau transaction info.

### Lokasi Kode
- `/middleware.ts` - Auth error logging
- `/lib/auth.ts` - Auth failure logging  
- Banyak API routes

### Penyebab
```typescript
// Contoh logging yang tidak cukup konteks
} catch (error) {
    console.error('Auth check failed:', error) // Tidak ada user atau request info
}
```

### Dampak
- Debugging yang sangat sulit
- Tidak bisa merekonstruksi kejadian
- Troubleshooting performance issues terhambat

### Solusi Rekomendasi
```typescript
// Context-aware logger
class ContextLogger {
  static logError(error: Error, context: {
    userId?: string;
    requestId: string;
    url: string;
    method: string;
    ip?: string;
    userAgent?: string;
    additional?: Record<string, any>;
  }) {
    const logEntry = {
      level: 'error',
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context: {
        userId: context.userId,
        requestId: context.requestId,
        url: context.url,
        method: context.method,
        ip: context.ip,
        userAgent: context.userAgent,
        additional: context.additional
      },
      type: error.constructor.name
    };
    
    // Log ke console untuk development
    if (process.env.NODE_ENV === 'development') {
      console.error('Detailed Error Log:', JSON.stringify(logEntry, null, 2));
    }
    
    // Kirim ke external logging service
    this.sendToExternalLogger(logEntry);
  }
  
  private static sendToExternalLogger(logEntry: any) {
    // Kirim ke external service seperti Sentry, LogRocket, dll
    if (process.env.LOGGING_SERVICE_URL) {
      fetch(process.env.LOGGING_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        console.error('Failed to send log to external service:', err);
      });
    }
  }
}

// Gunakan di middleware
export async function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  
  try {
    // Logic middleware
    const token = getTokenFromRequest(request);
    if (!token) {
      const context = {
        requestId,
        url: request.url,
        method: request.method,
        ip: request.headers.get('x-forwarded-for') || request.ip,
        userAgent: request.headers.get('user-agent')
      };
      
      ContextLogger.logError(
        new Error('No auth token found'), 
        context
      );
      
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    ContextLogger.logError(error, {
      requestId,
      url: request.url,
      method: request.method,
      ip: request.headers.get('x-forwarded-for') || request.ip,
      userAgent: request.headers.get('user-agent')
    });
    
    return NextResponse.error();
  }
}
```

## 4. Security Information Leakage

### Deskripsi Masalah
Beberapa error message mengungkapkan informasi internal sistem, dan error stack traces bisa terlihat di production.

### Lokasi Kode
- Banyak error responses
- Console logging di production
- Exception messages

### Penyebab
- Tidak ada sanitasi error message sebelum response
- Tidak ada environment-based logging
- Stack trace ditampilkan ke user

### Dampak
- Security vulnerability
- Information disclosure
- Potensi eksploitasi

### Solusi Rekomendasi
```typescript
// Secure error response
class SecureErrorFormatter {
  static format(error: any, environment: string): ErrorResponse {
    let safeMessage: string;
    let safeCode: string;
    let safeDetails: any;
    
    // Sanitasi error berdasarkan environment
    if (environment === 'production') {
      // Di production, sembunyikan detail internal
      safeCode = 'INTERNAL_ERROR';
      
      // Mapping internal error ke pesan aman
      if (error instanceof AuthenticationError) {
        safeMessage = 'Authentication failed';
        safeCode = 'AUTH_ERROR';
      } else if (error instanceof ValidationError) {
        safeMessage = 'Invalid input';
        safeCode = 'VALIDATION_ERROR';
        safeDetails = error.validationErrors; // Masih aman untuk validasi
      } else {
        // Error umum, tidak tampilkan detail
        safeMessage = 'An internal error occurred';
      }
    } else {
      // Di development, tampilkan lebih banyak detail
      safeMessage = error.message;
      safeCode = error.code || 'UNKNOWN_ERROR';
      safeDetails = {
        stack: error.stack,
        ...(error.cause && { cause: error.cause })
      };
    }
    
    return {
      success: false,
      error: {
        code: safeCode,
        message: safeMessage,
        details: safeDetails,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Middleware untuk sanitasi error
const secureErrorMiddleware = (error: Error, req: any, res: any, next: any) => {
  // Jangan tampilkan stack trace di production
  if (process.env.NODE_ENV === 'production') {
    delete error.stack;
  }
  
  // Sanitasi error properties sebelum response
  const safeError = SecureErrorFormatter.format(error, process.env.NODE_ENV);
  
  res.status(500).json(safeError);
};
```

## 5. Tidak Ada Error Recovery atau Retry Mechanism

### Deskripsi Masalah
Tidak ada retry mechanism untuk operasi database yang gagal, dan tidak ada fallback strategy.

### Lokasi Kode
- Database operations
- External API calls (S3, etc.)
- Email/SMS services

### Penyebab
- Tidak ada circuit breaker pattern
- Tidak ada retry logic dengan backoff
- Tidak ada fallback mechanism

### Dampak
- Single point of failure
- User experience terganggu
- Cascade failures

### Solusi Rekomendasi
```typescript
// Retry mechanism dengan exponential backoff
class RetryableOperation {
  static async execute<T>(
    operation: () => Promise<T>, 
    options: {
      maxRetries?: number;
      baseDelay?: number;
      factor?: number;
      exponential?: boolean;
      shouldRetry?: (error: Error) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      factor = 2,
      exponential = true,
      shouldRetry = () => true
    } = options;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !shouldRetry(error)) {
          break;
        }
        
        const delay = exponential 
          ? baseDelay * Math.pow(factor, attempt)
          : baseDelay * (attempt + 1);
          
        console.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`, error);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Circuit breaker implementation
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly timeout: number;
  
  constructor(options: { failureThreshold?: number; timeout?: number } = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
  }
  
  async call<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
    }
  }
}

// Gunakan dalam service
class PhotoService {
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    timeout: 30000
  });
  
  async uploadPhoto(photoData: any) {
    return await RetryableOperation.execute(
      () => this.circuitBreaker.call(() => this.performUpload(photoData)),
      {
        maxRetries: 3,
        shouldRetry: (error) => {
          // Hanya retry untuk network atau timeout errors
          return ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED'].includes(error.code) ||
                 error.message.includes('timeout') ||
                 error.message.includes('network');
        }
      }
    );
  }
  
  private async performUpload(photoData: any) {
    // Implementasi upload asli
    return await prisma.photos.create({ data: photoData });
  }
}
```

## 6. Tidak Ada Error Monitoring dan Alerting

### Deskripsi Masalah
Tidak ada sistem monitoring untuk mendeteksi dan memberi alert tentang error patterns.

### Lokasi Kode
- Keseluruhan sistem
- Tidak ada external monitoring integration

### Penyebab
- Tidak ada integrasi dengan error monitoring tools
- Tidak ada alerting mechanism
- Tidak ada error rate tracking

### Dampak
- Error tidak terdeteksi secara real-time
- Tidak bisa menganalisis error patterns
- Response time terhadap error tinggi

### Solusi Rekomendasi
```typescript
// Error monitoring service
class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private errorCounts: Map<string, { count: number; lastOccurrence: number }> = new Map();
  private alertThreshold = 10; // Alert jika error terjadi 10 kali per menit
  
  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }
  
  async recordError(error: Error, context: any = {}) {
    const errorKey = this.generateErrorKey(error, context);
    const now = Date.now();
    
    const current = this.errorCounts.get(errorKey) || { count: 0, lastOccurrence: now };
    current.count++;
    current.lastOccurrence = now;
    
    this.errorCounts.set(errorKey, current);
    
    // Cek apakah melewati threshold untuk alert
    if (current.count >= this.alertThreshold && (now - current.lastOccurrence) <= 60000) { // 1 menit
      await this.sendAlert(error, context, current.count);
    }
    
    // Bersihkan entries lama setiap 10 menit
    if (now % 600000 < 1000) { // Setiap 10 menit
      this.cleanupOldErrors();
    }
  }
  
  private generateErrorKey(error: Error, context: any): string {
    // Generate key unik untuk jenis error yang sama
    return `${error.constructor.name}_${error.message.substring(0, 100)}_${context.url || 'unknown'}`;
  }
  
  private async sendAlert(error: Error, context: any, count: number) {
    console.error(`ALERT: High error rate detected: ${count} occurrences in the last minute`);
    console.error('Error:', error.message);
    console.error('Context:', context);
    
    // Kirim alert ke external service (Sentry, Slack, etc.)
    if (process.env.ALERT_WEBHOOK_URL) {
      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `⚠️ High error rate: ${count} occurrences\nError: ${error.message}\nURL: ${context.url}`,
          attachments: [{
            color: 'danger',
            fields: [
              { title: 'Error Type', value: error.constructor.name },
              { title: 'URL', value: context.url },
              { title: 'Method', value: context.method }
            ]
          }]
        })
      }).catch(err => console.error('Failed to send alert:', err));
    }
  }
  
  private cleanupOldErrors() {
    const now = Date.now();
    for (const [key, data] of this.errorCounts.entries()) {
      if (now - data.lastOccurrence > 5 * 60 * 1000) { // 5 menit
        this.errorCounts.delete(key);
      }
    }
  }
}

// Integrasi dengan existing error handling
const monitorError = async (error: Error, context: any = {}) => {
  await ErrorMonitoringService.getInstance().recordError(error, context);
};
```

## 7. Tidak Ada Structured Logging

### Deskripsi Masalah
Tidak ada struktur logging yang konsisten di seluruh aplikasi, menggunakan console.log secara acak.

### Lokasi Kode
- Banyak file dan fungsi menggunakan console.log
- Tidak ada log level atau format standar

### Penyebab
- Tidak ada logging framework
- Tidak ada konvensi logging
- Mixed console.log, console.error, console.warn

### Dampak
- Log parsing dan analysis sulit
- Tidak bisa filter berdasarkan level
- Debugging production sulit

### Solusi Rekomendasi
```typescript
// Structured logger
enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
  stack?: string;
  environment: string;
}

class StructuredLogger {
  private static instance: StructuredLogger;
  private logLevel: LogLevel;
  
  static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }
  
  constructor() {
    this.logLevel = this.getLogLevelFromEnv();
  }
  
  debug(message: string, context?: any) {
    this.log(LogLevel.DEBUG, message, context);
  }
  
  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }
  
  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }
  
  error(message: string, context?: any, error?: Error) {
    this.log(LogLevel.ERROR, message, {
      ...context,
      error: {
        name: error?.name,
        message: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      }
    });
  }
  
  private log(level: LogLevel, message: string, context?: any) {
    if (this.shouldLog(level)) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
        environment: process.env.NODE_ENV || 'unknown'
      };
      
      // Output berdasarkan level
      switch (level) {
        case LogLevel.ERROR:
        case LogLevel.WARN:
          console.error(JSON.stringify(logEntry));
          break;
        case LogLevel.INFO:
          console.info(JSON.stringify(logEntry));
          break;
        case LogLevel.DEBUG:
          if (process.env.NODE_ENV === 'development') {
            console.debug(JSON.stringify(logEntry));
          }
          break;
      }
      
      // Kirim ke external service jika konfigurasi
      this.sendToExternalService(logEntry);
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }
  
  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }
  
  private sendToExternalService(logEntry: LogEntry) {
    // Kirim ke logging service seperti Winston, Bunyan, dll jika konfigurasi
    if (process.env.LOGGING_SERVICE_ENDPOINT) {
      // Implementasi kirim ke external service
    }
  }
}

// Gunakan di seluruh aplikasi
const logger = StructuredLogger.getInstance();

// Contoh penggunaan
export async function someServiceFunction() {
  logger.info('Starting service function', { function: 'someServiceFunction' });
  
  try {
    // Logic disini
    logger.debug('Processing data', { step: 1, data: 'sensitive_data_sanitized' });
    
  } catch (error) {
    logger.error('Service function failed', { function: 'someServiceFunction' }, error);
    throw error;
  }
}
```

## Rekomendasi Prioritas

**Prioritas Tinggi:**
1. Implementasi standard error response format
2. Tambahkan context-aware logging
3. Secure error information disclosure
4. Implementasi structured logging

**Prioritas Menengah:**
1. Tambahkan retry mechanism dan circuit breaker
2. Buat error monitoring dan alerting
3. Standardisasi error handling middleware
4. Tambahkan logging level management

**Prioritas Rendah:**
1. External logging service integration
2. Advanced error analytics
3. Performance error tracking
4. Log retention and archival