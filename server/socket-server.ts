
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import http from 'http';
import { verifyJWT } from '../lib/auth';
import { PrismaClient } from '@prisma/client';
// Initialize Prisma
const prisma = new PrismaClient();

// Configuration
const PORT = parseInt(process.env.SOCKET_PORT || '3001', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'https://hafiportrait.photography',
      'https://www.hafiportrait.photography'
    ];

interface AuthPayload {
  userId?: string;
  role?: string;
  guestToken?: string;
  // Backward compatible: historically clients send `eventId` but it actually contains the event slug.
  eventId?: string;
  // Preferred field name (explicit): eventSlug
  eventSlug?: string;
  sessionType: 'admin' | 'authenticated' | 'guest';
}

// Augment Socket interface
declare module 'socket.io' {
  interface Socket {
    auth?: AuthPayload;
    userId?: string;
    guestToken?: string;
    sessionType?: string;
    authorizedEvents?: Set<string>;
  }
}

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
  maxHttpBufferSize: 1e6, // 1MB limit
});

// Redis adapter setup
async function setupRedisAdapter() {
  if (process.env.SOCKET_REDIS_DISABLED === 'true') {
    console.log('ℹ️ Redis adapter disabled via SOCKET_REDIS_DISABLED=true')
    return null;
  }

  try {
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([
      pubClient.connect(),
      subClient.connect()
    ]);

    io.adapter(createAdapter(pubClient, subClient));
    
    console.log('✓ Redis adapter connected successfully');
    
    pubClient.on('error', (err) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err) => console.error('Redis Sub Client Error:', err));
    
    return { pubClient, subClient };
  } catch (error: any) {
    console.warn('⚠ Redis adapter setup failed, running without clustering:', error.message);
    return null;
  }
}

// Room management
const eventRooms = new Map<string, Set<string>>(); // eventSlug -> Set of socketIds
const guestCounts = new Map<string, number>(); // eventSlug -> count
const socketAuth = new Map<string, AuthPayload>(); // socketId -> auth payload
const rateLimits = new Map<string, { count: number, resetAt: number }>();

