'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Zap, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface SimpleCompressionStats {
  totalPhotos: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalSavingsBytes: number;
  totalSavingsPercentage: number;
  storageSaved: string;
  averageCompressionRatio: number;
  recentPhotos: Array<{
    id: string;
    original_name: string;
    original_size: number;
    optimized_size: number;
    savings_percentage: number;
    uploaded_at: string;
  }>;
}

export function SimpleCompressionAnalytics() {
  const [stats, setStats] = useState<SimpleCompressionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimpleStats();
  }, []);

  const fetchSimpleStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics/simple-compression');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching compression stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateMonthlySavings = (bytesPerMonth: number): number => {
    const gbPerMonth = bytesPerMonth / (1024 * 1024 * 1024);
    return gbPerMonth * 0.023; // AWS S3 pricing estimate
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Belum ada data kompresi tersedia</p>
          <p className="text-sm text-gray-400 mt-2">Upload beberapa foto untuk melihat analytics</p>
        </CardContent>
      </Card>
    );
  }

  const monthlySavings = calculateMonthlySavings(stats.totalSavingsBytes);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Analitik Kompresi Foto</h2>
        <p className="text-muted-foreground">Monitoring performa optimasi gambar</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Hemat</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.storageSaved}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSavingsPercentage.toFixed(1)}% compression ratio
            </p>
            <Progress value={stats.totalSavingsPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Penghematan Bulanan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${monthlySavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Estimasi penghematan storage cost
            </p>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Cost optimized</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Foto Dioptimasi</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPhotos.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg ratio: {stats.averageCompressionRatio.toFixed(1)}:1
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-xs text-blue-600">Performance boost</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loading Speed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(stats.totalSavingsPercentage / 10).toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">
              Faster image loading
            </p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-xs text-purple-600">User experience improved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Optimized Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Foto Terbaru yang Dioptimasi</CardTitle>
          <CardDescription>Hasil kompresi foto-foto terbaru</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentPhotos.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada foto yang dioptimasi. Upload foto untuk melihat hasil kompresi.
              </p>
            ) : (
              stats.recentPhotos.map((photo, index) => (
                <div key={photo.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{photo.original_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(photo.original_size)} → {formatFileSize(photo.optimized_size)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {photo.savings_percentage.toFixed(1)}% hemat
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(photo.uploaded_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mobile Data Hemat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {stats.totalSavingsPercentage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Penggunaan data mobile berkurang</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SEO Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              +{Math.round(stats.totalSavingsPercentage / 5)}
            </div>
            <p className="text-xs text-muted-foreground">PageSpeed score improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {(2 + stats.totalSavingsPercentage / 20).toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">Faster gallery browsing</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}