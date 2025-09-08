#!/usr/bin/env node

/**
 * Real-time Performance Monitor for HafiPortrait
 * Monitors photo sync, backup operations, and real-time updates
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class RealtimePerformanceMonitor {
  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
      testEventId: process.env.TEST_EVENT_ID || null,
      logFile: path.join(__dirname, '../logs/realtime-performance.log')
    };

    this.metrics = {
      photoSyncTimes: [],
      backupTimes: [],
      wsConnections: 0,
      wsReconnections: 0,
      wsErrors: 0,
      lastPhotoSync: null,
      lastBackupSync: null
    };

    this.ws = null;
    this.isMonitoring = false;
    this.startTime = new Date();

    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      metrics: this.getQuickMetrics()
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (data) console.log('Data:', JSON.stringify(data, null, 2));
    
    fs.appendFileSync(this.config.logFile, JSON.stringify(logEntry) + '\n');
  }

  getQuickMetrics() {
    const avgPhotoSync = this.metrics.photoSyncTimes.length > 0 ?
      this.metrics.photoSyncTimes.reduce((a, b) => a + b, 0) / this.metrics.photoSyncTimes.length : 0;
    
    const avgBackupTime = this.metrics.backupTimes.length > 0 ?
      this.metrics.backupTimes.reduce((a, b) => a + b, 0) / this.metrics.backupTimes.length : 0;

    return {
      avgPhotoSyncMs: Math.round(avgPhotoSync),
      avgBackupTimeMs: Math.round(avgBackupTime),
      wsStatus: this.ws?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected',
      totalSyncs: this.metrics.photoSyncTimes.length,
      totalBackups: this.metrics.backupTimes.length
    };
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.wsUrl);
        
        this.ws.on('open', () => {
          this.metrics.wsConnections++;
          this.log('info', 'WebSocket connected', { url: this.config.wsUrl });
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleWebSocketMessage(message);
          } catch (error) {
            this.log('warn', 'Failed to parse WebSocket message', { error: error.message, data: data.toString() });
          }
        });

        this.ws.on('close', () => {
          this.log('warn', 'WebSocket disconnected');
          if (this.isMonitoring) {
            setTimeout(() => this.reconnectWebSocket(), 5000);
          }
        });

        this.ws.on('error', (error) => {
          this.metrics.wsErrors++;
          this.log('error', 'WebSocket error', { error: error.message });
          reject(error);
        });

        // Timeout for connection
        setTimeout(() => {
          if (this.ws.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  async reconnectWebSocket() {
    this.metrics.wsReconnections++;
    this.log('info', 'Attempting WebSocket reconnection...');
    
    try {
      await this.connectWebSocket();
    } catch (error) {
      this.log('error', 'WebSocket reconnection failed', { error: error.message });
      if (this.isMonitoring) {
        setTimeout(() => this.reconnectWebSocket(), 10000);
      }
    }
  }

  handleWebSocketMessage(message) {
    const timestamp = Date.now();
    
    switch (message.type) {
      case 'photo_uploaded':
        this.handlePhotoSync(message, timestamp);
        break;
      case 'photo_deleted':
        this.handlePhotoSync(message, timestamp);
        break;
      case 'backup_started':
        this.handleBackupEvent(message, timestamp, 'started');
        break;
      case 'backup_progress':
        this.handleBackupEvent(message, timestamp, 'progress');
        break;
      case 'backup_completed':
        this.handleBackupEvent(message, timestamp, 'completed');
        break;
      case 'backup_failed':
        this.handleBackupEvent(message, timestamp, 'failed');
        break;
      default:
        this.log('debug', 'Unknown WebSocket message type', { type: message.type });
    }
  }

  handlePhotoSync(message, timestamp) {
    if (this.metrics.lastPhotoSync) {
      const syncTime = timestamp - this.metrics.lastPhotoSync;
      this.metrics.photoSyncTimes.push(syncTime);
      
      // Keep only last 50 measurements
      if (this.metrics.photoSyncTimes.length > 50) {
        this.metrics.photoSyncTimes = this.metrics.photoSyncTimes.slice(-50);
      }

      const status = syncTime <= 2000 ? 'EXCELLENT' : syncTime <= 5000 ? 'GOOD' : 'SLOW';
      
      this.log('info', `Photo sync detected: ${syncTime}ms (${status})`, {
        type: message.type,
        eventId: message.eventId,
        photoId: message.photoId,
        syncTime
      });
    }
    
    this.metrics.lastPhotoSync = timestamp;
  }

  handleBackupEvent(message, timestamp, stage) {
    if (stage === 'started') {
      this.backupStartTime = timestamp;
      this.log('info', 'Backup started', {
        eventId: message.eventId,
        photoCount: message.photoCount
      });
    } else if (stage === 'completed' && this.backupStartTime) {
      const backupTime = timestamp - this.backupStartTime;
      this.metrics.backupTimes.push(backupTime);
      
      // Keep only last 20 backup measurements
      if (this.metrics.backupTimes.length > 20) {
        this.metrics.backupTimes = this.metrics.backupTimes.slice(-20);
      }

      const status = backupTime <= 60000 ? 'FAST' : backupTime <= 300000 ? 'NORMAL' : 'SLOW';
      
      this.log('info', `Backup completed: ${(backupTime/1000).toFixed(1)}s (${status})`, {
        eventId: message.eventId,
        backupTime,
        photoCount: message.photoCount,
        backupUrl: message.backupUrl
      });
      
      this.backupStartTime = null;
    } else if (stage === 'failed') {
      this.log('error', 'Backup failed', {
        eventId: message.eventId,
        error: message.error
      });
      this.backupStartTime = null;
    } else if (stage === 'progress') {
      this.log('debug', 'Backup progress', {
        eventId: message.eventId,
        progress: message.progress,
        currentPhoto: message.currentPhoto
      });
    }
  }

  async testPhotoSyncPerformance() {
    if (!this.config.testEventId) {
      this.log('warn', 'No test event ID configured, skipping photo sync test');
      return false;
    }

    try {
      // Simulate photo upload by calling API
      const response = await this.makeRequest(`/api/events/${this.config.testEventId}/photos`, {
        method: 'GET'
      });

      if (response.statusCode === 200) {
        this.log('info', 'Photo sync test completed', {
          responseTime: response.responseTime,
          eventId: this.config.testEventId
        });
        return true;
      } else {
        this.log('error', 'Photo sync test failed', {
          statusCode: response.statusCode,
          eventId: this.config.testEventId
        });
        return false;
      }
    } catch (error) {
      this.log('error', 'Photo sync test error', { error: error.message });
      return false;
    }
  }

  async makeRequest(endpoint, options = {}) {
    const https = require('https');
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const url = `${this.config.baseUrl}${endpoint}`;
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'HafiPortrait-RealtimeMonitor/1.0',
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data,
            responseTime
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      
      req.end();
    });
  }

  generatePerformanceReport() {
    const uptime = Date.now() - this.startTime.getTime();
    const metrics = this.getQuickMetrics();
    
    const report = {
      timestamp: new Date().toISOString(),
      uptime: `${(uptime / (1000 * 60 * 60)).toFixed(2)} hours`,
      performance: {
        photoSync: {
          averageTime: `${metrics.avgPhotoSyncMs}ms`,
          totalSyncs: metrics.totalSyncs,
          status: metrics.avgPhotoSyncMs <= 2000 ? 'EXCELLENT' : 
                  metrics.avgPhotoSyncMs <= 5000 ? 'GOOD' : 'NEEDS_ATTENTION'
        },
        backup: {
          averageTime: `${(metrics.avgBackupTimeMs/1000).toFixed(1)}s`,
          totalBackups: metrics.totalBackups,
          status: metrics.avgBackupTimeMs <= 60000 ? 'FAST' : 
                  metrics.avgBackupTimeMs <= 300000 ? 'NORMAL' : 'SLOW'
        },
        websocket: {
          status: metrics.wsStatus,
          connections: this.metrics.wsConnections,
          reconnections: this.metrics.wsReconnections,
          errors: this.metrics.wsErrors
        }
      },
      alerts: this.generatePerformanceAlerts()
    };

    return report;
  }

  generatePerformanceAlerts() {
    const alerts = [];
    const metrics = this.getQuickMetrics();

    // Photo sync performance alerts
    if (metrics.avgPhotoSyncMs > 5000) {
      alerts.push({
        type: 'photo_sync_slow',
        severity: 'high',
        message: `Average photo sync time ${metrics.avgPhotoSyncMs}ms exceeds 5 second threshold`
      });
    }

    // Backup performance alerts
    if (metrics.avgBackupTimeMs > 300000) {
      alerts.push({
        type: 'backup_slow',
        severity: 'medium',
        message: `Average backup time ${(metrics.avgBackupTimeMs/1000).toFixed(1)}s exceeds 5 minute threshold`
      });
    }

    // WebSocket connection alerts
    if (this.metrics.wsReconnections > 5) {
      alerts.push({
        type: 'websocket_unstable',
        severity: 'medium',
        message: `WebSocket has reconnected ${this.metrics.wsReconnections} times`
      });
    }

    if (metrics.wsStatus !== 'connected') {
      alerts.push({
        type: 'websocket_disconnected',
        severity: 'high',
        message: 'WebSocket is not connected - real-time updates unavailable'
      });
    }

    return alerts;
  }

  async startMonitoring() {
    this.isMonitoring = true;
    this.log('info', 'Starting real-time performance monitoring...');

    try {
      await this.connectWebSocket();
    } catch (error) {
      this.log('error', 'Failed to connect WebSocket', { error: error.message });
    }

    // Test photo sync performance every 2 minutes
    setInterval(async () => {
      if (this.isMonitoring) {
        await this.testPhotoSyncPerformance();
      }
    }, 2 * 60 * 1000);

    // Generate performance report every 5 minutes
    setInterval(() => {
      if (this.isMonitoring) {
        const report = this.generatePerformanceReport();
        this.log('info', 'Performance report generated', report);
      }
    }, 5 * 60 * 1000);

    this.log('info', 'Real-time performance monitoring started');
  }

  async stopMonitoring() {
    this.isMonitoring = false;
    if (this.ws) {
      this.ws.close();
    }
    this.log('info', 'Real-time performance monitoring stopped');
  }

  async runPerformanceTest() {
    this.log('info', 'Running one-time performance test...');
    
    try {
      await this.connectWebSocket();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds for messages
      await this.testPhotoSyncPerformance();
      
      const report = this.generatePerformanceReport();
      this.log('info', 'Performance test completed', report);
      
      if (this.ws) {
        this.ws.close();
      }
      
      return report;
    } catch (error) {
      this.log('error', 'Performance test failed', { error: error.message });
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new RealtimePerformanceMonitor();
  
  const command = process.argv[2];
  
  if (command === 'start') {
    monitor.startMonitoring();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down real-time monitor...');
      await monitor.stopMonitoring();
      process.exit(0);
    });
    
  } else if (command === 'test') {
    monitor.runPerformanceTest().then(report => {
      console.log('\n=== REAL-TIME PERFORMANCE REPORT ===');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    }).catch(error => {
      console.error('Performance test failed:', error);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node realtime-performance-monitor.js start  # Start continuous monitoring');
    console.log('  node realtime-performance-monitor.js test   # Run single performance test');
    console.log('');
    console.log('Environment variables:');
    console.log('  TEST_EVENT_ID - Event ID for testing photo sync performance');
    console.log('  NEXT_PUBLIC_WS_URL - WebSocket URL for real-time monitoring');
  }
}

module.exports = RealtimePerformanceMonitor;