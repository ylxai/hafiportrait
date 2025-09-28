/**
 * CORS Utility for API Routes
 * Handles Cross-Origin Resource Sharing headers for all environments
 */

import { NextResponse } from 'next/server';

// Get allowed origins based on environment
function getAllowedOrigins(): string[] {
  const origins = [
    // Production domains
    'https://hafiportrait.photography',
    'https://www.hafiportrait.photography',
    'https://hafiportrait.vercel.app',
    'https://hafiportrait-git-main.vercel.app',
    'https://hafiportrait-git-develop.vercel.app',
    
    // Development domains (only in development)
    ...(process.env.NODE_ENV === 'development' ? [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://147.251.255.227:3000',
      'http://147.251.255.227:3001',
    ] : []),
    
    // Vercel preview domains
    'https://*.vercel.app',
    'https://*.vercel.app/*',
    
    // Additional production domains
    'https://hafiportrait.com',
    'https://www.hafiportrait.com',
  ];

  // Add environment-specific origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:*');
    origins.push('http://127.0.0.1:*');
  }

  // Add custom domains from environment variables
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  if (process.env.ALLOWED_ORIGINS) {
    const customOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...customOrigins);
  }

  return origins;
}

// Check if origin is allowed
function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = getAllowedOrigins();
  
  // For production with VPS, allow domain and localhost
  if (process.env.NODE_ENV === 'production') {
    // Allow production domain and localhost for internal requests
    if (origin === 'https://hafiportrait.photography' || 
        origin === 'https://www.hafiportrait.photography' ||
        !origin || // Allow requests without origin (server-to-server)
        origin.includes('localhost') || 
        origin.includes('127.0.0.1')) {
      return true;
    }
  }
  
  // Allow all origins in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns
  return allowedOrigins.some(allowedOrigin => {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }
    return false;
  });
}

export function corsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-API-Key, X-User-ID, X-User-Username, X-User-Role',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Set Access-Control-Allow-Origin
  if (!origin || isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin || '*';
  } else {
    // Fallback to first allowed origin
    const allowedOrigins = getAllowedOrigins();
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0] || '*';
  }

  return headers;
}

export function handleCors(response: NextResponse, origin?: string) {
  const headers = corsHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function corsResponse(data: any, status: number = 200, origin?: string) {
  const response = NextResponse.json(data, { status });
  return handleCors(response, origin);
}

export function corsErrorResponse(error: string, status: number = 500, origin?: string) {
  const response = NextResponse.json({ 
    error,
    timestamp: new Date().toISOString(),
    path: '/api/auth/login'
  }, { status });
  return handleCors(response, origin);
}

// Handle OPTIONS preflight requests
export function handleOptions(origin?: string) {
  const response = new NextResponse(null, { status: 200 });
  return handleCors(response, origin);
}

// Enhanced CORS middleware for API routes
export function withCors(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions(origin);
    }

    // Call the original handler
    const response = await handler(request, ...args);
    
    // Add CORS headers to the response
    return handleCors(response, origin);
  };
}