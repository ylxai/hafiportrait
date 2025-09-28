import { NextRequest, NextResponse } from 'next/server';

// Error reporting endpoint for admin components
export async function POST(request: NextRequest) {
  try {
    const errorReport = await request.json();
    
    // Log error with timestamp and context
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'admin_component_error',
      ...errorReport,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    };
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Admin Component Error Report');
      console.error('Component:', logEntry.context?.component);
      console.error('Error:', logEntry.error?.message);
      console.error('Stack:', logEntry.error?.stack);
      console.error('Context:', logEntry.context);
      console.error('User Agent:', logEntry.userAgent);
      console.groupEnd();
    }
    
    // In production, you would send this to your error tracking service
    // Examples: Sentry, LogRocket, Bugsnag, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: await sendToSentry(logEntry);
      // Example: await sendToLogRocket(logEntry);
      console.error('Production Error:', logEntry);
    }
    
    // Store in simple in-memory log (in production, use database)
    const globalThis = global as any;
    if (!globalThis.errorLogs) {
      globalThis.errorLogs = [];
    }
    globalThis.errorLogs.push(logEntry);
    
    // Keep only last 100 errors
    if (globalThis.errorLogs.length > 100) {
      globalThis.errorLogs = globalThis.errorLogs.slice(-100);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Error report received',
      errorId: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
    
  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

// Get error logs (for debugging)
export async function GET() {
  try {
    const globalThis = global as any;
    const logs = globalThis.errorLogs || [];
    
    return NextResponse.json({
      success: true,
      count: logs.length,
      errors: logs.slice(-20) // Return last 20 errors
    });
    
  } catch (error) {
    console.error('Failed to get error logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get error logs' },
      { status: 500 }
    );
  }
}