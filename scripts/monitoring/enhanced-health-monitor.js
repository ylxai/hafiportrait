#!/usr/bin/env node

/**
 * Enhanced Health Monitor untuk HafiPortrait
 * Sistem monitoring komprehensif dengan alerting otomatis
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class EnhancedHealthMonitor {
  constructor() {
    this.config = {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      checkInterval: 60000, // 1 menit
      alertCooldown: 300000, // 5 menit cooldown untuk alert yang sama
      thresholds: {
        responseTime: 3000, // 3 detik
        errorRate: 0.1, // 10%
        diskUsage: 85, // 85%
        memoryUsage: 90, // 90%
        cpuUsage: 80 // 80%
      },
      notifications: {
        slack: process.env.SLACK_WEBHOOK,
        email: process.env.NOTIFICATION_EMAIL,
        discord: process.env.DISCORD_WEBHOOK
      },
      logFile: path.join(__dirname, '../logs/health-monitor.log'),
      alertsFile: path.join(__dirname, '../logs/alerts.json')
    };

    this.metrics = {
      uptime: 0,
      totalChecks: 0,
      failedChecks: 0,
      avgResponseTime: 0,
      lastAlert: {},
      systemStatus: 'unknown',
      services: {
        api: { status: 'unknown', lastCheck: null, responseTime: 0 },
        database: { status: 'unknown', lastCheck: null, responseTime: 0 },
        storage: { status: 'unknown', lastCheck: null, responseTime: 0 },
        websocket: { status: 'unknown', lastCheck: null, responseTime: 0 }
      }
    };

    this.alerts = this.loadAlerts();
    this.startTime = new Date();
    
    this.ensureDirectories();
  }

  ensureDirectories() {
    const dirs = [
      path.dirname(this.config.logFile),
      path.dirname(this.config.alertsFile)
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadAlerts() {
    try {
      if (fs.existsSync(this.config.alertsFile)) {
        return JSON.parse(fs.readFileSync(this.config.alertsFile, 'utf8'));
      }
    } catch (error) {
      this.log('error', 'Failed to load alerts file', error);
    }
    return {};
  }

  saveAlerts() {
    try {
      fs.writeFileSync(this.config.alertsFile, JSON.stringify(this.alerts, null, 2));
    } catch (error) {
      this.log('error', 'Failed to save alerts file', error);
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      metrics: this.metrics
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    if (data) console.log('Data:', JSON.stringify(data, null, 2));
    
    try {
      fs.appendFileSync(this.config.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'HafiPortrait-HealthMonitor/1.0',
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

  async checkApiHealth() {
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/api/health`);
      const isHealthy = response.statusCode === 200;
      const responseTime = response.responseTime;
      
      this.metrics.services.api = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime,
        details: isHealthy ? JSON.parse(response.data) : { error: 'API check failed' }
      };

      if (!isHealthy || responseTime > this.config.thresholds.responseTime) {
        await this.sendAlert('api', `API health check failed. Status: ${response.statusCode}, Response time: ${responseTime}ms`);
      }

      return isHealthy;
    } catch (error) {
      this.metrics.services.api = {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        error: error.message
      };
      
      await this.sendAlert('api', `API health check error: ${error.message}`);
      return false;
    }
  }

  async checkDatabaseHealth() {
    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/api/test/db`);
      const isHealthy = response.statusCode === 200;
      
      this.metrics.services.database = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime: response.responseTime,
        details: isHealthy ? JSON.parse(response.data) : { error: 'Database check failed' }
      };

      if (!isHealthy) {
        await this.sendAlert('database', `Database health check failed. Status: ${response.statusCode}`);
      }

      return isHealthy;
    } catch (error) {
      this.metrics.services.database = {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        error: error.message
      };
      
      await this.sendAlert('database', `Database health check error: ${error.message}`);
      return false;
    }
  }

  async checkWebSocketHealth() {
    try {
      // Simple ping ke socket server
      const response = await this.makeRequest(`${this.config.socketUrl}/health`);
      const isHealthy = response.statusCode === 200;
      
      this.metrics.services.websocket = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime: response.responseTime
      };

      if (!isHealthy) {
        await this.sendAlert('websocket', `WebSocket health check failed. Status: ${response.statusCode}`);
      }

      return isHealthy;
    } catch (error) {
      this.metrics.services.websocket = {
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        responseTime: 0,
        error: error.message
      };
      
      await this.sendAlert('websocket', `WebSocket health check error: ${error.message}`);
      return false;
    }
  }

  async checkSystemResources() {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);

      // Check disk usage
      const { stdout: diskOutput } = await execPromise("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'");
      const diskUsage = parseInt(diskOutput.trim());

      // Check memory usage
      const { stdout: memOutput } = await execPromise("free | grep Mem | awk '{printf \"%.0f\", $3/$2 * 100.0}'");
      const memoryUsage = parseInt(memOutput.trim());

      // Check CPU usage
      const { stdout: cpuOutput } = await execPromise("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | sed 's/%us,//'");
      const cpuUsage = parseFloat(cpuOutput.trim());

      const systemHealth = {
        disk: { usage: diskUsage, status: diskUsage > this.config.thresholds.diskUsage ? 'warning' : 'healthy' },
        memory: { usage: memoryUsage, status: memoryUsage > this.config.thresholds.memoryUsage ? 'warning' : 'healthy' },
        cpu: { usage: cpuUsage, status: cpuUsage > this.config.thresholds.cpuUsage ? 'warning' : 'healthy' }
      };

      // Send alerts for resource usage
      if (diskUsage > this.config.thresholds.diskUsage) {
        await this.sendAlert('disk', `High disk usage: ${diskUsage}%`);
      }
      if (memoryUsage > this.config.thresholds.memoryUsage) {
        await this.sendAlert('memory', `High memory usage: ${memoryUsage}%`);
      }
      if (cpuUsage > this.config.thresholds.cpuUsage) {
        await this.sendAlert('cpu', `High CPU usage: ${cpuUsage}%`);
      }

      return systemHealth;
    } catch (error) {
      this.log('error', 'Failed to check system resources', error);
      return null;
    }
  }

  async sendAlert(type, message) {
    const now = Date.now();
    const lastAlert = this.alerts[type];
    
    // Check cooldown
    if (lastAlert && (now - lastAlert.timestamp) < this.config.alertCooldown) {
      return;
    }

    const alert = {
      type,
      message,
      timestamp: now,
      datetime: new Date().toISOString(),
      metrics: { ...this.metrics }
    };

    this.alerts[type] = alert;
    this.saveAlerts();

    this.log('alert', `ALERT [${type.toUpperCase()}]: ${message}`, alert);

    // Send notifications
    await Promise.all([
      this.sendSlackNotification(alert),
      this.sendDiscordNotification(alert),
      this.sendEmailNotification(alert)
    ]);
  }

  async sendSlackNotification(alert) {
    if (!this.config.notifications.slack) return;

    try {
      const payload = {
        text: `🚨 HafiPortrait Alert`,
        attachments: [{
          color: 'danger',
          fields: [
            { title: 'Type', value: alert.type.toUpperCase(), short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Time', value: alert.datetime, short: true },
            { title: 'System Status', value: this.metrics.systemStatus, short: true }
          ]
        }]
      };

      await this.makeRequest(this.config.notifications.slack, {
        method: 'POST',
        body: payload
      });

      this.log('info', 'Slack notification sent');
    } catch (error) {
      this.log('error', 'Failed to send Slack notification', error);
    }
  }

  async sendDiscordNotification(alert) {
    if (!this.config.notifications.discord) return;

    try {
      const payload = {
        embeds: [{
          title: '🚨 HafiPortrait System Alert',
          color: 0xff0000,
          fields: [
            { name: 'Type', value: alert.type.toUpperCase(), inline: true },
            { name: 'Message', value: alert.message, inline: false },
            { name: 'Time', value: alert.datetime, inline: true },
            { name: 'System Status', value: this.metrics.systemStatus, inline: true }
          ],
          timestamp: alert.datetime
        }]
      };

      await this.makeRequest(this.config.notifications.discord, {
        method: 'POST',
        body: payload
      });

      this.log('info', 'Discord notification sent');
    } catch (error) {
      this.log('error', 'Failed to send Discord notification', error);
    }
  }

  async sendEmailNotification(alert) {
    if (!this.config.notifications.email) return;

    try {
      // Implementasi email notification bisa menggunakan SendGrid, Nodemailer, dll
      this.log('info', 'Email notification would be sent here');
    } catch (error) {
      this.log('error', 'Failed to send email notification', error);
    }
  }

  async runHealthCheck() {
    this.log('info', 'Starting health check cycle');
    this.metrics.totalChecks++;

    const checks = await Promise.allSettled([
      this.checkApiHealth(),
      this.checkDatabaseHealth(),
      this.checkWebSocketHealth()
    ]);

    const systemResources = await this.checkSystemResources();

    // Calculate overall system status
    const healthyServices = checks.filter(check => check.status === 'fulfilled' && check.value === true).length;
    const totalServices = checks.length;
    const healthPercentage = (healthyServices / totalServices) * 100;

    if (healthPercentage === 100) {
      this.metrics.systemStatus = 'healthy';
    } else if (healthPercentage >= 50) {
      this.metrics.systemStatus = 'degraded';
    } else {
      this.metrics.systemStatus = 'unhealthy';
      this.metrics.failedChecks++;
    }

    // Update uptime
    this.metrics.uptime = Date.now() - this.startTime.getTime();

    // Calculate average response time
    const responseTimes = Object.values(this.metrics.services)
      .map(service => service.responseTime)
      .filter(time => time > 0);
    
    if (responseTimes.length > 0) {
      this.metrics.avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }

    this.log('info', 'Health check completed', {
      systemStatus: this.metrics.systemStatus,
      healthPercentage,
      avgResponseTime: this.metrics.avgResponseTime,
      systemResources
    });

    return {
      status: this.metrics.systemStatus,
      services: this.metrics.services,
      systemResources,
      metrics: this.metrics
    };
  }

  async start() {
    this.log('info', 'Enhanced Health Monitor started');
    
    // Run initial check
    await this.runHealthCheck();

    // Schedule regular checks
    setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        this.log('error', 'Health check cycle failed', error);
      }
    }, this.config.checkInterval);

    // Graceful shutdown
    process.on('SIGINT', () => {
      this.log('info', 'Enhanced Health Monitor stopping...');
      process.exit(0);
    });
  }

  getStatus() {
    return {
      uptime: this.metrics.uptime,
      systemStatus: this.metrics.systemStatus,
      services: this.metrics.services,
      metrics: this.metrics,
      config: {
        checkInterval: this.config.checkInterval,
        thresholds: this.config.thresholds
      }
    };
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new EnhancedHealthMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      monitor.start();
      break;
    case 'check':
      monitor.runHealthCheck().then(result => {
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
      });
      break;
    case 'status':
      console.log(JSON.stringify(monitor.getStatus(), null, 2));
      break;
    default:
      console.log('Usage: node enhanced-health-monitor.js [start|check|status]');
      process.exit(1);
  }
}

module.exports = EnhancedHealthMonitor;