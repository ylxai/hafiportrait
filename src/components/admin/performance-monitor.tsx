'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';

interface PerformanceMetrics {
  activeTimers: number;
  memoryUsage: number;
  cpuUsage: number;
  lastUpdate: Date;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    activeTimers: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    lastUpdate: new Date()
  });

  useEffect(() => {
    // Monitor performance every 30 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        // Get performance metrics
        const performance = window.performance;
        const memory = (performance as any).memory;
        
        setMetrics({
          activeTimers: getActiveTimersCount(),
          memoryUsage: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0,
          cpuUsage: getCPUUsage(),
          lastUpdate: new Date()
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getActiveTimersCount = () => {
    // Estimate active timers (simplified)
    return (window as any)._activeTimers || 0;
  };

  const getCPUUsage = () => {
    // Simplified CPU usage estimation
    const start = performance.now();
    for (let i = 0; i < 100000; i++) {
      Math.random();
    }
    const end = performance.now();
    return Math.min(100, Math.round((end - start) * 10));
  };

  const getStatusColor = (value: number, thresholds: [number, number]) => {
    if (value < thresholds[0]) return 'success';
    if (value < thresholds[1]) return 'warning';
    return 'destructive';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-blue-500" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="font-medium text-gray-600">Timers</div>
            <Badge variant={getStatusColor(metrics.activeTimers, [5, 10]) as any} className="text-xs">
              {metrics.activeTimers}
            </Badge>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Memory</div>
            <Badge variant={getStatusColor(metrics.memoryUsage, [50, 100]) as any} className="text-xs">
              {metrics.memoryUsage}MB
            </Badge>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">CPU</div>
            <Badge variant={getStatusColor(metrics.cpuUsage, [30, 60]) as any} className="text-xs">
              {metrics.cpuUsage}%
            </Badge>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          Last: {metrics.lastUpdate.toLocaleTimeString()}
        </div>

        {metrics.activeTimers > 10 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
            <AlertTriangle className="w-3 h-3" />
            High timer count detected
          </div>
        )}

        {metrics.memoryUsage > 100 && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertTriangle className="w-3 h-3" />
            High memory usage
          </div>
        )}
      </CardContent>
    </Card>
  );
}