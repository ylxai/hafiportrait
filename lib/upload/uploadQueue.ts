/**
 * Upload Queue Manager
 * 
 * Manages upload queue with:
 * - Queue operations (add, remove, pause, resume)
 * - Retry logic with exponential backoff
 * - Progress tracking
 * - Event emission for status updates
 */

import { UploadFileState } from './uploadPersistence';

export type UploadStatus = 'idle' | 'uploading' | 'paused' | 'completed' | 'error';

export interface UploadQueueEvents {
  progress: (fileId: string, progress: number, uploadedBytes: number) => void;
  fileComplete: (fileId: string) => void;
  fileError: (fileId: string, error: string) => void;
  queueComplete: () => void;
  statusChange: (status: UploadStatus) => void;
  retrying: (fileId: string, attempt: number, delay: number) => void;
}

export interface UploadOptions {
  maxConcurrent?: number;
  maxRetries?: number;
  chunkSize?: number;
  onProgress?: (fileId: string, progress: number, uploadedBytes: number) => void;
  onFileComplete?: (fileId: string) => void;
  onFileError?: (fileId: string, error: string) => void;
  onQueueComplete?: () => void;
  onStatusChange?: (status: UploadStatus) => void;
  onRetrying?: (fileId: string, attempt: number, delay: number) => void;
}

export interface UploadTask {
  fileState: UploadFileState;
  actualFile?: File;
  abortController?: AbortController;
  retryTimeout?: NodeJS.Timeout;
}

/**
 * Calculate retry delay using exponential backoff
 */
export function calculateRetryDelay(retryCount: number): number {
  const delays = [1000, 2000, 4000, 8000, 16000, 30000]; // ms
  const index = Math.min(retryCount, delays.length - 1);
  return delays[index];
}

/**
 * Upload Queue Class
 */
export class UploadQueue {
  private queue: Map<string, UploadTask> = new Map();
  private activeUploads: Set<string> = new Set();
  private status: UploadStatus = 'idle';
  private options: Required<UploadOptions>;
  private isPaused = false;

