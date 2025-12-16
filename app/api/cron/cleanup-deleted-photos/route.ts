import { NextRequest, NextResponse } from 'next/server';
import { cleanupDeletedPhotos } from '@/lib/utils/photo-cleanup';

// GET - Cron job endpoint for automated cleanup
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Invalid cron secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Cleanup photos deleted > 30 days ago
    const stats = await cleanupDeletedPhotos(30);
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
