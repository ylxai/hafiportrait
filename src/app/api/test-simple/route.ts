/**
 * Simple Test API Endpoint for Vercel Preview Debugging
 * GET /api/test-simple
 */

import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime and dynamic rendering to avoid any edge/runtime quirks
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer');
  
  console.log('Simple test API called from:', origin);
  console.log('Request URL:', request.url);
  console.log('Request method:', request.method);
  console.log('Environment:', process.env.NODE_ENV);
  
  try {
    const responseData = {
      success: true,
      message: 'Simple test API is working',
      timestamp: new Date().toISOString(),
      origin: origin,
      environment: process.env.NODE_ENV,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      env_vars: {
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        // Don't expose sensitive env vars
        HAS_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        HAS_SUPABASE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        HAS_JWT_SECRET: !!process.env.JWT_SECRET,
      }
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Simple test API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Simple test API failed',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      }
    });
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer');
  
  console.log('Simple test API POST called from:', origin);
  
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      body = { error: 'Failed to parse JSON' };
    }

    const responseData = {
      success: true,
      message: 'Simple test API POST is working',
      timestamp: new Date().toISOString(),
      origin: origin,
      environment: process.env.NODE_ENV,
      receivedData: body
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      }
    });

  } catch (error) {
    console.error('Simple test API POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Simple test API POST failed',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      }
    });
  }
}