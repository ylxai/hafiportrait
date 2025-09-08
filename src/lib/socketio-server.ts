/**
 * Socket.IO Server untuk Real-time Data
 * Enhanced version dengan auto-fallback, room management, dan mobile optimization
 */

import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

interface SocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id?: string;
  room?: string;
}

interface ConnectedClient {
  id: string;
  userId?: string;
  rooms: Set<string>;
  lastPing: number;
  transport: string;
  userAgent?: string;
}

interface RoomSubscription {
  room: string;
  clientId: string;
  subscribedAt: number;
}

class RealTimeSocketIOServer {
  private io: SocketIOServer | null = null;
  private server: any = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private dslrStatusWatcher: NodeJS.Timeout | null = null;
  private backupStatusWatcher: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  
  // File paths untuk monitoring
  private readonly DSLR_STATUS_FILE = path.join(process.cwd(), 'dslr-status.json');
  private readonly BACKUP_STATUS_FILE = path.join(process.cwd(), 'backup-status.json');
  
  // Cache untuk status terakhir
  private lastDslrStatus: any = null;
  private lastBackupStatus: any = null;
  
  // Rate limiting
  private rateLimiter: Map<string, number> = new Map();
  private readonly RATE_LIMIT = 100; // messages per minute
  
  constructor(private port: number = 3001) {
    this.setupServer();
  }

  /**
   * Setup Socket.IO server dengan middleware dan optimizations
   */
  private setupServer(): void {
    // Create HTTP server
    this.server = createServer();
    
    // Create Socket.IO server dengan optimizations
    this.io = new SocketIOServer(this.server, {
      path: '/socket.io/',
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.NEXT_PUBLIC_APP_URL || 'https://hafiportrait.photography']
          : ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
        credentials: true
      },
      // Transport optimizations
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      // Heartbeat settings
      pingTimeout: 60000,
      pingInterval: 25000,
      // Connection limits
      maxHttpBufferSize: 1e6, // 1MB
      // Upgrade timeout
      upgradeTimeout: 10000
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    console.log(`🚀 Socket.IO server configured on port ${this.port}`);
  }

