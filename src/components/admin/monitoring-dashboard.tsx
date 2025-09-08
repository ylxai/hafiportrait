'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Server, 
  Database, 
  Wifi, 
  HardDrive,
  RefreshCw,
  Bell,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  metrics: {
    totalChecks: number;
    healthyChecks: number;
    avgResponseTime: number;
    errorRate: number;
  };
  system?: {
    memory?: { used: number; total: number; percentage: number };
    cpu?: { usage: number };
    disk?: { usage: number };
  };
}

interface AlertData {
  id: string;
  type: string;
  message: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  timestamp: number;
  datetime: string;
}

export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/monitoring/health');
      const data = await response.json();
      setHealthData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      // Implementasi fetch alerts dari API
      // Untuk sekarang gunakan data dummy
      setAlerts([]);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchHealthData(), fetchAlerts()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const getServiceIcon = (serviceName: string) => {
    switch (serviceName) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'storage':
        return <HardDrive className="h-4 w-4" />;
      case 'external-services':
        return <Wifi className="h-4 w-4" />;
      case 'environment':
        return <Server className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading monitoring data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time health monitoring untuk HafiPortrait
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {healthData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(healthData.status)}
                <CardTitle>System Status</CardTitle>
                <Badge variant={healthData.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthData.status.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdate?.toLocaleTimeString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatUptime(healthData.uptime)}</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{healthData.metrics.avgResponseTime}ms</div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {healthData.metrics.healthyChecks}/{healthData.metrics.totalChecks}
                </div>
                <div className="text-sm text-muted-foreground">Healthy Services</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round((1 - healthData.metrics.errorRate) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="system">System Resources</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4">
          {healthData?.checks.map((check) => (
            <Card key={check.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getServiceIcon(check.name)}
                    <CardTitle className="capitalize">{check.name.replace('-', ' ')}</CardTitle>
                    <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                      {check.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {check.responseTime}ms
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {check.error && (
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{check.error}</AlertDescription>
                  </Alert>
                )}
                {check.details && (
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(check.details, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* System Resources Tab */}
        <TabsContent value="system" className="space-y-4">
          {healthData?.system && (
            <div className="grid gap-4">
              {healthData.system.memory && (
                <Card>
                  <CardHeader>
                    <CardTitle>Memory Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used: {Math.round(healthData.system.memory.used / 1024 / 1024)}MB</span>
                        <span>Total: {Math.round(healthData.system.memory.total / 1024 / 1024)}MB</span>
                      </div>
                      <Progress value={healthData.system.memory.percentage} />
                      <div className="text-center text-sm text-muted-foreground">
                        {healthData.system.memory.percentage}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {healthData.system.cpu && (
                <Card>
                  <CardHeader>
                    <CardTitle>CPU Usage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Progress value={healthData.system.cpu.usage} />
                      <div className="text-center text-sm text-muted-foreground">
                        {healthData.system.cpu.usage}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No recent alerts</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant={alert.level === 'critical' ? 'destructive' : 'secondary'}>
                        {alert.level}
                      </Badge>
                      <CardTitle>{alert.type}</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{alert.message}</p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}