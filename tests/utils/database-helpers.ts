/**
 * Database Testing Helpers
 * Utilities untuk database operations dalam testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Test Database Operations
 */
export class DatabaseTestHelper {
  /**
   * Seed test data untuk testing
   */
  static async seedTestData() {
    console.log('🌱 Seeding test data...');

    // Create test admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        passwordHash: '$2b$10$YourHashedPasswordHere', // Update with actual hash
        name: 'Test Admin',
        role: 'ADMIN',
      },
    });

    // Create test client user
    const client = await prisma.user.upsert({
      where: { email: 'client@test.com' },
      update: {},
      create: {
        email: 'client@test.com',
        passwordHash: '$2b$10$YourHashedPasswordHere',
        name: 'Test Client',
        role: 'CLIENT',
      },
    });

    // Create test event
    const event = await prisma.event.upsert({
      where: { slug: 'test-wedding-2024' },
      update: {},
      create: {
        name: 'Test Wedding 2024',
        slug: 'test-wedding-2024',
        accessCode: 'TEST123',
        status: 'ACTIVE',
        clientId: client.id,
        eventDate: new Date('2024-12-31'),
        location: 'Jakarta',
        description: 'Test wedding event for automated testing',
      },
    });

    // Create test photos
    for (let i = 1; i <= 10; i++) {
      await prisma.photo.upsert({
        where: { id: `test-photo-${i}` },
        update: {},
        create: {
          id: `test-photo-${i}`,
          filename: `test-photo-${i}.jpg`,
          originalUrl: `https://example.com/photos/test-${i}.jpg`,
          thumbnailUrl: `https://example.com/thumbs/test-${i}.jpg`,
          eventId: event.id,
          uploadedById: admin.id,
          fileSize: 1024000,
          mimeType: 'image/jpeg',
          width: 1920,
          height: 1080,
          displayOrder: i,
        },
      });
    }

    console.log('✅ Test data seeded successfully');
    return { admin, client, event };
  }

  /**
   * Clean all test data
   */
  static async cleanTestData() {
    console.log('🧹 Cleaning test data...');

    await prisma.photoLike.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.photoDownload.deleteMany({});
    await prisma.photoView.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.guestSession.deleteMany({});
    await prisma.eventSettings.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.contactMessage.deleteMany({});
    await prisma.user.deleteMany({});

    console.log('✅ Test data cleaned');
  }

  /**
   * Reset database ke initial state
   */
  static async resetDatabase() {
    await this.cleanTestData();
    await this.seedTestData();
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    const [
      userCount,
      eventCount,
      photoCount,
      commentCount,
      likeCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.photo.count(),
      prisma.comment.count(),
      prisma.photoLike.count(),
    ]);

    return {
      users: userCount,
      events: eventCount,
      photos: photoCount,
      comments: commentCount,
      likes: likeCount,
    };
  }

  /**
   * Check database health
   */
  static async checkHealth() {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { healthy: true, message: 'Database connection OK' };
    } catch (error) {
      return { 
        healthy: false, 
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Run database migrations
   */
  static async runMigrations() {
    // This would use Prisma migrate in actual implementation
    console.log('Running database migrations...');
    // Execute: npx prisma migrate deploy
  }

  /**
   * Create backup
   */
  static async createBackup(backupName: string) {
    console.log(`Creating database backup: ${backupName}`);
    // Implementation depends on database provider
  }

  /**
   * Restore from backup
   */
  static async restoreBackup(backupName: string) {
    console.log(`Restoring database from backup: ${backupName}`);
    // Implementation depends on database provider
  }
}

/**
 * Test data factories
 */
export const TestDataFactory = {
  /**
   * Create test user
   */
  user: (overrides = {}) => ({
    email: `user-${Date.now()}@test.com`,
    passwordHash: '$2b$10$defaulthash',
    name: 'Test User',
    role: 'CLIENT' as const,
    ...overrides,
  }),

  /**
   * Create test event
   */
  event: (clientId: string, overrides = {}) => ({
    name: `Event ${Date.now()}`,
    slug: `event-${Date.now()}`,
    accessCode: `CODE${Date.now().toString().slice(-6)}`,
    status: 'ACTIVE' as const,
    clientId,
    ...overrides,
  }),

  /**
   * Create test photo
   */
  photo: (eventId: string, uploaderId: string, overrides = {}) => ({
    filename: `photo-${Date.now()}.jpg`,
    originalUrl: `https://example.com/photos/${Date.now()}.jpg`,
    thumbnailUrl: `https://example.com/thumbs/${Date.now()}.jpg`,
    eventId,
    uploadedById: uploaderId,
    fileSize: 1024000,
    mimeType: 'image/jpeg',
    width: 1920,
    height: 1080,
    ...overrides,
  }),

  /**
   * Create test comment
   */
  comment: (photoId: string, eventId: string, overrides = {}) => ({
    photoId,
    eventId,
    authorName: 'Test Commenter',
    content: 'Test comment content',
    guestEmail: `guest-${Date.now()}@example.com`,
    ...overrides,
  }),
};

export default DatabaseTestHelper;
