/**
 * Standalone Socket.IO Server for HafiPortrait Photography Platform
 * Production-ready dengan Redis adapter untuk horizontal scaling
 */

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const http = require('http');

// Configuration
const PORT = process.env.SOCKET_PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'https://hafiportrait.photography',
      'https://www.hafiportrait.photography'
    ];

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      uptime: process.uptime(),
      connections: io.engine.clientsCount 
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
});

// Redis adapter setup untuk scaling
async function setupRedisAdapter() {
  try {
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    
    console.log('✓ Redis adapter connected successfully');
    
    // Redis error handlers
    pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
    
    return { pubClient, subClient };
  } catch (error) {
    console.warn('⚠ Redis adapter setup failed, running without clustering:', error.message);
    return null;
  }
}

// Room management
const eventRooms = new Map(); // eventSlug -> Set of socketIds
const guestCounts = new Map(); // eventSlug -> count

// Authentication middleware (optional - validate JWT if needed)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Add JWT validation here if needed
  // For now, allow all connections
  next();
});

// Connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Event: Join event room
  socket.on('event:join', (eventSlug) => {
    if (!eventSlug) return;
    
    socket.join(`event:${eventSlug}`);
    
    // Track room membership
    if (!eventRooms.has(eventSlug)) {
      eventRooms.set(eventSlug, new Set());
      guestCounts.set(eventSlug, 0);
    }
    eventRooms.get(eventSlug).add(socket.id);
    
    const guestCount = eventRooms.get(eventSlug).size;
    guestCounts.set(eventSlug, guestCount);
    
    // Notify room about new guest
    io.to(`event:${eventSlug}`).emit('guest:joined', { guestCount });
    
    console.log(`Socket ${socket.id} joined event:${eventSlug} (${guestCount} guests)`);
  });

  // Event: Leave event room
  socket.on('event:leave', (eventSlug) => {
    if (!eventSlug) return;
    
    socket.leave(`event:${eventSlug}`);
    
    if (eventRooms.has(eventSlug)) {
      eventRooms.get(eventSlug).delete(socket.id);
      const guestCount = eventRooms.get(eventSlug).size;
      guestCounts.set(eventSlug, guestCount);
      
      // Notify room about guest leaving
      io.to(`event:${eventSlug}`).emit('guest:left', { guestCount });
      
      // Cleanup empty rooms
      if (guestCount === 0) {
        eventRooms.delete(eventSlug);
        guestCounts.delete(eventSlug);
      }
      
      console.log(`Socket ${socket.id} left event:${eventSlug} (${guestCount} guests)`);
    }
  });

  // Photo upload progress
  socket.on('photo:upload:progress', ({ eventSlug, photoId, progress, filename }) => {
    io.to(`event:${eventSlug}`).emit('photo:upload:progress', {
      photoId,
      progress,
      filename,
      timestamp: new Date().toISOString()
    });
  });

  // Photo upload complete
  socket.on('photo:upload:complete', ({ eventSlug, photo }) => {
    io.to(`event:${eventSlug}`).emit('photo:upload:complete', {
      photo,
      timestamp: new Date().toISOString()
    });
  });

  // New like notification
  socket.on('photo:like', ({ eventSlug, photoId, likeCount }) => {
    io.to(`event:${eventSlug}`).emit('photo:like', {
      photoId,
      likeCount,
      timestamp: new Date().toISOString()
    });
  });

  // New comment notification
  socket.on('photo:comment', ({ eventSlug, photoId, comment }) => {
    io.to(`event:${eventSlug}`).emit('photo:comment', {
      photoId,
      comment,
      timestamp: new Date().toISOString()
    });
  });

  // Event update notification
  socket.on('event:update', ({ eventSlug, updates }) => {
    io.to(`event:${eventSlug}`).emit('event:update', {
      updates,
      timestamp: new Date().toISOString()
    });
  });

  // Admin notifications (broadcast to admin room)
  socket.on('admin:join', () => {
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('admin:notification', ({ type, data }) => {
    io.to('admin').emit('admin:notification', {
      type,
      data,
      timestamp: new Date().toISOString()
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Cleanup from all event rooms
    eventRooms.forEach((sockets, eventSlug) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        const guestCount = sockets.size;
        guestCounts.set(eventSlug, guestCount);
        
        io.to(`event:${eventSlug}`).emit('guest:left', { guestCount });
        
        if (guestCount === 0) {
          eventRooms.delete(eventSlug);
          guestCounts.delete(eventSlug);
        }
      }
    });
  });

  // Error handler
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  
  // Close all socket connections
  io.close(() => {
    console.log('All socket connections closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
  
  // Force close after timeout
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
async function start() {
  try {
    // Setup Redis adapter if available
    await setupRedisAdapter();
    
    // Start listening
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  HafiPortrait Socket.IO Server                         ║
╠════════════════════════════════════════════════════════╣
║  Status: Running                                       ║
║  Port: ${PORT}                                          ║
║  Environment: ${NODE_ENV}                              ║
║  Health Check: http://localhost:${PORT}/health         ║
╚════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

// Export for testing
module.exports = { io, server };
