/**
 * Authentication Flow E2E Tests
 * Test complete authentication flow
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

test.describe('Authentication Flow', () => {
  test('Complete login and logout flow', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`);
    expect(page.url()).toContain('/auth/login');

    // Fill login form
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'TestAdmin123!');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/admin/dashboard`, { timeout: 5000 });

    // Verify logged in state
    expect(page.url()).toContain('/admin/dashboard');
    
    // Verify user info displayed
    const userMenu = await page.locator('[data-testid="user-menu"]');
    expect(await userMenu.isVisible()).toBe(true);

    // Logout
    await userMenu.click();
    await page.click('text=Logout');

    // Verify redirected to login
    await page.waitForURL(`${BASE_URL}/auth/login`, { timeout: 5000 });
  });

  test('Login with invalid credentials', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`);

    await page.fill('input[name="email"]', 'wrong@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await page.waitForSelector('text=/Invalid credentials|Login failed/i', { timeout: 3000 });
  });

  test('Protected route requires authentication', async ({ page }) => {
    // Try to access protected route without login
    await page.goto(`${BASE_URL}/admin/dashboard`);

    // Should redirect to login
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    expect(page.url()).toContain('/auth/login');
  });

  test('Session persistence across page refresh', async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'TestAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/admin/dashboard`);

    // Refresh page
    await page.reload();

    // Should still be logged in
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/dashboard');
  });
});
