/**
 * Tests for guest storage utilities
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateGuestId,
  getGuestId,
  getLikedPhotos,
  addLikedPhoto,
  removeLikedPhoto,
  isPhotoLiked,
  clearGuestData,
} from '@/lib/guest-storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

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
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Guest Storage Utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  afterEach(() => {
    clearGuestData();
  });

  describe('generateGuestId', () => {
    it('should generate a unique guest ID', () => {
      const id1 = generateGuestId();
      const id2 = generateGuestId();

      expect(id1).toMatch(/^guest_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^guest_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getGuestId', () => {
    it('should create and return a new guest ID if none exists', () => {
      const id = getGuestId();
      expect(id).toMatch(/^guest_\d+_[a-z0-9]+$/);
    });

    it('should return existing guest ID from localStorage', () => {
      const firstId = getGuestId();
      const secondId = getGuestId();
      expect(firstId).toBe(secondId);
    });
  });

  describe('Liked Photos Management', () => {
    it('should start with empty liked photos', () => {
      const liked = getLikedPhotos();
      expect(liked.size).toBe(0);
    });

    it('should add photo to liked list', () => {
      addLikedPhoto('photo1');
      const liked = getLikedPhotos();
      expect(liked.has('photo1')).toBe(true);
    });

    it('should remove photo from liked list', () => {
      addLikedPhoto('photo1');
      addLikedPhoto('photo2');
      removeLikedPhoto('photo1');
      
      const liked = getLikedPhotos();
      expect(liked.has('photo1')).toBe(false);
      expect(liked.has('photo2')).toBe(true);
    });

    it('should check if photo is liked', () => {
      expect(isPhotoLiked('photo1')).toBe(false);
      addLikedPhoto('photo1');
      expect(isPhotoLiked('photo1')).toBe(true);
    });

    it('should persist liked photos to localStorage', () => {
      addLikedPhoto('photo1');
      addLikedPhoto('photo2');
      
      // Get fresh copy from localStorage
      const liked = getLikedPhotos();
      expect(liked.size).toBe(2);
      expect(liked.has('photo1')).toBe(true);
      expect(liked.has('photo2')).toBe(true);
    });
  });

  describe('clearGuestData', () => {
    it('should clear all guest data', () => {
      getGuestId(); // Creates guest ID
      addLikedPhoto('photo1');
      
      clearGuestData();
      
      expect(localStorage.getItem('hafiportrait_guest_id')).toBeNull();
      expect(localStorage.getItem('hafiportrait_guest_likes')).toBeNull();
    });
  });
});
