/**
 * Session Monitoring Dashboard Component
 * Real-time session analytics and health monitoring
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Users, 
  Clock, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { SessionAnalytics, SessionMetrics } from '@/lib/session-analytics';

interface SessionHealth {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
  metrics: SessionMetrics;
}

export function SessionMonitoringDashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch session health data
  const { data: sessionHealth, isLoading, refetch } = useQuery<SessionHealth>({
    queryKey: ['session-health'],
    queryFn: async () => {
      const response = await fetch('/api/admin/session/health');
      if (!response.ok) throw new Error('Failed to fetch session health');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 15000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      case 'desktop': return <Monitor className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Session Monitoring</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const metrics = sessionHealth?.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Session Monitoring</h2>
          <p className="text-gray-600">Real-time session analytics and health monitoring</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(sessionHealth?.status || 'unknown')}
            <span>System Health Status</span>
            <Badge className={getStatusColor(sessionHealth?.status || 'unknown')}>
              {sessionHealth?.status?.toUpperCase() || 'UNKNOWN'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionHealth?.issues && sessionHealth.issues.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Issues Detected:</p>
              <ul className="space-y-1">
                {sessionHealth.issues.map((issue, index) => (
                  <li key={index} className="text-sm text-red-600 flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-green-600 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>All systems operating normally</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold">{metrics?.totalActiveSessions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Session Duration</p>
                <p className="text-2xl font-bold">
                  {metrics ? formatDuration(metrics.averageSessionDuration) : '0h 0m'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Login Success Rate</p>
                <p className="text-2xl font-bold">{metrics?.loginSuccessRate.toFixed(1) || 0}%</p>
                <Progress value={metrics?.loginSuccessRate || 0} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Auth Failure Rate</p>
                <p className="text-2xl font-bold">{metrics?.authFailureRate.toFixed(1) || 0}%</p>
                <Progress value={metrics?.authFailureRate || 0} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Types & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics && Object.entries(metrics.deviceTypes).map(([device, count]) => (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getDeviceIcon(device)}
                    <span className="text-sm font-medium">{device}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {(!metrics || Object.keys(metrics.deviceTypes).length === 0) && (
                <p className="text-sm text-gray-500">No device data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Unique IP Addresses</span>
                <Badge variant="outline">{metrics?.ipAddresses.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Activity</span>
                <span className="text-sm text-gray-600">
                  {metrics?.lastActivity ? new Date(metrics.lastActivity).toLocaleString() : 'Unknown'}
                </span>
              </div>
              {metrics?.ipAddresses && metrics.ipAddresses.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Recent IP Addresses:</p>
                  <div className="space-y-1">
                    {metrics.ipAddresses.slice(0, 5).map((ip, index) => (
                      <div key={index} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                        {ip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions by Time */}
      {metrics && Object.keys(metrics.sessionsByTimeOfDay).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Login Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const timeSlot = `${hour}:00`;
                const count = metrics.sessionsByTimeOfDay[timeSlot] || 0;
                const maxCount = Math.max(...Object.values(metrics.sessionsByTimeOfDay));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <div key={hour} className="flex flex-col items-center space-y-1">
                    <div 
                      className="w-full bg-blue-200 rounded-t"
                      style={{ height: `${Math.max(height, 2)}px`, minHeight: '2px' }}
                    >
                      <div 
                        className="w-full bg-blue-600 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600">{hour}</span>
                    {count > 0 && (
                      <span className="text-xs font-medium">{count}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}