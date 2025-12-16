/**
 * Contact API Tests
 * Test form submission dan message handling
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { teardownTestEnvironment } from '../utils/test-helpers';

const API_URL = 'http://localhost:3000/api';

describe('Contact API', () => {
  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/contact', () => {
    it('should submit contact form with valid data', async () => {
      const contactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+62812345678',
        message: 'I would like to inquire about photography services.',
      };

      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBeDefined();
    });

    it('should work without phone number', async () => {
      const contactData = {
        name: 'Jane Smith',
        email: 'jane@example.com',
        message: 'Great portfolio!',
      };

      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });

      expect(response.status).toBe(201);
    });

    it('should fail with missing required fields', async () => {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          // Missing email and message
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          message: 'Test message',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should validate message length', async () => {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Hi', // Too short
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should sanitize input to prevent XSS', async () => {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '<script>alert("xss")</script>',
          email: 'test@example.com',
          message: 'Test message with <script>alert("xss")</script>',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message.name).not.toContain('<script>');
      expect(data.message.message).not.toContain('<script>');
    });
  });
});
