/**
 * Monitoring dan troubleshooting untuk Zeabur Socket.IO
 * Real-time monitoring dengan dashboard sederhana
 */

const readline = require('readline');

class ZeaburSocketIOMonitor {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.serverUrl = process.env.NEXT_PUBLIC_SOCKETIO_URL || 'http://localhost:8080';
    this.monitoring = false;
    this.stats = {
      uptime: 0,
      connections: 0,
      eventRooms: 0,
      adminConnections: 0,
      lastCheck: null,
      status: 'unknown'
    };
  }

  async run() {
    console.log('📊 Zeabur Socket.IO Monitor');
    console.log('===========================\n');
    
    try {
      await this.showMenu();
    } catch (error) {
      console.error('❌ Monitor error:', error.message);
    } finally {
      this.rl.close();
    }
  }

  async showMenu() {
    while (true) {
      console.log('\n🔧 Available Commands:');
      console.log('1. Check Health');
      console.log('2. View Stats');
      console.log('3. Start Real-time Monitoring');
      console.log('4. Test Connection');
      console.log('5. Send Test Notification');
      console.log('6. Troubleshoot Issues');
      console.log('7. Change Server URL');
      console.log('8. Exit');
      
      const choice = await this.question('\nSelect option (1-8): ');
      
      switch (choice) {
        case '1':
          await this.checkHealth();
          break;
        case '2':
          await this.viewStats();
          break;
        case '3':
          await this.startRealTimeMonitoring();
          break;
        case '4':
          await this.testConnection();
          break;
        case '5':
          await this.sendTestNotification();
          break;
        case '6':
          await this.troubleshoot();
          break;
        case '7':
          await this.changeServerUrl();
          break;
        case '8':
          console.log('👋 Goodbye!');
          return;
        default:
          console.log('❌ Invalid option');
      }
    }
  }

  async checkHealth() {
    console.log('\n🏥 Checking server health...');
    console.log(`Server: ${this.serverUrl}`);
    
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      const data = await response.json();
      
      this.stats.status = data.status;
      this.stats.uptime = data.uptime;
      this.stats.connections = data.connections;
      this.stats.lastCheck = new Date();
      
      console.log('\n✅ Health Check Results:');
      console.log(`Status: ${data.status}`);
      console.log(`Uptime: ${this.formatUptime(data.uptime)}`);
      console.log(`Connections: ${data.connections}`);
      console.log(`Timestamp: ${data.timestamp}`);
      
      if (data.status === 'healthy') {
        console.log('🎉 Server is healthy!');
      } else {
        console.log('⚠️ Server has issues');
      }
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.stats.status = 'unhealthy';
      this.stats.lastCheck = new Date();
    }
  }

  async viewStats() {
    console.log('\n📈 Fetching detailed stats...');
    
    try {
      const response = await fetch(`${this.serverUrl}/api/stats`);
      const data = await response.json();
      
      this.stats.connections = data.totalConnections;
      this.stats.eventRooms = data.eventRooms?.length || 0;
      this.stats.adminConnections = data.adminConnections;
      this.stats.uptime = data.uptime;
      
      console.log('\n📊 Server Statistics:');
      console.log(`Total Connections: ${data.totalConnections}`);
      console.log(`Admin Connections: ${data.adminConnections}`);
      console.log(`Event Rooms: ${data.eventRooms?.length || 0}`);
      console.log(`Uptime: ${this.formatUptime(data.uptime)}`);
      
      if (data.eventRooms && data.eventRooms.length > 0) {
        console.log('\n🏠 Active Event Rooms:');
        data.eventRooms.forEach(room => {
          console.log(`  - Event ${room.eventId}: ${room.connections} connections`);
        });
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch stats:', error.message);
    }
  }

  async startRealTimeMonitoring() {
    console.log('\n📡 Starting real-time monitoring...');
    console.log('Press Ctrl+C to stop monitoring\n');
    
    this.monitoring = true;
    
    const monitorInterval = setInterval(async () => {
      if (!this.monitoring) {
        clearInterval(monitorInterval);
        return;
      }
      
      try {
        const healthResponse = await fetch(`${this.serverUrl}/health`);
        const healthData = await healthResponse.json();
        
        const statsResponse = await fetch(`${this.serverUrl}/api/stats`);
        const statsData = await statsResponse.json();
        
        // Clear screen and show dashboard
        console.clear();
        console.log('📊 Real-time Socket.IO Monitor');
        console.log('==============================');
        console.log(`Server: ${this.serverUrl}`);
        console.log(`Last Update: ${new Date().toLocaleTimeString()}`);
        console.log('');
        
        // Status indicator
        const statusIcon = healthData.status === 'healthy' ? '🟢' : '🔴';
        console.log(`${statusIcon} Status: ${healthData.status.toUpperCase()}`);
        console.log(`⏱️ Uptime: ${this.formatUptime(healthData.uptime)}`);
        console.log('');
        
        // Connection stats
        console.log('👥 Connections:');
        console.log(`  Total: ${statsData.totalConnections}`);
        console.log(`  Admin: ${statsData.adminConnections}`);
        console.log(`  Rooms: ${statsData.eventRooms?.length || 0}`);
        console.log('');
        
        // Event rooms
        if (statsData.eventRooms && statsData.eventRooms.length > 0) {
          console.log('🏠 Active Rooms:');
          statsData.eventRooms.slice(0, 5).forEach(room => {
            console.log(`  📍 ${room.eventId}: ${room.connections} users`);
          });
          if (statsData.eventRooms.length > 5) {
            console.log(`  ... and ${statsData.eventRooms.length - 5} more`);
          }
        } else {
          console.log('🏠 No active rooms');
        }
        
        console.log('\nPress Ctrl+C to stop monitoring');
        
      } catch (error) {
        console.log(`❌ Monitoring error: ${error.message}`);
      }
    }, 3000);
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      this.monitoring = false;
      clearInterval(monitorInterval);
      console.log('\n\n⏹️ Monitoring stopped');
      process.exit(0);
    });
  }

  async testConnection() {
    console.log('\n🔌 Testing Socket.IO connection...');
    
    try {
      // Import socket.io-client dynamically
      const { io } = await import('socket.io-client');
      
      const socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000
      });
      
      const connectionPromise = new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        socket.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Socket.IO connection successful');
          console.log(`Socket ID: ${socket.id}`);
          resolve(true);
        });
        
        socket.on('connect_error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        
        socket.on('connected', (data) => {
          console.log('📡 Server welcome message:', data);
        });
      });
      
      await connectionPromise;
      
      // Test heartbeat
      console.log('\n💓 Testing heartbeat...');
      socket.emit('heartbeat');
      
      socket.on('heartbeat-ack', (data) => {
        console.log('✅ Heartbeat acknowledged:', data);
      });
      
      // Cleanup
      setTimeout(() => {
        socket.disconnect();
        console.log('🔌 Connection closed');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
    }
  }

  async sendTestNotification() {
    console.log('\n📢 Sending test notification...');
    
    try {
      const response = await fetch(`${this.serverUrl}/api/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'test-notification',
          data: {
            message: 'Test notification from monitor',
            timestamp: new Date().toISOString(),
            source: 'monitor-script'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Test notification sent successfully');
        console.log('Response:', result);
      } else {
        console.log('❌ Failed to send notification');
        console.log('Status:', response.status);
      }
      
    } catch (error) {
      console.error('❌ Notification test failed:', error.message);
    }
  }

  async troubleshoot() {
    console.log('\n🔧 Socket.IO Troubleshooting');
    console.log('============================\n');
    
    const issues = [];
    
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    try {
      const response = await fetch(this.serverUrl, { timeout: 5000 });
      console.log('✅ Server is reachable');
    } catch (error) {
      console.log('❌ Server unreachable:', error.message);
      issues.push('Server connectivity issue');
    }
    
    // Test 2: Health endpoint
    console.log('\n2. Testing health endpoint...');
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      const data = await response.json();
      if (data.status === 'healthy') {
        console.log('✅ Health endpoint working');
      } else {
        console.log('⚠️ Server reports unhealthy status');
        issues.push('Server health issues');
      }
    } catch (error) {
      console.log('❌ Health endpoint failed:', error.message);
      issues.push('Health endpoint not accessible');
    }
    
    // Test 3: CORS configuration
    console.log('\n3. Testing CORS configuration...');
    try {
      const response = await fetch(`${this.serverUrl}/api/stats`);
      if (response.ok) {
        console.log('✅ CORS configuration working');
      } else {
        console.log('⚠️ CORS might be misconfigured');
        issues.push('Possible CORS issues');
      }
    } catch (error) {
      console.log('❌ CORS test failed:', error.message);
      issues.push('CORS configuration problems');
    }
    
    // Test 4: Environment variables
    console.log('\n4. Checking environment configuration...');
    if (process.env.NEXT_PUBLIC_SOCKETIO_URL) {
      console.log('✅ NEXT_PUBLIC_SOCKETIO_URL is set');
    } else {
      console.log('⚠️ NEXT_PUBLIC_SOCKETIO_URL not set');
      issues.push('Missing environment variables');
    }
    
    // Summary
    console.log('\n📋 Troubleshooting Summary:');
    if (issues.length === 0) {
      console.log('✅ No issues detected! Socket.IO should be working properly.');
    } else {
      console.log('❌ Issues detected:');
      issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      
      console.log('\n🔧 Suggested fixes:');
      console.log('1. Check Zeabur deployment status');
      console.log('2. Verify environment variables');
      console.log('3. Check CORS configuration in server.js');
      console.log('4. Review Zeabur logs for errors');
    }
  }

  async changeServerUrl() {
    const newUrl = await this.question('\nEnter new server URL: ');
    if (newUrl.trim()) {
      this.serverUrl = newUrl.trim();
      console.log(`✅ Server URL updated to: ${this.serverUrl}`);
    }
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}

// Run monitor
const monitor = new ZeaburSocketIOMonitor();
monitor.run();