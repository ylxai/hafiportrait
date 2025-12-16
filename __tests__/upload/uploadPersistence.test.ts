/**
 * Upload Persistence Tests
 * 
 * Tests for localStorage-based upload state persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createUploadSession,
  saveUploadState,
  loadUploadState,
  clearUploadState,
  hasPendingUploads,
  updateFileState,
  removeFileFromSession,
  getPendingFiles,
  getCompletedFiles,
  isLocalStorageAvailable,
  getStorageUsage,
  UploadSession,
  UploadFileState,
} from '@/lib/upload/uploadPersistence';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

// Setup global localStorage mock
beforeEach(() => {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
  localStorageMock.clear();
});

afterEach(() => {
  localStorageMock.clear();
});

describe('Upload Persistence', () => {
  describe('isLocalStorageAvailable', () => {
    it('should detect localStorage availability', () => {
      expect(isLocalStorageAvailable()).toBe(true);
    });
  });

  describe('createUploadSession', () => {
    it('should create new upload session', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 0,
          status: 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      const session = createUploadSession('event123', files);

      expect(session.eventId).toBe('event123');
      expect(session.files).toEqual(files);
      expect(session.status).toBe('pending');
      expect(session.sessionId).toBeTruthy();
      expect(session.createdAt).toBeTruthy();
      expect(session.updatedAt).toBeTruthy();
    });
  });

  describe('saveUploadState and loadUploadState', () => {
    it('should save and load upload state', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 50,
          status: 'uploading',
          uploadedChunks: [0],
          totalChunks: 2,
          retryCount: 0,
        },
      ];

      const session = createUploadSession('event123', files);
      const saved = saveUploadState(session);

      expect(saved).toBe(true);

      const loaded = loadUploadState();
      expect(loaded).toBeTruthy();
      expect(loaded?.sessionId).toBe(session.sessionId);
      expect(loaded?.eventId).toBe('event123');
      expect(loaded?.files.length).toBe(1);
    });

    it('should return null when no state exists', () => {
      const loaded = loadUploadState();
      expect(loaded).toBeNull();
    });
  });

  describe('clearUploadState', () => {
    it('should clear upload state', () => {
      const session = createUploadSession('event123', []);
      saveUploadState(session);

      expect(loadUploadState()).toBeTruthy();

      clearUploadState();

      expect(loadUploadState()).toBeNull();
    });
  });

  describe('hasPendingUploads', () => {
    it('should detect pending uploads', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 0,
          status: 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      const session = createUploadSession('event123', files);
      expect(hasPendingUploads(session)).toBe(true);
    });

    it('should return false for completed session', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 100,
          status: 'completed',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      const session = createUploadSession('event123', files);
      expect(hasPendingUploads(session)).toBe(false);
    });

    it('should return false for null session', () => {
      expect(hasPendingUploads(null)).toBe(false);
    });
  });

  describe('updateFileState', () => {
    it('should update file state', () => {
      const files: UploadFileState[] = [
        {
          id: 'file1',
          file: { name: 'test.jpg', size: 1024, type: 'image/jpeg', lastModified: Date.now() },
          progress: 0,
          status: 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      const session = createUploadSession('event123', files);
      const updated = updateFileState(session, 'file1', { progress: 50, status: 'uploading' });

      expect(updated.files[0].progress).toBe(50);
      expect(updated.files[0].status).toBe('uploading');
    });
  });

  describe('removeFileFromSession', () => {
    it('should remove file from session', () => {
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
          progress: 0,
          status: 'queued',
          uploadedChunks: [],
          totalChunks: 1,
          retryCount: 0,
        },
      ];

      const session = createUploadSession('event123', files);
      const updated = removeFileFromSession(session, 'file1');

      expect(updated.files.length).toBe(1);
      expect(updated.files[0].id).toBe('file2');
    });
  });

  describe('getPendingFiles', () => {
    it('should get pending files', () => {
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

      const session = createUploadSession('event123', files);
      const pending = getPendingFiles(session);

      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe('file1');
    });
  });

  describe('getCompletedFiles', () => {
    it('should get completed files', () => {
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

      const session = createUploadSession('event123', files);
      const completed = getCompletedFiles(session);

      expect(completed.length).toBe(1);
      expect(completed[0].id).toBe('file2');
    });
  });

  describe('getStorageUsage', () => {
    it('should calculate storage usage', () => {
      const usage = getStorageUsage();

      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('available');
      expect(usage).toHaveProperty('percentage');
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });
  });
});
