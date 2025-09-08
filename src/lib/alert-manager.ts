// 🚨 Advanced Alert Manager for HafiPortrait
// Comprehensive alerting system with multiple channels and smart routing

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'system' | 'performance' | 'security' | 'business' | 'user';
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  escalationLevel: number;
  tags: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: Alert['severity'];
  category: Alert['category'];
  enabled: boolean;
  cooldown: number; // minutes
  escalationRules: EscalationRule[];
}

export interface EscalationRule {
  level: number;
  delayMinutes: number;
  channels: AlertChannel[];
  recipients: string[];
}

export interface AlertChannel {
  type: 'slack' | 'email' | 'sms' | 'webhook' | 'push' | 'whatsapp';
  config: Record<string, any>;
  enabled: boolean;
}

export interface AlertMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number;
  alertsByCategory: Record<string, number>;
  alertsBySeverity: Record<string, number>;
}

class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private cooldowns: Map<string, Date> = new Map();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  // 🔧 Initialize default alert rules
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'error_rate > threshold',
        threshold: 5, // 5% error rate
        severity: 'critical',
        category: 'system',
        enabled: true,
        cooldown: 15,
        escalationRules: [
          {
            level: 1,
            delayMinutes: 0,
            channels: ['slack', 'email'],
            recipients: ['dev-team']
          },
          {
            level: 2,
            delayMinutes: 15,
            channels: ['slack', 'email', 'sms'],
            recipients: ['dev-team', 'ops-team']
          }
        ]
      },
      {
        id: 'high-response-time',
        name: 'High Response Time',
        condition: 'avg_response_time > threshold',
        threshold: 2000, // 2 seconds
        severity: 'high',
        category: 'performance',
        enabled: true,
        cooldown: 10,
        escalationRules: [
          {
            level: 1,
            delayMinutes: 0,
            channels: ['slack'],
            recipients: ['dev-team']
          }
        ]
      },
      {
        id: 'storage-usage-high',
        name: 'Storage Usage High',
        condition: 'storage_usage > threshold',
        threshold: 85, // 85% storage usage
        severity: 'medium',
        category: 'system',
        enabled: true,
        cooldown: 60,
        escalationRules: [
          {
            level: 1,
            delayMinutes: 0,
            channels: ['slack', 'email'],
            recipients: ['ops-team']
          }
        ]
      },
      {
        id: 'failed-uploads',
        name: 'High Upload Failure Rate',
        condition: 'upload_failure_rate > threshold',
        threshold: 10, // 10% failure rate
        severity: 'high',
        category: 'business',
        enabled: true,
        cooldown: 5,
        escalationRules: [
          {
            level: 1,
            delayMinutes: 0,
            channels: ['slack', 'email'],
            recipients: ['dev-team', 'business-team']
          }
        ]
      },
      {
        id: 'security-breach-attempt',
        name: 'Security Breach Attempt',
        condition: 'failed_login_attempts > threshold',
        threshold: 10, // 10 failed attempts in 5 minutes
        severity: 'critical',
        category: 'security',
        enabled: true,
        cooldown: 1,
        escalationRules: [
          {
            level: 1,
            delayMinutes: 0,
            channels: ['slack', 'email', 'sms'],
            recipients: ['security-team', 'dev-team']
          }
        ]
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  // 🔧 Initialize default alert channels
  private initializeDefaultChannels(): void {
    const defaultChannels: AlertChannel[] = [
      {
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL,
          channel: '#alerts',
          username: 'HafiPortrait Alert Bot'
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL
      },
      {
        type: 'email',
        config: {
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER,
          smtpPass: process.env.SMTP_PASS,
          fromEmail: process.env.ALERT_FROM_EMAIL || 'alerts@hafiportrait.com'
        },
        enabled: !!process.env.SMTP_HOST
      },
      {
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`,
            'Content-Type': 'application/json'
          }
        },
        enabled: !!process.env.ALERT_WEBHOOK_URL
      },
      {
        type: 'whatsapp',
        config: {
          apiUrl: process.env.WHATSAPP_API_URL,
          token: process.env.WHATSAPP_API_TOKEN,
          phoneNumbers: process.env.WHATSAPP_ALERT_NUMBERS?.split(',') || []
        },
        enabled: !!process.env.WHATSAPP_API_URL
      }
    ];

    defaultChannels.forEach(channel => 
      this.channels.set(channel.type, channel)
    );
  }

  // 🚨 Create and process new alert
  async createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'escalationLevel'>): Promise<Alert> {
    const alert: Alert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      escalationLevel: 0,
      resolved: false
    };

    // Check cooldown
    const cooldownKey = `${alert.source}-${alert.category}`;
    const lastAlert = this.cooldowns.get(cooldownKey);
    if (lastAlert && Date.now() - lastAlert.getTime() < 60000) { // 1 minute minimum
      console.log(`Alert ${alert.id} suppressed due to cooldown`);
      return alert;
    }

    this.alerts.set(alert.id, alert);
    this.cooldowns.set(cooldownKey, new Date());

    // Process alert through rules and channels
    await this.processAlert(alert);

    return alert;
  }

  // 🔄 Process alert through rules and escalation
  private async processAlert(alert: Alert): Promise<void> {
    try {
      // Find matching rules
      const matchingRules = Array.from(this.rules.values())
        .filter(rule => rule.enabled && rule.category === alert.category);

      for (const rule of matchingRules) {
        if (this.evaluateRule(rule, alert)) {
          await this.executeEscalation(alert, rule, 0);
          break;
        }
      }

      // Log alert
      console.log(`🚨 Alert created: ${alert.title} [${alert.severity}]`);
      
    } catch (error) {
      console.error('Error processing alert:', error);
    }
  }

  // 📊 Evaluate alert rule
  private evaluateRule(rule: AlertRule, alert: Alert): boolean {
    // Simple rule evaluation - can be extended with more complex logic
    return alert.severity === rule.severity || 
           (rule.severity === 'critical' && ['critical', 'high'].includes(alert.severity));
  }

  // ⬆️ Execute escalation rules
  private async executeEscalation(alert: Alert, rule: AlertRule, level: number): Promise<void> {
    const escalationRule = rule.escalationRules[level];
    if (!escalationRule) return;

    // Send immediate notifications
    if (escalationRule.delayMinutes === 0) {
      await this.sendNotifications(alert, escalationRule);
    }

    // Schedule next escalation level
    if (level + 1 < rule.escalationRules.length) {
      const nextEscalation = rule.escalationRules[level + 1];
      const timer = setTimeout(async () => {
        if (!alert.resolved) {
          alert.escalationLevel = level + 1;
          await this.executeEscalation(alert, rule, level + 1);
        }
      }, nextEscalation.delayMinutes * 60 * 1000);

      this.escalationTimers.set(`${alert.id}-${level + 1}`, timer);
    }
  }

  // 📤 Send notifications through configured channels
  private async sendNotifications(alert: Alert, escalationRule: EscalationRule): Promise<void> {
    const promises = escalationRule.channels.map(async (channelType) => {
      const channel = this.channels.get(channelType);
      if (!channel || !channel.enabled) return;

      try {
        switch (channelType) {
          case 'slack':
            await this.sendSlackNotification(alert, channel);
            break;
          case 'email':
            await this.sendEmailNotification(alert, channel, escalationRule.recipients);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert, channel);
            break;
          case 'whatsapp':
            await this.sendWhatsAppNotification(alert, channel);
            break;
        }
      } catch (error) {
        console.error(`Failed to send ${channelType} notification:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // 💬 Send Slack notification
  private async sendSlackNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    const color = this.getSeverityColor(alert.severity);
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      attachments: [{
        color,
        title: `🚨 ${alert.title}`,
        text: alert.message,
        fields: [
          { title: 'Severity', value: alert.severity.toUpperCase(), short: true },
          { title: 'Category', value: alert.category, short: true },
          { title: 'Source', value: alert.source, short: true },
          { title: 'Time', value: alert.timestamp.toISOString(), short: true }
        ],
        footer: 'HafiPortrait Alert System',
        ts: Math.floor(alert.timestamp.getTime() / 1000)
      }]
    };

    await fetch(channel.config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  // 📧 Send email notification
  private async sendEmailNotification(alert: Alert, channel: AlertChannel, recipients: string[]): Promise<void> {
    // Email implementation would go here
    // Using nodemailer or similar service
    console.log(`📧 Email notification sent for alert: ${alert.id}`);
  }

  // 🔗 Send webhook notification
  private async sendWebhookNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    await fetch(channel.config.url, {
      method: 'POST',
      headers: channel.config.headers,
      body: JSON.stringify({
        alert,
        timestamp: new Date().toISOString(),
        source: 'hafiportrait-alert-manager'
      })
    });
  }

  // 📱 Send WhatsApp notification
  private async sendWhatsAppNotification(alert: Alert, channel: AlertChannel): Promise<void> {
    const message = `🚨 *HafiPortrait Alert*\n\n*${alert.title}*\n${alert.message}\n\nSeverity: ${alert.severity.toUpperCase()}\nTime: ${alert.timestamp.toLocaleString()}`;
    
    for (const phoneNumber of channel.config.phoneNumbers) {
      await fetch(channel.config.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${channel.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: phoneNumber,
          message
        })
      });
    }
  }

  // ✅ Resolve alert
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    // Clear escalation timers
    for (const [key, timer] of this.escalationTimers.entries()) {
      if (key.startsWith(alertId)) {
        clearTimeout(timer);
        this.escalationTimers.delete(key);
      }
    }

    console.log(`✅ Alert resolved: ${alert.title} by ${resolvedBy}`);
    return true;
  }

  // 📊 Get alert metrics
  getMetrics(): AlertMetrics {
    const alerts = Array.from(this.alerts.values());
    const now = Date.now();
    const last24h = alerts.filter(a => now - a.timestamp.getTime() < 24 * 60 * 60 * 1000);

    const resolvedAlerts = alerts.filter(a => a.resolved);
    const resolutionTimes = resolvedAlerts
      .filter(a => a.resolvedAt)
      .map(a => a.resolvedAt!.getTime() - a.timestamp.getTime());

    return {
      totalAlerts: last24h.length,
      criticalAlerts: last24h.filter(a => a.severity === 'critical').length,
      resolvedAlerts: resolvedAlerts.length,
      averageResolutionTime: resolutionTimes.length > 0 
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length 
        : 0,
      alertsByCategory: this.groupBy(last24h, 'category'),
      alertsBySeverity: this.groupBy(last24h, 'severity')
    };
  }

  // 🔍 Get alerts with filters
  getAlerts(filters?: {
    severity?: Alert['severity'];
    category?: Alert['category'];
    resolved?: boolean;
    limit?: number;
  }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.category) {
        alerts = alerts.filter(a => a.category === filters.category);
      }
      if (filters.resolved !== undefined) {
        alerts = alerts.filter(a => a.resolved === filters.resolved);
      }
      if (filters.limit) {
        alerts = alerts.slice(0, filters.limit);
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // 🛠️ Utility methods
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSeverityColor(severity: Alert['severity']): string {
    const colors = {
      critical: '#FF0000',
      high: '#FF6600',
      medium: '#FFAA00',
      low: '#FFDD00',
      info: '#00AA00'
    };
    return colors[severity] || '#808080';
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// 🌟 Export singleton instance
export const alertManager = new AlertManager();

// 🚀 Quick alert creation helpers
export const createSystemAlert = (title: string, message: string, severity: Alert['severity'] = 'medium') =>
  alertManager.createAlert({
    title,
    message,
    severity,
    category: 'system',
    source: 'system-monitor',
    tags: ['automated']
  });

export const createPerformanceAlert = (title: string, message: string, severity: Alert['severity'] = 'medium') =>
  alertManager.createAlert({
    title,
    message,
    severity,
    category: 'performance',
    source: 'performance-monitor',
    tags: ['automated', 'performance']
  });

export const createSecurityAlert = (title: string, message: string, severity: Alert['severity'] = 'high') =>
  alertManager.createAlert({
    title,
    message,
    severity,
    category: 'security',
    source: 'security-monitor',
    tags: ['automated', 'security']
  });

export const createBusinessAlert = (title: string, message: string, severity: Alert['severity'] = 'medium') =>
  alertManager.createAlert({
    title,
    message,
    severity,
    category: 'business',
    source: 'business-monitor',
    tags: ['automated', 'business']
  });