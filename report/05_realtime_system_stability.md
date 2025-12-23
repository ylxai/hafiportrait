# Analisis Isu Stabilitas dan Skalabilitas Sistem Real-time Hafiportrait

## Overview
Dokumen ini menganalisis berbagai isu terkait stabilitas dan skalabilitas pada sistem real-time Hafiportrait, termasuk Socket.IO server, real-time updates, dan mekanisme komunikasi antar komponen.

## 1. Memory Leak pada Socket Server

### Deskripsi Masalah
Socket server menyimpan state di memory tanpa batas maksimum dan tanpa mekanisme pembersihan otomatis.

### Lokasi Kode
- `/server/socket-server.js`

### Penyebab
```javascript
const eventRooms = new Map(); // Tidak memiliki batas ukuran
const guestCounts = new Map(); // Bisa bertambah terus tanpa batas
```

Struktur data ini bisa terus bertambah tanpa batas waktu, terutama jika:
- Event tidak pernah dihapus
- Server berjalan sangat lama
- Tidak ada cleanup otomatis untuk room yang tidak aktif

### Dampak
- Memory usage terus meningkat seiring waktu
- Potensi server crash karena out of memory
- Degradasi kinerja seiring bertambahnya jumlah room

### Solusi Rekomendasi
```javascript
// Implementasi cleanup otomatis
const cleanupInactiveRooms = () => {
  const now = Date.now();
  const inactiveTimeout = 24 * 60 * 60 * 1000; // 24 hours
  
  guestCounts.forEach((count, eventSlug) => {
    // Cek apakah room benar-benar tidak aktif
    const roomClients = io.sockets.adapter.rooms.get(`event:${eventSlug}`);
    if (!roomClients || roomClients.size === 0) {
      const lastAccess = roomAccessTimes.get(eventSlug) || 0;
      if (now - lastAccess > inactiveTimeout) {
        eventRooms.delete(eventSlug);
        guestCounts.delete(eventSlug);
        roomAccessTimes.delete(eventSlug);
      }
    }
  });
};

// Jalankan cleanup setiap 1 jam
setInterval(cleanupInactiveRooms, 60 * 60 * 1000);
```

## 2. Redis Adapter Fallback Tidak Aman

### Deskripsi Masalah
Jika Redis gagal, sistem tetap berjalan tanpa clustering support, menyebabkan isu konsistensi pada load balancing.

### Lokasi Kode
- `/server/socket-server.js`

### Penyebab
```javascript
try {
    io.adapter(createAdapter(pubClient, subClient));
} catch (error) {
    console.warn('⚠ Redis adapter setup failed, running without clustering:', error.message);
    return null; // Sistem tetap berjalan
}
```

### Dampak
- Tidak bisa di-scale ke multiple instances
- Data tidak konsisten antar server instances
- Single point of failure

### Solusi Rekomendasi
```javascript
// Mode production harus memiliki Redis
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
  console.error('Redis is required for production environment');
  process.exit(1);
}

// Atau gunakan fallback strategy yang lebih aman
const setupRedisAdapter = async () => {
  if (!process.env.REDIS_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Redis is required in production');
    }
    console.log('⚠ Running without Redis adapter (development mode)');
    return null;
  }
  
  // Setup dengan retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      const pubClient = createClient({ url: process.env.REDIS_URL });
      const subClient = pubClient.duplicate();
      
      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      
      console.log('✓ Redis adapter connected successfully');
      return { pubClient, subClient };
    } catch (error) {
      retries--;
      console.warn(`⚠ Redis connection failed, retries left: ${retries}`, error.message);
      if (retries === 0) {
        if (process.env.NODE_ENV === 'production') {
          throw new Error('Failed to connect to Redis after retries');
        }
        console.warn('Running without Redis in development');
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s before retry
    }
  }
};
```

## 3. Session Management Tidak Persisten

### Deskripsi Masalah
State real-time tidak memiliki persistensi ke database, jika server restart semua state hilang.

### Lokasi Kode
- `/server/socket-server.js`
- Guest counter dan session state

### Penyebab
- Semua state disimpan di memory server
- Tidak ada sinkronisasi dengan database
- Tidak ada recovery mechanism saat restart

### Dampak
- Data real-time hilang saat restart
- Inconsistency state antar restart
- User experience terganggu

