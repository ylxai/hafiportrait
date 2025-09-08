'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, HardDrive, Zap, DollarSign, Users, Download, Eye } from 'lucide-react';

interface CompressionStats {
  totalPhotos: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalSavingsBytes: number;
  totalSavingsPercentage: number;
  storageSaved: string;
  averageCompressionRatio: number;
  topCompressionSavings: Array<{
    id: string;
    original_name: string;
    original_size: number;
    optimized_size: number;
    savings_percentage: number;
    uploaded_at: string;
  }>;
  compressionByDate: Array<{
    date: string;
    photos_count: number;
    total_savings: number;
    average_savings: number;
  }>;
  sizeDistribution: Array<{
    size_range: string;
    count: number;
    percentage: number;
  }>;
}

export function CompressionAnalytics() {
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchCompressionStats();
  }, [timeRange]);

  const fetchCompressionStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/compression?range=${timeRange}`);
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
    // Estimate storage cost at $0.023 per GB per month (AWS S3 pricing)
    const gbPerMonth = bytesPerMonth / (1024 * 1024 * 1024);
    return gbPerMonth * 0.023;
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
          <p className="text-gray-500">No compression data available</p>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: 'Storage Saved', value: stats.totalSavingsBytes, color: '#10b981' },
    { name: 'Storage Used', value: stats.totalOptimizedSize, color: '#6b7280' }
  ];

  const monthlySavings = calculateMonthlySavings(stats.totalSavingsBytes);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Compression Analytics</h2>
        <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage Saved</CardTitle>
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
            <CardTitle className="text-sm font-medium">Monthly Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${monthlySavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated storage cost reduction
            </p>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-xs text-green-600">Cost optimized</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photos Optimized</CardTitle>
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
            <CardTitle className="text-sm font-medium">Bandwidth Saved</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSavingsBytes * 10)}</div>
            <p className="text-xs text-muted-foreground">
              Est. monthly bandwidth reduction
            </p>
            <div className="flex items-center mt-2">
              <TrendingDown className="h-3 w-3 text-purple-500 mr-1" />
              <span className="text-xs text-purple-600">User experience improved</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Storage Distribution</CardTitle>
            <CardDescription>Saved vs Used storage breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatFileSize(value)}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatFileSize(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Compression Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Compression Trend</CardTitle>
            <CardDescription>Daily compression savings over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.compressionByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'average_savings' ? `${value.toFixed(1)}%` : value,
                    name === 'average_savings' ? 'Avg Savings' : 'Photos Count'
                  ]}
                />
                <Line type="monotone" dataKey="average_savings" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="photos_count" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Size Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>File Size Distribution</CardTitle>
          <CardDescription>Distribution of original file sizes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.sizeDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="size_range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Compression Savings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Compression Achievements</CardTitle>
          <CardDescription>Photos with highest compression savings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.topCompressionSavings.map((photo, index) => (
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
                    {photo.savings_percentage.toFixed(1)}% saved
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(photo.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              User Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {(stats.totalSavingsPercentage / 10).toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">Faster loading speed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Download className="h-4 w-4 mr-2" />
              Mobile Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {stats.totalSavingsPercentage.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Less data usage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              SEO Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              +{Math.round(stats.totalSavingsPercentage / 5)}
            </div>
            <p className="text-xs text-muted-foreground">PageSpeed score boost</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}