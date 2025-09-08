import { NextRequest, NextResponse } from 'next/server';

// DSLR Service Control API
// Provides start/stop/restart functionality for DSLR service

interface ServiceControlRequest {
  action: 'start' | 'stop' | 'restart' | 'status';
}

// In-memory service state (for demo purposes)
let serviceState = {
  isRunning: false,
  startTime: null as string | null,
  processId: null as number | null,
  lastCommand: null as string | null
};

export async function POST(request: NextRequest) {
  try {
    const body: ServiceControlRequest = await request.json();
    const { action } = body;

    switch (action) {
      case 'start':
        if (serviceState.isRunning) {
          return NextResponse.json({
            success: false,
            message: 'DSLR service is already running',
            state: serviceState
          });
        }

        // Simulate starting service
        serviceState = {
          isRunning: true,
          startTime: new Date().toISOString(),
          processId: Math.floor(Math.random() * 10000) + 1000,
          lastCommand: 'start'
        };

        return NextResponse.json({
          success: true,
          message: 'DSLR service started successfully',
          state: serviceState
        });

      case 'stop':
        if (!serviceState.isRunning) {
          return NextResponse.json({
            success: false,
            message: 'DSLR service is not running',
            state: serviceState
          });
        }

        // Simulate stopping service
        serviceState = {
          isRunning: false,
          startTime: null,
          processId: null,
          lastCommand: 'stop'
        };

        return NextResponse.json({
          success: true,
          message: 'DSLR service stopped successfully',
          state: serviceState
        });

      case 'restart':
        // Simulate restart
        serviceState = {
          isRunning: true,
          startTime: new Date().toISOString(),
          processId: Math.floor(Math.random() * 10000) + 1000,
          lastCommand: 'restart'
        };

        return NextResponse.json({
          success: true,
          message: 'DSLR service restarted successfully',
          state: serviceState
        });

      case 'status':
        return NextResponse.json({
          success: true,
          message: 'Service status retrieved',
          state: serviceState
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: start, stop, restart, or status' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error controlling DSLR service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to control DSLR service' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'DSLR service control endpoint',
    state: serviceState,
    availableActions: ['start', 'stop', 'restart', 'status']
  });
}