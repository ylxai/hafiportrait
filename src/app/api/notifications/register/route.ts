import { NextRequest, NextResponse } from 'next/server';

/**
 * Register device for WebSocket/Socket.IO notifications
 * POST /api/notifications/register
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, userAgent, timestamp, type = 'web' } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Device token is required for WebSocket/Socket.IO notifications' },
        { status: 400 }
      );
    }

    // Store device info for WebSocket/Socket.IO notifications
    // In production, store in database with session management
    const deviceInfo = {
      id: generateDeviceId(token),
      sessionToken: token, // WebSocket/Socket.IO session identifier
      userAgent: userAgent,
      connectionType: type, // 'web', 'mobile', 'desktop'
      registeredAt: timestamp || new Date().toISOString(),
      isActive: true,
      lastSeen: new Date().toISOString(),
      subscribedRooms: ['general', 'uploads', 'system'], // WebSocket/Socket.IO rooms
      notificationPreferences: {
        uploadSuccess: true,
        uploadFailed: true,
        cameraDisconnected: true,
        storageWarning: true,
        eventMilestone: true,
        realTimeUpdates: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      },
      connectionSettings: {
        useSocketIO: process.env.NEXT_PUBLIC_USE_SOCKETIO === 'true',
        autoReconnect: true,
        heartbeatInterval: 30000
      }
    };

    // TODO: Store in database with WebSocket/Socket.IO session management
    console.log('📱 Device registered for WebSocket/Socket.IO notifications:', {
      deviceId: deviceInfo.id,
      connectionType: deviceInfo.connectionType,
      useSocketIO: deviceInfo.connectionSettings.useSocketIO,
      rooms: deviceInfo.subscribedRooms
    });

    // Subscribe to default WebSocket/Socket.IO rooms
    await subscribeToDefaultTopics(token);

    return NextResponse.json({
      success: true,
      data: {
        deviceId: deviceInfo.id,
        sessionToken: deviceInfo.sessionToken,
        subscribedRooms: deviceInfo.subscribedRooms,
        connectionSettings: deviceInfo.connectionSettings,
        notificationPreferences: deviceInfo.notificationPreferences,
        message: 'Device registered for WebSocket/Socket.IO notifications successfully'
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
 * Update device registration for WebSocket/Socket.IO notifications
 * PUT /api/notifications/register
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, preferences, rooms, connectionSettings } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Device token is required for WebSocket/Socket.IO notifications' },
        { status: 400 }
      );
    }

    // TODO: Update in database - WebSocket/Socket.IO session and preferences
    console.log('🔄 Device updated for WebSocket/Socket.IO:', { 
      sessionToken: token, 
      preferences, 
      rooms, 
      connectionSettings 
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionToken: token,
        updatedRooms: rooms,
        updatedPreferences: preferences,
        connectionSettings: connectionSettings,
        message: 'Device WebSocket/Socket.IO settings updated successfully'
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
        { success: false, error: 'Device token is required for WebSocket/Socket.IO notifications' },
        { status: 400 }
      );
    }

    // TODO: Remove from database - cleanup WebSocket/Socket.IO session
    console.log('🗑️ Device unregistered from WebSocket/Socket.IO notifications:', token);

    return NextResponse.json({
      success: true,
      data: {
        sessionToken: token,
        message: 'Device unregistered from WebSocket/Socket.IO notifications successfully'
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
    // Subscribe to WebSocket/Socket.IO rooms for topic-based notifications
    const defaultTopics = ['general', 'uploads', 'system'];
    
    for (const topic of defaultTopics) {
      // Device will join these rooms when connecting to WebSocket/Socket.IO
      console.log(`📢 Device ${token.substring(0, 16)}... will be subscribed to topic: ${topic}`);
    }
  } catch (error) {
    console.error('❌ Error subscribing to default topics:', error);
  }
}