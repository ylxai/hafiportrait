/**
 * Integrated Upload Queue
 * 
 * Upload queue with actual upload functionality
 * Provides real upload implementation using uploadService
 */

import { UploadFileState } from './uploadPersistence';
import { uploadFile, UploadProgress, UploadResult } from './uploadService';

export type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'error';

/**
 * Extended upload options with event context
 */
export interface IntegratedUploadOptions {
  maxConcurrent?: number;
  maxRetries?: number;
  chunkSize?: number;
  calculateChecksum?: boolean;
  onProgress?: (fileId: string, progress: number, uploadedBytes: number) => void;
  onFileComplete?: (fileId: string, result: UploadResult) => void;
  onFileError?: (fileId: string, error: string) => void;
  onQueueComplete?: () => void;
  onStatusChange?: (status: UploadStatus) => void;
  onRetrying?: (fileId: string, attempt: number, delay: number) => void;
}

/**
 * Integrated Upload Queue with real upload implementation
 * 
 * This class manages file uploads with:
 * - Real upload via uploadService
 * - Progress tracking
 * - Retry logic with exponential backoff
 * - Queue management
 */
export class IntegratedUploadQueue {
  private event_id: string;
  private queue: Map<string, { fileState: UploadFileState; actualFile: File; result?: UploadResult }> = new Map();
  private activeUploads: Map<string, AbortController> = new Map();
  private options: Required<IntegratedUploadOptions>;
  private isPaused = false;
  private isProcessing = false;

