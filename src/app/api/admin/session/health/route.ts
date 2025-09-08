/**
 * Session Health API Endpoint
 * GET /api/admin/session/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionAnalytics } from '@/lib/session-analytics';
import { corsHeaders } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    // Get session health data
    const healthData = await SessionAnalytics.getSessionHealth();
    
    return NextResponse.json({
      success: true,
      ...healthData
    }, {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Session health API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get session health data',
      status: 'critical',
      issues: ['Unable to fetch session metrics'],
      metrics: {
        totalActiveSessions: 0,
        averageSessionDuration: 0,
        loginSuccessRate: 0,
        authFailureRate: 100,
        sessionsByTimeOfDay: {},
        deviceTypes: {},
        ipAddresses: [],
        lastActivity: new Date()
      }
    }, {
      status: 500,
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