/**
 * Service Worker for Upload Persistence
 * 
 * Handles:
 * - Background sync for upload queue
 * - Upload resumption on activation
 * - Message handlers for upload commands
 */

// Bump version on SW logic changes to ensure clean upgrades
const CACHE_NAME = 'hafiportrait-upload-v2';
const UPLOAD_SYNC_TAG = 'upload-sync';

// Install event
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Allow page to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches to avoid stale assets
      caches.keys().then((keys) =>
        Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
      ),
      clients.claim().then(() => {
        console.log('[Service Worker] Claimed clients');
        // Check for pending uploads
        return checkPendingUploads();
      }),
    ])
  );
});

// Fetch event - pass through, no caching for uploads
self.addEventListener('fetch', (event) => {
  // Don't intercept upload requests
  if (event.request.url.includes('/api/admin/events/') && event.request.method === 'POST') {
    return;
  }
});

// Background Sync event
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === UPLOAD_SYNC_TAG) {
    event.waitUntil(syncUploads());
  }
});

// Message event - handle commands from main thread
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'UPLOAD_START':
      handleUploadStart(payload);
      break;
    case 'UPLOAD_PAUSE':
      handleUploadPause(payload);
      break;
    case 'UPLOAD_RESUME':
      handleUploadResume(payload);
      break;
    case 'UPLOAD_CANCEL':
      handleUploadCancel(payload);
      break;
    case 'CHECK_PENDING':
      checkPendingUploads();
      break;
    default:
      console.log('[Service Worker] Unknown message type:', type);
  }
});

/**
 * Check for pending uploads on activation
 */
async function checkPendingUploads() {
  try {
    // Notify all clients about pending uploads
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'PENDING_UPLOADS_CHECK',
        payload: { hasPending: false }, // Placeholder - actual check done in main thread
      });
    }
  } catch (error) {
    console.error('[Service Worker] Error checking pending uploads:', error);
  }
}

/**
 * Sync uploads in background
 */
async function syncUploads() {
  console.log('[Service Worker] Syncing uploads...');
  
  try {
    // Notify clients to resume uploads
    const clients = await self.clients.matchAll({ type: 'window' });
    
    for (const client of clients) {
      client.postMessage({
        type: 'RESUME_UPLOADS',
        payload: {},
      });
    }
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Error syncing uploads:', error);
    return Promise.reject(error);
  }
}

/**
 * Handle upload start command
 */
function handleUploadStart(payload) {
  console.log('[Service Worker] Upload started:', payload);
  
  // Register background sync
  if ('sync' in self.registration) {
    self.registration.sync.register(UPLOAD_SYNC_TAG).catch((error) => {
      console.error('[Service Worker] Failed to register sync:', error);
    });
  }
}

/**
 * Handle upload pause command
 */
function handleUploadPause(payload) {
  console.log('[Service Worker] Upload paused:', payload);
}

/**
 * Handle upload resume command
 */
function handleUploadResume(payload) {
  console.log('[Service Worker] Upload resumed:', payload);
  
  // Register background sync
  if ('sync' in self.registration) {
    self.registration.sync.register(UPLOAD_SYNC_TAG).catch((error) => {
      console.error('[Service Worker] Failed to register sync:', error);
    });
  }
}

/**
 * Handle upload cancel command
 */
function handleUploadCancel(payload) {
  console.log('[Service Worker] Upload cancelled:', payload);
}
