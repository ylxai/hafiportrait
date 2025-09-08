import { NextRequest, NextResponse } from 'next/server';

/**
 * Send push notification
 * POST /api/notifications/send
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      type = 'general',
      priority = 'normal',
      recipients = 'all',
      data = {},
      scheduled = null,
      topic = null
    } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      );
    }

    // Create notification payload
    const notification = {
      id: generateNotificationId(),
      title: title,
      body: message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.imageUrl || null,
      data: {
        type: type,
        priority: priority,
        url: data.url || '/admin',
        timestamp: new Date().toISOString(),
        ...data
      },
      actions: [
        {
          action: 'view',
          title: 'Lihat'
        },
        {
          action: 'dismiss',
          title: 'Tutup'
        }
      ]
    };

    // Determine recipients
    let targetTokens: string[] = [];
    
    if (recipients === 'all') {
      targetTokens = await getAllActiveTokens();
    } else if (Array.isArray(recipients)) {
      targetTokens = recipients;
    } else if (topic) {
      // Send to topic instead of individual tokens
      await sendToTopic(topic, notification);
      return NextResponse.json({
        success: true,
        data: {
          notificationId: notification.id,
          type: 'topic',
          topic: topic,
          message: 'Notification sent to topic successfully'
        }
      });
    }

    // Send to individual tokens
    const results = await sendToTokens(targetTokens, notification);
    
    // Store notification in history
    await storeNotificationHistory({
      ...notification,
      recipients: targetTokens.length,
      sentAt: new Date().toISOString(),
      results: results
    });

    return NextResponse.json({
      success: true,
      data: {
        notificationId: notification.id,
        type: 'tokens',
        recipients: targetTokens.length,
        successful: results.successful,
        failed: results.failed,
        message: 'Notification sent successfully'
      }
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Utility functions

function generateNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getAllActiveTokens(): Promise<string[]> {
  // TODO: Get from database
  // For now, return mock tokens
  return [
    'mock_token_1',
    'mock_token_2',
    'mock_token_3'
  ];
}

async function sendToTokens(tokens: string[], notification: any): Promise<{ successful: number, failed: number }> {
  try {
    // In production, use Firebase Admin SDK
    // const admin = require('firebase-admin');
    // const messaging = admin.messaging();
    
    let successful = 0;
    let failed = 0;

    // Mock sending for now
    for (const token of tokens) {
      try {
        // TODO: Use Firebase Admin SDK
        // await messaging.send({
        //   token: token,
        //   notification: {
        //     title: notification.title,
        //     body: notification.body,
        //     imageUrl: notification.image
        //   },
        //   data: notification.data,
        //   webpush: {
        //     notification: {
        //       icon: notification.icon,
        //       badge: notification.badge,
        //       actions: notification.actions
        //     }
        //   }
        // });
        
        console.log(`✅ Notification sent to token: ${token.substring(0, 16)}...`);
        successful++;
      } catch (error) {
        console.error(`❌ Failed to send to token: ${token.substring(0, 16)}...`, error);
        failed++;
      }
    }

    return { successful, failed };
  } catch (error) {
    console.error('❌ Error in sendToTokens:', error);
    return { successful: 0, failed: tokens.length };
  }
}

async function sendToTopic(topic: string, notification: any): Promise<void> {
  try {
    // In production, use Firebase Admin SDK
    // const admin = require('firebase-admin');
    // const messaging = admin.messaging();
    
    // TODO: Use Firebase Admin SDK
    // await messaging.send({
    //   topic: topic,
    //   notification: {
    //     title: notification.title,
    //     body: notification.body,
    //     imageUrl: notification.image
    //   },
    //   data: notification.data,
    //   webpush: {
    //     notification: {
    //       icon: notification.icon,
    //       badge: notification.badge,
    //       actions: notification.actions
    //     }
    //   }
    // });
    
    console.log(`✅ Notification sent to topic: ${topic}`);
  } catch (error) {
    console.error(`❌ Failed to send to topic: ${topic}`, error);
    throw error;
  }
}

async function storeNotificationHistory(notificationData: any): Promise<void> {
  try {
    // TODO: Store in database
    console.log('📝 Storing notification history:', {
      id: notificationData.id,
      title: notificationData.title,
      recipients: notificationData.recipients,
      sentAt: notificationData.sentAt
    });
  } catch (error) {
    console.error('❌ Error storing notification history:', error);
  }
}