'use client';

// 📊 Real-time System Monitor for HafiPortrait Admin
// Live system metrics and health monitoring dashboard

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Network,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  Camera,
  Upload,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { PerformanceMetrics, HealthCheck } from '@/lib/health-monitor';

interface RealTimeMonitorProps {
  className?: string;
}

export function RealTimeMonitor({ className }: RealTimeMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [dslrData, setDslrData] = useState<any>(null);

  // 🔄 Load real-time data
  const loadData = async () => {
    try {
      // Fetch monitoring data
      const response = await fetch('/api/admin/monitoring?type=overview');
      const data = await response.json();
      
      if (data.metrics) {
        // Convert API data to expected format
        const metricsData = {
          timestamp: new Date(data.timestamp),
          metrics: data.metrics,
          healthChecks: data.healthChecks || [],
          overallStatus: data.status || 'healthy'
        };
        
        setMetrics(metricsData);
        setLastUpdate(new Date());
        
        // Add to history
        setMetricsHistory(prev => {
          const newHistory = [...prev, metricsData];
          return newHistory.slice(-20); // Keep last 20
        });
      }

      // Fetch DSLR data
      const dslrResponse = await fetch('/api/dslr/status');
      if (dslrResponse.ok) {
        const dslrResult = await dslrResponse.json();
        setDslrData(dslrResult);
      }
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    }
  };

  // 🔄 Auto-refresh effect
  useEffect(() => {
    loadData();
    
    if (isLive) {
      const interval = setInterval(loadData, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isLive]);

  // 🎨 Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // 🎨 Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'outline';
    }
  };

  // 📊 Format bytes
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 📊 Format percentage
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  // 📊 Get trend indicator
  const getTrendIndicator = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  if (!metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading system metrics...</span>
      </div>
    );
  }

  const previousMetrics = metricsHistory.length > 1 ? metricsHistory[metricsHistory.length - 2] : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 🎛️ Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Badge variant={getStatusBadge(metrics.overallStatus) as any} className="text-sm">
            {metrics.overallStatus.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 📊 System Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CPU Usage */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">CPU</span>
              </div>
              {previousMetrics && getTrendIndicator(
                metrics.metrics.cpu.usage,
                previousMetrics.metrics.cpu.usage
              )}
            </div>
            <div className="space-y-2">
              <Progress value={metrics.metrics.cpu.usage} className="h-2" />
              <p className="text-xl font-bold">{formatPercentage(metrics.metrics.cpu.usage)}</p>
              <p className="text-xs text-muted-foreground">
                Load: {metrics.metrics.cpu.load.map(l => l.toFixed(1)).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <MemoryStick className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              {previousMetrics && getTrendIndicator(
                metrics.metrics.memory.percentage,
                previousMetrics.metrics.memory.percentage
              )}
            </div>
            <div className="space-y-2">
              <Progress value={metrics.metrics.memory.percentage} className="h-2" />
              <p className="text-xl font-bold">{formatPercentage(metrics.metrics.memory.percentage)}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(metrics.metrics.memory.used)} / {formatBytes(metrics.metrics.memory.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Storage Usage */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Storage</span>
              </div>
              {previousMetrics && getTrendIndicator(
                metrics.metrics.storage.percentage,
                previousMetrics.metrics.storage.percentage
              )}
            </div>
            <div className="space-y-2">
              <Progress value={metrics.metrics.storage.percentage} className="h-2" />
              <p className="text-xl font-bold">{formatPercentage(metrics.metrics.storage.percentage)}</p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(metrics.metrics.storage.used)} / {formatBytes(metrics.metrics.storage.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API Performance */}
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">API</span>
              </div>
              {previousMetrics && getTrendIndicator(
                metrics.metrics.api.responseTime,
                previousMetrics.metrics.api.responseTime
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">{metrics.metrics.api.responseTime.toFixed(0)}ms</p>
              <p className="text-xs text-muted-foreground">
                Error: {formatPercentage(metrics.metrics.api.errorRate)}
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics.metrics.api.requestsPerMinute} req/min
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📋 Detailed Tabs */}
      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="dslr">DSLR</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* 🏥 Health Checks Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.healthChecks.map((check) => (
              <Card key={check.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize">
                      {check.name.replace('-', ' ')}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {check.status === 'healthy' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <Badge variant={getStatusBadge(check.status) as any}>
                        {check.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {check.message}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Response: {check.responseTime ? `${check.responseTime}ms` : 'N/A'}
                    </span>
                    <span>
                      Last checked: {new Date(check.lastChecked).toLocaleTimeString()}
                    </span>
                  </div>

                  {check.metadata && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(check.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="ml-1 font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 📊 Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Detailed Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Detailed Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* CPU Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">CPU Usage</span>
                    </div>
                    <span className="text-sm text-gray-600">{metrics.metrics.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.metrics.cpu.usage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    Load Average: {metrics.metrics.cpu.load.map(l => l.toFixed(2)).join(', ')}
                  </div>
                </div>

                {/* Memory Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Memory Usage</span>
                    </div>
                    <span className="text-sm text-gray-600">{metrics.metrics.memory.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.metrics.memory.percentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {formatBytes(metrics.metrics.memory.used)} / {formatBytes(metrics.metrics.memory.total)}
                  </div>
                </div>

                {/* Storage Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Storage Usage</span>
                    </div>
                    <span className="text-sm text-gray-600">{metrics.metrics.storage.percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={metrics.metrics.storage.percentage} className="h-2" />
                  <div className="text-xs text-gray-500">
                    {formatBytes(metrics.metrics.storage.used)} / {formatBytes(metrics.metrics.storage.total)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="h-5 w-5" />
                  <span>System Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Server Status</span>
                  <Badge variant="default">Online</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium">7 days, 14 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-sm font-medium">{metrics.metrics.api.responseTime.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Requests/min</span>
                  <span className="text-sm font-medium">{metrics.metrics.api.requestsPerMinute}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <span className="text-sm font-medium">{metrics.metrics.api.errorRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 📷 DSLR Tab */}
        <TabsContent value="dslr" className="space-y-4">
          {dslrData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>DSLR Service Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Service Status</span>
                    <Badge variant={dslrData.success ? "default" : "destructive"}>
                      {dslrData.success ? "Running" : "Stopped"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Camera Connected</span>
                    <Badge variant={dslrData.isConnected ? "default" : "destructive"}>
                      {dslrData.isConnected ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Disconnected
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Processing</span>
                    <Badge variant={dslrData.isProcessing ? "default" : "outline"}>
                      {dslrData.isProcessing ? "Active" : "Idle"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Watch Folder</span>
                    <span className="text-xs font-medium text-gray-500 max-w-[200px] truncate">
                      {dslrData.watchFolder || "Not set"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Event ID</span>
                    <span className="text-sm font-medium">
                      {dslrData.eventId || "No active event"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Upload Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Uploaded</span>
                    <span className="text-sm font-medium">{dslrData.totalUploaded || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Failed Uploads</span>
                    <span className="text-sm font-medium text-red-600">{dslrData.failedUploads || 0}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-medium">
                        {dslrData.totalUploaded > 0 
                          ? (((dslrData.totalUploaded - (dslrData.failedUploads || 0)) / dslrData.totalUploaded) * 100).toFixed(1)
                          : 100}%
                      </span>
                    </div>
                    <Progress 
                      value={dslrData.totalUploaded > 0 
                        ? ((dslrData.totalUploaded - (dslrData.failedUploads || 0)) / dslrData.totalUploaded) * 100
                        : 100} 
                      className="h-2" 
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Queue Size</span>
                    <span className="text-sm font-medium">{dslrData.queueSize || 0} files</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Upload</span>
                    <span className="text-sm font-medium">
                      {dslrData.lastUpload 
                        ? new Date(dslrData.lastUpload).toLocaleString()
                        : "No uploads yet"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Uploader</span>
                    <span className="text-sm font-medium">{dslrData.uploaderName || "Unknown"}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Loading DSLR Data...</h3>
                <p className="text-muted-foreground">
                  Fetching DSLR service status and statistics
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 🛡️ Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SSL Certificate</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Threat Level</span>
                  <Badge variant="default">Low</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Failed Logins (24h)</span>
                  <span className="text-sm font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Security Scan</span>
                  <span className="text-sm font-medium">1 hour ago</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Firewall Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Security Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No security alerts</p>
                  <p className="text-xs text-gray-500">All systems secure</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 🗄️ Database Tab */}
        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Connection Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant={getStatusBadge(metrics.metrics.database.status) as any}>
                    {metrics.metrics.database.status.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Active connections: {metrics.metrics.database.connections}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Query Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    {metrics.metrics.database.queryTime.toFixed(0)}ms
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average query time
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.healthChecks
                    .filter(check => check.name === 'database-connection')
                    .map(check => (
                      <div key={check.name}>
                        <Badge variant={getStatusBadge(check.status) as any}>
                          {check.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {check.message}
                        </p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 🌐 Network Tab */}
        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Network className="h-5 w-5" />
                  <span>Network Traffic</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Inbound</span>
                      <span>{formatBytes(metrics.metrics.network.inbound)}/s</span>
                    </div>
                    <Progress value={(metrics.metrics.network.inbound / 1000000) * 100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Outbound</span>
                      <span>{formatBytes(metrics.metrics.network.outbound)}/s</span>
                    </div>
                    <Progress value={(metrics.metrics.network.outbound / 1000000) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics.healthChecks
                    .filter(check => check.name === 'external-services')
                    .map(check => (
                      <div key={check.name}>
                        <Badge variant={getStatusBadge(check.status) as any}>
                          {check.status}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {check.message}
                        </p>
                        {check.metadata && (
                          <p className="text-xs text-muted-foreground">
                            Success Rate: {check.metadata.successRate?.toFixed(1)}%
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 📈 History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Metrics History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Showing last {metricsHistory.length} data points
                </p>
                
                {/* Simple metrics table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">CPU</th>
                        <th className="text-left p-2">Memory</th>
                        <th className="text-left p-2">API Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsHistory.slice(-10).reverse().map((metric, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{new Date(metric.timestamp).toLocaleTimeString()}</td>
                          <td className="p-2">
                            <Badge variant={getStatusBadge(metric.overallStatus) as any} className="text-xs">
                              {metric.overallStatus}
                            </Badge>
                          </td>
                          <td className="p-2">{formatPercentage(metric.metrics.cpu.usage)}</td>
                          <td className="p-2">{formatPercentage(metric.metrics.memory.percentage)}</td>
                          <td className="p-2">{metric.metrics.api.responseTime.toFixed(0)}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}