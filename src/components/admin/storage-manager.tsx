'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  HardDrive, 
  Database, 
  Cloud, 
  FolderOpen,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  FileImage,
  Archive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  byStorageTier: Record<string, { count: number; size: number }>;
  byFileType: Record<string, { count: number; size: number }>;
  byEvent: Record<string, { count: number; size: number }>;
}

interface CleanupRecommendation {
  type: 'large_files' | 'old_files' | 'duplicates' | 'empty_events';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  count: number;
  potentialSavings: number;
  items?: any[];
}

interface StorageManagerProps {
  className?: string;
}

export function StorageManager({ className = '' }: StorageManagerProps) {
  const { toast } = useToast();
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [recommendations, setRecommendations] = useState<CleanupRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/storage/analyze');
      if (!response.ok) {
        throw new Error('Failed to load storage stats');
      }

      const data = await response.json();
      setStorageStats(data.stats);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error loading storage stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load storage statistics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };


  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get storage tier color
  const getStorageTierColor = (tier: string) => {
    switch (tier) {
      case 'cloudflareR2': return 'bg-blue-500';
      case 'googleDrive': return 'bg-green-500';
      case 'local': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  // Get recommendation severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get file type icon
  const getFileTypeIcon = (type: string) => {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(type)) {
      return <FileImage className="h-4 w-4 text-green-500" />;
    }
    return <Archive className="h-4 w-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading storage analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Overview
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadStorageStats}
                disabled={isLoading}
              >
                <BarChart3 className={`h-4 w-4 ${isLoading ? 'animate-pulse' : ''}`} />
                {isLoading ? 'Analyzing...' : 'Analyze Storage'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadStorageStats}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {storageStats && (
            <>
              {/* Total Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-900">
                    {storageStats.totalFiles.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">Total Files</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <HardDrive className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-900">
                    {formatFileSize(storageStats.totalSize)}
                  </div>
                  <div className="text-sm text-green-600">Total Size</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Cloud className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-900">
                    {Object.keys(storageStats.byStorageTier).length}
                  </div>
                  <div className="text-sm text-purple-600">Storage Tiers</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-900">
                    {Object.keys(storageStats.byEvent).length}
                  </div>
                  <div className="text-sm text-orange-600">Events</div>
                </div>
              </div>

              {/* Storage Tier Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Storage Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(storageStats.byStorageTier).map(([tier, stats]) => {
                    const percentage = (stats.size / storageStats.totalSize) * 100;
                    return (
                      <div key={tier} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${getStorageTierColor(tier)}`}></div>
                            <span className="font-medium capitalize">{tier}</span>
                            <Badge variant="secondary">{stats.count} files</Badge>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatFileSize(stats.size)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* File Type Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-3">File Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(storageStats.byFileType)
                    .sort(([,a], [,b]) => b.size - a.size)
                    .slice(0, 8)
                    .map(([type, stats]) => (
                      <div key={type} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          {getFileTypeIcon(type)}
                          <span className="font-medium uppercase">{type || 'unknown'}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <div>{stats.count} files</div>
                          <div>{formatFileSize(stats.size)}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cleanup Recommendations
              <Badge variant="secondary">{recommendations.length} opportunities</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(rec.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {rec.severity === 'high' ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                      <h4 className="font-semibold">{rec.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {rec.severity}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{rec.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span><strong>{rec.count}</strong> items</span>
                      <span><strong>{formatFileSize(rec.potentialSavings)}</strong> potential savings</span>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="ml-4"
                    onClick={() => {
                      // TODO: Implement cleanup action
                      toast({
                        title: 'Cleanup Action',
                        description: `This would clean up ${rec.count} items`
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clean Up
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}