### Solusi Rekomendasi
```javascript
// Gunakan database untuk track real-time state
class RealtimeStateService {
  async incrementGuestCount(eventSlug) {
    // Update di database dan broadcast
    const count = await prisma.event_settings.update({
      where: { event_id: eventSlug },
      data: { 
        // Gunakan raw query untuk atomic increment
        _raw: {
          guest_count: 'guest_count + 1'
        }
      },
      select: { guest_count: true }
    });
    
    // Broadcast ke semua client
    io.to(`event:${eventSlug}`).emit('guest:joined', { guestCount: count });
    return count;
  }
  
  async syncStateToMemory() {
    // Sinkronkan state dari database ke memory saat startup
    const activeEvents = await prisma.events.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true }
    });
    
    for (const event of activeEvents) {
      // Dapatkan guest count dari database
      const count = await this.getGuestCountFromDB(event.slug);
      guestCounts.set(event.slug, count);
    }
  }
}
```

## 4. Tidak Ada Rate Limiting pada Socket Events

### Deskripsi Masalah
Pengguna bisa spam event seperti `photo:like` atau `photo:comment` tanpa rate limiting.

### Lokasi Kode
- `/server/socket-server.js` - semua socket event listeners

### Penyebab
- Tidak ada validasi frekuensi event per socket/user
- Tidak ada rate limiting mechanism
- Tidak ada otentikasi per event

### Dampak
- Server bisa dibebani oleh spam events
- Potensi DoS attack melalui socket events
- Performance degradation

### Solusi Rekomendasi
```javascript
// Implementasi rate limiting per socket
const socketRateLimiter = new Map(); // socketId -> { events: Map, lastReset: number }

const checkRateLimit = (socketId, eventType) => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxEvents = 60; // Max 60 events per minute per socket
  
  if (!socketRateLimiter.has(socketId)) {
    socketRateLimiter.set(socketId, {
      events: new Map(),
      lastReset: now
    });
  }
  
  const socketLimiter = socketRateLimiter.get(socketId);
  
  // Reset window jika perlu
  if (now - socketLimiter.lastReset > windowMs) {
    socketLimiter.events.clear();
    socketLimiter.lastReset = now;
  }
  
  const eventCount = socketLimiter.events.get(eventType) || 0;
  
  if (eventCount >= maxEvents) {
    return false; // Rate limit exceeded
  }
  
  socketLimiter.events.set(eventType, eventCount + 1);
  return true;
};

// Gunakan di event listener
socket.on('photo:like', ({ eventSlug, photoId }) => {
  if (!checkRateLimit(socket.id, 'photo:like')) {
    socket.emit('error', { message: 'Rate limit exceeded' });
    return;
  }
  
  // Proses like
  io.to(`event:${eventSlug}`).emit('photo:like', { photoId, likeCount: newCount });
});
```

## 5. Connection Management Tidak Optimal

### Deskripsi Masalah
Tidak ada batas maksimum koneksi per IP atau timeout otomatis untuk koneksi idle.

### Lokasi Kode
- `/server/socket-server.js` - connection handling

### Penyebab
- Socket.IO konfigurasi default
- Tidak ada IP-based rate limiting
- Tidak ada idle connection timeout

### Dampak
- Potensi connection exhaustion
- DoS attack melalui banyak koneksi
- Resource usage tidak efisien

### Solusi Rekomendasi
```javascript
// Konfigurasi Socket.IO dengan connection management
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000, // Kurangi dari 60s
  pingInterval: 20000, // Kurangi dari 25s
  maxHttpBufferSize: 1e6, // 1MB
  serveClient: false,
  // Tambahkan adapter untuk connection management
  perMessageDeflate: false, // Nonaktifkan per-message deflate
});

// IP-based connection tracking
const ipConnections = new Map(); // ip -> connection count
const MAX_CONNECTIONS_PER_IP = 10;

io.use((socket, next) => {
  const ip = socket.handshake.headers['x-forwarded-for'] || 
             socket.handshake.address;
  
  const currentCount = ipConnections.get(ip) || 0;
  
  if (currentCount >= MAX_CONNECTIONS_PER_IP) {
    next(new Error('Too many connections from this IP'));
    return;
  }
  
  // Track connection
  ipConnections.set(ip, currentCount + 1);
  
  // Cleanup on disconnect
  socket.on('disconnect', () => {
    const count = ipConnections.get(ip) || 0;
    if (count <= 1) {
      ipConnections.delete(ip);
    } else {
      ipConnections.set(ip, count - 1);
    }
  });
  
  next();
});
```

## 6. Performance Issues pada Broadcast

### Deskripsi Masalah
Satu broadcast bisa menyebabkan beban tinggi pada server jika satu event memiliki banyak pengunjung.

### Lokasi Kode
- `/server/socket-server.js` - semua `io.to().emit()`

### Penyebab
- Broadcast ke semua member room tanpa batch processing
- Tidak ada queue mechanism untuk broadcast
- Tidak ada error handling untuk failed broadcast

### Dampak
- Server performance degradation saat banyak subscriber
- Potential memory issues
- Failed broadcasts without recovery

