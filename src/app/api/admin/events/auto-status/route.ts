import { NextRequest, NextResponse } from 'next/server';
import { EventAutoStatus } from '@/lib/event-auto-status';
import { database } from '@/lib/database';

// GET - Run status health check
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'health-check':
        const healthCheck = await EventAutoStatus.performStatusHealthCheck();
        return NextResponse.json(healthCheck);

      case 'suggest-archive':
        const suggestions = await EventAutoStatus.suggestArchiveForOldEvents();
        return NextResponse.json({ suggestions });

      case 'auto-complete':
        const autoComplete = await EventAutoStatus.autoCompleteExpiredEvents();
        return NextResponse.json(autoComplete);

      case 'auto-activate':
        const autoActivate = await EventAutoStatus.autoActivateTodayEvents();
        return NextResponse.json(autoActivate);

      default:
        return NextResponse.json(
          { message: "Invalid action. Use: health-check, suggest-archive, auto-complete, auto-activate" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auto status management error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: "Failed to perform auto status management", error: message },
      { status: 500 }
    );
  }
}

// POST - Execute specific auto actions
export async function POST(request: NextRequest) {
  try {
    const { action, eventIds } = await request.json();

    switch (action) {
      case 'bulk-archive':
        if (!eventIds || !Array.isArray(eventIds)) {
          return NextResponse.json(
            { message: "eventIds array is required for bulk-archive" },
            { status: 400 }
          );
        }

        const results = [];
        for (const eventId of eventIds) {
          try {
            const updatedEvent = await database.updateEventStatus(eventId, 'archived');
            results.push({
              eventId,
              status: 'success',
              event: updatedEvent
            });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            results.push({
              eventId,
              status: 'error',
              message: message
            });
          }
        }

        return NextResponse.json({
          message: "Bulk archive completed",
          results,
          summary: {
            total: eventIds.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length
          }
        });

      case 'run-all-auto':
        const fullHealthCheck = await EventAutoStatus.performStatusHealthCheck();
        return NextResponse.json({
          message: "All automatic status updates completed",
          results: fullHealthCheck
        });

      default:
        return NextResponse.json(
          { message: "Invalid action. Use: bulk-archive, run-all-auto" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auto status execution error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { message: "Failed to execute auto status action", error: message },
      { status: 500 }
    );
  }
}