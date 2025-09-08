import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for notification settings (in production, use database)
let notificationSettings = {
  uploadSuccess: true,
  uploadFailed: true,
  cameraDisconnected: true,
  storageWarning: true,
  eventMilestone: true,
  clientNotifications: true,
  soundEnabled: true,
  vibrationEnabled: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      ...notificationSettings
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Update notification settings
    notificationSettings = {
      ...notificationSettings,
      ...body
    };

    console.log('✅ Notification settings updated:', notificationSettings);

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      ...notificationSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}