/**
 * WebSocket Server untuk Real-time Data
 * Menangani data kritis: DSLR status, Backup progress, Upload events
 */

import * as WebSocket from 'ws';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
}

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  subscriptions: Set<string>;
  lastPing: number;
}

class RealTimeWebSocketServer {
  private wss: any = null;
  private server: any = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private dslrStatusWatcher: NodeJS.Timeout | null = null;
  private backupStatusWatcher: NodeJS.Timeout | null = null;
  
  // File paths untuk monitoring
  private readonly DSLR_STATUS_FILE = path.join(process.cwd(), 'dslr-status.json');
  private readonly BACKUP_STATUS_FILE = path.join(process.cwd(), 'backup-status.json');
  
  // Cache untuk status terakhir
  private lastDslrStatus: any = null;
  private lastBackupStatus: any = null;

  constructor(private port: number = 3001) {
    this.setupServer();
  }

  /**
   * Setup WebSocket server
   */
  private setupServer(): void {
    // Create HTTP server
    this.server = createServer();
    
    // Create WebSocket server
    this.wss = new (WebSocket as any).Server({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request: any) => {
      this.handleConnection(ws, request);
    });

    console.log(`🚀 WebSocket server configured on port ${this.port}`);
  }

  /**
   * Start server
   */
  public start(): void {
    if (!this.server) {
      console.error('❌ Server not configured');
      return;
    }

    this.server.listen(this.port, () => {
      console.log(`✅ WebSocket server running on ws://localhost:${this.port}/ws`);
      
      // Start monitoring services
      this.startHeartbeat();
      this.startDslrMonitoring();
      this.startBackupMonitoring();
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();
    const client: ConnectedClient = {
      ws,
      id: clientId,
      subscriptions: new Set(),
      lastPing: Date.now()
    };

    this.clients.set(clientId, client);
    console.log(`🔌 Client connected: ${clientId} (Total: ${this.clients.size})`);

    // Send welcome message
    this.sendToClient(clientId, 'connected', {
      clientId,
      timestamp: new Date().toISOString(),
      availableChannels: ['dslr', 'backup', 'upload', 'camera', 'system']
    });

    // Handle messages from client
    (ws as any).on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error: any) {
        console.error(`❌ Error parsing message from ${clientId}:`, error);
      }
    });

