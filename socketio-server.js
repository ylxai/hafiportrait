#!/usr/bin/env node

/**
 * Socket.IO Server untuk HafiPortrait Photography
 * Real-time notifications dan updates
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const express = require('express');
const cors = require('cors');

const app = express();
const server = createServer(app);

// CORS configuration untuk development dan production
const corsOptions = {
  origin: [
    // Development ports
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://147.251.255.227:3000',
    'http://localhost:3002',
    'http://147.251.255.227:3002',
    
    // Production ports
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://147.251.255.227:3002',
    'http://localhost:4002',
    'http://147.251.255.227:4002',
    
    // Production domains
    'https://hafiportrait.photography',
    'https://hafiportrait-staging.vercel.app',
    '*' // Allow all untuk development
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO server dengan CORS
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    connections: io.engine.clientsCount,
    version: '1.0.0'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // Join room berdasarkan event ID
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    console.log(`📅 Socket ${socket.id} joined event-${eventId}`);
    
    // Confirm join
    socket.emit('joined-event', { eventId, socketId: socket.id });
  });

  // Join admin room
  socket.on('join-admin', () => {
    socket.join('admin');
    console.log(`👨‍💼 Socket ${socket.id} joined admin room`);
    
    // Send admin stats
    socket.emit('admin-stats', {
      totalConnections: io.engine.clientsCount,
      timestamp: new Date().toISOString()
    });
  });

  // Handle photo upload notifications
  socket.on('photo-uploaded', (data) => {
    console.log(`📸 Photo uploaded:`, data);
    
    // Broadcast to event room
    if (data.eventId) {
      socket.to(`event-${data.eventId}`).emit('new-photo', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
    
    // Broadcast to admin
    socket.to('admin').emit('admin-notification', {
      type: 'photo-upload',
      message: `New photo uploaded: ${data.fileName}`,
      eventId: data.eventId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle DSLR notifications
  socket.on('dslr-notification', (data) => {
    console.log(`📷 DSLR notification:`, data);
    
    // Broadcast to admin
    socket.to('admin').emit('dslr-update', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  // Handle event status updates
  socket.on('event-status-update', (data) => {
    console.log(`📊 Event status update:`, data);
    
    // Broadcast to event room
    if (data.eventId) {
      io.to(`event-${data.eventId}`).emit('event-status', {
        ...data,
        timestamp: new Date().toISOString()
      });
    }
    
    // Broadcast to admin
    socket.to('admin').emit('admin-notification', {
      type: 'event-status',
      message: `Event ${data.eventId} status: ${data.status}`,
      eventId: data.eventId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });
});

// Error handling
server.on('error', (error) => {
  console.error('🚨 Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📴 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server
const PORT = process.env.SOCKETIO_PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('🚀 Socket.IO Server started!');
  console.log(`📡 Listening on: http://${HOST}:${PORT}`);
  console.log(`🌐 Public URL: http://147.251.255.227:${PORT}`);
  console.log(`🔗 Health check: http://147.251.255.227:${PORT}/health`);
  console.log('');
  console.log('📱 Client connection URLs:');
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Public: http://147.251.255.227:${PORT}`);
  console.log('');
  console.log('✅ Ready to accept connections!');
});

module.exports = { app, server, io };