/**
 * API Performance Tests
 * Test response times untuk semua API endpoints
 */

import { describe, it, expect } from 'vitest';
import { performanceBenchmarks } from '../fixtures/test-data';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

describe('API Performance Tests', () => {
  describe('Authentication Endpoints', () => {
    it('POST /api/auth/login should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'TestAdmin123!',
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiResponseTime.slow);
      
      console.log(`Login response time: ${responseTime}ms`);
    });

    it('GET /api/auth/me should be fast', async () => {
      // Login first
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'TestAdmin123!',
        }),
      });
      const { token } = await loginResponse.json();

      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiResponseTime.acceptable);
      
      console.log(`Auth/me response time: ${responseTime}ms`);
    });
  });

  describe('Gallery Endpoints', () => {
    it('Gallery access should be fast', async () => {
      const startTime = Date.now();

      const response = await fetch(`${API_URL}/gallery/test-wedding-2024/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: 'TEST123',
          guestName: 'Performance Test Guest',
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiResponseTime.slow);
      
      console.log(`Gallery access response time: ${responseTime}ms`);
    });

    it('Photos listing should be optimized', async () => {
      // Get guest token
      const accessResponse = await fetch(`${API_URL}/gallery/test-wedding-2024/access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: 'TEST123',
          guestName: 'Performance Test',
        }),
      });
      const { token } = await accessResponse.json();

      const startTime = Date.now();

      const response = await fetch(`${API_URL}/gallery/test-wedding-2024/photos`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiResponseTime.slow);
      
      console.log(`Photos listing response time: ${responseTime}ms`);
    });
  });

  describe('Admin Endpoints', () => {
    it('Dashboard endpoint should load quickly', async () => {
      // Login as admin
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'TestAdmin123!',
        }),
      });
      const { token } = await loginResponse.json();

      const startTime = Date.now();

      const response = await fetch(`${API_URL}/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiResponseTime.slow);
      
      console.log(`Dashboard response time: ${responseTime}ms`);
    });

    it('Events list should be paginated efficiently', async () => {
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'TestAdmin123!',
        }),
      });
      const { token } = await loginResponse.json();

      const startTime = Date.now();

      const response = await fetch(`${API_URL}/admin/events?page=1&limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(performanceBenchmarks.apiResponseTime.slow);
      
      console.log(`Events list response time: ${responseTime}ms`);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises: Promise<Response>[] = [];

      const startTime = Date.now();

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          fetch(`${API_URL}/health`)
        );
      }

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
      });

      console.log(`${concurrentRequests} concurrent requests completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(performanceBenchmarks.apiResponseTime.slow * 2);
    });
  });
});
