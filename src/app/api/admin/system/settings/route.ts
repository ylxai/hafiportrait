import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for system monitor settings (in production, use database)
let systemSettings = {
  useRealtime: true,
  pollingInterval: 30000,
  alertThresholds: {
    cpu: 80,
    memory: 85,
    storage: 90
  },
  enableNotifications: true
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ...systemSettings
    });
  } catch (error) {
    console.error('Error getting system settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get system settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update system settings
    systemSettings = {
      ...systemSettings,
      ...body
    };

    console.log('✅ System monitor settings updated:', systemSettings);

    return NextResponse.json({
      success: true,
      message: 'System monitor settings updated successfully',
      ...systemSettings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}