  constructor(options: UploadOptions = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent ?? 3,
      maxRetries: options.maxRetries ?? 10,
      chunkSize: options.chunkSize ?? 5 * 1024 * 1024, // 5MB
      onProgress: options.onProgress ?? (() => {}),
      onFileComplete: options.onFileComplete ?? (() => {}),
      onFileError: options.onFileError ?? (() => {}),
      onQueueComplete: options.onQueueComplete ?? (() => {}),
      onStatusChange: options.onStatusChange ?? (() => {}),
      onRetrying: options.onRetrying ?? (() => {}),
    };
  }

  /**
   * Add file to queue
   */
  addFile(fileState: UploadFileState, actualFile?: File): void {
    const task: UploadTask = {
      fileState,
      actualFile,
    };
    
    this.queue.set(fileState.id, task);
  }

  /**
   * Remove file from queue
   */
  removeFile(fileId: string): void {
    const task = this.queue.get(fileId);
    
    if (task) {
      // Cancel active upload
      if (task.abortController) {
        task.abortController.abort();
      }
      
      // Clear retry timeout
      if (task.retryTimeout) {
        clearTimeout(task.retryTimeout);
      }
      
      this.activeUploads.delete(fileId);
      this.queue.delete(fileId);
    }
  }

  /**
   * Pause all uploads
   */
  pause(): void {
    this.isPaused = true;
    this.updateStatus('paused');

    // Abort all active uploads
    this.activeUploads.forEach(fileId => {
      const task = this.queue.get(fileId);
      if (task?.abortController) {
        task.abortController.abort();
      }
    });

    this.activeUploads.clear();
  }

  /**
   * Resume uploads
   */
  resume(): void {
    this.isPaused = false;
    this.updateStatus('uploading');
    this.processQueue();
  }

  /**
   * Start processing queue
   */
  async start(): Promise<void> {
    if (this.status === 'uploading') {
      return;
    }

    this.isPaused = false;
    this.updateStatus('uploading');
    await this.processQueue();
  }

  /**
   * Stop all uploads
   */
  stop(): void {
    this.pause();
    this.updateStatus('idle');
  }

  /**
   * Clear completed files
   */
  clearCompleted(): void {
    const completedIds: string[] = [];
    
    this.queue.forEach((task, fileId) => {
      if (task.fileState.status === 'completed') {
        completedIds.push(fileId);
      }
    });

    completedIds.forEach(id => this.removeFile(id));
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

    this.queue.forEach(task => {
      switch (task.fileState.status) {
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
    return Array.from(this.queue.values()).map(task => task.fileState);
  }

  /**
   * Get file by ID
   */
  getFile(fileId: string): UploadFileState | undefined {
    return this.queue.get(fileId)?.fileState;
  }

  /**
   * Update file state
   */
  updateFileState(fileId: string, updates: Partial<UploadFileState>): void {
    const task = this.queue.get(fileId);
    if (task) {
      task.fileState = { ...task.fileState, ...updates };
    }
  }

  /**
   * Process upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isPaused) {
      return;
    }

    // Start new uploads if slots available
    while (this.activeUploads.size < this.options.maxConcurrent && !this.isPaused) {
      const nextTask = this.getNextTask();
      
      if (!nextTask) {
        break;
      }

      const [fileId, task] = nextTask;
      this.activeUploads.add(fileId);
      
      // Update status to uploading
      this.updateFileState(fileId, { status: 'uploading' });
      
      // Start upload (don't await, process in parallel)
      this.uploadFile(fileId, task).catch(error => {
        console.error(`Upload failed for ${fileId}:`, error);
      });
    }

    // Check if queue is complete
    if (this.activeUploads.size === 0 && this.getNextTask() === null) {
      const stats = this.getStats();
      if (stats.queued === 0 && stats.uploading === 0 && stats.paused === 0) {
        this.updateStatus('completed');
        this.options.onQueueComplete();
      }
    }
  }

  /**
   * Get next task to upload
   */
  private getNextTask(): [string, UploadTask] | null {
    for (const [fileId, task] of this.queue.entries()) {
      const status = task.fileState.status;
      
      // Process queued or failed files that haven't exceeded retry limit
      if (status === 'queued' || (status === 'failed' && task.fileState.retryCount < this.options.maxRetries)) {
        return [fileId, task];
      }
    }
    
    return null;
  }

  /**
   * Upload a single file
   */
  private async uploadFile(fileId: string, task: UploadTask): Promise<void> {
    try {
      // Create abort controller for this upload
      task.abortController = new AbortController();

      // Simulate upload (replace with actual upload logic)
      await this.performUpload(fileId, task);

      // Mark as completed
      this.updateFileState(fileId, { 
        status: 'completed', 
        progress: 100,
        uploadedBytes: task.fileState.file.size,
      });
      
      this.options.onFileComplete(fileId);
      this.activeUploads.delete(fileId);

      // Continue processing queue
      await this.processQueue();

    } catch (error: any) {
      this.activeUploads.delete(fileId);

      // Check if aborted (pause/cancel)
      if (error.name === 'AbortError') {
        this.updateFileState(fileId, { status: 'paused' });
        return;
      }

      // Handle upload error
      await this.handleUploadError(fileId, task, error);
    }
  }

  /**
   * Perform actual upload
   */
  private async performUpload(fileId: string, task: UploadTask): Promise<void> {
    // This is a placeholder - actual upload logic will be implemented
    // with chunked upload support in the enhanced PhotoUploader component
    
    const fileState = task.fileState;
    const signal = task.abortController?.signal;

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      if (signal?.aborted) {
        throw new DOMException('Upload aborted', 'AbortError');
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      
      const uploadedBytes = Math.floor((fileState.file.size * i) / 100);
      this.updateFileState(fileId, { 
        progress: i,
        uploadedBytes,
      });
      
      this.options.onProgress(fileId, i, uploadedBytes);
    }
  }

  /**
   * Handle upload error with retry logic
   */
  private async handleUploadError(fileId: string, task: UploadTask, error: any): Promise<void> {
    const fileState = task.fileState;
    const retryCount = fileState.retryCount + 1;

    // Check if should retry
    if (retryCount <= this.options.maxRetries) {
      const delay = calculateRetryDelay(retryCount);
      
      this.updateFileState(fileId, {
        status: 'failed',
        retryCount,
        lastRetry: Date.now(),
        error: error.message || 'Upload failed',
      });

      this.options.onRetrying(fileId, retryCount, delay);

      // Schedule retry
      task.retryTimeout = setTimeout(async () => {
        if (!this.isPaused) {
          this.updateFileState(fileId, { status: 'queued' });
          await this.processQueue();
        }
      }, delay);

    } else {
      // Max retries exceeded
      this.updateFileState(fileId, {
        status: 'failed',
        error: `Upload failed after ${retryCount} attempts: ${error.message}`,
      });
      
      this.options.onFileError(fileId, error.message || 'Upload failed');
      
      // Continue with next file
      await this.processQueue();
    }
  }

  /**
   * Update queue status
   */
  private updateStatus(newStatus: UploadStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.options.onStatusChange(newStatus);
    }
  }

  /**
   * Get current status
   */
  getStatus(): UploadStatus {
    return this.status;
  }

  /**
   * Check if queue is active
   */
  is_active(): boolean {
    return this.status === 'uploading' && !this.isPaused;
  }

  /**
   * Destroy queue and cleanup
   */
  destroy(): void {
    // Cancel all active uploads
    this.activeUploads.forEach(fileId => {
      const task = this.queue.get(fileId);
      if (task?.abortController) {
        task.abortController.abort();
      }
      if (task?.retryTimeout) {
        clearTimeout(task.retryTimeout);
      }
    });

    this.queue.clear();
    this.activeUploads.clear();
    this.updateStatus('idle');
  }
}