  constructor(event_id: string, options: IntegratedUploadOptions = {}) {
    this.event_id = event_id;
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 3,
      maxRetries: options.maxRetries ?? 10,
      chunkSize: options.chunkSize ?? 5 * 1024 * 1024,
      calculateChecksum: options.calculateChecksum ?? false,
      onProgress: options.onProgress ?? (() => {}),
      onFileComplete: options.onFileComplete ?? (() => {}),
      onFileError: options.onFileError ?? (() => {}),
      onQueueComplete: options.onQueueComplete ?? (() => {}),
      onStatusChange: options.onStatusChange ?? (() => {}),
      onRetrying: options.onRetrying ?? (() => {}),
    };
  }

  /**
   * Add file to upload queue
   */
  addFile(fileState: UploadFileState, actualFile: File): void {
    this.queue.set(fileState.id, { fileState, actualFile });
  }

  /**
   * Remove file from queue
   */
  removeFile(fileId: string): void {
    // Cancel active upload if exists
    const abortController = this.activeUploads.get(fileId);
    if (abortController) {
      abortController.abort();
      this.activeUploads.delete(fileId);
    }

    this.queue.delete(fileId);
  }

  /**
   * Start processing queue
   */
  async start(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isPaused = false;
    this.isProcessing = true;
    this.options.onStatusChange('uploading');
    await this.processQueue();
  }

  /**
   * Pause all uploads
   */
  pause(): void {
    this.isPaused = true;
    this.options.onStatusChange('paused');

    // Abort all active uploads
    this.activeUploads.forEach((controller, fileId) => {
      controller.abort();
      const item = this.queue.get(fileId);
      if (item) {
        item.fileState.status = 'paused';
      }
    });

    this.activeUploads.clear();
  }

  /**
   * Resume uploads
   */
  resume(): void {
    this.isPaused = false;
    this.options.onStatusChange('uploading');
    this.processQueue();
  }

  /**
   * Stop all uploads
   */
  stop(): void {
    this.pause();
    this.isProcessing = false;
    this.options.onStatusChange('idle');
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    total: number;
    queued: number;
    uploading: number;
    completed: number;
    failed: number;
    paused: number;
  } {
    const stats = {
      total: this.queue.size,
      queued: 0,
      uploading: 0,
      completed: 0,
      failed: 0,
      paused: 0,
    };

    this.queue.forEach(({ fileState }) => {
      switch (fileState.status) {
        case 'queued':
          stats.queued++;
          break;
        case 'uploading':
          stats.uploading++;
          break;
        case 'completed':
          stats.completed++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'paused':
          stats.paused++;
          break;
      }
    });

    return stats;
  }

  /**
   * Get all files in queue
   */
  getFiles(): UploadFileState[] {
    return Array.from(this.queue.values()).map(({ fileState }) => fileState);
  }

  /**
   * Get file by ID
   */
  getFile(fileId: string): UploadFileState | undefined {
    return this.queue.get(fileId)?.fileState;
  }

  /**
   * Clear completed files
   */
  clearCompleted(): void {
    const completedIds: string[] = [];
    
    this.queue.forEach(({ fileState }, fileId) => {
      if (fileState.status === 'completed') {
        completedIds.push(fileId);
      }
    });

    completedIds.forEach(id => this.queue.delete(id));
  }

  /**
   * Process upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isPaused || !this.isProcessing) {
      return;
    }

    // Start new uploads if slots available
    while (this.activeUploads.size < this.options.maxConcurrent && !this.isPaused) {
      const nextItem = this.getNextQueueItem();
      
      if (!nextItem) {
        break;
      }

      const [fileId, item] = nextItem;
      
      // Update status to uploading
      item.fileState.status = 'uploading';
      
      // Start upload (don't await, process in parallel)
      this.uploadFile(fileId, item).catch(error => {
        console.error(`Upload failed for ${fileId}:`, error);
      });
    }

    // Check if queue is complete
    if (this.activeUploads.size === 0) {
      const stats = this.getStats();
      if (stats.queued === 0 && stats.uploading === 0 && stats.paused === 0) {
        this.isProcessing = false;
        this.options.onStatusChange('completed');
        this.options.onQueueComplete();
      }
    }
  }

  /**
   * Get next item to upload
   */
  private getNextQueueItem(): [string, { fileState: UploadFileState; actualFile: File; result?: UploadResult }] | null {
    for (const [fileId, item] of this.queue.entries()) {
      const status = item.fileState.status;
      
      // Process queued or failed files that haven't exceeded retry limit
      if (status === 'queued' || (status === 'failed' && item.fileState.retryCount < this.options.maxRetries)) {
        return [fileId, item];
      }
    }
    
    return null;
  }

  /**
   * Upload a single file using uploadService
   */
  private async uploadFile(
    fileId: string,
    item: { fileState: UploadFileState; actualFile: File; result?: UploadResult }
  ): Promise<void> {
    const abortController = new AbortController();
    this.activeUploads.set(fileId, abortController);

    try {
      // Upload file using uploadService with progress tracking
      const result: UploadResult = await uploadFile(item.actualFile, this.event_id, {
        calculateFileChecksum: this.options.calculateChecksum,
        signal: abortController.signal,
        onProgress: (progress: UploadProgress) => {
          // Update file state with progress
          item.fileState.progress = progress.percentage;
          item.fileState.uploadedBytes = progress.loaded;

          // Emit progress event
          this.options.onProgress(fileId, progress.percentage, progress.loaded);
        },
      });

      // Check if upload was successful
      if (!result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      // Mark as completed
      item.fileState.status = 'completed';
      item.fileState.progress = 100;
      item.fileState.uploadedBytes = item.fileState.file.size;
      item.fileState.checksum = result.checksum;
      item.result = result;

      this.options.onFileComplete(fileId, result);
      this.activeUploads.delete(fileId);

      // Continue processing queue
      await this.processQueue();

    } catch (error: any) {
      this.activeUploads.delete(fileId);

      // Check if aborted (pause/cancel)
      if (error.name === 'AbortError') {
        item.fileState.status = 'paused';
        return;
      }

      // Handle upload error with retry logic
      await this.handleUploadError(fileId, item, error);
    }
  }

  /**
   * Handle upload error with retry logic
   */
  private async handleUploadError(
    fileId: string,
    item: { fileState: UploadFileState; actualFile: File },
    error: any
  ): Promise<void> {
    const retryCount = item.fileState.retryCount + 1;

    // Check if should retry
    if (retryCount <= this.options.maxRetries) {
      const delay = this.calculateRetryDelay(retryCount);
      
      item.fileState.status = 'failed';
      item.fileState.retryCount = retryCount;
      item.fileState.lastRetry = Date.now();
      item.fileState.error = error.message || 'Upload failed';

      this.options.onRetrying(fileId, retryCount, delay);

      // Schedule retry
      setTimeout(async () => {
        if (!this.isPaused && this.isProcessing) {
          item.fileState.status = 'queued';
          await this.processQueue();
        }
      }, delay);

    } else {
      // Max retries exceeded
      item.fileState.status = 'failed';
      item.fileState.error = `Upload failed after ${retryCount} attempts: ${error.message}`;
      
      this.options.onFileError(fileId, error.message || 'Upload failed');
      
      // Continue with next file
      await this.processQueue();
    }
  }

  /**
   * Calculate retry delay using exponential backoff
   */
  private calculateRetryDelay(retryCount: number): number {
    const delays = [1000, 2000, 4000, 8000, 16000, 30000]; // ms
    const index = Math.min(retryCount - 1, delays.length - 1);
    return delays[index] ?? 30000; // Fallback to max delay
  }

  /**
   * Get event ID
   */
  getEventId(): string {
    return this.event_id;
  }

  /**
   * Update event ID
   */
  setEventId(event_id: string): void {
    this.event_id = event_id;
  }

  /**
   * Get current status
   */
  getStatus(): UploadStatus {
    if (!this.isProcessing) return 'idle';
    if (this.isPaused) return 'paused';
    
    const stats = this.getStats();
    if (stats.uploading > 0 || stats.queued > 0) return 'uploading';
    if (stats.failed > 0) return 'error';
    if (stats.completed > 0) return 'completed';
    
    return 'idle';
  }

  /**
   * Check if queue is active
   */
  isActive(): boolean {
    return this.isProcessing && !this.isPaused;
  }

  /**
   * Destroy queue and cleanup
   */
  destroy(): void {
    // Cancel all active uploads
    this.activeUploads.forEach((controller) => {
      controller.abort();
    });

    this.queue.clear();
    this.activeUploads.clear();
    this.isProcessing = false;
    this.options.onStatusChange('idle');
  }
}

/**
 * Factory function to create integrated upload queue
 */
export function createIntegratedUploadQueue(
  event_id: string,
  options: IntegratedUploadOptions = {}
): IntegratedUploadQueue {
  return new IntegratedUploadQueue(event_id, options);
}
