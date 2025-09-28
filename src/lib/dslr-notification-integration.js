/**
 * DSLR Notification Integration - JavaScript Version
 * Compatible with Node.js DSLR service
 */

// Use built-in fetch or fallback
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (error) {
  console.warn('⚠️ node-fetch not available, using mock fetch');
  fetch = async (url, options) => {
    console.log(`🔄 Mock fetch called: ${options?.method || 'GET'} ${url}`);
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, mode: 'mock' }),
      text: async () => 'Mock response'
    };
  };
}

class DSLRNotificationIntegration {
  constructor() {
    this.eventQueue = [];
    this.isProcessing = false;
    this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    console.log('🔔 DSLR Notification Integration initialized');
  }

  /**
   * Trigger DSLR event and send notifications
   */
  async triggerEvent(type, data) {
    const event = {
      type,
      data,
      timestamp: new Date().toISOString(),
      eventId: `dslr_${Date.now()}`
    };

    console.log('📸 DSLR Event triggered:', event);

    // Add to queue for processing
    this.eventQueue.push(event);
    
    if (!this.isProcessing) {
      await this.processEventQueue();
    }
  }

  /**
   * Process event queue
   */
  async processEventQueue() {
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
  async processEvent(event) {
    try {
      switch (event.type) {
        case 'upload_start':
          await this.handleUploadStart(event.data);
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
        case 'event_milestone':
          await this.handleEventMilestone(event.data);
          break;
        case 'storage_warning':
          await this.handleStorageWarning(event.data);
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
  async handleUploadStart(data) {
    const notification = {
      type: 'upload_progress',
      title: '📤 Starting Upload',
      message: `Uploading ${data.fileName} to ${data.albumName}`,
      priority: 'low',
      data: {
        fileName: data.fileName,
        albumName: data.albumName,
        eventName: data.eventName,
        status: 'starting'
      }
    };

    await this.sendNotification(notification);
    console.log(`📤 Upload started: ${data.fileName}`);
  }

  /**
   * Handle upload success
   */
  async handleUploadSuccess(data) {
    const notification = {
      type: 'upload_success',
      title: '✅ Upload Berhasil',
      message: `${data.fileName} berhasil diupload ke album ${data.albumName}`,
      priority: 'medium',
      data: {
        fileName: data.fileName,
        fileSize: data.fileSize,
        albumName: data.albumName,
        eventName: data.eventName,
        uploaderName: data.uploaderName,
        status: 'completed',
        photoId: data.photoId,
        total: data.total
      }
    };

    await this.sendNotification(notification);
    console.log(`✅ Upload success notification sent: ${data.fileName}`);
  }

  /**
   * Handle upload failure
   */
  async handleUploadFailed(data) {
    const notification = {
      type: 'upload_failed',
      title: '❌ Upload Gagal',
      message: `Gagal mengupload ${data.fileName}. ${data.error || 'Silakan coba lagi.'}`,
      priority: 'high',
      data: {
        fileName: data.fileName,
        albumName: data.albumName,
        eventName: data.eventName,
        error: data.error,
        status: 'failed'
      }
    };

    await this.sendNotification(notification);
    console.error(`❌ Upload failed notification sent: ${data.fileName}`);
  }

  /**
   * Handle camera connected
   */
  async handleCameraConnected(data) {
    const notification = {
      type: 'camera_connected',
      title: '📷 Kamera Terhubung',
      message: `${data.cameraModel} siap untuk shooting`,
      priority: 'medium',
      data: {
        cameraModel: data.cameraModel,
        status: data.status,
        connectedAt: new Date().toISOString()
      }
    };

    await this.sendNotification(notification);
    console.log(`📷 Camera connected: ${data.cameraModel}`);
  }

  /**
   * Handle camera disconnected
   */
  async handleCameraDisconnected(data) {
    const notification = {
      type: 'camera_disconnected',
      title: '📷 Kamera Terputus',
      message: data.message || `${data.cameraModel} terputus dari sistem. Silakan cek koneksi USB.`,
      priority: 'high',
      data: {
        cameraModel: data.cameraModel,
        status: data.status,
        lastSeen: data.lastSeen
      }
    };

    await this.sendNotification(notification);
    console.warn(`📷 Camera disconnected: ${data.cameraModel}`);
  }

  /**
   * Handle event milestone
   */
  async handleEventMilestone(data) {
    const notification = {
      type: 'event_milestone',
      title: '🎉 Milestone Event',
      message: `${data.milestone} foto telah diupload untuk ${data.eventName}!`,
      priority: 'medium',
      data: {
        eventName: data.eventName,
        eventId: data.eventId,
        milestone: data.milestone,
        totalPhotos: data.totalPhotos,
        albumName: data.albumName
      }
    };

    await this.sendNotification(notification);
    console.log(`🎉 Milestone reached: ${data.milestone} photos`);

    // Send to clients for major milestones
    if (data.milestone % 50 === 0) {
      await this.sendClientNotification(data);
    }
  }

  /**
   * Handle storage warning
   */
  async handleStorageWarning(data) {
    const notification = {
      type: 'storage_warning',
      title: '💾 Storage Hampir Penuh',
      message: `Storage tersisa ${100 - data.percentage}%. Silakan backup foto lama.`,
      priority: 'high',
      data: {
        percentage: data.percentage,
        freeSpace: data.freeSpace,
        totalSpace: data.totalSpace,
        threshold: data.threshold
      }
    };

    await this.sendNotification(notification);
    console.warn(`💾 Storage warning: ${data.percentage}% used`);
  }

  /**
   * Send notification via API
   */
  async sendNotification(notification) {
    try {
      // Check if API server is running
      const healthCheck = await this.checkAPIHealth();
      if (!healthCheck) {
        console.warn('⚠️ API server not available, logging notification locally');
        this.logNotificationLocally(notification);
        return { success: true, mode: 'local' };
      }

      const response = await fetch(`${this.apiBaseUrl}/api/notifications/send`, {
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
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      console.log('✅ Notification sent successfully:', notification.title);
      return result;

    } catch (error) {
      console.warn('⚠️ API notification failed, logging locally:', error.message);
      this.logNotificationLocally(notification);
      // Don't throw error to prevent breaking the upload process
      return { success: false, error: error.message, mode: 'local' };
    }
  }

  /**
   * Check if API server is healthy
   */
  async checkAPIHealth() {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000);
      });

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${this.apiBaseUrl}/api/test/db`, {
          method: 'GET'
        }),
        timeoutPromise
      ]);
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Log notification locally when API is not available
   */
  logNotificationLocally(notification) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data
    };
    
    console.log('📝 Local notification log:', JSON.stringify(logEntry, null, 2));
    
    // Could also write to file for persistence
    // fs.appendFileSync('./dslr-notifications.log', JSON.stringify(logEntry) + '\n');
  }

  /**
   * Send notification to clients/guests
   */
  async sendClientNotification(data) {
    try {
      const clientNotification = {
        title: '📸 Foto Baru Tersedia',
        message: `${data.milestone} foto baru telah diupload untuk ${data.eventName}`,
        type: 'event_update',
        priority: 'medium',
        data: {
          eventName: data.eventName,
          eventId: data.eventId,
          photoCount: data.milestone
        },
        topic: `event_${data.eventId}` // Send to event-specific topic
      };

      const response = await fetch(`${this.apiBaseUrl}/api/notifications/send`, {
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
      console.error('❌ Failed to send client notification:', error.message);
    }
  }

  /**
   * Update DSLR status via API
   */
  async updateDSLRStatus(status) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/dslr/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_settings',
          settings: status
        })
      });

      if (response.ok) {
        console.log('✅ DSLR status updated');
      }
    } catch (error) {
      console.error('❌ Failed to update DSLR status:', error.message);
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueLength: this.eventQueue.length,
      isProcessing: this.isProcessing
    };
  }
}

// Create singleton instance
let dslrIntegration = null;

function getDSLRNotificationIntegration() {
  if (!dslrIntegration) {
    dslrIntegration = new DSLRNotificationIntegration();
  }
  return dslrIntegration;
}

module.exports = {
  DSLRNotificationIntegration,
  getDSLRNotificationIntegration
};