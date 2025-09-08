/**
 * DSLR Notification Integration
 * Connects DSLR auto-upload service with notification system
 */

import { getWebSocketClient } from './websocket-client';

export interface DSLREvent {
  type: 'upload_start' | 'upload_progress' | 'upload_success' | 'upload_failed' | 'camera_connected' | 'camera_disconnected' | 'storage_warning' | 'event_milestone';
  data: any;
  timestamp: string;
  eventId?: string;
}

export interface UploadEvent {
  fileName: string;
  fileSize: number;
  filePath: string;
  albumName: string;
  eventName: string;
  uploaderName: string;
  progress?: number;
  total?: number;
  error?: string;
}

export interface CameraEvent {
  cameraModel: string;
  status: 'connected' | 'disconnected';
  message?: string;
  lastSeen?: string;
}

export interface StorageEvent {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  percentage: number;
  threshold: number;
}

export interface EventMilestoneData {
  eventName: string;
  eventId: string;
  milestone: number;
  totalPhotos: number;
  albumName: string;
}

class DSLRNotificationIntegration {
  private wsClient = getWebSocketClient();
  private eventQueue: DSLREvent[] = [];
  private isProcessing = false;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for DSLR service
   */
  private setupEventListeners(): void {
    // Listen for DSLR service events via WebSocket
    this.wsClient.on('dslr_event', (event: DSLREvent) => {
      this.handleDSLREvent(event);
    });

    // Listen for file system events (if available)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'dslr_event') {
          this.handleDSLREvent(event.data.payload);
        }
      });
    }
  }

  /**
   * Handle DSLR events and trigger appropriate notifications
   */
  private async handleDSLREvent(event: DSLREvent): Promise<void> {
    console.log('📸 DSLR Event received:', event);

    // Add to queue for processing
    this.eventQueue.push(event);
    
    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  /**
   * Process event queue
   */
  private async processEventQueue(): Promise<void> {
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        await this.processEvent(event);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Process individual event
   */
  private async processEvent(event: DSLREvent): Promise<void> {
    try {
      switch (event.type) {
        case 'upload_start':
          await this.handleUploadStart(event.data);
          break;
        case 'upload_progress':
          await this.handleUploadProgress(event.data);
          break;
        case 'upload_success':
          await this.handleUploadSuccess(event.data);
          break;
        case 'upload_failed':
          await this.handleUploadFailed(event.data);
          break;
        case 'camera_connected':
          await this.handleCameraConnected(event.data);
          break;
        case 'camera_disconnected':
          await this.handleCameraDisconnected(event.data);
          break;
        case 'storage_warning':
          await this.handleStorageWarning(event.data);
          break;
        case 'event_milestone':
          await this.handleEventMilestone(event.data);
          break;
        default:
          console.warn('🤷 Unknown DSLR event type:', event.type);
      }
    } catch (error) {
      console.error('❌ Error processing DSLR event:', error);
    }
  }

  /**
   * Handle upload start
   */
  private async handleUploadStart(data: UploadEvent): Promise<void> {
    const notification = {
      type: 'upload_progress' as const,
      title: '📤 Starting Upload',
      message: `Uploading ${data.fileName} to ${data.albumName}`,
      priority: 'low' as const,
      showToast: true,
      data: {
        fileName: data.fileName,
        albumName: data.albumName,
        eventName: data.eventName,
        status: 'starting'
      }
    };

    // Send via WebSocket for real-time updates
    this.wsClient.send('notification', notification);

    // Also send push notification for background users
    await this.sendPushNotification(notification);
  }

  /**
   * Handle upload progress
   */
  private async handleUploadProgress(data: UploadEvent): Promise<void> {
    // Only send progress updates for large files or slow connections
    if (data.progress && data.total && data.progress % 25 === 0) {
      const percentage = Math.round((data.progress / data.total) * 100);
      
      const notification = {
        type: 'upload_progress' as const,
        title: '📤 Upload Progress',
        message: `${data.fileName} - ${percentage}% complete`,
        priority: 'low' as const,
        showToast: false, // Don't spam with toast notifications
        data: {
          fileName: data.fileName,
          progress: data.progress,
          total: data.total,
          percentage: percentage,
          status: 'uploading'
        }
      };

      this.wsClient.send('upload_progress', notification);
    }
  }

  /**
   * Handle upload success
   */
  private async handleUploadSuccess(data: UploadEvent): Promise<void> {
    const notification = {
      type: 'upload_success' as const,
      title: '✅ Upload Berhasil',
      message: `${data.fileName} berhasil diupload ke album ${data.albumName}`,
      priority: 'medium' as const,
      showToast: true,
      data: {
        fileName: data.fileName,
        fileSize: data.fileSize,
        albumName: data.albumName,
        eventName: data.eventName,
        uploaderName: data.uploaderName,
        status: 'completed',
        url: `/events/${data.eventName}/photos`
      }
    };

    // Send real-time notification
    this.wsClient.send('notification', notification);

    // Send push notification
    await this.sendPushNotification(notification);

    // Update statistics
    await this.updateUploadStats(data);
  }

  /**
   * Handle upload failure
   */
  private async handleUploadFailed(data: UploadEvent): Promise<void> {
    const notification = {
      type: 'upload_failed' as const,
      title: '❌ Upload Gagal',
      message: `Gagal mengupload ${data.fileName}. ${data.error || 'Silakan coba lagi.'}`,
      priority: 'high' as const,
      showToast: true,
      persistent: true,
      data: {
        fileName: data.fileName,
        albumName: data.albumName,
        eventName: data.eventName,
        error: data.error,
        status: 'failed',
        retryAction: true
      }
    };

    // Send real-time notification
    this.wsClient.send('notification', notification);

    // Send push notification with higher priority
    await this.sendPushNotification(notification);

    // Log error for debugging
    console.error('📸 Upload failed:', data);
  }

  /**
   * Handle camera connected
   */
  private async handleCameraConnected(data: CameraEvent): Promise<void> {
    const notification = {
      type: 'camera_connected' as const,
      title: '📷 Kamera Terhubung',
      message: `${data.cameraModel} siap untuk shooting`,
      priority: 'medium' as const,
      showToast: true,
      data: {
        cameraModel: data.cameraModel,
        status: data.status,
        connectedAt: new Date().toISOString()
      }
    };

    this.wsClient.send('camera_status', notification);
    await this.sendPushNotification(notification);
  }

  /**
   * Handle camera disconnected
   */
  private async handleCameraDisconnected(data: CameraEvent): Promise<void> {
    const notification = {
      type: 'camera_disconnected' as const,
      title: '📷 Kamera Terputus',
      message: data.message || `${data.cameraModel} terputus dari sistem. Silakan cek koneksi USB.`,
      priority: 'high' as const,
      showToast: true,
      persistent: true,
      data: {
        cameraModel: data.cameraModel,
        status: data.status,
        lastSeen: data.lastSeen,
        troubleshootUrl: '/admin/dslr'
      }
    };

    this.wsClient.send('camera_status', notification);
    await this.sendPushNotification(notification);
  }

  /**
   * Handle storage warning
   */
  private async handleStorageWarning(data: StorageEvent): Promise<void> {
    const notification = {
      type: 'storage_warning' as const,
      title: '💾 Storage Hampir Penuh',
      message: `Storage tersisa ${100 - data.percentage}%. Silakan backup foto lama atau tambah storage.`,
      priority: 'high' as const,
      showToast: true,
      persistent: true,
      data: {
        percentage: data.percentage,
        freeSpace: data.freeSpace,
        totalSpace: data.totalSpace,
        threshold: data.threshold,
        actionUrl: '/admin/storage'
      }
    };

    this.wsClient.send('system_status', notification);
    await this.sendPushNotification(notification);
  }

  /**
   * Handle event milestone
   */
  private async handleEventMilestone(data: EventMilestoneData): Promise<void> {
    const notification = {
      type: 'event_milestone' as const,
      title: '🎉 Milestone Event',
      message: `${data.milestone} foto telah diupload untuk ${data.eventName}!`,
      priority: 'medium' as const,
      showToast: true,
      data: {
        eventName: data.eventName,
        eventId: data.eventId,
        milestone: data.milestone,
        totalPhotos: data.totalPhotos,
        albumName: data.albumName,
        celebrationUrl: `/events/${data.eventId}`
      }
    };

    this.wsClient.send('notification', notification);
    await this.sendPushNotification(notification);

    // Send to clients/guests if it's a major milestone
    if (data.milestone % 50 === 0) {
      await this.sendClientNotification(data);
    }
  }

  /**
   * Send push notification via API
   */
  private async sendPushNotification(notification: any): Promise<void> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notification.title,
          message: notification.message,
          type: notification.type,
          priority: notification.priority,
          data: notification.data,
          topic: 'photographers' // Send to photographer topic
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log('✅ Push notification sent:', notification.title);
    } catch (error) {
      console.error('❌ Failed to send push notification:', error);
    }
  }

  /**
   * Send notification to clients/guests
   */
  private async sendClientNotification(data: EventMilestoneData): Promise<void> {
    try {
      const clientNotification = {
        title: '📸 Foto Baru Tersedia',
        message: `${data.milestone} foto baru telah diupload untuk ${data.eventName}`,
        type: 'event_update',
        priority: 'medium',
        data: {
          eventName: data.eventName,
          eventId: data.eventId,
          photoCount: data.milestone,
          viewUrl: `/events/${data.eventId}/gallery`
        },
        topic: `event_${data.eventId}` // Send to event-specific topic
      };

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientNotification)
      });

      if (response.ok) {
        console.log('✅ Client notification sent for milestone:', data.milestone);
      }
    } catch (error) {
      console.error('❌ Failed to send client notification:', error);
    }
  }

  /**
   * Update upload statistics
   */
  private async updateUploadStats(data: UploadEvent): Promise<void> {
    try {
      // Update statistics in database
      const stats = {
        fileName: data.fileName,
        fileSize: data.fileSize,
        albumName: data.albumName,
        eventName: data.eventName,
        uploaderName: data.uploaderName,
        uploadedAt: new Date().toISOString()
      };

      // TODO: Send to analytics endpoint
      console.log('📊 Upload stats updated:', stats);
    } catch (error) {
      console.error('❌ Failed to update upload stats:', error);
    }
  }

  /**
   * Manually trigger DSLR event (for testing)
   */
  public triggerEvent(type: DSLREvent['type'], data: any): void {
    const event: DSLREvent = {
      type,
      data,
      timestamp: new Date().toISOString(),
      eventId: `manual_${Date.now()}`
    };

    this.handleDSLREvent(event);
  }

  /**
   * Get event queue status
   */
  public getQueueStatus(): { queueLength: number, isProcessing: boolean } {
    return {
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Create singleton instance
let dslrIntegration: DSLRNotificationIntegration | null = null;

export function getDSLRNotificationIntegration(): DSLRNotificationIntegration {
  if (!dslrIntegration) {
    dslrIntegration = new DSLRNotificationIntegration();
  }
  return dslrIntegration;
}

export { DSLRNotificationIntegration };