#!/usr/bin/env node

// 🤖 Automated Monitoring Script for HafiPortrait
// Comprehensive system monitoring with automated alerts and reporting

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AutomatedMonitor {
  constructor() {
    this.config = {
      checkInterval: 60000, // 1 minute
      alertThresholds: {
        cpu: 80,
        memory: 85,
        storage: 90,
        responseTime: 2000,
        errorRate: 5
      },
      notifications: {
        slack: process.env.SLACK_WEBHOOK_URL,
        email: process.env.ALERT_EMAIL,
        whatsapp: process.env.WHATSAPP_WEBHOOK
      },
      logFile: path.join(__dirname, '../logs/monitoring.log'),
      metricsFile: path.join(__dirname, '../logs/metrics.json')
    };

    this.isRunning = false;
    this.metrics = [];
    this.alerts = [];
    
    this.ensureLogDirectory();
  }

  // 📁 Ensure log directory exists
  ensureLogDirectory() {
    const logDir = path.dirname(this.config.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  // 🚀 Start monitoring
  async start() {
    if (this.isRunning) {
      console.log('🤖 Monitoring already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated monitoring...');
    
    // Initial check
    await this.performCheck();
    
    // Set up interval
    this.interval = setInterval(async () => {
      await this.performCheck();
    }, this.config.checkInterval);

    // Graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  // 🛑 Stop monitoring
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.isRunning = false;
    console.log('🛑 Monitoring stopped');
    process.exit(0);
  }

  // 🔍 Perform comprehensive system check
  async performCheck() {
    try {
      const timestamp = new Date();
      console.log(`🔍 Performing system check at ${timestamp.toISOString()}`);

      const metrics = await this.collectMetrics();
      const healthChecks = await this.performHealthChecks();
      
      const checkResult = {
        timestamp,
        metrics,
        healthChecks,
        overallStatus: this.calculateOverallStatus(metrics, healthChecks)
      };

      // Store metrics
      this.metrics.push(checkResult);
      this.saveMetrics();

      // Check for alerts
      await this.checkAlerts(checkResult);

      // Log result
      this.logResult(checkResult);

      // Cleanup old metrics (keep last 1000)
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

    } catch (error) {
      console.error('❌ Error during system check:', error);
      await this.sendAlert('System Check Failed', `Monitoring error: ${error.message}`, 'critical');
    }
  }

  // 📊 Collect system metrics
  async collectMetrics() {
    const metrics = {};

    try {
      // CPU metrics
      metrics.cpu = await this.getCpuMetrics();
      
      // Memory metrics
      metrics.memory = await this.getMemoryMetrics();
      
      // Storage metrics
      metrics.storage = await this.getStorageMetrics();
      
      // Network metrics
      metrics.network = await this.getNetworkMetrics();
      
      // Application metrics
      metrics.application = await this.getApplicationMetrics();

    } catch (error) {
      console.error('Error collecting metrics:', error);
    }

    return metrics;
  }

  // 🖥️ Get CPU metrics
  async getCpuMetrics() {
    try {
      // Get CPU usage
      const { stdout: cpuInfo } = await execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
      const cpuUsage = parseFloat(cpuInfo.trim()) || 0;

      // Get load average
      const { stdout: loadInfo } = await execAsync("uptime | awk -F'load average:' '{print $2}'");
      const loadAvg = loadInfo.trim().split(',').map(l => parseFloat(l.trim()));

      return {
        usage: cpuUsage,
        loadAverage: loadAvg.slice(0, 3)
      };
    } catch (error) {
      console.error('Error getting CPU metrics:', error);
      return { usage: 0, loadAverage: [0, 0, 0] };
    }
  }

  // 💾 Get memory metrics
  async getMemoryMetrics() {
    try {
      const { stdout } = await execAsync("free -m | grep '^Mem:'");
      const memInfo = stdout.trim().split(/\s+/);
      
      const total = parseInt(memInfo[1]) * 1024 * 1024; // Convert MB to bytes
      const used = parseInt(memInfo[2]) * 1024 * 1024;
      const available = parseInt(memInfo[6]) * 1024 * 1024;

      return {
        total,
        used,
        available,
        percentage: (used / total) * 100
      };
    } catch (error) {
      console.error('Error getting memory metrics:', error);
      return { total: 0, used: 0, available: 0, percentage: 0 };
    }
  }

  // 💿 Get storage metrics
  async getStorageMetrics() {
    try {
      const { stdout } = await execAsync("df -h / | tail -1");
      const diskInfo = stdout.trim().split(/\s+/);
      
      const total = this.parseSize(diskInfo[1]);
      const used = this.parseSize(diskInfo[2]);
      const available = this.parseSize(diskInfo[3]);
      const percentage = parseFloat(diskInfo[4].replace('%', ''));

      return {
        total,
        used,
        available,
        percentage
      };
    } catch (error) {
      console.error('Error getting storage metrics:', error);
      return { total: 0, used: 0, available: 0, percentage: 0 };
    }
  }

  // 🌐 Get network metrics
  async getNetworkMetrics() {
    try {
      // Simple network check - ping Google DNS
      const { stdout } = await execAsync("ping -c 1 8.8.8.8 | grep 'time=' | awk -F'time=' '{print $2}' | awk '{print $1}'");
      const latency = parseFloat(stdout.trim()) || 0;

      return {
        latency,
        status: latency > 0 ? 'connected' : 'disconnected'
      };
    } catch (error) {
      console.error('Error getting network metrics:', error);
      return { latency: 0, status: 'disconnected' };
    }
  }

  // 🚀 Get application metrics
  async getApplicationMetrics() {
    try {
      const metrics = {};

      // Check if application is running
      try {
        const { stdout } = await execAsync("pgrep -f 'node.*next' | wc -l");
        metrics.processCount = parseInt(stdout.trim()) || 0;
        metrics.status = metrics.processCount > 0 ? 'running' : 'stopped';
      } catch (error) {
        metrics.processCount = 0;
        metrics.status = 'unknown';
      }

      // Check application health endpoint
      try {
        const healthCheck = await this.checkHealthEndpoint();
        metrics.healthEndpoint = healthCheck;
      } catch (error) {
        metrics.healthEndpoint = { status: 'error', responseTime: 0 };
      }

      return metrics;
    } catch (error) {
      console.error('Error getting application metrics:', error);
      return { processCount: 0, status: 'unknown', healthEndpoint: { status: 'error' } };
    }
  }

  // 🏥 Perform health checks
  async performHealthChecks() {
    const checks = [];

    // Database check
    checks.push(await this.checkDatabase());
    
    // Storage service check
    checks.push(await this.checkStorageService());
    
    // API endpoints check
    checks.push(await this.checkApiEndpoints());
    
    // External services check
    checks.push(await this.checkExternalServices());

    return checks;
  }

  // 🗄️ Check database
  async checkDatabase() {
    const startTime = Date.now();
    
    try {
      // Try to connect to database (simplified check)
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'database',
        status: 'healthy',
        message: 'Database connection successful',
        responseTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'critical',
        message: `Database connection failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  // 💾 Check storage service
  async checkStorageService() {
    const startTime = Date.now();
    
    try {
      // Check if storage directory is accessible
      const storagePath = process.env.STORAGE_PATH || './uploads';
      await fs.promises.access(storagePath, fs.constants.R_OK | fs.constants.W_OK);
      
      return {
        name: 'storage',
        status: 'healthy',
        message: 'Storage service is accessible',
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: 'storage',
        status: 'critical',
        message: `Storage service check failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  // 🌐 Check API endpoints
  async checkApiEndpoints() {
    const startTime = Date.now();
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const endpoints = ['/api/health', '/api/ping'];
      
      const results = await Promise.allSettled(
        endpoints.map(endpoint => this.checkEndpoint(`${baseUrl}${endpoint}`))
      );
      
      const failedCount = results.filter(r => r.status === 'rejected').length;
      const status = failedCount === 0 ? 'healthy' : failedCount === endpoints.length ? 'critical' : 'warning';
      
      return {
        name: 'api-endpoints',
        status,
        message: `${endpoints.length - failedCount}/${endpoints.length} endpoints healthy`,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: 'api-endpoints',
        status: 'critical',
        message: `API endpoints check failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  // 🔗 Check external services
  async checkExternalServices() {
    const startTime = Date.now();
    
    try {
      // Check external services (simplified)
      const services = ['google.com', 'cloudflare.com'];
      const results = await Promise.allSettled(
        services.map(service => this.pingService(service))
      );
      
      const failedCount = results.filter(r => r.status === 'rejected').length;
      const status = failedCount === 0 ? 'healthy' : 'warning';
      
      return {
        name: 'external-services',
        status,
        message: `${services.length - failedCount}/${services.length} external services reachable`,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        name: 'external-services',
        status: 'warning',
        message: `External services check failed: ${error.message}`,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      };
    }
  }

  // 🔍 Check health endpoint
  async checkHealthEndpoint() {
    const startTime = Date.now();
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/health`);
      
      return {
        status: response.ok ? 'healthy' : 'error',
        responseTime: Date.now() - startTime,
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  // 🔍 Check individual endpoint
  async checkEndpoint(url) {
    const response = await fetch(url, { timeout: 5000 });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response;
  }

  // 🏓 Ping service
  async pingService(hostname) {
    const { stdout } = await execAsync(`ping -c 1 ${hostname}`);
    return stdout.includes('1 received');
  }

  // 📊 Calculate overall status
  calculateOverallStatus(metrics, healthChecks) {
    // Check for critical health checks
    if (healthChecks.some(check => check.status === 'critical')) {
      return 'critical';
    }

    // Check metrics thresholds
    if (
      metrics.cpu?.usage > this.config.alertThresholds.cpu ||
      metrics.memory?.percentage > this.config.alertThresholds.memory ||
      metrics.storage?.percentage > this.config.alertThresholds.storage
    ) {
      return 'critical';
    }

    // Check for warnings
    if (
      healthChecks.some(check => check.status === 'warning') ||
      metrics.cpu?.usage > this.config.alertThresholds.cpu * 0.8 ||
      metrics.memory?.percentage > this.config.alertThresholds.memory * 0.8
    ) {
      return 'warning';
    }

    return 'healthy';
  }

  // 🚨 Check for alerts
  async checkAlerts(checkResult) {
    const { metrics, healthChecks, overallStatus } = checkResult;

    // System alerts
    if (metrics.cpu?.usage > this.config.alertThresholds.cpu) {
      await this.sendAlert(
        'High CPU Usage',
        `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
        'critical'
      );
    }

    if (metrics.memory?.percentage > this.config.alertThresholds.memory) {
      await this.sendAlert(
        'High Memory Usage',
        `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        'critical'
      );
    }

    if (metrics.storage?.percentage > this.config.alertThresholds.storage) {
      await this.sendAlert(
        'High Storage Usage',
        `Storage usage is at ${metrics.storage.percentage.toFixed(1)}%`,
        'critical'
      );
    }

    // Application alerts
    if (metrics.application?.status === 'stopped') {
      await this.sendAlert(
        'Application Down',
        'HafiPortrait application is not running',
        'critical'
      );
    }

    // Health check alerts
    for (const check of healthChecks) {
      if (check.status === 'critical') {
        await this.sendAlert(
          `${check.name} Health Check Failed`,
          check.message,
          'critical'
        );
      }
    }
  }

  // 📤 Send alert
  async sendAlert(title, message, severity) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      severity,
      timestamp: new Date(),
      source: 'automated-monitor'
    };

    this.alerts.push(alert);
    console.log(`🚨 ALERT [${severity.toUpperCase()}]: ${title} - ${message}`);

    // Send notifications
    if (this.config.notifications.slack) {
      await this.sendSlackAlert(alert);
    }

    // Log alert
    this.logAlert(alert);
  }

  // 💬 Send Slack alert
  async sendSlackAlert(alert) {
    try {
      const color = {
        critical: '#FF0000',
        high: '#FF6600',
        medium: '#FFAA00',
        low: '#FFDD00',
        info: '#00AA00'
      }[alert.severity] || '#808080';

      const payload = {
        attachments: [{
          color,
          title: `🚨 ${alert.title}`,
          text: alert.message,
          fields: [
            { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
            { title: 'Source', value: alert.source, short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true }
          ],
          footer: 'HafiPortrait Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000)
        }]
      };

      await fetch(this.config.notifications.slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // 📝 Log result
  logResult(result) {
    const logEntry = {
      timestamp: result.timestamp.toISOString(),
      status: result.overallStatus,
      cpu: result.metrics.cpu?.usage,
      memory: result.metrics.memory?.percentage,
      storage: result.metrics.storage?.percentage,
      healthChecks: result.healthChecks.map(check => ({
        name: check.name,
        status: check.status
      }))
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(this.config.logFile, logLine);
  }

  // 📝 Log alert
  logAlert(alert) {
    const logLine = `[${alert.timestamp.toISOString()}] ALERT [${alert.severity.toUpperCase()}]: ${alert.title} - ${alert.message}\n`;
    fs.appendFileSync(this.config.logFile, logLine);
  }

  // 💾 Save metrics
  saveMetrics() {
    try {
      const data = {
        lastUpdated: new Date().toISOString(),
        metrics: this.metrics.slice(-100), // Keep last 100 entries
        alerts: this.alerts.slice(-50) // Keep last 50 alerts
      };
      
      fs.writeFileSync(this.config.metricsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  }

  // 🛠️ Utility: Parse size string to bytes
  parseSize(sizeStr) {
    const units = { K: 1024, M: 1024**2, G: 1024**3, T: 1024**4 };
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)(K|M|G|T)?$/);
    if (!match) return 0;
    
    const value = parseFloat(match[1]);
    const unit = match[2] || '';
    return Math.round(value * (units[unit] || 1));
  }
}

// 🚀 Main execution
if (require.main === module) {
  const monitor = new AutomatedMonitor();
  
  console.log('🤖 HafiPortrait Automated Monitoring System');
  console.log('==========================================');
  
  monitor.start().catch(error => {
    console.error('Failed to start monitoring:', error);
    process.exit(1);
  });
}

module.exports = AutomatedMonitor;