'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  HardDrive, 
  Cloud, 
  FolderOpen, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  Server,
  BarChart3
} from 'lucide-react';

interface StorageTierData {
  used: number;
  available: number;
  percentage: number;
  status: string;
  totalSize: number;
  count?: number;
}

interface StorageAnalytics {
  storageReport: {
    cloudflareR2: {
      used: string;
      available: string;
      usage: string;
      status: string;
    };
    googleDrive: {
      used: string;
      available: string;
      usage: string;
      status: string;
    };
    local: {
      used: string;
      available: string;
      usage: string;
      status: string;
    };
  };
  tierStats: {
    cloudflareR2: { count: number; totalSize: number };
    googleDrive: { count: number; totalSize: number };
    local: { count: number; totalSize: number };
  };
  totalPhotosWithSmartStorage: number;
  recentUploads: any[];
}

interface StorageStatus {
  health: 'healthy' | 'warning' | 'critical';
  overallUsage: {
    used: number;
    available: number;
    percentage: number;
  };
  tierDistribution: {
    cloudflareR2: StorageTierData;
    googleDrive: StorageTierData;
    local: StorageTierData;
  };
  providers: any;
  recommendation: string;
}

export default function StorageAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<StorageAnalytics | null>(null);
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStorageData = async () => {
    try {
      setError(null);
      
      // Fetch both analytics and status in parallel
      const [analyticsResponse, statusResponse] = await Promise.all([
        fetch('/api/admin/storage/analytics'),
        fetch('/api/admin/storage/status')
      ]);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data);
      } else {
        console.warn('Analytics endpoint not available:', analyticsResponse.status);
      }

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setStatus(statusData.data);
      } else {
        console.warn('Status endpoint not available:', statusResponse.status);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch storage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch storage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchStorageData, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatGB = (gb: number): string => {
    return `${gb.toFixed(1)} GB`;
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <AlertTriangle className="h-4 w-4" />;
    if (percentage >= 75) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'cloudflareR2':
        return <Cloud className="h-5 w-5 text-blue-600" />;
      case 'googleDrive':
        return <Database className="h-5 w-5 text-green-600" />;
      case 'local':
        return <HardDrive className="h-5 w-5 text-purple-600" />;
      default:
        return <Server className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'cloudflareR2': return 'Cloudflare R2';
      case 'googleDrive': return 'Google Drive';
      case 'local': return 'Local Storage';
      default: return tier;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading storage analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Storage Analytics</h2>
          <p className="text-muted-foreground">
            Smart Storage Manager metrics and tier distribution
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStorageData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdate && (
            <span className="text-sm text-muted-foreground">
              Updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Storage Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Overall Storage Health
              <Badge variant={status.health === 'healthy' ? 'default' : 'destructive'}>
                {status.health.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{formatGB(status.overallUsage.used)}</div>
                <div className="text-sm text-muted-foreground">Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{formatGB(status.overallUsage.available)}</div>
                <div className="text-sm text-muted-foreground">Total Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{status.overallUsage.percentage}%</div>
                <div className="text-sm text-muted-foreground">Usage</div>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={status.overallUsage.percentage} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Tiers */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(status.tierDistribution).map(([tier, data]) => (
            <Card key={tier}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTierIcon(tier)}
                    {getTierName(tier)}
                  </div>
                  <Badge className={getStatusColor(data.percentage)}>
                    {getStatusIcon(data.percentage)}
                    <span className="ml-1">{data.percentage}%</span>
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Used:</span>
                    <span className="font-medium">{formatGB(data.used)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Available:</span>
                    <span className="font-medium">{formatGB(data.available)}</span>
                  </div>
                  <Progress value={data.percentage} className="h-2" />
                  <div className="text-xs text-center text-muted-foreground">
                    {data.status.replace(/🟢|🟡|🔴/g, '').trim()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Distribution */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Photo Distribution by Tier
            </CardTitle>
            <CardDescription>
              Total photos with Smart Storage: {analytics.totalPhotosWithSmartStorage}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(analytics.tierStats).map(([tier, stats]) => (
                <div key={tier} className="text-center p-4 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getTierIcon(tier)}
                  </div>
                  <div className="text-lg font-bold">{stats.count}</div>
                  <div className="text-sm text-muted-foreground">Photos</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formatBytes(stats.totalSize)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Recommendations */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  Recommended tier for new uploads: <strong>{getTierName(status.recommendation)}</strong>
                </span>
              </div>
              
              {status.overallUsage.percentage > 75 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">
                    Consider cleaning up old files or expanding storage capacity
                  </span>
                </div>
              )}
              
              {status.tierDistribution.cloudflareR2.percentage > 90 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">
                    Cloudflare R2 is nearly full. New uploads will use Google Drive.
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}