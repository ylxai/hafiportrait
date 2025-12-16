/**
 * Upload Queue Tests
 * 
 * Tests for upload queue management with retry logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UploadQueue, calculateRetryDelay } from '@/lib/upload/uploadQueue';
import { UploadFileState } from '@/lib/upload/uploadPersistence';

describe('Upload Queue', () => {
  describe('calculateRetryDelay', () => {
    it('should calculate correct retry delays', () => {
      expect(calculateRetryDelay(0)).toBe(1000);
      expect(calculateRetryDelay(1)).toBe(2000);
      expect(calculateRetryDelay(2)).toBe(4000);
      expect(calculateRetryDelay(3)).toBe(8000);
      expect(calculateRetryDelay(4)).toBe(16000);
      expect(calculateRetryDelay(5)).toBe(30000);
      expect(calculateRetryDelay(10)).toBe(30000); // Max delay
    });
  });

  describe('UploadQueue', () => {
    let queue: UploadQueue;

    beforeEach(() => {
      queue = new UploadQueue({
        maxConcurrent: 2,
        maxRetries: 3,
      });
    });

    afterEach(() => {
      queue.destroy();
    });

    it('should initialize with idle status', () => {
      expect(queue.getStatus()).toBe('idle');
      expect(queue.isActive()).toBe(false);
    });

    it('should add files to queue', () => {
      const fileState: UploadFileState = {
        id: 'file1',
        file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
        progress: 0,
        status: 'queued',
        uploadedChunks: [],
        totalChunks: 1,
        retryCount: 0,
      };

      queue.addFile(fileState);

      const files = queue.getFiles();
      expect(files.length).toBe(1);
      expect(files[0].id).toBe('file1');
    });

    it('should remove files from queue', () => {
      const fileState: UploadFileState = {
        id: 'file1',
        file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
        progress: 0,
        status: 'queued',
        uploadedChunks: [],
        totalChunks: 1,
        retryCount: 0,
      };

      queue.addFile(fileState);
      expect(queue.getFiles().length).toBe(1);

      queue.removeFile('file1');
      expect(queue.getFiles().length).toBe(0);
    });

    it('should get correct statistics', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test1.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 0,
          status: 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
        {
          id: 'file2',
          file: { name: 'test2.jpg', size: 2048, type: 'image/jpeg', lastModified: Date.now() },
          progress: 50,
          status: 'uploading',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
        {
          id: 'file3',
          file: { name: 'test3.jpg', size: 3072, type: 'image/jpeg', lastModified: Date.now() },
          progress: 100,
          status: 'completed',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      files.forEach(f => queue.addFile(f));

      const stats = queue.getStats();
      expect(stats.total).toBe(3);
      expect(stats.queued).toBe(1);
      expect(stats.uploading).toBe(1);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(0);
    });

    it('should update file state', () => {
      const fileState: UploadFileState = {
        id: 'file1',
        file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
        progress: 0,
        status: 'queued',
        uploadedChunks: [],
        totalChunks: 1,
        retryCount: 0,
      };

      queue.addFile(fileState);
      queue.updateFileState('file1', { progress: 50, status: 'uploading' });

      const file = queue.getFile('file1');
      expect(file?.progress).toBe(50);
      expect(file?.status).toBe('uploading');
    });

    it('should clear completed files', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test1.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 0,
          status: 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
        {
          id: 'file2',
          file: { name: 'test2.jpg', size: 2048, type: 'image/jpeg', lastModified: Date.now() },
          progress: 100,
          status: 'completed',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      files.forEach(f => queue.addFile(f));
      expect(queue.getStats().total).toBe(2);

      queue.clearCompleted();
      expect(queue.getStats().total).toBe(1);
      expect(queue.getStats().completed).toBe(0);
    });

    it('should pause and resume queue', () => {
      queue.pause();
      expect(queue.getStatus()).toBe('paused');

      queue.resume();
      expect(queue.getStatus()).toBe('uploading');
    });
  });
});
