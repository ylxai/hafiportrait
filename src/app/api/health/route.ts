/**
 * Health Check API Endpoint
 * GET /api/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsResponse, corsErrorResponse, handleOptions } from '@/lib/cors';

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
  return handleOptions(origin);
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
  
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      checks: {
        database: 'unknown',
        environment: 'unknown',
        api: 'healthy',
        security: 'unknown'
      }
    };

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => {
      const value = process.env[varName];
      return !value || value === 'hafiportrait-secret-key-change-in-production';
    });
    
    if (missingEnvVars.length > 0) {
      healthStatus.checks.environment = 'unhealthy';
      healthStatus.checks.database = 'unknown';
      healthStatus.checks.security = 'unhealthy';
      healthStatus.status = 'unhealthy';
      
      return corsResponse({
        ...healthStatus,
        error: `Missing environment variables: ${missingEnvVars.join(', ')}`
      }, 500, origin);
    } else {
      healthStatus.checks.environment = 'healthy';
    }

    // Check security configuration
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret !== 'hafiportrait-secret-key-change-in-production') {
      healthStatus.checks.security = 'healthy';
    } else {
      healthStatus.checks.security = 'unhealthy';
      healthStatus.status = 'unhealthy';
      
      return corsResponse({
        ...healthStatus,
        error: 'JWT_SECRET is not properly configured'
      }, 500, origin);
    }

    // Check database connection
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test database connection
      const { data, error } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .limit(1);

      if (error) {
        healthStatus.checks.database = 'unhealthy';
        healthStatus.status = 'unhealthy';
        
        return corsResponse({
          ...healthStatus,
          error: `Database connection failed: ${error.message}`
        }, 500, origin);
      } else {
        healthStatus.checks.database = 'healthy';
      }
    } catch (dbError) {
      healthStatus.checks.database = 'unhealthy';
      healthStatus.status = 'unhealthy';
      
      return corsResponse({
        ...healthStatus,
        error: `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`
      }, 500, origin);
    }

    // All checks passed
    return corsResponse(healthStatus, 200, origin);

  } catch (error) {
    console.error('Health check error:', error);
    
    return corsResponse({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: '1.0.0',
      error: 'Health check failed',
      checks: {
        database: 'unknown',
        environment: 'unknown',
        api: 'unhealthy',
        security: 'unknown'
      }
    }, 500, origin);
  }
}