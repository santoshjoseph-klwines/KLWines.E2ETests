import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { checkLinksInSection, verifyNoBrokenLinks } from '../../utils/links';

test.describe('Link Validation @browsing', () => {
  test('should have no broken links on homepage', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded');

    // Check first 100 visible links to avoid timeout
    await verifyNoBrokenLinks(page, 100);
  });

  test('should validate header navigation links', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded');

    const headerLinks = await checkLinksInSection(page, 'header, nav, [role="navigation"]');
    const brokenLinks = headerLinks.filter(link => link.status === 'broken' || (link.status === 'error' && !link.error?.includes('Cloudflare') && !link.error?.includes('Authentication')));

    if (brokenLinks.length > 0) {
      const brokenLinksInfo = brokenLinks.map(link =>
        `"${link.text}" (${link.url}) - ${link.status}${link.error ? `: ${link.error}` : ''}${link.statusCode ? ` (HTTP ${link.statusCode})` : ''}`
      ).join('\n');
      throw new Error(`Found ${brokenLinks.length} broken header links:\n${brokenLinksInfo}`);
    }

    expect(brokenLinks.length).toBe(0);
  });

  test('should validate footer links', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded');

    const footerLinks = await checkLinksInSection(page, 'footer');
    const brokenLinks = footerLinks.filter(link => link.status === 'broken' || (link.status === 'error' && !link.error?.includes('Cloudflare') && !link.error?.includes('Authentication')));

    if (brokenLinks.length > 0) {
      const brokenLinksInfo = brokenLinks.map(link =>
        `"${link.text}" (${link.url}) - ${link.status}${link.error ? `: ${link.error}` : ''}${link.statusCode ? ` (HTTP ${link.statusCode})` : ''}`
      ).join('\n');
      throw new Error(`Found ${brokenLinks.length} broken footer links:\n${brokenLinksInfo}`);
    }

    expect(brokenLinks.length).toBe(0);
  });

  test('should validate category links', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded');

    // Look for category/menu links
    const categoryLinks = await checkLinksInSection(page, '[data-testid="category"], .category, .menu-item');
    const brokenLinks = categoryLinks.filter(link => link.status === 'broken' || (link.status === 'error' && !link.error?.includes('Cloudflare') && !link.error?.includes('Authentication')));

    if (brokenLinks.length > 0) {
      const brokenLinksInfo = brokenLinks.map(link =>
        `"${link.text}" (${link.url}) - ${link.status}${link.error ? `: ${link.error}` : ''}${link.statusCode ? ` (HTTP ${link.statusCode})` : ''}`
      ).join('\n');
      throw new Error(`Found ${brokenLinks.length} broken category links:\n${brokenLinksInfo}`);
    }

    expect(brokenLinks.length).toBe(0);
  });

  test('should have working navigation links', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    // Test main navigation links
    const navLinks = page.locator('nav a[href], header a[href]');
    const count = await navLinks.count();

    expect(count).toBeGreaterThan(0);

    // Click first few navigation links to verify they work
    for (let i = 0; i < Math.min(3, count); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        await link.click();
        await page.waitForLoadState('networkidle');
        await expect(page).not.toHaveURL(/404|error/i);
        await homePage.goto(); // Return to home for next test
      }
    }
  });
});

