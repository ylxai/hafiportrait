/**
 * Firebase Configuration for Push Notifications
 * Setup FCM (Firebase Cloud Messaging) untuk cross-platform notifications
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hafi-portrait.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hafi-portrait",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hafi-portrait.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234"
};

// VAPID key for web push
const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "your-vapid-key";

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize messaging
let messaging: any = null;

if (typeof window !== 'undefined') {
  // Only initialize on client side
  isSupported().then((supported) => {
    if (supported) {
      messaging = getMessaging(app);
      console.log('✅ Firebase Messaging initialized');
    } else {
      console.warn('⚠️ Firebase Messaging not supported in this browser');
    }
  });
}

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission(): Promise<string | null> {
  try {
    // Check if messaging is supported
    if (!messaging) {
      console.warn('⚠️ Firebase Messaging not available');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      
      // Register service worker
      await registerServiceWorker();
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: await navigator.serviceWorker.getRegistration()
      });
      
      if (token) {
        console.log('🔑 FCM Token:', token);
        
        // Store token in localStorage for later use
        localStorage.setItem('fcm-token', token);
        
        // Send token to server
        await sendTokenToServer(token);
        
        return token;
      } else {
        console.error('❌ No registration token available');
        return null;
      }
    } else {
      console.warn('⚠️ Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting notification permission:', error);
    return null;
  }
}

/**
 * Register service worker for push notifications
 */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registered:', registration);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } else {
      console.warn('⚠️ Service Worker not supported');
      return null;
    }
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Send FCM token to server for storage
 */
async function sendTokenToServer(token: string): Promise<void> {
  try {
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        type: 'web'
      })
    });
    
    if (response.ok) {
      console.log('✅ FCM token sent to server');
    } else {
      console.error('❌ Failed to send FCM token to server');
    }
  } catch (error) {
    console.error('❌ Error sending FCM token to server:', error);
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void): void {
  if (!messaging) {
    console.warn('⚠️ Firebase Messaging not available');
    return;
  }
  
  onMessage(messaging, (payload) => {
    console.log('📨 Foreground message received:', payload);
    callback(payload);
  });
}

/**
 * Subscribe to topic for targeted notifications
 */
export async function subscribeToTopic(topic: string): Promise<void> {
  try {
    const token = localStorage.getItem('fcm-token');
    if (!token) {
      console.warn('⚠️ No FCM token available for topic subscription');
      return;
    }
    
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        topic: topic
      })
    });
    
    if (response.ok) {
      console.log(`✅ Subscribed to topic: ${topic}`);
    } else {
      console.error(`❌ Failed to subscribe to topic: ${topic}`);
    }
  } catch (error) {
    console.error('❌ Error subscribing to topic:', error);
  }
}

/**
 * Unsubscribe from topic
 */
export async function unsubscribeFromTopic(topic: string): Promise<void> {
  try {
    const token = localStorage.getItem('fcm-token');
    if (!token) {
      console.warn('⚠️ No FCM token available for topic unsubscription');
      return;
    }
    
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        topic: topic
      })
    });
    
    if (response.ok) {
      console.log(`✅ Unsubscribed from topic: ${topic}`);
    } else {
      console.error(`❌ Failed to unsubscribe from topic: ${topic}`);
    }
  } catch (error) {
    console.error('❌ Error unsubscribing from topic:', error);
  }
}

/**
 * Get current FCM token
 */
export function getCurrentToken(): string | null {
  return localStorage.getItem('fcm-token');
}

/**
 * Check if notifications are supported and enabled
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Get notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  return Notification.permission;
}

/**
 * Send test notification
 */
export async function sendTestNotification(): Promise<void> {
  try {
    const token = getCurrentToken();
    if (!token) {
      throw new Error('No FCM token available');
    }
    
    const response = await fetch('/api/notifications/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: token,
        title: '🧪 Test Notification',
        body: 'This is a test notification from Hafi Portrait',
        data: {
          type: 'test',
          url: '/admin'
        }
      })
    });
    
    if (response.ok) {
      console.log('✅ Test notification sent');
    } else {
      console.error('❌ Failed to send test notification');
    }
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  }
}

export { app, messaging };