    // Handle client disconnect
    (ws as any).on('close', () => {
      this.clients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId} (Total: ${this.clients.size})`);
    });

    // Handle errors
    (ws as any).on('error', (error: any) => {
      console.error(`❌ WebSocket error for ${clientId}:`, error);
      this.clients.delete(clientId);
    });
  }

  /**
   * Handle messages from clients
   */
  private handleClientMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { type, payload } = message;

    switch (type) {
      case 'subscribe':
        if (payload.channel) {
          client.subscriptions.add(payload.channel);
          console.log(`📡 Client ${clientId} subscribed to ${payload.channel}`);
          
          // Send current status for subscribed channel
          this.sendCurrentStatus(clientId, payload.channel);
        }
        break;

      case 'unsubscribe':
        if (payload.channel) {
          client.subscriptions.delete(payload.channel);
          console.log(`📡 Client ${clientId} unsubscribed from ${payload.channel}`);
        }
        break;

      case 'heartbeat':
        client.lastPing = Date.now();
        this.sendToClient(clientId, 'heartbeat_response', { timestamp: new Date().toISOString() });
        break;

      case 'get_status':
        if (payload.channel) {
          this.sendCurrentStatus(clientId, payload.channel);
        }
        break;

      default:
        console.log(`🤷 Unknown message type from ${clientId}: ${type}`);
    }
  }

  /**
   * Send current status for a channel
   */
  private sendCurrentStatus(clientId: string, channel: string): void {
    switch (channel) {
      case 'dslr':
        if (this.lastDslrStatus) {
          this.sendToClient(clientId, 'dslr_status', this.lastDslrStatus);
        }
        break;
      case 'backup':
        if (this.lastBackupStatus) {
          this.sendToClient(clientId, 'backup_status', this.lastBackupStatus);
        }
        break;
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, type: string, payload: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) return;

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`❌ Error sending message to ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcast message to all subscribed clients
   */
  private broadcast(channel: string, type: string, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (client.subscriptions.has(channel) && client.ws.readyState === 1) {
        try {
          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`❌ Error broadcasting to ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    });

    if (sentCount > 0) {
      console.log(`📡 Broadcasted ${type} to ${sentCount} clients on channel ${channel}`);
    }
  }

  /**
   * Start heartbeat to check client connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 seconds

      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > timeout) {
          console.log(`💔 Client ${clientId} timed out`);
          (client.ws as any).terminate();
          this.clients.delete(clientId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start DSLR status monitoring
   */
  private startDslrMonitoring(): void {
    const checkDslrStatus = () => {
      try {
        // Read from file (updated by DSLR service)
        if (fs.existsSync(this.DSLR_STATUS_FILE)) {
          const data = fs.readFileSync(this.DSLR_STATUS_FILE, 'utf8');
          const currentStatus = JSON.parse(data);
          
          // Check if status changed
          if (JSON.stringify(currentStatus) !== JSON.stringify(this.lastDslrStatus)) {
            this.lastDslrStatus = currentStatus;
            
            // Broadcast to subscribed clients
            this.broadcast('dslr', 'dslr_status', currentStatus);
            
            // Send specific notifications for important events
            if (currentStatus.isConnected !== this.lastDslrStatus?.isConnected) {
              this.broadcast('dslr', 'camera_status', {
                status: currentStatus.isConnected ? 'connected' : 'disconnected',
                cameraModel: currentStatus.cameraModel,
                message: currentStatus.isConnected ? 'Camera connected and ready' : 'Camera disconnected'
              });
            }
            
            if (currentStatus.lastUpload && currentStatus.lastUpload !== this.lastDslrStatus?.lastUpload) {
              this.broadcast('dslr', 'upload_progress', {
                status: 'completed',
                fileName: 'New photo uploaded',
                timestamp: currentStatus.lastUpload
              });
            }
          }
        }
      } catch (error) {
        console.error('❌ Error monitoring DSLR status:', error);
      }
    };

    // Check every 2 seconds for real-time DSLR monitoring
    this.dslrStatusWatcher = setInterval(checkDslrStatus, 2000);
    checkDslrStatus(); // Initial check
  }

  /**
   * Start backup status monitoring
   */
  private startBackupMonitoring(): void {
    const checkBackupStatus = () => {
      try {
        // Import EventStorageManager untuk mendapatkan status backup
        const EventStorageManager = require('@/lib/event-storage-manager');
        const eventStorageManager = new EventStorageManager();
        
        const allBackups = await eventStorageManager.getAllBackupStatuses();
        const activeBackups = allBackups.filter((b: any) => 
          b.status === 'backing_up' || b.status === 'initializing'
        );
        
        // Check for status changes in active backups
        activeBackups.forEach((backup: any) => {
          const lastBackup = this.lastBackupStatus?.find((b: any) => b.backupId === backup.backupId);
          
          if (!lastBackup || 
              backup.processedPhotos !== lastBackup.processedPhotos ||
              backup.status !== lastBackup.status) {
            
            // Broadcast backup progress
            this.broadcast('backup', 'backup_progress', {
              backupId: backup.backupId,
              eventId: backup.eventId,
              status: backup.status,
              progress: backup.totalPhotos > 0 ? 
                Math.round((backup.processedPhotos / backup.totalPhotos) * 100) : 0,
              processedPhotos: backup.processedPhotos,
              totalPhotos: backup.totalPhotos,
              successfulUploads: backup.successfulUploads,
              failedUploads: backup.failedUploads
            });
            
            // Send notification for status changes
            if (backup.status === 'completed') {
              this.broadcast('backup', 'notification', {
                type: 'backup_complete',
                title: 'Backup Complete',
                message: `Event ${backup.eventId} backup completed successfully`,
                priority: 'high',
                data: backup
              });
            } else if (backup.status === 'failed') {
              this.broadcast('backup', 'notification', {
                type: 'backup_failed',
                title: 'Backup Failed',
                message: `Event ${backup.eventId} backup failed`,
                priority: 'critical',
                data: backup
              });
            }
          }
        });
        
        this.lastBackupStatus = allBackups;
        
      } catch (error) {
        console.error('❌ Error monitoring backup status:', error);
      }
    };

    // Check every 5 seconds for backup monitoring
    this.backupStatusWatcher = setInterval(checkBackupStatus, 5000);
    checkBackupStatus(); // Initial check
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Stop server
   */
  public stop(): void {
    console.log('🛑 Stopping WebSocket server...');
    
    // Clear intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.dslrStatusWatcher) {
      clearInterval(this.dslrStatusWatcher);
    }
    if (this.backupStatusWatcher) {
      clearInterval(this.backupStatusWatcher);
    }
    
    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();
    
    // Close server
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ WebSocket server stopped');
  }

  /**
   * Get server statistics
   */
  public getStats(): any {
    return {
      connectedClients: this.clients.size,
      subscriptions: Array.from(this.clients.values()).reduce((acc, client) => {
        client.subscriptions.forEach(sub => {
          acc[sub] = (acc[sub] || 0) + 1;
        });
        return acc;
      }, {} as Record<string, number>),
      uptime: process.uptime(),
      lastDslrUpdate: this.lastDslrStatus?.lastHeartbeat,
      lastBackupUpdate: this.lastBackupStatus?.length || 0
    };
  }
}

// Export singleton instance
let wsServer: RealTimeWebSocketServer | null = null;

export function getWebSocketServer(): RealTimeWebSocketServer {
  if (!wsServer) {
    const port = parseInt(process.env.WS_PORT || '3001');
    wsServer = new RealTimeWebSocketServer(port);
  }
  return wsServer;
}

export { RealTimeWebSocketServer };