/**
 * Global Test Setup
 * Setup yang dijalankan sebelum semua tests
 */

import { config } from 'dotenv';
import DatabaseTestHelper from './utils/database-helpers';

// Load test environment variables
config({ path: '.env.test' });

export async function setup() {
  console.log('🔧 Setting up test environment...');
  
  // Check database connection
  const health = await DatabaseTestHelper.checkHealth();
  if (!health.healthy) {
    throw new Error(`Database connection failed: ${health.message}`);
  }
  console.log('✅ Database connection OK');
  
  // Seed test data
  await DatabaseTestHelper.seedTestData();
  console.log('✅ Test data seeded');
  
  console.log('✅ Test environment ready\n');
}

export async function teardown() {
  console.log('\n🧹 Cleaning up test environment...');
  
  // Clean test data
  await DatabaseTestHelper.cleanTestData();
  console.log('✅ Test data cleaned');
  
  console.log('✅ Cleanup complete');
}
