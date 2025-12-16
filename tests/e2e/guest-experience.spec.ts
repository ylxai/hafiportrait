/**
 * Guest Experience E2E Tests
 * Test complete guest user journey
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const TEST_EVENT_SLUG = 'test-wedding-2024';
const TEST_ACCESS_CODE = 'TEST123';

test.describe('Guest Experience Flow', () => {
  test('Complete guest journey', async ({ page }) => {
    // 1. Access gallery page
    await page.goto(`${BASE_URL}/gallery/${TEST_EVENT_SLUG}`);

    // 2. Enter access code
    await page.waitForSelector('input[name="accessCode"]', { timeout: 5000 });
    await page.fill('input[name="accessCode"]', TEST_ACCESS_CODE);
    await page.fill('input[name="guestName"]', 'Test Guest User');
    await page.click('button[type="submit"]');

    // 3. View gallery
    await page.waitForSelector('[data-testid="gallery-photos"]', { timeout: 5000 });
    
    const photoCards = await page.locator('[data-testid="photo-card"]');
    const photoCount = await photoCards.count();
    expect(photoCount).toBeGreaterThan(0);

    // 4. View photo details
    await photoCards.first().click();
    await page.waitForSelector('[data-testid="photo-viewer"]', { timeout: 5000 });

    // 5. Like photo
    const likeButton = await page.locator('[data-testid="like-button"]');
    await likeButton.click();
    
    // Wait for like to register
    await page.waitForTimeout(500);

    // 6. Comment on photo
    const commentInput = await page.locator('textarea[name="comment"]');
    if (await commentInput.isVisible()) {
      await commentInput.fill('Great photo! Beautiful moment captured.');
      await page.click('button:has-text("Post Comment")');
      
      await page.waitForSelector('text=Great photo!', { timeout: 3000 });
    }

    // 7. Download photo
    const downloadButton = await page.locator('[data-testid="download-button"]');
    if (await downloadButton.isVisible()) {
      await downloadButton.click();
      // Note: Download verification depends on browser settings
    }

    // 8. Navigate between photos
    const nextButton = await page.locator('[data-testid="next-photo"]');
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(500);
    }

    // 9. Close photo viewer
    await page.click('[data-testid="close-viewer"]');
    await page.waitForSelector('[data-testid="gallery-photos"]');
  });

  test('Guest with invalid access code', async ({ page }) => {
    await page.goto(`${BASE_URL}/gallery/${TEST_EVENT_SLUG}`);

    await page.fill('input[name="accessCode"]', 'WRONGCODE');
    await page.fill('input[name="guestName"]', 'Test Guest');
    await page.click('button[type="submit"]');

    // Should show error
    await page.waitForSelector('text=/Invalid access code|Access denied/i', { timeout: 3000 });
  });

  test('Gallery pagination', async ({ page }) => {
    // Login as guest
    await page.goto(`${BASE_URL}/gallery/${TEST_EVENT_SLUG}`);
    await page.fill('input[name="accessCode"]', TEST_ACCESS_CODE);
    await page.fill('input[name="guestName"]', 'Test Guest');
    await page.click('button[type="submit"]');

    await page.waitForSelector('[data-testid="gallery-photos"]', { timeout: 5000 });

    // Check for pagination controls
    const paginationNext = await page.locator('[data-testid="pagination-next"]');
    if (await paginationNext.isVisible()) {
      await paginationNext.click();
      await page.waitForLoadState('networkidle');
    }
  });
});
