import { NextRequest, NextResponse } from 'next/server';

/**
 * Register FCM token for push notifications
 * POST /api/notifications/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userAgent, timestamp, type = 'web' } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // In production, store in database
    // For now, we'll simulate the storage
    const deviceInfo = {
      id: generateDeviceId(token),
      token: token,
      userAgent: userAgent,
      type: type,
      registeredAt: timestamp || new Date().toISOString(),
      isActive: true,
      lastSeen: new Date().toISOString(),
      topics: ['general'], // Default topic
      preferences: {
        uploadSuccess: true,
        uploadFailed: true,
        cameraDisconnected: true,
        storageWarning: true,
        eventMilestone: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      }
    };

    // TODO: Store in database
    console.log('📱 Device registered:', deviceInfo);

    // Subscribe to default topics
    await subscribeToDefaultTopics(token);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: deviceInfo.id,
        topics: deviceInfo.topics,
        message: 'Device registered successfully'
      }
    });

  } catch (error) {
    console.error('❌ Error registering device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register device' },
      { status: 500 }
    );
  }
}

/**
 * Update FCM token registration
 * PUT /api/notifications/register
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, preferences, topics } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // TODO: Update in database
    console.log('🔄 Device updated:', { token, preferences, topics });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Device updated successfully'
      }
    });

  } catch (error) {
    console.error('❌ Error updating device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update device' },
      { status: 500 }
    );
  }
}

/**
 * Unregister device
 * DELETE /api/notifications/register
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // TODO: Remove from database
    console.log('🗑️ Device unregistered:', token);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Device unregistered successfully'
      }
    });

  } catch (error) {
    console.error('❌ Error unregistering device:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to unregister device' },
      { status: 500 }
    );
  }
}

// Utility functions

function generateDeviceId(token: string): string {
  // Generate a unique device ID based on token
  return `device_${token.substring(0, 16)}_${Date.now()}`;
}

async function subscribeToDefaultTopics(token: string): Promise<void> {
  try {
    // In production, use Firebase Admin SDK to subscribe to topics
    const defaultTopics = ['general', 'uploads', 'system'];
    
    for (const topic of defaultTopics) {
      // TODO: Use Firebase Admin SDK
      console.log(`📢 Subscribing ${token.substring(0, 16)}... to topic: ${topic}`);
    }
  } catch (error) {
    console.error('❌ Error subscribing to default topics:', error);
  }
}