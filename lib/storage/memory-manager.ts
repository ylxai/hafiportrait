/**
 * Memory Manager - Concurrency Control for File Processing
 * Prevents memory exhaustion during large batch uploads
 * 
 * PRODUCTION UPDATE: Increased limits for wedding photo business
 */

export class MemoryManager {
  private activeOperations: number = 0;
  private readonly MAX_CONCURRENT: number;
  private readonly MAX_LARGE_CONCURRENT: number;
  private readonly LARGE_FILE_THRESHOLD: number;
  private readonly MAX_BATCH_SIZE: number;

  constructor(
    maxConcurrent: number = 10,
    maxLargeConcurrent: number = 5,
    largeFileThresholdMB: number = 10,
    maxBatchSizeMB: number = 5000 // Increased from 500MB to 5GB
  ) {
    this.MAX_CONCURRENT = maxConcurrent;
    this.MAX_LARGE_CONCURRENT = maxLargeConcurrent;
    this.LARGE_FILE_THRESHOLD = largeFileThresholdMB * 1024 * 1024;
    this.MAX_BATCH_SIZE = maxBatchSizeMB * 1024 * 1024; // Convert MB to bytes
  }

  /**
   * Check if total batch size is within limits
   */
  validateBatchSize(files: { size: number }[]): { valid: boolean; error?: string; totalSize: number } {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > this.MAX_BATCH_SIZE) {
      return {
        valid: false,
        totalSize,
        error: `Total batch size ${(totalSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(this.MAX_BATCH_SIZE / 1024 / 1024).toFixed(0)}MB`
      };
    }

    return { valid: true, totalSize };
  }

  /**
   * Process with concurrency control
   * Limits concurrent operations to prevent memory exhaustion
   */
  async processWithControl<T>(
    file_size: number,
    operation: () => Promise<T>
  ): Promise<T> {
    const isLargeFile = file_size > this.LARGE_FILE_THRESHOLD;
    const maxAllowed = isLargeFile ? this.MAX_LARGE_CONCURRENT : this.MAX_CONCURRENT;

    // Wait if too many operations are active
    while (this.activeOperations >= maxAllowed) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.activeOperations++;
    
    try {
      return await operation();
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Large files are limited to MAX_LARGE_CONCURRENT concurrent operations
   * Small files can have up to MAX_CONCURRENT operations
   */
  isLargeFile(file_size: number): boolean {
    return file_size > this.LARGE_FILE_THRESHOLD;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      activeOperations: this.activeOperations,
      maxConcurrent: this.MAX_CONCURRENT,
      maxLargeConcurrent: this.MAX_LARGE_CONCURRENT,
      largeFileThresholdMB: this.LARGE_FILE_THRESHOLD / 1024 / 1024,
    };
  }

  /**
   * Wait for all operations to complete
   */
  async waitForCompletion(timeoutMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (this.activeOperations > 0) {
      if (Date.now() - startTime > timeoutMs) {
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return true;
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    this.activeOperations = 0;
  }

  /**
   * Get recommended batch size based on current system
   */
  getRecommendedBatchSize(): {
    maxFiles: number;
    maxBatchSizeMB: number;
    maxLargeConcurrent: number;
  } {
    return {
      maxFiles: 100,
      maxBatchSizeMB: this.MAX_BATCH_SIZE / 1024 / 1024,
      maxLargeConcurrent: this.MAX_LARGE_CONCURRENT,
    };
  }
}

// Singleton instance with production settings
export const memoryManager = new MemoryManager(
  parseInt(process.env.MAX_CONCURRENT_UPLOADS || '10'),
  parseInt(process.env.MAX_LARGE_CONCURRENT || '5'),
  parseInt(process.env.LARGE_FILE_THRESHOLD_MB || '10'),
  parseInt(process.env.MAX_BATCH_SIZE_MB || '5000') // 5GB default
);