### Solusi Rekomendasi
```javascript
// Implementasi batch broadcast dengan error handling
const broadcastToRoom = async (room, event, data) => {
  const roomClients = io.sockets.adapter.rooms.get(room);
  if (!roomClients) return;
  
  const batchSize = 50; // Kirim dalam batch
  const clientIds = Array.from(roomClients);
  
  // Kirim dalam batch untuk mengurangi beban
  for (let i = 0; i < clientIds.length; i += batchSize) {
    const batch = clientIds.slice(i, i + batchSize);
    
    try {
      // Gunakan promise untuk error handling
      await Promise.all(
        batch.map(clientId => {
          return new Promise((resolve, reject) => {
            io.to(clientId).emit(event, data);
            resolve(true);
          });
        })
      );
    } catch (error) {
      console.error(`Broadcast error to room ${room}, batch ${i}:`, error);
      // Log error atau lakukan recovery
    }
  }
};
```

## 7. Admin Notifications Tanpa Otentikasi

### Deskripsi Masalah
Room 'admin' tidak memiliki validasi bahwa hanya admin yang bisa join, dan tidak ada otentikasi untuk `admin:notification` events.

### Lokasi Kode
- `/server/socket-server.js` - admin room dan events

### Penyebab
- Tidak ada validasi role sebelum join admin room
- Tidak ada otentikasi token untuk admin events
- Siapa saja bisa join dan kirim notifikasi admin

### Dampak
- Akses unauthorized ke informasi admin
- Potensi abuse dari user biasa
- Security breach possibility

### Solusi Rekomendasi
```javascript
// Implementasi admin authentication untuk socket
socket.on('admin:join', async (authToken) => {
  try {
    const user = await verifyJWT(authToken);
    if (!user || user.role !== 'ADMIN') {
      socket.emit('error', { message: 'Unauthorized to join admin room' });
      return;
    }
    
    socket.join('admin');
    console.log(`Admin ${user.id} joined admin room`);
  } catch (error) {
    socket.emit('error', { message: 'Invalid authentication token' });
  }
});

socket.on('admin:notification', async (data) => {
  // Pastikan socket tergabung dalam admin room
  if (!socket.rooms.has('admin')) {
    socket.emit('error', { message: 'Not authorized to send admin notifications' });
    return;
  }
  
  // Proses dan broadcast notifikasi admin
  io.to('admin').emit('admin:notification', data);
});
```

## 8. Tidak Ada Load Balancing Strategy

### Deskripsi Masalah
Tidak ada strategi load balancing khusus untuk real-time events.

### Lokasi Kode
- Arsitektur deployment keseluruhan

### Penyebab
- Asumsi single instance server
- Tidak ada sticky sessions configuration
- Tidak ada session affinity

### Dampak
- Masalah saat scaling horizontal
- Inconsistent state antar instances
- Connection drop saat load balancing

### Solusi Rekomendasi
- Gunakan Redis adapter untuk clustering
- Konfigurasi sticky sessions di load balancer
- Gunakan session persistence mechanism
- Gunakan shared state di Redis/databases

## 9. Tidak Ada Circuit Breaker atau Retry Mechanism

### Deskripsi Masalah
Tidak ada mekanisme untuk menangani failure pada external dependencies atau internal errors.

### Lokasi Kode
- Semua socket event handlers

### Penyebab
- Tidak ada error recovery strategy
- Tidak ada fallback mechanism
- Tidak ada circuit breaker pattern

### Dampak
- Server crash saat external service down
- User experience terganggu
- Cascade failures

### Solusi Rekomendasi
```javascript
// Implementasi circuit breaker pattern
class CircuitBreaker {
  constructor(failureThreshold = 5, timeout = 60000) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }
  
  async call(fn) {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
    }
  }
}

// Gunakan pada operasi yang rentan failure
const dbOperationCircuitBreaker = new CircuitBreaker();

socket.on('photo:like', async ({ eventSlug, photoId }) => {
  try {
    await dbOperationCircuitBreaker.call(async () => {
      // Operasi database di sini
      await updatePhotoLikes(photoId);
    });
    
    io.to(`event:${eventSlug}`).emit('photo:like', { photoId, likeCount: newCount });
  } catch (error) {
    // Tangani error tanpa crash server
    socket.emit('error', { message: 'Unable to process like at this time' });
    console.error('Photo like error:', error);
  }
});
```

## Rekomendasi Prioritas

**Prioritas Tinggi:**
1. Perbaiki memory leak pada socket server
2. Implementasi Redis adapter yang aman
3. Tambahkan rate limiting pada socket events

**Prioritas Menengah:**
1. Connection management (IP limits, timeouts)
2. Admin notification security
3. Circuit breaker implementation

**Prioritas Rendah:**
1. Load balancing strategy
2. Batch broadcast optimization
3. State persistence improvement