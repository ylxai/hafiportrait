#!/usr/bin/env node

/**
 * Alert Manager untuk HafiPortrait
 * Mengelola notifikasi dan alerting sistem
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

class AlertManager {
  constructor() {
    this.config = {
      notifications: {
        slack: process.env.SLACK_WEBHOOK,
        discord: process.env.DISCORD_WEBHOOK,
        email: process.env.NOTIFICATION_EMAIL,
        whatsapp: process.env.WHATSAPP_API_URL
      },
      alertLevels: {
        info: { color: '#36a64f', priority: 1 },
        warning: { color: '#ff9500', priority: 2 },
        error: { color: '#ff0000', priority: 3 },
        critical: { color: '#8b0000', priority: 4 }
      },
      cooldownPeriod: 300000, // 5 menit
      alertsFile: path.join(__dirname, '../logs/alerts-history.json')
    };

    this.alertHistory = this.loadAlertHistory();
    this.ensureDirectories();
  }

  ensureDirectories() {
    const logDir = path.dirname(this.config.alertsFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  loadAlertHistory() {
    try {
      if (fs.existsSync(this.config.alertsFile)) {
        return JSON.parse(fs.readFileSync(this.config.alertsFile, 'utf8'));
      }
    } catch (error) {
      console.error('Failed to load alert history:', error);
    }
    return [];
  }

  saveAlertHistory() {
    try {
      // Keep only last 1000 alerts
      if (this.alertHistory.length > 1000) {
        this.alertHistory = this.alertHistory.slice(-1000);
      }
      fs.writeFileSync(this.config.alertsFile, JSON.stringify(this.alertHistory, null, 2));
    } catch (error) {
      console.error('Failed to save alert history:', error);
    }
  }

  shouldSendAlert(type, level) {
    const now = Date.now();
    const recentAlerts = this.alertHistory.filter(alert => 
      alert.type === type && 
      alert.level === level &&
      (now - alert.timestamp) < this.config.cooldownPeriod
    );
    
    return recentAlerts.length === 0;
  }

  async sendAlert(type, message, level = 'error', metadata = {}) {
    if (!this.shouldSendAlert(type, level)) {
      console.log(`Alert cooldown active for ${type}:${level}`);
      return false;
    }

    const alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      level,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      metadata,
      sent: {
        slack: false,
        discord: false,
        email: false,
        whatsapp: false
      }
    };

    // Add to history
    this.alertHistory.push(alert);
    this.saveAlertHistory();

    console.log(`🚨 ALERT [${level.toUpperCase()}] ${type}: ${message}`);

    // Send notifications
    const results = await Promise.allSettled([
      this.sendSlackAlert(alert),
      this.sendDiscordAlert(alert),
      this.sendEmailAlert(alert),
      this.sendWhatsAppAlert(alert)
    ]);

    // Update sent status
    alert.sent.slack = results[0].status === 'fulfilled' && results[0].value;
    alert.sent.discord = results[1].status === 'fulfilled' && results[1].value;
    alert.sent.email = results[2].status === 'fulfilled' && results[2].value;
    alert.sent.whatsapp = results[3].status === 'fulfilled' && results[3].value;

    this.saveAlertHistory();
    return alert;
  }

  async sendSlackAlert(alert) {
    if (!this.config.notifications.slack) return false;

    try {
      const levelConfig = this.config.alertLevels[alert.level];
      const emoji = this.getEmojiForLevel(alert.level);
      
      const payload = {
        text: `${emoji} HafiPortrait System Alert`,
        attachments: [{
          color: levelConfig.color,
          fields: [
            { title: 'Level', value: alert.level.toUpperCase(), short: true },
            { title: 'Type', value: alert.type, short: true },
            { title: 'Message', value: alert.message, short: false },
            { title: 'Time', value: alert.datetime, short: true },
            { title: 'Alert ID', value: alert.id, short: true }
          ],
          footer: 'HafiPortrait Monitoring',
          ts: Math.floor(alert.timestamp / 1000)
        }]
      };

      if (alert.metadata && Object.keys(alert.metadata).length > 0) {
        payload.attachments[0].fields.push({
          title: 'Details',
          value: JSON.stringify(alert.metadata, null, 2),
          short: false
        });
      }

      const response = await this.makeRequest(this.config.notifications.slack, {
        method: 'POST',
        body: payload
      });

      return response.statusCode === 200;
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  async sendDiscordAlert(alert) {
    if (!this.config.notifications.discord) return false;

    try {
      const levelConfig = this.config.alertLevels[alert.level];
      const emoji = this.getEmojiForLevel(alert.level);
      
      const embed = {
        title: `${emoji} HafiPortrait System Alert`,
        description: alert.message,
        color: parseInt(levelConfig.color.replace('#', ''), 16),
        fields: [
          { name: 'Level', value: alert.level.toUpperCase(), inline: true },
          { name: 'Type', value: alert.type, inline: true },
          { name: 'Alert ID', value: alert.id, inline: true }
        ],
        timestamp: alert.datetime,
        footer: { text: 'HafiPortrait Monitoring' }
      };

      if (alert.metadata && Object.keys(alert.metadata).length > 0) {
        embed.fields.push({
          name: 'Details',
          value: '```json\n' + JSON.stringify(alert.metadata, null, 2) + '\n```',
          inline: false
        });
      }

      const payload = { embeds: [embed] };

      const response = await this.makeRequest(this.config.notifications.discord, {
        method: 'POST',
        body: payload
      });

      return response.statusCode === 200 || response.statusCode === 204;
    } catch (error) {
      console.error('Failed to send Discord alert:', error);
      return false;
    }
  }

  async sendEmailAlert(alert) {
    if (!this.config.notifications.email) return false;

    try {
      // Implementasi email bisa menggunakan SendGrid, Nodemailer, dll
      console.log(`Email alert would be sent to: ${this.config.notifications.email}`);
      console.log(`Subject: [${alert.level.toUpperCase()}] HafiPortrait Alert: ${alert.type}`);
      console.log(`Body: ${alert.message}`);
      
      // Untuk sekarang return true, implementasi actual email nanti
      return true;
    } catch (error) {
      console.error('Failed to send email alert:', error);
      return false;
    }
  }

  async sendWhatsAppAlert(alert) {
    if (!this.config.notifications.whatsapp) return false;

    try {
      const emoji = this.getEmojiForLevel(alert.level);
      const message = `${emoji} *HafiPortrait Alert*\n\n` +
                     `*Level:* ${alert.level.toUpperCase()}\n` +
                     `*Type:* ${alert.type}\n` +
                     `*Message:* ${alert.message}\n` +
                     `*Time:* ${alert.datetime}\n` +
                     `*ID:* ${alert.id}`;

      // Implementasi WhatsApp API
      console.log(`WhatsApp alert would be sent: ${message}`);
      
      // Untuk sekarang return true, implementasi actual WhatsApp nanti
      return true;
    } catch (error) {
      console.error('Failed to send WhatsApp alert:', error);
      return false;
    }
  }

  getEmojiForLevel(level) {
    const emojis = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };
    return emojis[level] || '📢';
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HafiPortrait-AlertManager/1.0',
          ...options.headers
        },
        timeout: 10000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
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

  getAlertHistory(limit = 50) {
    return this.alertHistory
      .slice(-limit)
      .reverse(); // Most recent first
  }

  getAlertStats() {
    const now = Date.now();
    const last24h = this.alertHistory.filter(alert => 
      (now - alert.timestamp) < 86400000 // 24 hours
    );
    
    const stats = {
      total: this.alertHistory.length,
      last24h: last24h.length,
      byLevel: {},
      byType: {},
      successRate: {}
    };

    // Count by level
    this.alertHistory.forEach(alert => {
      stats.byLevel[alert.level] = (stats.byLevel[alert.level] || 0) + 1;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });

    // Calculate success rates
    const channels = ['slack', 'discord', 'email', 'whatsapp'];
    channels.forEach(channel => {
      const total = this.alertHistory.length;
      const successful = this.alertHistory.filter(alert => alert.sent[channel]).length;
      stats.successRate[channel] = total > 0 ? Math.round((successful / total) * 100) : 0;
    });

    return stats;
  }
}

// CLI usage
if (require.main === module) {
  const alertManager = new AlertManager();
  
  const command = process.argv[2];
  const type = process.argv[3];
  const message = process.argv[4];
  const level = process.argv[5] || 'error';
  
  switch (command) {
    case 'send':
      if (!type || !message) {
        console.log('Usage: node alert-manager.js send <type> <message> [level]');
        process.exit(1);
      }
      alertManager.sendAlert(type, message, level).then(result => {
        console.log('Alert sent:', result ? result.id : 'Failed');
        process.exit(0);
      });
      break;
    case 'history':
      const limit = parseInt(process.argv[3]) || 50;
      console.log(JSON.stringify(alertManager.getAlertHistory(limit), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(alertManager.getAlertStats(), null, 2));
      break;
    default:
      console.log('Usage: node alert-manager.js [send|history|stats]');
      process.exit(1);
  }
}

module.exports = AlertManager;