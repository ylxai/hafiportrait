/**
 * Test Helpers dan Utilities
 * Fungsi-fungsi bantuan untuk testing
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export const prisma = new PrismaClient();

// Test User Data
export const testUsers = {
  admin: {
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'TestAdmin123!',
    name: 'Test Admin',
    role: 'ADMIN' as const,
  },
  client: {
    username: 'testclient',
    email: 'client@test.com',
    password: 'TestClient123!',
    name: 'Test Client',
    role: 'CLIENT' as const,
  },
};

// Test Event Data
export const testEvent = {
  name: 'Test Wedding Event',
  slug: 'test-wedding-2024',
  accessCode: 'TEST123',
  eventDate: new Date('2024-12-31'),
  location: 'Jakarta',
  description: 'Test event description',
};

/**
 * Membuat test user di database
 */
export async function createTestUser(userData: typeof testUsers.admin | typeof testUsers.client) {
  const passwordHash = await bcrypt.hash(userData.password, 10);
  
  return await prisma.user.create({
    data: {
      username: userData.username,
      email: userData.email,
      passwordHash,
      name: userData.name,
      role: userData.role,
    },
  });
}

/**
 * Membuat test event di database
 */
export async function createTestEvent(userId: string, eventData = testEvent) {
  return await prisma.event.create({
    data: {
      ...eventData,
      clientId: userId,
      status: 'ACTIVE',
    },
  });
}

/**
 * Generate JWT token untuk testing
 */
export async function generateTestToken(username: string, password: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const data = await response.json();
  return data.token;
}

/**
 * Cleanup database setelah testing
 */
export async function cleanupDatabase() {
  // Hapus dalam urutan yang benar (foreign key constraints)
  await prisma.photoLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.photoDownload.deleteMany();
  await prisma.photoView.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.guestSession.deleteMany();
  await prisma.eventSettings.deleteMany();
  await prisma.event.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Generate random string
 */
export function randomString(length = 10): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Wait helper untuk async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock photo data
 */
export function createMockPhotoData(eventId: string, uploaderId: string) {
  return {
    filename: `test-photo-${randomString()}.jpg`,
    originalUrl: `https://example.com/photos/test-${randomString()}.jpg`,
    thumbnailUrl: `https://example.com/thumbs/test-${randomString()}.jpg`,
    eventId,
    uploadedById: uploaderId,
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
  };
}

/**
 * Setup test environment
 */
export async function setupTestEnvironment() {
  // Create admin user
  const admin = await createTestUser(testUsers.admin);
  
  // Create client user
  const client = await createTestUser(testUsers.client);
  
  // Create test event
  const event = await createTestEvent(client.id);
  
  return { admin, client, event };
}

/**
 * Teardown test environment
 */
export async function teardownTestEnvironment() {
  await cleanupDatabase();
  await prisma.$disconnect();
}
