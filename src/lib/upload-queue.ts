/**
 * Upload Queue System - Task 2.3
 * Advanced queue management with retry logic, progress tracking, and resource optimization
 * Mobile-first design with intelligent concurrency control
 */

import { apiRequest } from '@/lib/queryClient';

export interface UploadItem {
  id: string;
  file: File;
  eventId: string;
  uploaderName: string;
  albumName: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'retrying';
  progress: number;
  error?: string;
  retryCount: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  data?: any;
}

export interface QueueStats {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
  retrying: number;
  overallProgress: number;
}

export interface QueueConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  useBatchEndpoint: boolean;
  batchSize: number;
}

export class UploadQueue {
  private queue: UploadItem[] = [];
  private processing = false;
  private activeUploads = new Set<string>();
  private listeners = new Set<(stats: QueueStats, items: UploadItem[]) => void>();
  private config: QueueConfig;

  constructor(isMobile = false) {
    // Mobile-first configuration
    this.config = {
      maxConcurrent: isMobile ? 2 : 3,
      maxRetries: 3,
      retryDelay: 2000,
      timeout: isMobile ? 45000 : 60000, // 45s mobile, 60s desktop
      useBatchEndpoint: true,
      batchSize: isMobile ? 3 : 5
    };
  }

  /**
   * Add files to upload queue
   */
  addFiles(files: File[], eventId: string, uploaderName: string, albumName: string): string[] {
    const itemIds: string[] = [];
    
    files.forEach((file, index) => {
      const item: UploadItem = {
        id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        eventId,
        uploaderName,
        albumName,
        status: 'pending',
        progress: 0,
        retryCount: 0,
        createdAt: Date.now()
      };
      
      this.queue.push(item);
      itemIds.push(item.id);
    });

    this.notifyListeners();
    
    // Auto-start processing if not already running
    if (!this.processing) {
      this.startProcessing();
    }

    return itemIds;
  }

  /**
   * Add single file to queue
   */
  addFile(file: File, eventId: string, uploaderName: string, albumName: string): string {
    return this.addFiles([file], eventId, uploaderName, albumName)[0];
  }

  /**
   * Remove item from queue
   */
  removeItem(itemId: string): boolean {
    const index = this.queue.findIndex(item => item.id === itemId);
    if (index === -1) return false;

    const item = this.queue[index];
    
    // Can't remove if currently uploading
    if (item.status === 'uploading') {
      return false;
    }

    this.queue.splice(index, 1);
    this.notifyListeners();
    return true;
  }

  /**
   * Clear completed and failed items
   */
  clearCompleted(): void {
    this.queue = this.queue.filter(item => 
      item.status !== 'completed' && item.status !== 'failed'
    );
    this.notifyListeners();
  }

  /**
   * Clear all items
   */
  clearAll(): void {
    // Only clear non-uploading items
    this.queue = this.queue.filter(item => item.status === 'uploading');
    this.notifyListeners();
  }

  /**
   * Retry failed items
   */
  retryFailed(): void {
    this.queue.forEach(item => {
      if (item.status === 'failed' && item.retryCount < this.config.maxRetries) {
        item.status = 'pending';
        item.progress = 0;
        item.error = undefined;
      }
    });

    this.notifyListeners();
    
    if (!this.processing) {
      this.startProcessing();
    }
  }

  /**
   * Start queue processing
   */
  async startProcessing(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;
    console.log('[UploadQueue] Starting queue processing...');

    try {
      await this.processQueue();
    } catch (error) {
      console.error('[UploadQueue] Processing error:', error);
    } finally {
      this.processing = false;
      console.log('[UploadQueue] Queue processing finished');
    }
  }

  /**
   * Stop queue processing
   */
  stopProcessing(): void {
    this.processing = false;
  }

  /**
   * Main queue processing loop
   */
  private async processQueue(): Promise<void> {
    while (this.processing && this.hasPendingItems()) {
      // Determine processing strategy
      if (this.config.useBatchEndpoint && this.canUseBatchProcessing()) {
        await this.processBatch();
      } else {
        await this.processSingle();
      }

      // Small delay between batches
      await this.delay(100);
    }
  }

  /**
   * Check if batch processing is beneficial
   */
  private canUseBatchProcessing(): boolean {
    const pendingItems = this.queue.filter(item => item.status === 'pending');
    const sameEventItems = this.groupByEvent(pendingItems);
    
    // Use batch if we have multiple files for the same event
    return Object.values(sameEventItems).some(items => items.length >= 2);
  }

  /**
   * Process items in batches
   */
  private async processBatch(): Promise<void> {
    const pendingItems = this.queue.filter(item => item.status === 'pending');
    const groupedByEvent = this.groupByEvent(pendingItems);

    for (const [eventId, items] of Object.entries(groupedByEvent)) {
      if (!this.processing) break;
      
      const batchItems = items.slice(0, this.config.batchSize);
      if (batchItems.length >= 2) {
        await this.uploadBatch(batchItems);
      } else if (batchItems.length === 1) {
        await this.uploadSingle(batchItems[0]);
      }
    }
  }

  /**
   * Process items one by one
   */
  private async processSingle(): Promise<void> {
    const availableSlots = this.config.maxConcurrent - this.activeUploads.size;
    if (availableSlots <= 0) {
      await this.delay(500);
      return;
    }

    const pendingItems = this.queue
      .filter(item => item.status === 'pending')
      .slice(0, availableSlots);

    const uploadPromises = pendingItems.map(item => this.uploadSingle(item));
    await Promise.allSettled(uploadPromises);
  }

