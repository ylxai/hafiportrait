'use client';

import { lazy, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from 'lucide-react';

// Lazy load heavy components
const SystemMonitor = lazy(() => import('./system-monitor'));
const DSLRMonitor = lazy(() => import('./dslr-monitor'));
// Fix: Import BackupStatusMonitor as named export
const BackupStatusMonitor = lazy(() => 
  import('./backup-status-monitor').then(module => ({ 
    default: module.BackupStatusMonitor 
  }))
);

// Loading fallback component
function MonitorSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="w-5 h-5 text-wedding-gold" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LazySystemMonitor() {
  return (
    <Suspense fallback={<MonitorSkeleton title="System Monitor" />}>
      <SystemMonitor />
    </Suspense>
  );
}

export function LazyDSLRMonitor() {
  return (
    <Suspense fallback={<MonitorSkeleton title="DSLR Monitor" />}>
      <DSLRMonitor />
    </Suspense>
  );
}

export function LazyBackupStatusMonitor() {
  return (
    <Suspense fallback={<MonitorSkeleton title="Backup Status" />}>
      <BackupStatusMonitor />
    </Suspense>
  );
}