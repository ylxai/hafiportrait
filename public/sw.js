/**
 * Service Worker for Push Notifications
 * Handles background notifications, offline queue, and click actions
 */

const CACHE_NAME = 'hafi-portrait-notifications-v1';
const NOTIFICATION_QUEUE_KEY = 'notification-queue';

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/admin',
        '/manifest.json',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png'
      ]);
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activated');
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim all clients immediately
  self.clients.claim();
});

// Handle Push Messages from FCM
self.addEventListener('push', (event) => {
  console.log('📨 Push message received:', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
    notificationData = {
      title: 'Hafi Portrait',
      body: 'You have a new notification',
      icon: '/icons/icon-192x192.png'
    };
  }
  
  // Default notification options
  const defaultOptions = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    requireInteraction: false,
    silent: false,
    renotify: true,
    tag: 'hafi-portrait-notification',
    actions: [
      {
        action: 'view',
        title: 'Lihat',
        icon: '/icons/view-action.png'
      },
      {
        action: 'dismiss',
        title: 'Tutup',
        icon: '/icons/dismiss-action.png'
      }
    ],
    data: {
      url: notificationData.url || '/admin',
      timestamp: Date.now(),
      type: notificationData.type || 'general'
    }
  };
  
  // Merge with received data
  const options = {
    ...defaultOptions,
    ...notificationData,
    body: notificationData.body || notificationData.message || 'New notification',
    data: {
      ...defaultOptions.data,
      ...notificationData.data
    }
  };
  
  // Show notification
  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Hafi Portrait',
      options
    ).then(() => {
      console.log('✅ Notification shown successfully');
      
      // Track notification display
      trackNotificationEvent('displayed', options.data);
      
      // Store in offline queue if needed
      storeNotificationOffline(notificationData);
    }).catch((error) => {
      console.error('❌ Error showing notification:', error);
    })
  );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  // Close notification
  notification.close();
  
  // Track click event
  trackNotificationEvent('clicked', { action, ...data });
  
  if (action === 'dismiss') {
    // Just close, do nothing
    return;
  }
  
  // Default action or 'view' action
  const urlToOpen = data.url || '/admin';
  
  event.waitUntil(
    // Check if app is already open
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      
      // Try to focus existing window
      for (let client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Navigate to specific URL if needed
          if (urlToOpen !== '/') {
            client.postMessage({
              type: 'NAVIGATE',
              url: urlToOpen,
              notificationData: data
            });
          }
          return client.focus();
        }
      }
      
      // Open new window if none exists
      return self.clients.openWindow(urlToOpen);
    })
  );
});

// Handle Notification Close
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification closed:', event);
  
  const data = event.notification.data || {};
  trackNotificationEvent('closed', data);
});

// Handle Background Sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(syncOfflineNotifications());
  }
});

// Handle Messages from Main Thread
self.addEventListener('message', (event) => {
  console.log('💬 Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_NOTIFICATIONS':
      clearAllNotifications();
      break;
      
    case 'UPDATE_BADGE':
      updateBadgeCount(payload.count);
      break;
      
    default:
      console.log('🤷 Unknown message type:', type);
  }
});

// Utility Functions

/**
 * Track notification events for analytics
 */
function trackNotificationEvent(eventType, data) {
  try {
    // Send to analytics endpoint
    fetch('/api/notifications/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: Date.now(),
        data: data
      })
    }).catch(error => {
      console.error('❌ Analytics tracking failed:', error);
    });
  } catch (error) {
    console.error('❌ Error tracking notification event:', error);
  }
}

/**
 * Store notification for offline sync
 */
function storeNotificationOffline(notificationData) {
  try {
    // Get existing queue
    const queue = JSON.parse(localStorage.getItem(NOTIFICATION_QUEUE_KEY) || '[]');
    
    // Add new notification
    queue.push({
      ...notificationData,
      timestamp: Date.now(),
      status: 'pending'
    });
    
    // Keep only last 50 notifications
    if (queue.length > 50) {
      queue.splice(0, queue.length - 50);
    }
    
    // Store back
    localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
    
  } catch (error) {
    console.error('❌ Error storing notification offline:', error);
  }
}

/**
 * Sync offline notifications when online
 */
async function syncOfflineNotifications() {
  try {
    const queue = JSON.parse(localStorage.getItem(NOTIFICATION_QUEUE_KEY) || '[]');
    const pendingNotifications = queue.filter(n => n.status === 'pending');
    
    if (pendingNotifications.length === 0) {
      return;
    }
    
    console.log(`🔄 Syncing ${pendingNotifications.length} offline notifications`);
    
    // Send to server
    const response = await fetch('/api/notifications/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notifications: pendingNotifications })
    });
    
    if (response.ok) {
      // Mark as synced
      const updatedQueue = queue.map(n => 
        n.status === 'pending' ? { ...n, status: 'synced' } : n
      );
      localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(updatedQueue));
      
      console.log('✅ Offline notifications synced successfully');
    }
    
  } catch (error) {
    console.error('❌ Error syncing offline notifications:', error);
  }
}

/**
 * Clear all notifications
 */
async function clearAllNotifications() {
  try {
    const notifications = await self.registration.getNotifications();
    notifications.forEach(notification => notification.close());
    console.log(`🗑️ Cleared ${notifications.length} notifications`);
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
  }
}

/**
 * Update badge count
 */
function updateBadgeCount(count) {
  try {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(count);
    }
  } catch (error) {
    console.error('❌ Error updating badge count:', error);
  }
}

// Handle fetch events (for offline support)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request);
    })
  );
});

console.log('🚀 Service Worker loaded successfully');