#!/usr/bin/env node

/**
 * WebSocket Server Startup Script
 * Menjalankan WebSocket server untuk real-time data
 */

const { getWebSocketServer } = require('../src/lib/websocket-server.ts');

async function startWebSocketServer() {
  console.log('🚀 Starting WebSocket Server for Real-time Data...');
  
  try {
    // Get WebSocket server instance
    const wsServer = getWebSocketServer();
    
    // Start server
    wsServer.start();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      wsServer.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      wsServer.stop();
      process.exit(0);
    });
    
    // Log server stats every 30 seconds
    setInterval(() => {
      const stats = wsServer.getStats();
      console.log('📊 WebSocket Server Stats:', {
        connectedClients: stats.connectedClients,
        subscriptions: stats.subscriptions,
        uptime: `${Math.floor(stats.uptime / 60)}m ${Math.floor(stats.uptime % 60)}s`,
        lastDslrUpdate: stats.lastDslrUpdate ? new Date(stats.lastDslrUpdate).toLocaleTimeString() : 'Never',
        activeBackups: stats.lastBackupUpdate || 0
      });
    }, 30000);
    
  } catch (error) {
    console.error('❌ Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

// Start server if run directly
if (require.main === module) {
  startWebSocketServer();
}

module.exports = { startWebSocketServer };