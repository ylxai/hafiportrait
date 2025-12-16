/**
 * Photo Management API Tests
 * Test upload, delete, restore photos
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment, testUsers, generateTestToken, createMockPhotoData, prisma } from '../utils/test-helpers';

const API_URL = 'http://localhost:3000/api';

describe('Photo Management API', () => {
  let adminToken: string;
  let testEvent: any;
  let testPhoto: any;
  let admin: any;

  beforeAll(async () => {
    const { admin: adminUser, event } = await setupTestEnvironment();
    admin = adminUser;
    testEvent = event;
    adminToken = await generateTestToken(testUsers.admin.username, testUsers.admin.password);

    // Create test photo
    testPhoto = await prisma.photo.create({
      data: createMockPhotoData(event.id, adminUser.id),
    });
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/admin/events/:id/photos/upload', () => {
    it('should handle photo upload metadata', async () => {
      const photoData = {
        filename: 'test-upload.jpg',
        originalUrl: 'https://example.com/test.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        width: 1920,
        height: 1080,
      };

      const response = await fetch(`${API_URL}/admin/events/${testEvent.id}/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(photoData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.photo).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEvent.id}/photos/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'test.jpg',
          originalUrl: 'https://example.com/test.jpg',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEvent.id}/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          filename: 'test.jpg',
          // Missing originalUrl
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/admin/photos/:photoId', () => {
    it('should update photo metadata', async () => {
      const updateData = {
        caption: 'Updated caption',
        isFeatured: true,
        displayOrder: 5,
      };

      const response = await fetch(`${API_URL}/admin/photos/${testPhoto.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.photo.caption).toBe(updateData.caption);
      expect(data.photo.isFeatured).toBe(updateData.isFeatured);
    });

    it('should fail with non-existent photo', async () => {
      const response = await fetch(`${API_URL}/admin/photos/non-existent-id`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ caption: 'Test' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/photos/:photoId', () => {
    it('should soft delete photo', async () => {
      const response = await fetch(`${API_URL}/admin/photos/${testPhoto.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify soft delete
      const deletedPhoto = await prisma.photo.findUnique({
        where: { id: testPhoto.id },
      });
      expect(deletedPhoto?.deletedAt).toBeDefined();
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/photos/${testPhoto.id}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/admin/photos/trash', () => {
    it('should get deleted photos', async () => {
      const response = await fetch(`${API_URL}/admin/photos/trash`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.photos)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/photos/trash`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/admin/photos/:photoId/restore', () => {
    it('should restore deleted photo', async () => {
      const response = await fetch(`${API_URL}/admin/photos/${testPhoto.id}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify restore
      const restoredPhoto = await prisma.photo.findUnique({
        where: { id: testPhoto.id },
      });
      expect(restoredPhoto?.deletedAt).toBeNull();
    });
  });
});
