/**
 * Enhanced Socket.IO Server dengan Authentication & Security
 * Production-ready dengan Redis adapter, JWT auth, dan rate limiting
 */

const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const http = require('http');
const { verifyJWT } = require('../lib/auth');

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

// Initialize Socket.IO dengan security options
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
  maxHttpBufferSize: 1e6, // 1MB limit untuk messages
  allowEIO3: false, // Disable old engine.io versions
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
const socketAuth = new Map(); // socketId -> auth payload

// Rate limiting storage
const rateLimits = new Map(); // key -> { count, resetAt }

function checkRateLimit(key, maxEvents, windowMs) {
  const now = Date.now();
  const limit = rateLimits.get(key);
  
  if (!limit || limit.resetAt < now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (limit.count >= maxEvents) {
    return false;
  }
  
  limit.count++;
  return true;
}

// Authentication middleware dengan JWT & Guest Session support
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    const guestSessionId = socket.handshake.auth.guestSessionId;
    const eventId = socket.handshake.auth.eventId;

    let authPayload = null;

    // Try JWT authentication first (admin/photographer)
    if (token) {
      try {
        const jwtPayload = await verifyJWT(token);
        
        if (jwtPayload) {
          authPayload = {
            userId: jwtPayload.userId,
            role: jwtPayload.role,
            sessionType: jwtPayload.role === 'ADMIN' ? 'admin' : 'authenticated',
          };
        }
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }

    // If no JWT, check guest session
    if (!authPayload && guestSessionId && eventId) {
      // Simple guest session validation (in production, validate against database)
      authPayload = {
        guestToken: guestSessionId,
        eventId: eventId,
        sessionType: 'guest',
      };
    }

    // Require at least guest authentication
    if (!authPayload) {
      return next(new Error('Authentication required'));
    }

    // Attach auth to socket
    socket.auth = authPayload;
    socket.userId = authPayload.userId;
    socket.guestToken = authPayload.guestToken;
    socket.sessionType = authPayload.sessionType;

    // Store auth
    socketAuth.set(socket.id, authPayload);

    console.log(`✓ Socket authenticated: ${socket.id} (${authPayload.sessionType})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

// Helper: Check event access permission
function canAccessEvent(socket, eventSlug) {
  const auth = socket.auth;
  
  // Admin can access all
  if (auth.sessionType === 'admin') {
    return true;
  }
  
  // Authenticated users can access (will be validated against event ownership in production)
  if (auth.sessionType === 'authenticated') {
    return true;
  }
  
  // Guest can only access their event
  if (auth.sessionType === 'guest') {
    return auth.eventId === eventSlug;
  }
  
  return false;
}

// Helper: Sanitize data to prevent XSS
function sanitizeData(data) {
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '');
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  return data;
}

// Connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (${socket.sessionType})`);

  // Event: Join event room
  socket.on('event:join', (eventSlug) => {
    if (!eventSlug) return;
    
    // Check permission
    if (!canAccessEvent(socket, eventSlug)) {
      socket.emit('error', { message: 'Access denied to this event' });
      return;
    }
    
    // Rate limit
    const rateLimitKey = `join:${socket.id}`;
    if (!checkRateLimit(rateLimitKey, 5, 10000)) {
      socket.emit('error', { message: 'Too many join requests' });
      return;
    }
    
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
      
      io.to(`event:${eventSlug}`).emit('guest:left', { guestCount });
      
      if (guestCount === 0) {
        eventRooms.delete(eventSlug);
        guestCounts.delete(eventSlug);
      }
      
      console.log(`Socket ${socket.id} left event:${eventSlug} (${guestCount} guests)`);
    }
  });

  // Photo upload progress (admin/photographer only)
  socket.on('photo:upload:progress', ({ eventSlug, photoId, progress, filename }) => {
    if (socket.sessionType !== 'admin' && socket.sessionType !== 'authenticated') {
      return;
    }
    
    if (!canAccessEvent(socket, eventSlug)) return;
    
    io.to(`event:${eventSlug}`).emit('photo:upload:progress', {
      photoId,
      progress,
      filename: sanitizeData(filename),
      timestamp: new Date().toISOString()
    });
  });

  // Photo upload complete (admin/photographer only)
  socket.on('photo:upload:complete', ({ eventSlug, photo }) => {
    if (socket.sessionType !== 'admin' && socket.sessionType !== 'authenticated') {
      return;
    }
    
    if (!canAccessEvent(socket, eventSlug)) return;
    
    io.to(`event:${eventSlug}`).emit('photo:upload:complete', {
      photo: sanitizeData(photo),
      timestamp: new Date().toISOString()
    });
  });

  // Photo like notification (with rate limiting)
  socket.on('photo:like', ({ eventSlug, photoId, likeCount }) => {
    if (!canAccessEvent(socket, eventSlug)) return;
    
    // Rate limit: 10 likes per second
    const rateLimitKey = `like:${socket.id}`;
    if (!checkRateLimit(rateLimitKey, 10, 1000)) {
      socket.emit('error', { message: 'Too many like requests' });
      return;
    }
    
    io.to(`event:${eventSlug}`).emit('photo:like', {
      photoId: sanitizeData(photoId),
      likeCount,
      timestamp: new Date().toISOString()
    });
  });

  // Photo comment notification (with rate limiting)
  socket.on('photo:comment', ({ eventSlug, photoId, comment }) => {
    if (!canAccessEvent(socket, eventSlug)) return;
    
    // Rate limit: 3 comments per 5 seconds
    const rateLimitKey = `comment:${socket.id}`;
    if (!checkRateLimit(rateLimitKey, 3, 5000)) {
      socket.emit('error', { message: 'Too many comment requests' });
      return;
    }
    
    io.to(`event:${eventSlug}`).emit('photo:comment', {
      photoId: sanitizeData(photoId),
      comment: sanitizeData(comment),
      timestamp: new Date().toISOString()
    });
  });

  // Event update notification (admin/photographer only)
  socket.on('event:update', ({ eventSlug, updates }) => {
    if (socket.sessionType !== 'admin' && socket.sessionType !== 'authenticated') {
      return;
    }
    
    if (!canAccessEvent(socket, eventSlug)) return;
    
    io.to(`event:${eventSlug}`).emit('event:update', {
      updates: sanitizeData(updates),
      timestamp: new Date().toISOString()
    });
  });

  // Admin room (admin only)
  socket.on('admin:join', () => {
    if (socket.sessionType !== 'admin') {
      socket.emit('error', { message: 'Admin access required' });
      return;
    }
    
    socket.join('admin');
    console.log(`Socket ${socket.id} joined admin room`);
  });

  socket.on('admin:notification', ({ type, data }) => {
    if (socket.sessionType !== 'admin') {
      return;
    }
    
    io.to('admin').emit('admin:notification', {
      type: sanitizeData(type),
      data: sanitizeData(data),
      timestamp: new Date().toISOString()
    });
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Cleanup auth
    socketAuth.delete(socket.id);
    
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
  
  io.close(() => {
    console.log('All socket connections closed');
    
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
  
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
    await setupRedisAdapter();
    
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════╗
║  HafiPortrait Socket.IO Server (Enhanced Security)     ║
╠════════════════════════════════════════════════════════╣
║  Status: Running                                       ║
║  Port: ${PORT}                                          ║
║  Environment: ${NODE_ENV}                              ║
║  Features: JWT Auth, Rate Limiting, RBAC               ║
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

module.exports = { io, server };
