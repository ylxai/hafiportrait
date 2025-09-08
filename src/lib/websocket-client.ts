/**
 * WebSocket Client for Real-time Notifications
 * Handles bi-directional communication between client and server
 */

import { toast } from '@/components/ui/toast-notification';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

export interface NotificationPayload {
  type: 'upload_success' | 'upload_failed' | 'camera_disconnected' | 'storage_warning' | 'event_milestone' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  showToast?: boolean;
  persistent?: boolean;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private listeners: Map<string, Function[]> = new Map();
  private messageQueue: WebSocketMessage[] = [];

  constructor(private url: string = '') {
    // Disable WebSocket in production for now
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      console.log('🚫 WebSocket disabled in production environment');
      return;
    }
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    // Skip connection if no URL provided (production mode)
    if (!this.url) {
      console.log('🚫 WebSocket connection skipped - no URL provided');
      return;
    }

    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to WebSocket server:', this.url);

    try {
      this.ws = new WebSocket(this.url);
      this.setupEventListeners();
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      this.handleReconnect();
    }
  }

  /**
   * Setup WebSocket event listeners
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Send queued messages
      this.sendQueuedMessages();
      
      // Emit connection event
      this.emit('connected', { timestamp: new Date().toISOString() });
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', message);
        
        this.handleMessage(message);
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = (event) => {
      console.log('🔌 WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      
      // Emit disconnection event
      this.emit('disconnected', { 
        code: event.code, 
        reason: event.reason,
        timestamp: new Date().toISOString()
      });
      
      // Attempt to reconnect if not a clean close
      if (event.code !== 1000) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.emit('error', { error, timestamp: new Date().toISOString() });
    };
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const { type, payload } = message;

    switch (type) {
      case 'notification':
        this.handleNotification(payload);
        break;
      
      case 'upload_progress':
        this.handleUploadProgress(payload);
        break;
      
      case 'camera_status':
        this.handleCameraStatus(payload);
        break;
      
      case 'system_status':
        this.handleSystemStatus(payload);
        break;
      
      case 'heartbeat_response':
        // Heartbeat acknowledged
        break;
      
      default:
        console.log('🤷 Unknown message type:', type);
    }

    // Emit to listeners
    this.emit(type, payload);
  }

  /**
   * Handle notification messages
   */
  private handleNotification(payload: NotificationPayload): void {
    const { type, title, message, priority, showToast = true, persistent = false, data = {} } = payload;

    // Show toast notification if enabled
    if (showToast) {
      const toastOptions = {
        persistent: persistent || priority === 'critical',
        duration: priority === 'critical' ? 0 : priority === 'high' ? 8000 : 5000
      };

      switch (type) {
        case 'upload_success':
          toast.upload(title, message, toastOptions);
          break;
        case 'upload_failed':
          toast.error(title, message, toastOptions);
          break;
        case 'camera_disconnected':
          toast.camera(title, message, toastOptions);
          break;
        case 'storage_warning':
          toast.warning(title, message, toastOptions);
          break;
        case 'event_milestone':
          toast.success(title, message, toastOptions);
          break;
        case 'system':
          toast.info(title, message, toastOptions);
          break;
        default:
          toast.info(title, message, toastOptions);
      }
    }

    // Play sound for high priority notifications
    if (priority === 'critical' || priority === 'high') {
      this.playNotificationSound();
    }

    // Vibrate for mobile devices
    if ('vibrator' in navigator && (priority === 'critical' || priority === 'high')) {
      navigator.vibrate([200, 100, 200]);
    }
  }

  /**
   * Handle upload progress updates
   */
  private handleUploadProgress(payload: any): void {
    const { fileName, progress, total, status } = payload;
    
    if (status === 'completed') {
      toast.success('Upload Complete', `${fileName} uploaded successfully`);
    } else if (status === 'failed') {
      toast.error('Upload Failed', `Failed to upload ${fileName}`);
    }
  }

  /**
   * Handle camera status updates
   */
  private handleCameraStatus(payload: any): void {
    const { status, cameraModel, message } = payload;
    
    if (status === 'connected') {
      toast.camera('Camera Connected', `${cameraModel} is ready for shooting`);
    } else if (status === 'disconnected') {
      toast.camera('Camera Disconnected', message || 'Please check USB connection', { persistent: true });
    }
  }

  /**
   * Handle system status updates
   */
  private handleSystemStatus(payload: any): void {
    const { status, message, data } = payload;
    
    if (status === 'storage_warning') {
      toast.warning('Storage Warning', `${data.percentage}% storage remaining`, { persistent: true });
    } else if (status === 'backup_complete') {
      toast.success('Backup Complete', message);
    }
  }

  /**
   * Send message to server
   */
  public send(type: string, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log('📤 WebSocket message sent:', message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      console.log('📦 Message queued (WebSocket not ready):', message);
    }
  }

  /**
   * Send queued messages
   */
  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
        console.log('📤 Queued message sent:', message);
      }
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send('heartbeat', { timestamp: new Date().toISOString() });
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.emit('max_reconnect_attempts', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  /**
   * Add event listener
   */
  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  public off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.1;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.warn('⚠️ Could not play notification sound:', error);
    }
  }

  /**
   * Get connection status
   */
  public getStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  /**
   * Close connection
   */
  public close(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client closing connection');
      this.ws = null;
    }
  }

  /**
   * Manually reconnect
   */
  public reconnect(): void {
    this.close();
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.connect();
  }
}

// Create singleton instance
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
  if (!wsClient) {
    // Only enable WebSocket in development
    const wsUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? 'ws://localhost:3001' 
      : '';
    wsClient = new WebSocketClient(wsUrl);
  }
  return wsClient;
}

export { WebSocketClient };