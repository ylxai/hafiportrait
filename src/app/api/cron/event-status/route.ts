// Cron Job for Automatic Event Status Management
import { NextRequest, NextResponse } from 'next/server';
import { EventAutoStatus } from '@/lib/event-auto-status';

// This endpoint will be called by Vercel Cron or external cron service
export async function GET(request: NextRequest) {
  try {
    // Verify cron authorization (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log('🔄 Starting automatic event status management...');
    
    // Run comprehensive status health check
    const healthCheckResult = await EventAutoStatus.performStatusHealthCheck();
    
    // Log results for monitoring
    console.log('✅ Auto status management completed:', {
      timestamp: healthCheckResult.timestamp,
      autoCompleted: healthCheckResult.autoComplete.processed,
      autoActivated: healthCheckResult.autoActivate.processed,
      archiveSuggestions: healthCheckResult.archiveSuggestions.length,
      errors: healthCheckResult.summary.errors.length
    });

    // Send notification if there are significant changes or errors
    if (healthCheckResult.summary.totalProcessed > 0 || healthCheckResult.summary.errors.length > 0) {
      // Here you could integrate with notification services like:
      // - Discord webhook
      // - Slack webhook  
      // - Email service
      // - Push notifications
      
      console.log('📢 Significant changes detected, notifications should be sent');
    }

    return NextResponse.json({
      success: true,
      message: "Automatic event status management completed",
      results: healthCheckResult,
      summary: {
        totalProcessed: healthCheckResult.summary.totalProcessed,
        suggestionsCount: healthCheckResult.archiveSuggestions.length,
        errorsCount: healthCheckResult.summary.errors.length,
        timestamp: healthCheckResult.timestamp
      }
    });

  } catch (error: any) {
    console.error('❌ Cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      message: "Automatic event status management failed",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST method for manual trigger (for testing)
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    let result;
    switch (action) {
      case 'health-check':
        result = await EventAutoStatus.performStatusHealthCheck();
        break;
      case 'auto-complete':
        result = await EventAutoStatus.autoCompleteExpiredEvents();
        break;
      case 'auto-activate':
        result = await EventAutoStatus.autoActivateTodayEvents();
        break;
      case 'suggest-archive':
        result = await EventAutoStatus.suggestArchiveForOldEvents();
        break;
      default:
        return NextResponse.json(
          { message: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Manual trigger failed:', error);
    
    return NextResponse.json({
      success: false,
      message: "Manual trigger failed",
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}