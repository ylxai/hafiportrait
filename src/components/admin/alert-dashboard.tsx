'use client';

// 🚨 Alert Dashboard Component for HafiPortrait Admin
// Real-time alert monitoring and management interface

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Shield, 
  Server,
  Users,
  Activity,
  Bell,
  BellOff,
  Filter,
  RefreshCw
} from 'lucide-react';
import { alertManager, Alert as AlertType, AlertMetrics } from '@/lib/alert-manager';

interface AlertDashboardProps {
  className?: string;
}

export function AlertDashboard({ className }: AlertDashboardProps) {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [metrics, setMetrics] = useState<AlertMetrics | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'unresolved'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 🔄 Load alerts and metrics
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Get alerts based on filter
      let alertFilters = {};
      if (activeFilter === 'critical') {
        alertFilters = { severity: 'critical' as const };
      } else if (activeFilter === 'unresolved') {
        alertFilters = { resolved: false };
      }
      
      const alertsData = alertManager.getAlerts(alertFilters);
      const metricsData = alertManager.getMetrics();
      
      setAlerts(alertsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading alert data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔄 Auto-refresh effect
  useEffect(() => {
    loadData();
    
    if (autoRefresh) {
      const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [activeFilter, autoRefresh]);

  // ✅ Resolve alert
  const handleResolveAlert = async (alertId: string) => {
    try {
      await alertManager.resolveAlert(alertId, 'admin-user');
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  // 🎨 Get severity color
  const getSeverityColor = (severity: AlertType['severity']) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
      info: 'outline'
    };
    return colors[severity] || 'default';
  };

  // 📊 Get category icon
  const getCategoryIcon = (category: AlertType['category']) => {
    const icons = {
      system: Server,
      performance: Activity,
      security: Shield,
      business: TrendingUp,
      user: Users
    };
    const Icon = icons[category] || AlertTriangle;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Loading alert dashboard...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 📊 Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Alerts (24h)</p>
                  <p className="text-2xl font-bold">{metrics.totalAlerts}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.criticalAlerts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.resolvedAlerts}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
                  <p className="text-2xl font-bold">
                    {Math.round(metrics.averageResolutionTime / 60000)}m
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 🎛️ Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filter:</span>
          <div className="flex space-x-1">
            {['all', 'critical', 'unresolved'].map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveFilter(filter as any)}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* 📋 Alert Tabs */}
      <Tabs defaultValue="alerts" className="w-full">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* 🚨 Active Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
                <p className="text-muted-foreground">
                  All systems are running smoothly. Great job! 🎉
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500' :
                  alert.severity === 'high' ? 'border-l-orange-500' :
                  alert.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getCategoryIcon(alert.category)}
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge variant={getSeverityColor(alert.severity) as any}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          {alert.resolved && (
                            <Badge variant="outline" className="text-green-600">
                              RESOLVED
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>Source: {alert.source}</span>
                          <span>Category: {alert.category}</span>
                          <span>Time: {alert.timestamp.toLocaleString()}</span>
                          {alert.escalationLevel > 0 && (
                            <span className="text-orange-600">
                              Escalation Level: {alert.escalationLevel}
                            </span>
                          )}
                        </div>

                        {alert.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {alert.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2">
                        {!alert.resolved && (
                          <Button
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 📊 Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alerts by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Alerts by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(metrics.alertsByCategory).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category as AlertType['category'])}
                          <span className="capitalize">{category}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alerts by Severity */}
              <Card>
                <CardHeader>
                  <CardTitle>Alerts by Severity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(metrics.alertsBySeverity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <span className="capitalize">{severity}</span>
                        <Badge variant={getSeverityColor(severity as AlertType['severity']) as any}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* ⚙️ Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Alert configuration is managed through environment variables and the alert manager.
                  Contact your system administrator to modify alert rules and notification channels.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}