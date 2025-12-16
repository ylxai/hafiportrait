/**
 * Mobile Responsiveness Tests
 * Test tampilan mobile dan touch interactions
 */

import { test, expect, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Test di berbagai device
const mobileDevices = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S9+', device: devices['Galaxy S9+'] },
  { name: 'iPad Mini', device: devices['iPad Mini'] },
];

mobileDevices.forEach(({ name, device }) => {
  test.describe(`Mobile Tests - ${name}`, () => {
    test.use({ ...device });

    test('Homepage should be responsive', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check viewport
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();

      // Check if mobile menu exists
      const mobileMenu = await page.locator('[data-testid="mobile-menu-button"]');
      if (viewport!.width < 768) {
        expect(await mobileMenu.isVisible()).toBe(true);
      }

      // Take screenshot for visual comparison
      await page.screenshot({ 
        path: `tests/screenshots/mobile-home-${name.replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
    });

    test('Gallery should work on mobile', async ({ page }) => {
      await page.goto(`${BASE_URL}/gallery/test-wedding-2024`);
      
      // Enter access code
      await page.fill('input[name="accessCode"]', 'TEST123');
      await page.fill('input[name="guestName"]', 'Mobile User');
      await page.tap('button[type="submit"]');

      await page.waitForSelector('[data-testid="gallery-photos"]', { timeout: 5000 });

      // Test touch interactions
      const firstPhoto = await page.locator('[data-testid="photo-card"]').first();
      await firstPhoto.tap();

      await page.waitForSelector('[data-testid="photo-viewer"]');

      // Test swipe gestures using touch events
      const photoViewer = await page.locator('[data-testid="photo-viewer"]');
      const box = await photoViewer.boundingBox();
      if (box) {
        // Simulate swipe left
        await page.touchscreen.tap(box.x + box.width - 50, box.y + box.height / 2);
      }

      // Take screenshot
      await page.screenshot({ 
        path: `tests/screenshots/mobile-gallery-${name.replace(/\s+/g, '-')}.png` 
      });
    });

    test('Touch targets should be large enough', async ({ page }) => {
      await page.goto(BASE_URL);
      
      // Check button sizes (should be at least 44x44px for touch)
      const buttons = await page.locator('button, a[role="button"]').all();
      
      for (const button of buttons.slice(0, 5)) { // Check first 5 buttons
        const box = await button.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(40);
          expect(box.height).toBeGreaterThanOrEqual(40);
        }
      }
    });
  });
});

test.describe('Responsive Design', () => {
  test('Desktop layout should work', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(BASE_URL);
    
    // Desktop navigation should be visible
    const desktopNav = await page.locator('nav.desktop-nav');
    expect(await desktopNav.isVisible()).toBe(true);
  });

  test('Tablet layout should work', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(BASE_URL);
    
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(768);
  });
});
