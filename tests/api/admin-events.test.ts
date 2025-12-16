/**
 * Admin Events API Tests
 * Test CRUD operations untuk events
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment, testUsers, generateTestToken, prisma } from '../utils/test-helpers';

const API_URL = 'http://localhost:3000/api';

describe('Admin Events API', () => {
  let adminToken: string;
  let clientToken: string;
  let testEventId: string;

  beforeAll(async () => {
    const { admin, client } = await setupTestEnvironment();
    adminToken = await generateTestToken(testUsers.admin.username, testUsers.admin.password);
    clientToken = await generateTestToken(testUsers.client.username, testUsers.client.password);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/admin/events', () => {
    it('should create new event with valid data', async () => {
      const eventData = {
        name: 'Test Wedding 2024',
        slug: 'test-wedding-2024-unique',
        accessCode: 'TEST2024',
        eventDate: new Date('2024-12-31').toISOString(),
        location: 'Jakarta',
        description: 'Beautiful wedding celebration',
        clientEmail: 'client@example.com',
        clientPhone: '+62812345678',
      };

      const response = await fetch(`${API_URL}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(eventData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.event).toBeDefined();
      expect(data.event.name).toBe(eventData.name);
      expect(data.event.slug).toBe(eventData.slug);
      testEventId = data.event.id;
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Unauthorized Event',
          slug: 'unauthorized',
          accessCode: 'UNAUTH',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should fail with duplicate slug', async () => {
      const eventData = {
        name: 'Another Event',
        slug: 'test-wedding-2024-unique', // Same slug as before
        accessCode: 'ANOTHER123',
      };

      const response = await fetch(`${API_URL}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(eventData),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await fetch(`${API_URL}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Incomplete Event',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should validate slug format', async () => {
      const response = await fetch(`${API_URL}/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Invalid Slug Event',
          slug: 'invalid slug with spaces',
          accessCode: 'VALID123',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/events', () => {
    it('should get all events for authenticated admin', async () => {
      const response = await fetch(`${API_URL}/admin/events`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.events)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/events`);
      expect(response.status).toBe(401);
    });

    it('should support pagination', async () => {
      const response = await fetch(`${API_URL}/admin/events?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.pagination).toBeDefined();
    });

    it('should support filtering by status', async () => {
      const response = await fetch(`${API_URL}/admin/events?status=ACTIVE`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/admin/events/:id', () => {
    it('should get event by id', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEventId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.event.id).toBe(testEventId);
    });

    it('should fail with non-existent id', async () => {
      const response = await fetch(`${API_URL}/admin/events/non-existent-id`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEventId}`);
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/admin/events/:id', () => {
    it('should update event', async () => {
      const updateData = {
        name: 'Updated Event Name',
        location: 'Updated Location',
      };

      const response = await fetch(`${API_URL}/admin/events/${testEventId}`, {
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
      expect(data.event.name).toBe(updateData.name);
      expect(data.event.location).toBe(updateData.location);
    });

    it('should fail with invalid data', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          slug: 'invalid slug with spaces',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized Update' }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/admin/events/:id', () => {
    it('should delete event', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should fail with non-existent id', async () => {
      const response = await fetch(`${API_URL}/admin/events/non-existent-id`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(404);
    });

    it('should fail without authentication', async () => {
      const response = await fetch(`${API_URL}/admin/events/${testEventId}`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(401);
    });
  });
});
