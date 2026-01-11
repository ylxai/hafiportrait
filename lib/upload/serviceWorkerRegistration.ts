/**
 * Service Worker Registration
 * 
 * Handles:
 * - Service worker registration
 * - Update detection
 * - Message communication
 */

export interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      // Always bypass HTTP cache when checking SW updates
      updateViaCache: 'none',
    });

    // If a new SW is waiting, activate it immediately
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    // When a new SW takes control, reload to ensure client bundle matches server build
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          // If there's an existing controller, this is an update
          if (navigator.serviceWorker.controller) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      });
    });

    swRegistration = registration;
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    return false;
  }

  try {
    const result = await swRegistration.unregister();
    swRegistration = null;
    return result;
  } catch (error) {
    console.error('Service Worker unregistration failed:', error);
    return false;
  }
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: ServiceWorkerMessage): void {
  if (!navigator.serviceWorker.controller) {
    return;
  }

  navigator.serviceWorker.controller.postMessage(message);
}

/**
 * Listen to messages from service worker
 */
export function listenToSWMessages(
  callback: (message: ServiceWorkerMessage) => void
): () => void {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      callback(event.data as ServiceWorkerMessage);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

/**
 * Get service worker registration
 */
export function getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
  return swRegistration;
}

/**
 * Request background sync (if supported)
 */
export async function requestBackgroundSync(tag: string): Promise<boolean> {
  if (!swRegistration) {
    return false;
  }

  if (!('sync' in swRegistration)) {
    return false;
  }

  try {
    await (swRegistration as any).sync.register(tag);
    return true;
  } catch (error) {
    console.error('Background Sync registration failed:', error);
    return false;
  }
}
