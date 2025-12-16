/**
 * Screenshot Helpers untuk Visual Testing
 */

import { Page } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { join } from 'path';

export class ScreenshotHelper {
  private screenshotDir: string;

  constructor(screenshotDir = 'tests/screenshots') {
    this.screenshotDir = screenshotDir;
  }

  /**
   * Ensure screenshot directory exists
   */
  async ensureDir() {
    await mkdir(this.screenshotDir, { recursive: true });
  }

  /**
   * Take full page screenshot
   */
  async takeFullPage(page: Page, name: string) {
    await this.ensureDir();
    const path = join(this.screenshotDir, `${name}-fullpage.png`);
    await page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * Take viewport screenshot
   */
  async takeViewport(page: Page, name: string) {
    await this.ensureDir();
    const path = join(this.screenshotDir, `${name}-viewport.png`);
    await page.screenshot({ path });
    return path;
  }

  /**
   * Take element screenshot
   */
  async takeElement(page: Page, selector: string, name: string) {
    await this.ensureDir();
    const element = await page.locator(selector);
    const path = join(this.screenshotDir, `${name}-element.png`);
    await element.screenshot({ path });
    return path;
  }

  /**
   * Take screenshots at multiple breakpoints
   */
  async takeResponsive(page: Page, url: string, name: string) {
    const breakpoints = [
      { width: 320, height: 568, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1024, height: 768, name: 'laptop' },
      { width: 1440, height: 900, name: 'desktop' },
    ];

    await this.ensureDir();

    for (const bp of breakpoints) {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      const path = join(this.screenshotDir, `${name}-${bp.name}.png`);
      await page.screenshot({ path, fullPage: true });
    }
  }
}
