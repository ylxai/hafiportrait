/**
 * Session Events API Endpoint
 * GET /api/admin/session/events - Get recent session events
 * POST /api/admin/session/events - Log new session event
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionAnalytics } from '@/lib/session-analytics';
import { corsHeaders } from '@/lib/cors';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('type');
    
    let query = supabase
      .from('session_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    
    const { data: events, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      events: events || [],
      pagination: {
        limit,
        offset,
        total: events?.length || 0
      }
    }, {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Session events API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch session events'
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip session logging in development or if disabled
    if (process.env.NODE_ENV === 'development' || process.env.DISABLE_SESSION_LOGGING === 'true') {
      return NextResponse.json({
        success: true,
        message: 'Session event logging disabled in development'
      }, {
        status: 200,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const { session_id, user_id, event_type, metadata } = body;
    
    // Validate required fields (be lenient in production to avoid UI failures)
    if (!session_id || !user_id || !event_type) {
      return NextResponse.json({
        success: true,
        message: 'Session event ignored (missing fields)',
      }, {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Get client info
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1';
    const user_agent = request.headers.get('user-agent') || 'Unknown';
    
    // Log the session event (will handle errors gracefully)
    await SessionAnalytics.logSessionEvent({
      session_id,
      user_id,
      event_type,
      ip_address,
      user_agent,
      metadata
    });
    
    return NextResponse.json({
      success: true,
      message: 'Session event logged successfully'
    }, {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Session event logging error:', error);
    }
    
    // Return success to prevent client-side errors
    return NextResponse.json({
      success: true,
      message: 'Session event processed'
    }, {
      status: 200,
      headers: corsHeaders
    });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders
  });
}