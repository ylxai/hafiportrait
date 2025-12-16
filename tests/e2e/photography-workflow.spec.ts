/**
 * End-to-End Photography Workflow Tests
 * Test complete photography workflow dari create event sampai guest download
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

test.describe('Complete Photography Workflow', () => {
  let page: Page;
  let eventSlug: string;
  let accessCode: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('1. Admin Login', async () => {
    await page.goto(`${BASE_URL}/auth/login`);
    
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');

    await page.waitForURL(`${BASE_URL}/admin/dashboard`);
    expect(page.url()).toContain('/admin/dashboard');
  });

  test('2. Create New Event', async () => {
    await page.goto(`${BASE_URL}/admin/events/new`);

    const uniqueSlug = `wedding-${Date.now()}`;
    const uniqueCode = `CODE${Date.now().toString().slice(-6)}`;

    await page.fill('input[name="name"]', 'Test Wedding Event');
    await page.fill('input[name="slug"]', uniqueSlug);
    await page.fill('input[name="accessCode"]', uniqueCode);
    await page.fill('input[name="location"]', 'Jakarta');
    await page.fill('textarea[name="description"]', 'Beautiful wedding event');
    
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/admin\/events\/.+/);
    
    eventSlug = uniqueSlug;
    accessCode = uniqueCode;
  });

  test('3. Upload Photos', async () => {
    await page.goto(`${BASE_URL}/admin/events`);
    await page.click(`text=${eventSlug}`);

    // Wait for upload interface
    await page.waitForSelector('[data-testid="upload-zone"]', { timeout: 5000 });

    // Simulate photo upload
    const fileInput = await page.locator('input[type="file"]');
    
    // Note: In real test, upload actual test images
    // For now, verify upload interface exists
    expect(await fileInput.count()).toBeGreaterThan(0);
  });

  test('4. Generate QR Code', async () => {
    await page.click('button:has-text("Generate QR Code")');
    
    await page.waitForSelector('[data-testid="qr-code-preview"]', { timeout: 5000 });
    
    const qrImage = await page.locator('[data-testid="qr-code-preview"] img');
    expect(await qrImage.count()).toBe(1);
  });

  test('5. Guest Access Gallery via QR/Link', async () => {
    // Logout admin
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Logout');

    // Access gallery as guest
    await page.goto(`${BASE_URL}/gallery/${eventSlug}`);

    // Enter access code
    await page.fill('input[name="accessCode"]', accessCode);
    await page.fill('input[name="guestName"]', 'Test Guest');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="gallery-photos"]', { timeout: 5000 });
  });

  test('6. Guest Browse and Like Photos', async () => {
    // Click on first photo
    const firstPhoto = await page.locator('[data-testid="photo-card"]').first();
    await firstPhoto.click();

    // Like photo
    await page.click('[data-testid="like-button"]');
    
    const likeCount = await page.locator('[data-testid="like-count"]');
    expect(await likeCount.textContent()).toBeTruthy();
  });

  test('7. Guest Add Comment', async () => {
    await page.fill('textarea[name="comment"]', 'Beautiful photo!');
    await page.click('button:has-text("Post Comment")');

    await page.waitForSelector('text=Beautiful photo!', { timeout: 3000 });
  });

  test('8. Guest Download Photo', async () => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('[data-testid="download-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.jpg');
  });

  test('9. Admin View Analytics', async () => {
    // Login as admin again
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');

    // Go to event analytics
    await page.goto(`${BASE_URL}/admin/events`);
    await page.click(`text=${eventSlug}`);
    await page.click('text=Analytics');

    // Verify analytics data
    await page.waitForSelector('[data-testid="analytics-stats"]', { timeout: 5000 });
    
    const viewCount = await page.locator('[data-testid="total-views"]');
    const likeCount = await page.locator('[data-testid="total-likes"]');
    const downloadCount = await page.locator('[data-testid="total-downloads"]');

    expect(await viewCount.textContent()).toBeTruthy();
    expect(await likeCount.textContent()).toBeTruthy();
    expect(await downloadCount.textContent()).toBeTruthy();
  });
});
