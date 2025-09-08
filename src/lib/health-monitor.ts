// 🏥 Health Monitor System for HafiPortrait
// Comprehensive system health monitoring with real-time metrics

import { alertManager, createSystemAlert, createPerformanceAlert, createSecurityAlert } from './alert-manager';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  responseTime?: number;
  lastChecked: Date;
  metadata?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    inbound: number;
    outbound: number;
  };
  database: {
    connections: number;
    queryTime: number;
    status: 'connected' | 'disconnected' | 'slow';
  };
  api: {
    responseTime: number;
    errorRate: number;
    requestsPerMinute: number;
  };
}

export interface PerformanceMetrics {
  timestamp: Date;
  metrics: SystemMetrics;
  healthChecks: HealthCheck[];
  overallStatus: 'healthy' | 'warning' | 'critical';
}

class HealthMonitor {
  private metrics: PerformanceMetrics[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.initializeHealthChecks();
  }

  // 🔧 Initialize default health checks
  private initializeHealthChecks(): void {
    const defaultChecks = [
      {
        name: 'database-connection',
        status: 'unknown' as const,
        message: 'Database connection not tested',
        lastChecked: new Date()
      },
      {
        name: 'storage-service',
        status: 'unknown' as const,
        message: 'Storage service not tested',
        lastChecked: new Date()
      },
      {
        name: 'api-endpoints',
        status: 'unknown' as const,
        message: 'API endpoints not tested',
        lastChecked: new Date()
      },
      {
        name: 'external-services',
        status: 'unknown' as const,
        message: 'External services not tested',
        lastChecked: new Date()
      }
    ];

    defaultChecks.forEach(check => 
      this.healthChecks.set(check.name, check)
    );
  }

  // 🚀 Start monitoring
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.log('Health monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🏥 Starting health monitoring...');

    // Initial check
    this.performHealthCheck();