function checkRateLimit(key: string, maxEvents: number, windowMs: number): boolean {
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

// Verify Event Access (Async with DB check)
async function validateEventAccess(socket: Socket, eventSlug: string): Promise<boolean> {
  const auth = socket.auth;
  if (!auth) return false;

  // 1. Admin always access
  if (auth.sessionType === 'admin') return true;

  // 2. Guest access - strictly linked to the event slug in their session
  if (auth.sessionType === 'guest') {
    const slugFromAuth = auth.eventSlug ?? auth.eventId;
    return slugFromAuth === eventSlug;
  }

  // 3. Authenticated User (Photographer/Client)
  if (auth.sessionType === 'authenticated' && auth.userId) {
    // Check in-memory cache
    if (socket.authorizedEvents?.has(eventSlug)) {
      return true;
    }

    try {
      // Verify ownership in DB
      const event = await prisma.events.findUnique({
        where: { slug: eventSlug },
        select: { client_id: true }
      });

      if (event && event.client_id === auth.userId) {
        socket.authorizedEvents?.add(eventSlug);
        return true;
      }
    } catch (error) {
      console.error('Error verifying event ownership:', error);
      return false;
    }
  }

  return false;
}

// Authentication Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    const guestSessionId = socket.handshake.auth.guestSessionId;
    const eventSlug = socket.handshake.auth.eventSlug;
    const eventId = socket.handshake.auth.eventId; // backward compatible (often contains slug)

    let authPayload: AuthPayload | null = null;

    // Try JWT authentication
    if (token) {
      try {
        const jwtPayload = await verifyJWT(token);
        
        if (jwtPayload) {
          authPayload = {
            userId: jwtPayload.user_id,
            role: jwtPayload.role,
            sessionType: jwtPayload.role === 'ADMIN' ? 'admin' : 'authenticated',
          };
        }
      } catch (error) {
        console.error('JWT verification failed:', error);
      }
    }

    // Try Guest Session
    if (!authPayload && guestSessionId && (eventSlug || eventId)) {
      const resolvedEventSlug = (eventSlug ?? eventId) as string;

      // Phase 3 hardening: verify guest session against DB (prevents spoofed guestSessionId)
      if (process.env.SOCKET_GUEST_SESSION_VALIDATION_DISABLED !== 'true') {
        const event = await prisma.events.findUnique({
          where: { slug: resolvedEventSlug },
          select: { id: true },
        });

        if (!event) {
          return next(new Error('Invalid event'));
        }

        const session = await prisma.guest_sessions.findFirst({
          where: {
            session_id: guestSessionId,
            event_id: event.id,
            expires_at: { gt: new Date() },
          },
          select: { session_id: true },
        });

        if (!session) {
          return next(new Error('Invalid guest session'));
        }

        // Best-effort update last access
        prisma.guest_sessions
          .update({
            where: { session_id: guestSessionId },
            data: { last_access_at: new Date() },
          })
          .catch(() => {
            // ignore
          });
      }

      authPayload = {
        guestToken: guestSessionId,
        eventSlug: resolvedEventSlug,
        // Keep the legacy field as well for backward compatibility
        eventId: eventId,
        sessionType: 'guest',
      };
    }

    if (!authPayload) {
      return next(new Error('Authentication required'));
    }

    socket.auth = authPayload;
    socket.userId = authPayload.userId;
    socket.guestToken = authPayload.guestToken;
    socket.sessionType = authPayload.sessionType;
    socket.authorizedEvents = new Set(); // Initialize cache

    socketAuth.set(socket.id, authPayload);
    console.log(`✓ Socket authenticated: ${socket.id} (${authPayload.sessionType})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (${socket.sessionType})`);

  // Event: Join
  socket.on('event:join', async (eventSlug: string) => {
    if (!eventSlug) return;
    
    // SECURITY: Async Check
    const allowed = await validateEventAccess(socket, eventSlug);
    if (!allowed) {
      socket.emit('error', { message: 'Access denied to this event' });
      return;
    }
    
    // Rate Limit
    const rateLimitKey = `join:${socket.id}`;
    if (!checkRateLimit(rateLimitKey, 5, 10000)) {
      socket.emit('error', { message: 'Too many join requests' });
      return;
    }
    
    socket.join(`event:${eventSlug}`);
    
    if (!eventRooms.has(eventSlug)) {
      eventRooms.set(eventSlug, new Set());
      guestCounts.set(eventSlug, 0);
    }
    eventRooms.get(eventSlug)?.add(socket.id);
    
    const guestCount = eventRooms.get(eventSlug)?.size || 0;
    guestCounts.set(eventSlug, guestCount);
    
    io.to(`event:${eventSlug}`).emit('guest:joined', { guestCount });
    console.log(`Socket ${socket.id} joined event:${eventSlug}`);
  });

  // Event: Leave
  socket.on('event:leave', (eventSlug: string) => {
    if (!eventSlug) return;
    
    socket.leave(`event:${eventSlug}`);
    
    const room = eventRooms.get(eventSlug);
    if (room) {
      room.delete(socket.id);
      const guestCount = room.size;
      guestCounts.set(eventSlug, guestCount);
      
      io.to(`event:${eventSlug}`).emit('guest:left', { guestCount });
      
      if (guestCount === 0) {
        eventRooms.delete(eventSlug);
        guestCounts.delete(eventSlug);
      }
    }
  });

  // Protected Events (Like/Comment)
  // Standardized payload: use `photo_id` (snake_case) consistently.
  // Backward compatibility: accept both `photo_id` and `photoId` from clients.
  socket.on('photo:like', async ({ eventSlug, photo_id, photoId, likeCount }: any) => {
    if (!(await validateEventAccess(socket, eventSlug))) return;

    const rateLimitKey = `like:${socket.id}`;
    if (!checkRateLimit(rateLimitKey, 10, 1000)) return;

    const resolvedPhotoId = photo_id ?? photoId;
    if (!resolvedPhotoId) return;

    io.to(`event:${eventSlug}`).emit('photo:like', {
      photo_id: resolvedPhotoId,
      likeCount,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('photo:comment', async ({ eventSlug, photo_id, photoId, comment }: any) => {
    if (!(await validateEventAccess(socket, eventSlug))) return;

    const rateLimitKey = `comment:${socket.id}`;
    if (!checkRateLimit(rateLimitKey, 3, 5000)) return;

    const resolvedPhotoId = photo_id ?? photoId;
    if (!resolvedPhotoId) return;

    io.to(`event:${eventSlug}`).emit('photo:comment', {
      photo_id: resolvedPhotoId,
      comment,
      timestamp: new Date().toISOString(),
    });
  });

  // Upload Events (Admin/Auth Only)
  // Standardized payload: use `photo_id` (snake_case) consistently.
  // Backward compatibility: accept both `photo_id` and `photoId` from clients.
  socket.on('photo:upload:progress', async ({ eventSlug, photo_id, photoId, progress, filename }: any) => {
    if (socket.sessionType !== 'admin' && socket.sessionType !== 'authenticated') return;
    if (!(await validateEventAccess(socket, eventSlug))) return;

    const resolvedPhotoId = photo_id ?? photoId;
    if (!resolvedPhotoId) return;

    io.to(`event:${eventSlug}`).emit('photo:upload:progress', {
      photo_id: resolvedPhotoId,
      progress,
      filename, // sanitized by frontend usually, but could add sanitization here
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('photo:upload:complete', async ({ eventSlug, photo }: any) => {
    if (socket.sessionType !== 'admin' && socket.sessionType !== 'authenticated') return;
    if (!(await validateEventAccess(socket, eventSlug))) return;
    
    io.to(`event:${eventSlug}`).emit('photo:upload:complete', {
      photo,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    socketAuth.delete(socket.id);
    // Cleanup rooms...
    eventRooms.forEach((sockets, eventSlug) => {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id);
        const guestCount = sockets.size;
        guestCounts.set(eventSlug, guestCount);
        io.to(`event:${eventSlug}`).emit('guest:left', { guestCount });
      }
    });
  });
});

async function start() {
  try {
    await setupRedisAdapter();
    server.listen(PORT, () => {
      console.log(`> Secure Socket Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
