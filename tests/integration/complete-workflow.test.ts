/**
 * Integration Test - Complete Workflow
 * Test end-to-end flow dari perspective yang berbeda
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import TestApiClient from '../utils/api-client';
import DatabaseTestHelper from '../utils/database-helpers';

describe('Complete Photography Workflow Integration', () => {
  const adminClient = new TestApiClient();
  const guestClient = new TestApiClient();
  
  let adminUser: any;
  let testEvent: any;
  let testPhoto: any;

  beforeAll(async () => {
    await DatabaseTestHelper.resetDatabase();
    
    // Login as admin
    adminUser = await adminClient.login('admin@test.com', 'TestAdmin123!');
  });

  afterAll(async () => {
    await DatabaseTestHelper.cleanTestData();
  });

  it('1. Admin creates new event', async () => {
    const eventData = {
      name: 'Integration Test Wedding',
      slug: `integration-wedding-${Date.now()}`,
      accessCode: `INT${Date.now().toString().slice(-6)}`,
      eventDate: new Date('2024-12-31').toISOString(),
      location: 'Jakarta',
      description: 'Integration test event',
    };

    const result = await adminClient.createEvent(eventData);
    
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event.name).toBe(eventData.name);
    
    testEvent = result.event;
  });

  it('2. Admin uploads photos to event', async () => {
    const photoData = {
      filename: 'integration-test-photo.jpg',
      originalUrl: 'https://example.com/photo.jpg',
      thumbnailUrl: 'https://example.com/thumb.jpg',
      fileSize: 1024000,
      mimeType: 'image/jpeg',
      width: 1920,
      height: 1080,
    };

    const result = await adminClient.uploadPhoto(testEvent.id, photoData);
    
    expect(result.success).toBe(true);
    expect(result.photo).toBeDefined();
    
    testPhoto = result.photo;
  });

  it('3. Guest accesses gallery', async () => {
    const result = await guestClient.galleryAccess(
      testEvent.slug,
      testEvent.accessCode,
      'Integration Test Guest'
    );
    
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
  });
});
