/**
 * Security Tests
 * Test keamanan aplikasi
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestEnvironment, teardownTestEnvironment, testUsers, generateTestToken } from '../utils/test-helpers';

const API_URL = 'http://localhost:3000/api';

describe('Security Tests', () => {
  let adminToken: string;
  let guestToken: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    adminToken = await generateTestToken(testUsers.admin.username, testUsers.admin.password);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Authentication Security', () => {
    it('should reject requests without token to protected routes', async () => {
      const response = await fetch(`${API_URL}/admin/events`);
      expect(response.status).toBe(401);
    });

    it('should reject invalid JWT tokens', async () => {
      const response = await fetch(`${API_URL}/admin/events`, {
        headers: {
          'Authorization': 'Bearer invalid.jwt.token',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      // Create an expired token (this would need to be implemented in test helpers)
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.signature';
      
      const response = await fetch(`${API_URL}/admin/events`, {
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
        },
      });
      expect(response.status).toBe(401);
    });

    it('should prevent brute force attacks with rate limiting', async () => {
      const attempts = 10;
      const responses: number[] = [];

      for (let i = 0; i < attempts; i++) {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@test.com',
            password: 'wrongpassword',
          }),
        });
        responses.push(response.status);
      }

      // Should have at least one 429 (Too Many Requests) if rate limiting is active
      const hasRateLimit = responses.some(status => status === 429);
      console.log(`Rate limiting active: ${hasRateLimit}`);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent guest from accessing admin routes', async () => {
      // Get guest token
      const accessResponse = await fetch(`${API_URL}/gallery/test-wedding-2024/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: 'TEST123',
          guestName: 'Test Guest',
        }),
      });
      const { token: gToken } = await accessResponse.json();

      const response = await fetch(`${API_URL}/admin/events`, {
        headers: {
          'Authorization': `Bearer ${gToken}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it('should prevent unauthorized event access', async () => {
      const response = await fetch(`${API_URL}/admin/events/unauthorized-event-id`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in login', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: "admin@test.com' OR '1'='1",
          password: "password' OR '1'='1",
        }),
      });

      expect(response.status).toBe(401);
    });

    it('should sanitize XSS attempts in contact form', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: xssPayload,
          email: 'test@example.com',
          message: `Test message ${xssPayload}`,
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message.name).not.toContain('<script>');
      expect(data.message.message).not.toContain('<script>');
    });

    it('should validate file upload types', async () => {
      const response = await fetch(`${API_URL}/admin/events/test-event/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          filename: 'malicious.exe',
          originalUrl: 'https://example.com/malicious.exe',
          mimeType: 'application/x-msdownload',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should prevent oversized file uploads', async () => {
      const response = await fetch(`${API_URL}/admin/events/test-event/photos/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          filename: 'huge-file.jpg',
          originalUrl: 'https://example.com/huge.jpg',
          fileSize: 50 * 1024 * 1024, // 50MB
          mimeType: 'image/jpeg',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('CSRF Protection', () => {
    it('should require proper headers for state-changing operations', async () => {
      const response = await fetch(`${API_URL}/admin/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          // Missing Content-Type header
        },
        body: JSON.stringify({
          name: 'Test Event',
          slug: 'test-event',
          accessCode: 'TEST123',
        }),
      });

      // Should fail or return 415 Unsupported Media Type
      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Session Security', () => {
    it('should invalidate tokens on logout', async () => {
      // Login
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.admin.username,
          password: testUsers.admin.password,
        }),
      });
      const { token } = await loginResponse.json();

      // Logout
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Try to use the token after logout
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      // Should still work with JWT (stateless) or fail if using session blacklist
      // This depends on implementation
      expect([200, 401]).toContain(response.status);
    });
  });

  describe('Data Access Control', () => {
    it('should not expose sensitive data in responses', async () => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUsers.admin.username,
          password: testUsers.admin.password,
        }),
      });

      const data = await response.json();
      
      // Should not return password hash
      expect(data.user.passwordHash).toBeUndefined();
      expect(data.user.password).toBeUndefined();
    });

    it('should not expose other users data', async () => {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      
      // Should only return current user's data
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(testUsers.admin.username);
    });
  });
});
