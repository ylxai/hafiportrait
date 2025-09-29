/**
 * React Hook for Upload Queue - Task 2.3
 * Provides easy integration of upload queue with React components
 * Mobile-optimized with automatic state management
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { UploadQueue, UploadItem, QueueStats } from '@/lib/upload-queue';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useUnifiedNotifications } from '@/hooks/use-unified-notifications';
import { useQueryClient } from '@tanstack/react-query';

export interface UseUploadQueueOptions {
  eventId: string;
  onComplete?: (completedItems: UploadItem[]) => void;
  onError?: (errorItems: UploadItem[]) => void;
  autoStart?: boolean;
  maxRetries?: number;
}

export interface UseUploadQueueReturn {
  // Queue management
  addFiles: (files: File[], uploaderName: string, albumName: string) => void;
  addFile: (file: File, uploaderName: string, albumName: string) => void;
  removeItem: (itemId: string) => boolean;
  clearCompleted: () => void;
  clearAll: () => void;
  retryFailed: () => void;
  
  // State
  items: UploadItem[];
  stats: QueueStats;
  isProcessing: boolean;
  
  // Controls
  startProcessing: () => void;
  stopProcessing: () => void;
  
  // Utilities
  getItemsByStatus: (status: UploadItem['status']) => UploadItem[];
  getProgressByFile: (fileName: string) => number;
  isQueueEmpty: boolean;
  hasFailedItems: boolean;
  canRetry: boolean;
}

export function useUploadQueue(options: UseUploadQueueOptions): UseUploadQueueReturn {
  const { eventId, onComplete, onError, autoStart = true, maxRetries } = options;
  
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const notifications = useUnifiedNotifications();
  const queryClient = useQueryClient();
  
  // Queue instance - persistent across re-renders
  const queueRef = useRef<UploadQueue | null>(null);
  
  // State
  const [items, setItems] = useState<UploadItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
    retrying: 0,
    overallProgress: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Previous stats for comparison
  const prevStatsRef = useRef<QueueStats>(stats);

  // Initialize queue
  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new UploadQueue(isMobile);
      
      // Update configuration if provided
      if (maxRetries !== undefined) {
        queueRef.current.updateConfig({ maxRetries });
      }
    }

    const queue = queueRef.current;

    // Subscribe to queue updates
    const unsubscribe = queue.subscribe((newStats, newItems) => {
      setStats(newStats);
      setItems(newItems);
      setIsProcessing(queue['processing']); // Access private property
    });

    return unsubscribe;
  }, [isMobile, maxRetries]);

  // Handle completion events
  useEffect(() => {
    const prevStats = prevStatsRef.current;
    const currentStats = stats;

    // Check for newly completed items
    if (currentStats.completed > prevStats.completed) {
      const completedItems = items.filter(item => item.status === 'completed');
      const newlyCompleted = completedItems.slice(prevStats.completed);
      
      if (newlyCompleted.length > 0) {
        // Invalidate photos query to refresh gallery
        queryClient.invalidateQueries({ 
          queryKey: ['/api/events', eventId, 'photos'] 
        });
        
        // Show success notification
        const successCount = newlyCompleted.length;
        const successText = successCount === 1 ? '1 foto' : `${successCount} foto`;
        notifications.upload.success(`${successText} berhasil diupload`, 'queue');
        
        // Call completion callback
        onComplete?.(newlyCompleted);
      }
    }

    // Check for newly failed items
    if (currentStats.failed > prevStats.failed) {
      const failedItems = items.filter(item => item.status === 'failed');
      const newlyFailed = failedItems.slice(prevStats.failed);
      
      if (newlyFailed.length > 0) {
        const errorCount = newlyFailed.length;
        const errorText = errorCount === 1 ? '1 foto' : `${errorCount} foto`;
        notifications.upload.failed(`${errorText} gagal diupload`, 'Coba lagi');
        
        // Call error callback
        onError?.(newlyFailed);
      }
    }

    // Update previous stats
    prevStatsRef.current = currentStats;
  }, [stats, items, eventId, queryClient, notifications, onComplete, onError]);

  // Queue management functions
  const addFiles = useCallback((files: File[], uploaderName: string, albumName: string) => {
    if (!queueRef.current || files.length === 0) return;

    const itemIds = queueRef.current.addFiles(files, eventId, uploaderName, albumName);
    
    // Auto-start processing if enabled
    if (autoStart && !isProcessing) {
      queueRef.current.startProcessing();
    }

    // Show notification
    const fileText = files.length === 1 ? '1 foto' : `${files.length} foto`;
    notifications.info("Ditambahkan ke Queue", `${fileText} akan diupload`);

    return itemIds;
  }, [eventId, autoStart, isProcessing, notifications]);

  const addFile = useCallback((file: File, uploaderName: string, albumName: string) => {
    return addFiles([file], uploaderName, albumName);
  }, [addFiles]);

  const removeItem = useCallback((itemId: string) => {
    if (!queueRef.current) return false;
    return queueRef.current.removeItem(itemId);
  }, []);

  const clearCompleted = useCallback(() => {
    if (!queueRef.current) return;
    queueRef.current.clearCompleted();
    toast({
      title: "Queue Dibersihkan",
      description: "Item yang sudah selesai telah dihapus"
    });
  }, [toast]);

  const clearAll = useCallback(() => {
    if (!queueRef.current) return;
    queueRef.current.clearAll();
    toast({
      title: "Queue Dikosongkan",
      description: "Semua item (kecuali yang sedang upload) telah dihapus"
    });
  }, [toast]);

  const retryFailed = useCallback(() => {
    if (!queueRef.current) return;
    queueRef.current.retryFailed();
    notifications.info("Mencoba Ulang", "Item yang gagal akan dicoba lagi");
  }, [notifications]);

  const startProcessing = useCallback(() => {
    if (!queueRef.current) return;
    queueRef.current.startProcessing();
  }, []);

  const stopProcessing = useCallback(() => {
    if (!queueRef.current) return;
    queueRef.current.stopProcessing();
  }, []);

  // Utility functions
  const getItemsByStatus = useCallback((status: UploadItem['status']) => {
    return items.filter(item => item.status === status);
  }, [items]);

  const getProgressByFile = useCallback((fileName: string) => {
    const item = items.find(item => item.file.name === fileName);
    return item?.progress || 0;
  }, [items]);

  // Computed properties
  const isQueueEmpty = items.length === 0;
  const hasFailedItems = stats.failed > 0;
  const canRetry = hasFailedItems && items.some(item => 
    item.status === 'failed' && item.retryCount < (maxRetries || 3)
  );

  return {
    // Queue management
    addFiles,
    addFile,
    removeItem,
    clearCompleted,
    clearAll,
    retryFailed,
    
    // State
    items,
    stats,
    isProcessing,
    
    // Controls
    startProcessing,
    stopProcessing,
    
    // Utilities
    getItemsByStatus,
    getProgressByFile,
    isQueueEmpty,
    hasFailedItems,
    canRetry
  };
}

// Additional hook for queue statistics only (lightweight)
export function useUploadQueueStats(eventId: string) {
  const isMobile = useIsMobile();
  const queueRef = useRef<UploadQueue | null>(null);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
    retrying: 0,
    overallProgress: 0
  });

  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new UploadQueue(isMobile);
    }

    const unsubscribe = queueRef.current.subscribe((newStats) => {
      setStats(newStats);
    });

    return unsubscribe;
  }, [isMobile]);

  return {
    stats,
    hasActiveUploads: stats.uploading > 0 || stats.pending > 0 || stats.retrying > 0,
    isIdle: stats.total === 0 || (stats.completed === stats.total && stats.failed === 0)
  };
}