  /**
   * Upload batch of files
   */
  private async uploadBatch(items: UploadItem[]): Promise<void> {
    if (items.length === 0) return;

    const eventId = items[0].eventId;
    const uploaderName = items[0].uploaderName;
    const albumName = items[0].albumName;

    // Mark all items as uploading
    items.forEach(item => {
      item.status = 'uploading';
      item.startedAt = Date.now();
      item.progress = 10;
      this.activeUploads.add(item.id);
    });

    this.notifyListeners();

    try {
      // Prepare FormData for batch upload
      const formData = new FormData();
      formData.append('uploaderName', uploaderName);
      formData.append('albumName', albumName);

      items.forEach((item, index) => {
        formData.append(`file${index}`, item.file);
      });

      // Update progress to uploading
      items.forEach(item => {
        item.progress = 25;
      });
      this.notifyListeners();

      // Call batch endpoint
      const response = await apiRequest(
        'POST',
        `/api/events/${eventId}/photos/batch`,
        formData
      );

      // Update progress to processing
      items.forEach(item => {
        item.progress = 75;
      });
      this.notifyListeners();

      if (!response.ok) {
        throw new Error(`Batch upload failed: ${response.status}`);
      }

      const result = await response.json();

      // Process individual results
      if (result.results && Array.isArray(result.results)) {
        result.results.forEach((fileResult: any) => {
          const item = items.find(i => i.file.name === fileResult.fileName);
          if (item) {
            if (fileResult.success) {
              item.status = 'completed';
              item.progress = 100;
              item.completedAt = Date.now();
              item.data = fileResult.data;
            } else {
              this.handleItemError(item, fileResult.error || 'Upload failed');
            }
          }
        });
      } else {
        // Fallback: mark all as successful
        items.forEach(item => {
          item.status = 'completed';
          item.progress = 100;
          item.completedAt = Date.now();
        });
      }

    } catch (error: any) {
      console.error('[UploadQueue] Batch upload error:', error);
      
      // Mark all items as failed
      items.forEach(item => {
        this.handleItemError(item, error.message || 'Batch upload failed');
      });
    } finally {
      // Remove from active uploads
      items.forEach(item => {
        this.activeUploads.delete(item.id);
      });
      
      this.notifyListeners();
    }
  }

  /**
   * Upload single file
   */
  private async uploadSingle(item: UploadItem): Promise<void> {
    item.status = 'uploading';
    item.startedAt = Date.now();
    item.progress = 10;
    this.activeUploads.add(item.id);

    this.notifyListeners();

    try {
      const formData = new FormData();
      formData.append('file', item.file);
      formData.append('uploaderName', item.uploaderName);
      formData.append('albumName', item.albumName);

      item.progress = 25;
      this.notifyListeners();

      const response = await apiRequest(
        'POST',
        `/api/events/${item.eventId}/photos`,
        formData
      );

      item.progress = 75;
      this.notifyListeners();

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      item.status = 'completed';
      item.progress = 100;
      item.completedAt = Date.now();
      item.data = result;

    } catch (error: any) {
      console.error('[UploadQueue] Single upload error:', error);
      this.handleItemError(item, error.message || 'Upload failed');
    } finally {
      this.activeUploads.delete(item.id);
      this.notifyListeners();
    }
  }

  /**
   * Handle item error with retry logic
   */
  private handleItemError(item: UploadItem, errorMessage: string): void {
    item.error = errorMessage;
    item.retryCount++;

    if (item.retryCount < this.config.maxRetries) {
      item.status = 'retrying';
      item.progress = 0;
      
      // Schedule retry
      setTimeout(() => {
        if (item.status === 'retrying') {
          item.status = 'pending';
          this.notifyListeners();
        }
      }, this.config.retryDelay * item.retryCount);
    } else {
      item.status = 'failed';
      item.progress = 0;
    }
  }

  /**
   * Group items by event
   */
  private groupByEvent(items: UploadItem[]): Record<string, UploadItem[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.eventId]) {
        groups[item.eventId] = [];
      }
      groups[item.eventId].push(item);
      return groups;
    }, {} as Record<string, UploadItem[]>);
  }

  /**
   * Check if there are pending items
   */
  private hasPendingItems(): boolean {
    return this.queue.some(item => item.status === 'pending' || item.status === 'retrying');
  }

  /**
   * Subscribe to queue updates
   */
  subscribe(listener: (stats: QueueStats, items: UploadItem[]) => void): () => void {
    this.listeners.add(listener);
    
    // Send initial state
    listener(this.getStats(), [...this.queue]);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current queue statistics
   */
  getStats(): QueueStats {
    const stats = {
      total: this.queue.length,
      pending: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
      retrying: 0,
      overallProgress: 0
    };

    let totalProgress = 0;

    this.queue.forEach(item => {
      stats[item.status]++;
      totalProgress += item.progress;
    });

    stats.overallProgress = stats.total > 0 ? totalProgress / stats.total : 0;

    return stats;
  }

  /**
   * Get queue items
   */
  getItems(): UploadItem[] {
    return [...this.queue];
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    const items = [...this.queue];
    
    this.listeners.forEach(listener => {
      try {
        listener(stats, items);
      } catch (error) {
        console.error('[UploadQueue] Listener error:', error);
      }
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}