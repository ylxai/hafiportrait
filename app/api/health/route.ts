import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { redis } from '@/lib/redis'

export async function GET() {
  try {
    const timestamp = new Date().toISOString()
    
    // Check database connection
    let dbStatus = 'unknown'
    try {
      await prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch (error) {
      dbStatus = 'disconnected'
      console.error('Database health check failed:', error)
    }

    // Check Redis connection
    let redisStatus = 'unknown'
    try {
      await redis.ping()
      redisStatus = 'connected'
    } catch (error) {
      redisStatus = 'disconnected'
      console.error('Redis health check failed:', error)
    }

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected'

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp,
        checks: {
          database: dbStatus,
          redis: redisStatus,
        },
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 500 }
    )
  }
}