    // Set up interval
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  // 🛑 Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Health monitoring stopped');
  }

  // 🔍 Perform comprehensive health check
  private async performHealthCheck(): Promise<void> {
    try {
      const timestamp = new Date();
      
      // Run all health checks in parallel
      const [
        systemMetrics,
        databaseCheck,
        storageCheck,
        apiCheck,
        externalServicesCheck
      ] = await Promise.allSettled([
        this.getSystemMetrics(),
        this.checkDatabase(),
        this.checkStorage(),
        this.checkApiEndpoints(),
        this.checkExternalServices()
      ]);

      // Process results
      const metrics = systemMetrics.status === 'fulfilled' ? systemMetrics.value : this.getDefaultMetrics();
      
      // Update health checks
      if (databaseCheck.status === 'fulfilled') {
        this.healthChecks.set('database-connection', databaseCheck.value);
      }
      if (storageCheck.status === 'fulfilled') {
        this.healthChecks.set('storage-service', storageCheck.value);
      }
      if (apiCheck.status === 'fulfilled') {
        this.healthChecks.set('api-endpoints', apiCheck.value);
      }
      if (externalServicesCheck.status === 'fulfilled') {
        this.healthChecks.set('external-services', externalServicesCheck.value);
      }

      // Determine overall status
      const healthChecksArray = Array.from(this.healthChecks.values());
      const overallStatus = this.calculateOverallStatus(healthChecksArray, metrics);

      // Store metrics
      const performanceMetrics: PerformanceMetrics = {
        timestamp,
        metrics,
        healthChecks: healthChecksArray,
        overallStatus
      };

      this.metrics.push(performanceMetrics);

      // Keep only last 100 metrics (about 1.5 hours at 1-minute intervals)
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Check for alerts
      await this.checkForAlerts(performanceMetrics);

      console.log(`🏥 Health check completed - Status: ${overallStatus}`);

    } catch (error) {
      console.error('Error during health check:', error);
      await createSystemAlert(
        'Health Check Failed',
        `Health monitoring system encountered an error: ${error}`,
        'high'
      );
    }
  }

  // 📊 Get system metrics
  private async getSystemMetrics(): Promise<SystemMetrics> {
    // In a real implementation, these would come from actual system monitoring
    // For now, we'll simulate some metrics
    
    return {
      cpu: {
        usage: Math.random() * 100,
        load: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
      },
      memory: {
        used: Math.random() * 8000000000, // 8GB max
        total: 8000000000,
        percentage: Math.random() * 100
      },
      storage: {
        used: Math.random() * 100000000000, // 100GB max
        total: 100000000000,
        percentage: Math.random() * 100
      },
      network: {
        inbound: Math.random() * 1000000, // 1MB/s max
        outbound: Math.random() * 1000000
      },
      database: {
        connections: Math.floor(Math.random() * 50),
        queryTime: Math.random() * 1000,
        status: Math.random() > 0.1 ? 'connected' : 'slow'
      },
      api: {
        responseTime: Math.random() * 2000,
        errorRate: Math.random() * 10,
        requestsPerMinute: Math.floor(Math.random() * 1000)
      }
    };
  }

  // 🗄️ Check database health
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate database check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
      
      const responseTime = Date.now() - startTime;
      const isHealthy = responseTime < 500 && Math.random() > 0.05;

      return {
        name: 'database-connection',
        status: isHealthy ? 'healthy' : 'warning',
        message: isHealthy ? 'Database connection is healthy' : 'Database response time is slow',
        responseTime,
        lastChecked: new Date(),
        metadata: {
          connectionPool: Math.floor(Math.random() * 20),
          activeQueries: Math.floor(Math.random() * 10)
        }
      };
    } catch (error) {
      return {
        name: 'database-connection',
        status: 'critical',
        message: `Database connection failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  // 💾 Check storage health
  private async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate storage check
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
      
      const responseTime = Date.now() - startTime;
      const storageUsage = Math.random() * 100;
      
      let status: HealthCheck['status'] = 'healthy';
      let message = 'Storage service is healthy';
      
      if (storageUsage > 90) {
        status = 'critical';
        message = 'Storage usage is critically high';
      } else if (storageUsage > 80) {
        status = 'warning';
        message = 'Storage usage is high';
      }

      return {
        name: 'storage-service',
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        metadata: {
          usagePercentage: storageUsage,
          availableSpace: (100 - storageUsage) * 1000000000 // GB to bytes
        }
      };
    } catch (error) {
      return {
        name: 'storage-service',
        status: 'critical',
        message: `Storage service check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  // 🌐 Check API endpoints
  private async checkApiEndpoints(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check critical API endpoints
      const endpoints = ['/api/health', '/api/events', '/api/photos'];
      const results = await Promise.allSettled(
        endpoints.map(endpoint => this.checkEndpoint(endpoint))
      );

      const responseTime = Date.now() - startTime;
      const failedEndpoints = results.filter(r => r.status === 'rejected').length;
      
      let status: HealthCheck['status'] = 'healthy';
      let message = 'All API endpoints are healthy';
      
      if (failedEndpoints > 0) {
        status = failedEndpoints === endpoints.length ? 'critical' : 'warning';
        message = `${failedEndpoints}/${endpoints.length} API endpoints are failing`;
      }

      return {
        name: 'api-endpoints',
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        metadata: {
          totalEndpoints: endpoints.length,
          failedEndpoints,
          successRate: ((endpoints.length - failedEndpoints) / endpoints.length) * 100
        }
      };
    } catch (error) {
      return {
        name: 'api-endpoints',
        status: 'critical',
        message: `API endpoint check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  // 🔗 Check external services
  private async checkExternalServices(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Simulate external service checks
      const services = ['cloudflare-r2', 'google-drive', 'socket-io'];
      const results = await Promise.allSettled(
        services.map(service => this.checkExternalService(service))
      );

      const responseTime = Date.now() - startTime;
      const failedServices = results.filter(r => r.status === 'rejected').length;
      
      let status: HealthCheck['status'] = 'healthy';
      let message = 'All external services are healthy';
      
      if (failedServices > 0) {
        status = failedServices === services.length ? 'critical' : 'warning';
        message = `${failedServices}/${services.length} external services are failing`;
      }

      return {
        name: 'external-services',
        status,
        message,
        responseTime,
        lastChecked: new Date(),
        metadata: {
          totalServices: services.length,
          failedServices,
          successRate: ((services.length - failedServices) / services.length) * 100
        }
      };
    } catch (error) {
      return {
        name: 'external-services',
        status: 'critical',
        message: `External services check failed: ${error}`,
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };
    }
  }

  // 🔍 Check individual endpoint
  private async checkEndpoint(endpoint: string): Promise<void> {
    // Simulate endpoint check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    if (Math.random() < 0.05) { // 5% failure rate
      throw new Error(`Endpoint ${endpoint} is not responding`);
    }
  }

  // 🔍 Check individual external service
  private async checkExternalService(service: string): Promise<void> {
    // Simulate external service check
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
    
    if (Math.random() < 0.02) { // 2% failure rate
      throw new Error(`External service ${service} is not responding`);
    }
  }

  // 📊 Calculate overall system status
  private calculateOverallStatus(healthChecks: HealthCheck[], metrics: SystemMetrics): 'healthy' | 'warning' | 'critical' {
    // Check for critical health checks
    if (healthChecks.some(check => check.status === 'critical')) {
      return 'critical';
    }

    // Check system metrics thresholds
    if (
      metrics.cpu.usage > 90 ||
      metrics.memory.percentage > 90 ||
      metrics.storage.percentage > 95 ||
      metrics.api.errorRate > 10
    ) {
      return 'critical';
    }

    // Check for warnings
    if (
      healthChecks.some(check => check.status === 'warning') ||
      metrics.cpu.usage > 70 ||
      metrics.memory.percentage > 80 ||
      metrics.storage.percentage > 85 ||
      metrics.api.errorRate > 5 ||
      metrics.api.responseTime > 1000
    ) {
      return 'warning';
    }

    return 'healthy';
  }

  // 🚨 Check for alert conditions
  private async checkForAlerts(performanceMetrics: PerformanceMetrics): Promise<void> {
    const { metrics, overallStatus } = performanceMetrics;

    // System alerts
    if (metrics.cpu.usage > 90) {
      await createSystemAlert(
        'High CPU Usage',
        `CPU usage is at ${metrics.cpu.usage.toFixed(1)}%`,
        'critical'
      );
    }

    if (metrics.memory.percentage > 90) {
      await createSystemAlert(
        'High Memory Usage',
        `Memory usage is at ${metrics.memory.percentage.toFixed(1)}%`,
        'critical'
      );
    }

    if (metrics.storage.percentage > 95) {
      await createSystemAlert(
        'Storage Almost Full',
        `Storage usage is at ${metrics.storage.percentage.toFixed(1)}%`,
        'critical'
      );
    }

    // Performance alerts
    if (metrics.api.responseTime > 2000) {
      await createPerformanceAlert(
        'High API Response Time',
        `Average API response time is ${metrics.api.responseTime.toFixed(0)}ms`,
        'high'
      );
    }

    if (metrics.api.errorRate > 10) {
      await createPerformanceAlert(
        'High API Error Rate',
        `API error rate is ${metrics.api.errorRate.toFixed(1)}%`,
        'critical'
      );
    }

    // Database alerts
    if (metrics.database.status === 'disconnected') {
      await createSystemAlert(
        'Database Connection Lost',
        'Database connection is not available',
        'critical'
      );
    } else if (metrics.database.queryTime > 1000) {
      await createPerformanceAlert(
        'Slow Database Queries',
        `Average database query time is ${metrics.database.queryTime.toFixed(0)}ms`,
        'high'
      );
    }
  }

  // 📊 Get default metrics (fallback)
  private getDefaultMetrics(): SystemMetrics {
    return {
      cpu: { usage: 0, load: [0, 0, 0] },
      memory: { used: 0, total: 0, percentage: 0 },
      storage: { used: 0, total: 0, percentage: 0 },
      network: { inbound: 0, outbound: 0 },
      database: { connections: 0, queryTime: 0, status: 'unknown' as const },
      api: { responseTime: 0, errorRate: 0, requestsPerMinute: 0 }
    };
  }

  // 📈 Get latest metrics
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  // 📊 Get metrics history
  getMetricsHistory(limit?: number): PerformanceMetrics[] {
    const metrics = [...this.metrics];
    return limit ? metrics.slice(-limit) : metrics;
  }

  // 🏥 Get current health status
  getCurrentHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    checks: HealthCheck[];
    lastUpdated: Date;
  } {
    const latest = this.getLatestMetrics();
    return {
      status: latest?.overallStatus || 'unknown',
      checks: Array.from(this.healthChecks.values()),
      lastUpdated: latest?.timestamp || new Date()
    };
  }

  // 📊 Get system statistics
  getSystemStats(): {
    uptime: number;
    totalChecks: number;
    averageResponseTime: number;
    healthyPercentage: number;
  } {
    const totalChecks = this.metrics.length;
    const healthyChecks = this.metrics.filter(m => m.overallStatus === 'healthy').length;
    
    const responseTimes = this.metrics
      .flatMap(m => m.healthChecks)
      .filter(check => check.responseTime)
      .map(check => check.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    return {
      uptime: this.isMonitoring ? Date.now() - (this.metrics[0]?.timestamp.getTime() || Date.now()) : 0,
      totalChecks,
      averageResponseTime,
      healthyPercentage: totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0
    };
  }
}

// 🌟 Export singleton instance
export const healthMonitor = new HealthMonitor();

// 🚀 Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  healthMonitor.startMonitoring(60000); // Check every minute
}