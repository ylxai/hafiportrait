#!/usr/bin/env node

/**
 * Socket.IO Server Startup Script
 * Enhanced real-time server dengan auto-fallback dan mobile optimization
 */

const { getSocketIOServer } = require('../src/lib/socketio-server.ts');

async function startSocketIOServer() {
  console.log('🚀 Starting Socket.IO Server for Enhanced Real-time Data...');
  
  try {
    // Get Socket.IO server instance
    const socketIOServer = getSocketIOServer();
    
    // Start server
    socketIOServer.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      socketIOServer.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      socketIOServer.stop();
      process.exit(0);
    });
    
    // Log server stats every 60 seconds
    setInterval(() => {
      const stats = socketIOServer.getStats();
      console.log('📊 Socket.IO Server Stats:', {
        connectedClients: stats.connectedClients,
        roomSubscriptions: stats.roomSubscriptions,
        transports: stats.transports,
        uptime: `${Math.floor(stats.uptime / 60)}m ${Math.floor(stats.uptime % 60)}s`,
        lastDslrUpdate: stats.lastDslrUpdate ? new Date(stats.lastDslrUpdate).toLocaleTimeString() : 'Never',
        activeBackups: stats.lastBackupUpdate || 0,
        rateLimit: stats.rateLimit
      });
    }, 60000);
    
    // Health check endpoint info
    console.log('🏥 Health check available at: http://localhost:' + (process.env.SOCKETIO_PORT || process.env.WS_PORT || '3001') + '/health');
    
  } catch (error) {
    console.error('❌ Failed to start Socket.IO server:', error);
    process.exit(1);
  }
}

// Start server if run directly
if (require.main === module) {
  startSocketIOServer();
}

module.exports = { startSocketIOServer };