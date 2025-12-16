/**
 * Gallery API Tests
 * Test public gallery access dan guest features
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment, createMockPhotoData, prisma } from '../utils/test-helpers';

const API_URL = 'http://localhost:3000/api';

describe('Gallery API', () => {
  let testEvent: any;
  let testPhoto: any;
  let guestToken: string;

  beforeAll(async () => {
    const { event, client } = await setupTestEnvironment();
    testEvent = event;

    // Create test photo
    testPhoto = await prisma.photo.create({
      data: createMockPhotoData(event.id, client.id),
    });
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/gallery/:eventSlug/access', () => {
    it('should grant access with valid access code', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: testEvent.accessCode,
          guestName: 'Test Guest',
        }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.token).toBeDefined();
      expect(data.event).toBeDefined();
      guestToken = data.token;
    });

    it('should fail with invalid access code', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: 'WRONGCODE',
          guestName: 'Test Guest',
        }),
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should fail with non-existent event', async () => {
      const response = await fetch(`${API_URL}/gallery/non-existent-event/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: 'ANYCODE',
          guestName: 'Test Guest',
        }),
      });

      expect(response.status).toBe(404);
    });

    it('should fail with missing fields', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: testEvent.accessCode,
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/gallery/:eventSlug/photos', () => {
    it('should get photos with valid guest token', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos`, {
        headers: {
          'Authorization': `Bearer ${guestToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.photos)).toBe(true);
    });

    it('should fail without guest token', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos`);
      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos?page=1&limit=20`, {
        headers: {
          'Authorization': `Bearer ${guestToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.pagination).toBeDefined();
    });
  });

  describe('POST /api/gallery/:eventSlug/photos/:photoId/like', () => {
    it('should like a photo', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos/${testPhoto.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${guestToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should unlike a photo', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos/${testPhoto.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${guestToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos/${testPhoto.id}/like`, {
        method: 'POST',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/gallery/:eventSlug/photos/:photoId/download', () => {
    it('should download photo with valid token', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos/${testPhoto.id}/download`, {
        headers: {
          'Authorization': `Bearer ${guestToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.downloadUrl).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos/${testPhoto.id}/download`);
      expect(response.status).toBe(401);
    });

    it('should fail with non-existent photo', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/photos/non-existent-id/download`, {
        headers: {
          'Authorization': `Bearer ${guestToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/gallery/:eventSlug/comments', () => {
    it('should create comment on photo', async () => {
      const commentData = {
        photoId: testPhoto.id,
        authorName: 'Test Guest',
        content: 'Beautiful photo!',
        guestEmail: 'guest@example.com',
      };

      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${guestToken}`,
        },
        body: JSON.stringify(commentData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.comment).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: testPhoto.id,
          authorName: 'Test',
          content: 'Comment',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should validate comment length', async () => {
      const response = await fetch(`${API_URL}/gallery/${testEvent.slug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          photoId: testPhoto.id,
          authorName: 'Test',
          content: '', // Empty content
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