  /**
   * Setup middleware untuk authentication dan rate limiting
   */
  private setupMiddleware(): void {
    if (!this.io) return;

    // Authentication middleware (optional untuk admin features)
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
          socket.data.userId = decoded.userId;
          socket.data.isAdmin = decoded.isAdmin || false;
        } catch (error: any) {
          console.warn('⚠️ Invalid token provided:', error.message);
          // Allow connection without auth for public features
        }
      }
      
      next();
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const clientId = socket.id;
      const currentCount = this.rateLimiter.get(clientId) || 0;
      
      if (currentCount > this.RATE_LIMIT) {
        console.warn(`⚠️ Rate limit exceeded for client: ${clientId}`);
        return next(new Error('Rate limit exceeded'));
      }
      
      next();
    });

    // Logging middleware
    this.io.use((socket, next) => {
      const userAgent = socket.handshake.headers['user-agent'];
      const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent || '');
      
      socket.data.userAgent = userAgent;
      socket.data.isMobile = isMobile;
      
      console.log(`🔌 New connection attempt: ${socket.id} (${isMobile ? 'Mobile' : 'Desktop'})`);
      next();
    });
  }

  /**
   * Setup event handlers untuk Socket.IO
   */
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new Socket.IO connection
   */
  private handleConnection(socket: any): void {
    const clientId = socket.id;
    const client: ConnectedClient = {
      id: clientId,
      userId: socket.data.userId,
      rooms: new Set(),
      lastPing: Date.now(),
      transport: socket.conn.transport.name,
      userAgent: socket.data.userAgent
    };

    this.clients.set(clientId, client);
    console.log(`✅ Client connected: ${clientId} via ${client.transport} (Total: ${this.clients.size})`);

    // Send welcome message dengan connection info
    socket.emit('connected', {
      clientId,
      transport: client.transport,
      timestamp: new Date().toISOString(),
      serverVersion: '2.0.0-socketio',
      features: ['rooms', 'compression', 'auto-fallback', 'mobile-optimized']
    });

    // Handle room subscriptions
    socket.on('join-room', (roomName: string) => {
      this.handleRoomJoin(socket, roomName);
    });

    socket.on('leave-room', (roomName: string) => {
      this.handleRoomLeave(socket, roomName);
    });

    // Handle client messages
    socket.on('message', (data: any) => {
      this.handleClientMessage(socket, data);
    });

    // Handle heartbeat
    socket.on('heartbeat', (data: any) => {
      this.handleHeartbeat(socket, data);
    });

    // Handle transport upgrade
    socket.conn.on('upgrade', () => {
      const newTransport = socket.conn.transport.name;
      console.log(`🔄 Client ${clientId} upgraded to ${newTransport}`);
      
      if (this.clients.has(clientId)) {
        this.clients.get(clientId)!.transport = newTransport;
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason: any) => {
      this.handleDisconnection(socket, reason);
    });

    // Handle errors
    socket.on('error', (error: any) => {
      console.error(`❌ Socket error for ${clientId}:`, error);
    });
  }

  /**
   * Handle room join dengan validation
   */
  private handleRoomJoin(socket: any, roomName: string): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);
    
    if (!client) return;

    // Validate room name
    const allowedRooms = ['dslr-monitoring', 'backup-status', 'admin-notifications', 'upload-progress'];
    if (!allowedRooms.includes(roomName)) {
      socket.emit('error', { message: `Invalid room: ${roomName}` });
      return;
    }

    // Check admin permissions for admin rooms
    if (roomName.includes('admin') && !socket.data.isAdmin) {
      socket.emit('error', { message: 'Admin access required' });
      return;
    }

    // Join room
    socket.join(roomName);
    client.rooms.add(roomName);

    // Track room subscriptions
    if (!this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.set(roomName, new Set());
    }
    this.roomSubscriptions.get(roomName)!.add(clientId);

    console.log(`📍 Client ${clientId} joined room: ${roomName}`);
    
    // Send current status for the room
    this.sendCurrentStatusToClient(socket, roomName);
    
    socket.emit('room-joined', { 
      room: roomName, 
      timestamp: new Date().toISOString(),
      clientsInRoom: this.roomSubscriptions.get(roomName)?.size || 0
    });
  }

  /**
   * Handle room leave
   */
  private handleRoomLeave(socket: any, roomName: string): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);
    
    if (!client) return;

    socket.leave(roomName);
    client.rooms.delete(roomName);

    if (this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.get(roomName)!.delete(clientId);
    }

    console.log(`📍 Client ${clientId} left room: ${roomName}`);
    socket.emit('room-left', { room: roomName, timestamp: new Date().toISOString() });
  }

  /**
   * Send current status untuk room yang baru di-join
   */
  private sendCurrentStatusToClient(socket: any, roomName: string): void {
    switch (roomName) {
      case 'dslr-monitoring':
        if (this.lastDslrStatus) {
          socket.emit('dslr_status', this.lastDslrStatus);
        }
        break;
      
      case 'backup-status':
        if (this.lastBackupStatus) {
          socket.emit('backup_status', this.lastBackupStatus);
        }
        break;
    }
  }

  /**
   * Handle client messages dengan rate limiting
   */
  private handleClientMessage(socket: any, data: any): void {
    const clientId = socket.id;
    
    // Update rate limiter
    const currentCount = this.rateLimiter.get(clientId) || 0;
    this.rateLimiter.set(clientId, currentCount + 1);
    
    console.log(`📨 Message from ${clientId}:`, data);
    
    // Echo message back untuk testing
    socket.emit('message-received', {
      originalMessage: data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle heartbeat dari client
   */
  private handleHeartbeat(socket: any, data: any): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);
    
    if (client) {
      client.lastPing = Date.now();
    }
    
    socket.emit('heartbeat-response', {
      timestamp: new Date().toISOString(),
      serverTime: Date.now()
    });
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnection(socket: any, reason: string): void {
    const clientId = socket.id;
    const client = this.clients.get(clientId);
    
    if (client) {
      // Remove from all rooms
      client.rooms.forEach(roomName => {
        if (this.roomSubscriptions.has(roomName)) {
          this.roomSubscriptions.get(roomName)!.delete(clientId);
        }
      });
      
      this.clients.delete(clientId);
      this.rateLimiter.delete(clientId);
    }
    
    console.log(`🔌 Client disconnected: ${clientId} (${reason}) (Remaining: ${this.clients.size})`);
  }

  /**
   * Start server dan monitoring services
   */
  public start(): void {
    if (!this.server) {
      console.error('❌ Server not configured');
      return;
    }

    this.server.listen(this.port, () => {
      console.log(`✅ Socket.IO server running on http://localhost:${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}/socket.io/`);
      
      // Start monitoring services
      this.startHeartbeat();
      this.startDslrMonitoring();
      this.startBackupMonitoring();
      this.startStatsLogging();
      this.startRateLimiterCleanup();
    });
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const staleClients: string[] = [];
      
      this.clients.forEach((client, clientId) => {
        if (now - client.lastPing > 90000) { // 90 seconds timeout
          staleClients.push(clientId);
        }
      });
      
      // Remove stale clients
      staleClients.forEach(clientId => {
        console.log(`🧹 Removing stale client: ${clientId}`);
        this.clients.delete(clientId);
        this.rateLimiter.delete(clientId);
      });
      
    }, 30000); // Check every 30 seconds
  }

  /**
   * Start DSLR status monitoring
   */
  private startDslrMonitoring(): void {
    this.dslrStatusWatcher = setInterval(() => {
      this.checkDslrStatus();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Check DSLR status dan broadcast changes
   */
  private checkDslrStatus(): void {
    try {
      if (fs.existsSync(this.DSLR_STATUS_FILE)) {
        const statusData = fs.readFileSync(this.DSLR_STATUS_FILE, 'utf8');
        const currentStatus = JSON.parse(statusData);
        
        // Check if status changed
        if (JSON.stringify(currentStatus) !== JSON.stringify(this.lastDslrStatus)) {
          this.lastDslrStatus = currentStatus;
          
          // Broadcast to dslr-monitoring room
          this.broadcastToRoom('dslr-monitoring', 'dslr_status', {
            ...currentStatus,
            timestamp: new Date().toISOString(),
            source: 'file-watcher'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error reading DSLR status:', error);
    }
  }

  /**
   * Start backup status monitoring
   */
  private startBackupMonitoring(): void {
    this.backupStatusWatcher = setInterval(() => {
      this.checkBackupStatus();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Check backup status dan broadcast changes
   */
  private checkBackupStatus(): void {
    try {
      if (fs.existsSync(this.BACKUP_STATUS_FILE)) {
        const statusData = fs.readFileSync(this.BACKUP_STATUS_FILE, 'utf8');
        const currentStatus = JSON.parse(statusData);
        
        // Check if status changed
        if (JSON.stringify(currentStatus) !== JSON.stringify(this.lastBackupStatus)) {
          this.lastBackupStatus = currentStatus;
          
          // Broadcast to backup-status room
          this.broadcastToRoom('backup-status', 'backup_status', {
            ...currentStatus,
            timestamp: new Date().toISOString(),
            source: 'file-watcher'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error reading backup status:', error);
    }
  }

  /**
   * Broadcast message to specific room
   */
  public broadcastToRoom(roomName: string, eventName: string, data: any): void {
    if (!this.io) return;
    
    const subscriberCount = this.roomSubscriptions.get(roomName)?.size || 0;
    if (subscriberCount > 0) {
      this.io.to(roomName).emit(eventName, data);
      console.log(`📡 Broadcasted ${eventName} to room ${roomName} (${subscriberCount} clients)`);
    }
  }

  /**
   * Broadcast to all connected clients
   */
  public broadcast(eventName: string, data: any): void {
    if (!this.io) return;
    
    this.io.emit(eventName, data);
    console.log(`📡 Broadcasted ${eventName} to all clients (${this.clients.size} clients)`);
  }

  /**
   * Start stats logging
   */
  private startStatsLogging(): void {
    this.statsInterval = setInterval(() => {
      const stats = this.getStats();
      console.log('📊 Socket.IO Server Stats:', {
        connectedClients: stats.connectedClients,
        roomSubscriptions: stats.roomSubscriptions,
        transports: stats.transports,
        uptime: `${Math.floor(stats.uptime / 60)}m ${Math.floor(stats.uptime % 60)}s`
      });
    }, 60000); // Log every minute
  }

  /**
   * Start rate limiter cleanup
   */
  private startRateLimiterCleanup(): void {
    setInterval(() => {
      this.rateLimiter.clear();
    }, 60000); // Reset rate limits every minute
  }

  /**
   * Stop server dan cleanup
   */
  public stop(): void {
    console.log('🛑 Stopping Socket.IO server...');
    
    // Clear intervals
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.dslrStatusWatcher) clearInterval(this.dslrStatusWatcher);
    if (this.backupStatusWatcher) clearInterval(this.backupStatusWatcher);
    if (this.statsInterval) clearInterval(this.statsInterval);
    
    // Disconnect all clients
    if (this.io) {
      this.io.disconnectSockets(true);
    }
    
    // Clear data structures
    this.clients.clear();
    this.roomSubscriptions.clear();
    this.rateLimiter.clear();
    
    // Close server
    if (this.io) {
      this.io.close();
    }
    if (this.server) {
      this.server.close();
    }
    
    console.log('✅ Socket.IO server stopped');
  }

  /**
   * Get server statistics
   */
  public getStats(): any {
    const transports = new Map();
    this.clients.forEach(client => {
      const transport = client.transport;
      transports.set(transport, (transports.get(transport) || 0) + 1);
    });

    return {
      connectedClients: this.clients.size,
      roomSubscriptions: Object.fromEntries(
        Array.from(this.roomSubscriptions.entries()).map(([room, clients]) => [room, clients.size])
      ),
      transports: Object.fromEntries(transports),
      uptime: process.uptime(),
      lastDslrUpdate: this.lastDslrStatus?.lastHeartbeat,
      lastBackupUpdate: Array.isArray(this.lastBackupStatus) ? this.lastBackupStatus.length : 0,
      rateLimit: {
        activeClients: this.rateLimiter.size,
        limit: this.RATE_LIMIT
      }
    };
  }
}

// Export singleton instance
let socketIOServer: RealTimeSocketIOServer | null = null;

export function getSocketIOServer(): RealTimeSocketIOServer {
  if (!socketIOServer) {
    const port = parseInt(process.env.SOCKETIO_PORT || process.env.WS_PORT || '3001');
    socketIOServer = new RealTimeSocketIOServer(port);
  }
  return socketIOServer;
}

export { RealTimeSocketIOServer };