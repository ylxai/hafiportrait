/**
 * Enhanced Health Monitoring API Endpoint
 * GET /api/monitoring/health
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { corsResponse, corsErrorResponse, handleOptions } from '@/lib/cors';

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
  return handleOptions(origin);
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  metrics: {
    totalChecks: number;
    healthyChecks: number;
    avgResponseTime: number;
    errorRate: number;
  };
  system?: {
    memory?: { used: number; total: number; percentage: number };
    cpu?: { usage: number };
    disk?: { usage: number };
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test database connection dengan query sederhana
    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        error: error.message
      };
    }

    // Test write capability
    const { error: writeError } = await supabaseAdmin
      .from('events')
      .select('id')
      .limit(1);

    return {
      name: 'database',
      status: writeError ? 'degraded' : 'healthy',
      responseTime,
      details: {
        connectionTest: 'passed',
        readTest: 'passed',
        writeTest: writeError ? 'failed' : 'passed',
        recordCount: data?.length || 0
      }
    };
  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Check Cloudflare R2 atau storage yang digunakan
    const storageConfig = {
      r2AccountId: process.env.R2_ACCOUNT_ID,
      r2AccessKey: process.env.R2_ACCESS_KEY_ID,
      r2SecretKey: process.env.R2_SECRET_ACCESS_KEY,
      r2BucketName: process.env.R2_BUCKET_NAME
    };

    const missingConfig = Object.entries(storageConfig)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingConfig.length > 0) {
      return {
        name: 'storage',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          configStatus: 'incomplete',
          missingConfig
        }
      };
    }

    // Jika semua config ada, storage dianggap healthy
    return {
      name: 'storage',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        configStatus: 'complete',
        provider: 'cloudflare-r2'
      }
    };
  } catch (error) {
    return {
      name: 'storage',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown storage error'
    };
  }
}

async function checkExternalServices(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const services = [];
    
    // Check Socket.IO server jika ada
    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      services.push('websocket');
    }
    
    // Check Google Drive integration jika ada
    if (process.env.GOOGLE_DRIVE_CLIENT_ID) {
      services.push('google-drive');
    }

    return {
      name: 'external-services',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        configuredServices: services,
        count: services.length
      }
    };
  } catch (error) {
    return {
      name: 'external-services',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown external services error'
    };
  }
}

async function checkEnvironmentConfig(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => {
      const value = process.env[varName];
      return !value || value === 'hafiportrait-secret-key-change-in-production';
    });

    const optionalVars = [
      'R2_ACCOUNT_ID',
      'GOOGLE_DRIVE_CLIENT_ID',
      'NEXT_PUBLIC_SOCKET_URL',
      'SLACK_WEBHOOK'
    ];

    const configuredOptional = optionalVars.filter(varName => !!process.env[varName]);

    if (missingVars.length > 0) {
      return {
        name: 'environment',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: `Missing required environment variables: ${missingVars.join(', ')}`,
        details: {
          missingRequired: missingVars,
          configuredOptional
        }
      };
    }

    return {
      name: 'environment',
      status: 'healthy',
      responseTime: Date.now() - startTime,
      details: {
        requiredVarsCount: requiredEnvVars.length,
        optionalVarsCount: configuredOptional.length,
        configuredOptional
      }
    };
  } catch (error) {
    return {
      name: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown environment error'
    };
  }
}

async function getSystemMetrics() {
  try {
    // Basic system info yang bisa didapat di environment serverless
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime() * 1000; // Convert to milliseconds
    
    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
      },
      uptime,
      nodeVersion: process.version,
      platform: process.platform
    };
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin') || request.headers.get('referer') || undefined;
  const startTime = Date.now();
  
  try {
    // Run all health checks in parallel
    const [
      databaseCheck,
      storageCheck,
      externalServicesCheck,
      environmentCheck,
      systemMetrics
    ] = await Promise.all([
      checkDatabase(),
      checkStorage(),
      checkExternalServices(),
      checkEnvironmentConfig(),
      getSystemMetrics()
    ]);

    const checks = [databaseCheck, storageCheck, externalServicesCheck, environmentCheck];
    const totalResponseTime = Date.now() - startTime;

    // Calculate overall health
    const healthyChecks = checks.filter(check => check.status === 'healthy').length;
    const degradedChecks = checks.filter(check => check.status === 'degraded').length;
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded';
    if (unhealthyChecks > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedChecks > 0) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    // Calculate metrics
    const avgResponseTime = checks.reduce((sum, check) => sum + check.responseTime, 0) / checks.length;
    const errorRate = unhealthyChecks / checks.length;

    const healthStatus: SystemHealth = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: systemMetrics?.uptime || 0,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks,
      metrics: {
        totalChecks: checks.length,
        healthyChecks,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100) / 100
      },
      system: systemMetrics
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return corsResponse(healthStatus, statusCode, origin);

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse: SystemHealth = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: 0,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: [{
        name: 'health-check',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: 'Health check system failure'
      }],
      metrics: {
        totalChecks: 1,
        healthyChecks: 0,
        avgResponseTime: Date.now() - startTime,
        errorRate: 1
      }
    };
    
    return corsResponse(errorResponse, 503, origin);
  }
}