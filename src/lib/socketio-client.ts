/**
 * Socket.IO Client untuk Real-time Notifications
 * Enhanced version dengan auto-fallback, room management, dan mobile optimization
 */

import { io, Socket } from 'socket.io-client';
import { toast } from '@/components/ui/toast-notification';

export interface SocketIOMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
  room?: string;
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

export interface ConnectionInfo {
  clientId: string;
  transport: string;
  timestamp: string;
  serverVersion: string;
  features: string[];
}

class SocketIOClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isConnecting = false;
  private listeners: Map<string, Function[]> = new Map();
  private messageQueue: SocketIOMessage[] = [];
  private subscribedRooms: Set<string> = new Set();
  private connectionInfo: ConnectionInfo | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  // Mobile optimization
  private isMobile: boolean = false;
  private isBackground: boolean = false;
  private networkType: string = 'unknown';

  constructor(private url: string = 'http://localhost:3000') {
    this.detectMobile();
    this.setupNetworkDetection();
    this.setupVisibilityHandling();
    this.connect();
  }

  /**
   * Detect mobile device
   */
  private detectMobile(): void {
    if (typeof window !== 'undefined') {
      this.isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
      
      // Detect network type for mobile optimization
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        this.networkType = connection?.effectiveType || 'unknown';
      }
    }
  }

  /**
   * Setup network change detection
   */
  private setupNetworkDetection(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('📶 Network back online, reconnecting...');
        this.handleNetworkChange('online');
      });

      window.addEventListener('offline', () => {
        console.log('📵 Network offline detected');
        this.handleNetworkChange('offline');
      });

      // Mobile network change detection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connection?.addEventListener('change', () => {
          const newType = connection.effectiveType;
          if (newType !== this.networkType) {
            console.log(`📶 Network type changed: ${this.networkType} → ${newType}`);
            this.networkType = newType;
            this.handleNetworkChange('type-change');
          }
        });
      }
    }
  }

  /**
   * Setup page visibility handling untuk mobile
   */
  private setupVisibilityHandling(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        const wasBackground = this.isBackground;
        this.isBackground = document.hidden;
        
        if (wasBackground && !this.isBackground) {
          // App came back to foreground
          console.log('📱 App returned to foreground, checking connection...');
          this.handleAppForeground();
        } else if (!wasBackground && this.isBackground) {
          // App went to background
          console.log('📱 App went to background');
          this.handleAppBackground();
        }
      });
    }
  }

  /**
   * Handle network changes
   */
  private handleNetworkChange(type: 'online' | 'offline' | 'type-change'): void {
    switch (type) {
      case 'online':
        if (!this.socket?.connected) {
          this.reconnect();
        }
        break;
      
      case 'offline':
        this.emit('network-offline', { timestamp: new Date().toISOString() });
        break;
      
      case 'type-change':
        // Optimize connection based on network type
        this.optimizeForNetwork();
        break;
    }
  }

  /**
   * Handle app returning to foreground
   */
  private handleAppForeground(): void {
    if (!this.socket?.connected) {
      this.reconnect();
    } else {
      // Send heartbeat to verify connection
      this.sendHeartbeat();
    }
  }

  /**
   * Handle app going to background
   */
  private handleAppBackground(): void {
    // Reduce heartbeat frequency for battery optimization
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.startHeartbeat(60000); // 1 minute interval in background
    }
  }

  /**
   * Optimize connection based on network type
   */
  private optimizeForNetwork(): void {
    if (!this.socket) return;

    const options: any = {};

    switch (this.networkType) {
      case 'slow-2g':
      case '2g':
        options.timeout = 30000;
        options.forceNew = false;
        break;
      
      case '3g':
        options.timeout = 20000;
        break;
      
      case '4g':
      default:
        options.timeout = 10000;
        break;
    }

    console.log(`📶 Optimizing for ${this.networkType} network`);
  }

  /**
   * Connect to Socket.IO server dengan optimizations
   */
  private connect(): void {
    if (this.isConnecting || (this.socket && this.socket.connected)) {
      return;
    }

    this.isConnecting = true;
    console.log('🔌 Connecting to Socket.IO server...');

    try {
      // Socket.IO connection options
      const options: any = {
        // Transport options dengan fallback
        transports: ['websocket', 'polling'],
        upgrade: true,
        rememberUpgrade: true,
        
        // Timeout settings berdasarkan network
        timeout: this.getTimeoutForNetwork(),
        
        // Reconnection settings
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: this.maxReconnectAttempts,
        
        // Mobile optimizations
        forceNew: false,
        
        // Authentication (optional)
        auth: this.getAuthToken(),
        
        // Query parameters
        query: {
          clientType: this.isMobile ? 'mobile' : 'desktop',
          networkType: this.networkType,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
        }
      };

      this.socket = io(this.url, options);
      this.setupSocketEventListeners();
      
    } catch (error) {
      console.error('❌ Socket.IO connection error:', error);
      this.handleReconnect();
    }
  }

  /**
   * Get timeout berdasarkan network type
   */
  private getTimeoutForNetwork(): number {
    switch (this.networkType) {
      case 'slow-2g': return 30000;
      case '2g': return 25000;
      case '3g': return 20000;
      case '4g': return 10000;
      default: return 15000;
    }
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): any {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token');
      return token ? { token } : {};
    }
    return {};
  }

  /**
   * Setup Socket.IO event listeners
   */
  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log(`✅ Socket.IO connected via ${this.socket?.io.engine.transport.name}`);
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Re-join rooms
      this.rejoinRooms();
      
      // Send queued messages
      this.sendQueuedMessages();
      
      // Emit connection event
      this.emit('connected', { 
        transport: this.socket?.io.engine.transport.name,
        timestamp: new Date().toISOString() 
      });
    });

    this.socket.on('connected', (info: ConnectionInfo) => {
      this.connectionInfo = info;
      console.log('📡 Server connection info:', info);
      this.emit('server-info', info);
    });

    // Transport upgrade
    this.socket.io.on('upgrade' as any, (transport: any) => {
      console.log(`🔄 Transport upgraded to: ${transport.name}`);
      this.emit('transport-upgrade', { transport: transport.name });
    });

    // Message events
    this.socket.on('message', (data: any) => {
      this.handleMessage('message', data);
    });

    // Room events
    this.socket.on('room-joined', (data: any) => {
      console.log(`📍 Joined room: ${data.room}`);
      this.emit('room-joined', data);
    });

    this.socket.on('room-left', (data: any) => {
      console.log(`📍 Left room: ${data.room}`);
      this.emit('room-left', data);
    });

    // Real-time data events
    this.socket.on('dslr_status', (data: any) => {
      this.handleMessage('dslr_status', data);
    });

    this.socket.on('backup_status', (data: any) => {
      this.handleMessage('backup_status', data);
    });

    this.socket.on('notification', (data: NotificationPayload) => {
      this.handleNotification(data);
    });

    this.socket.on('upload_progress', (data: any) => {
      this.handleUploadProgress(data);
    });

    this.socket.on('camera_status', (data: any) => {
      this.handleCameraStatus(data);
    });

    this.socket.on('system_status', (data: any) => {
      this.handleSystemStatus(data);
    });

    // Heartbeat
    this.socket.on('heartbeat-response', (data: any) => {
      // Heartbeat acknowledged
      this.emit('heartbeat-response', data);
    });

    // Error handling
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
      this.emit('connect_error', { error: error.message, timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', (reason, details) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      this.isConnecting = false;
      this.stopHeartbeat();
      
      this.emit('disconnected', { 
        reason, 
        details,
        timestamp: new Date().toISOString() 
      });
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket.IO error:', error);
      this.emit('error', { error, timestamp: new Date().toISOString() });
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(type: string, payload: any): void {
    console.log(`📨 Socket.IO message received: ${type}`, payload);
    
    // Emit to listeners
    this.emit(type, payload);
  }

  /**
   * Handle notification messages
   */
  private handleNotification(payload: NotificationPayload): void {
    const { type, title, message, priority, showToast = true, persistent = false } = payload;

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
    if (this.isMobile && 'vibrator' in navigator && (priority === 'critical' || priority === 'high')) {
      navigator.vibrate([200, 100, 200]);
    }

    this.emit('notification', payload);
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

    this.emit('upload_progress', payload);
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

    this.emit('camera_status', payload);
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

    this.emit('system_status', payload);
  }

  /**
   * Join room
   */
  public joinRoom(roomName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-room', roomName);
      this.subscribedRooms.add(roomName);
      console.log(`📍 Joining room: ${roomName}`);
    } else {
      console.warn(`⚠️ Cannot join room ${roomName}: not connected`);
    }
  }

  /**
   * Leave room
   */
  public leaveRoom(roomName: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', roomName);
      this.subscribedRooms.delete(roomName);
      console.log(`📍 Leaving room: ${roomName}`);
    }
  }

  /**
   * Re-join rooms after reconnection
   */
  private rejoinRooms(): void {
    this.subscribedRooms.forEach(roomName => {
      if (this.socket?.connected) {
        this.socket.emit('join-room', roomName);
        console.log(`📍 Re-joining room: ${roomName}`);
      }
    });
  }

  /**
   * Send message to server
   */
  public send(type: string, payload: any, room?: string): void {
    const message: SocketIOMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      room
    };

    if (this.socket?.connected) {
      this.socket.emit('message', message);
      console.log('📤 Socket.IO message sent:', message);
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      console.log('📦 Message queued (Socket.IO not ready):', message);
    }
  }

  /**
   * Send queued messages
   */
  private sendQueuedMessages(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.socket?.connected) {
        this.socket.emit('message', message);
        console.log('📤 Queued message sent:', message);
      }
    }
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(): void {
    if (this.socket?.connected) {
      this.socket.emit('heartbeat', { 
        timestamp: new Date().toISOString(),
        clientTime: Date.now(),
        networkType: this.networkType,
        isBackground: this.isBackground
      });
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(interval: number = 30000): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval);
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

    // Exponential backoff with jitter
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000, 30000);
    
    setTimeout(() => {
      this.connect();
    }, delay);
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
    if (!this.socket) return 'disconnected';
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  /**
   * Get connection info
   */
  public getConnectionInfo(): any {
    return {
      status: this.getStatus(),
      transport: this.socket?.io.engine.transport.name || 'unknown',
      networkType: this.networkType,
      isMobile: this.isMobile,
      isBackground: this.isBackground,
      reconnectAttempts: this.reconnectAttempts,
      subscribedRooms: Array.from(this.subscribedRooms),
      connectionInfo: this.connectionInfo
    };
  }

  /**
   * Close connection
   */
  public close(): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedRooms.clear();
  }

  /**
   * Manually reconnect
   */
  public reconnect(): void {
    this.close();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Create singleton instance
let socketIOClient: SocketIOClient | null = null;

export function getSocketIOClient(): SocketIOClient {
  if (!socketIOClient) {
    // For production, use the same domain as the website (Nginx will proxy to localhost:3000)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKETIO_URL || 
                     (process.env.NODE_ENV === 'production' ? 'https://hafiportrait.photography' : 'http://localhost:3000');
    console.log('🔌 Socket.IO URL:', socketUrl);
    socketIOClient = new SocketIOClient(socketUrl);
  }
  return socketIOClient;
}

export { SocketIOClient };