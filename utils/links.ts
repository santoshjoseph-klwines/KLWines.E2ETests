import { Page, Locator } from '@playwright/test';

export interface LinkCheckResult {
  url: string;
  text: string;
  status: 'ok' | 'broken' | 'timeout' | 'error';
  statusCode?: number;
  error?: string;
}

/**
 * Get all links on the current page
 */
export async function getAllLinks(page: Page): Promise<Locator[]> {
  const links = page.locator('a[href]');
  const count = await links.count();
  const linkArray: Locator[] = [];
  
  for (let i = 0; i < count; i++) {
    linkArray.push(links.nth(i));
  }
  
  return linkArray;
}

/**
 * Check if a link is valid (not broken)
 */
export async function checkLink(page: Page, link: Locator): Promise<LinkCheckResult> {
  const href = await link.getAttribute('href');
  const text = await link.textContent() || '';
  
  if (!href) {
    return {
      url: '',
      text: text.trim(),
      status: 'error',
      error: 'No href attribute',
    };
  }

  // Skip mailto, tel, javascript, and anchor links
  if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('#')) {
    return {
      url: href,
      text: text.trim(),
      status: 'ok',
    };
  }

  try {
    // Create a new page context for checking the link
    const response = await page.request.get(href, { timeout: 10000 });
    const statusCode = response.status();
    
    return {
      url: href,
      text: text.trim(),
      status: statusCode >= 200 && statusCode < 400 ? 'ok' : 'broken',
      statusCode,
    };
  } catch (error: any) {
    return {
      url: href,
      text: text.trim(),
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Check all links on the current page
 */
export async function checkAllLinks(page: Page): Promise<LinkCheckResult[]> {
  const links = await getAllLinks(page);
  const results: LinkCheckResult[] = [];
  
  for (const link of links) {
    const result = await checkLink(page, link);
    results.push(result);
  }
  
  return results;
}

/**
 * Check links in a specific section
 */
export async function checkLinksInSection(page: Page, sectionSelector: string): Promise<LinkCheckResult[]> {
  const section = page.locator(sectionSelector);
  const links = section.locator('a[href]');
  const count = await links.count();
  const results: LinkCheckResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    const result = await checkLink(page, link);
    results.push(result);
  }
  
  return results;
}

/**
 * Verify no broken links on the page
 */
export async function verifyNoBrokenLinks(page: Page): Promise<void> {
  const results = await checkAllLinks(page);
  const brokenLinks = results.filter(r => r.status === 'broken' || r.status === 'error');
  
  if (brokenLinks.length > 0) {
    const brokenUrls = brokenLinks.map(r => `${r.text} (${r.url})`).join(', ');
    throw new Error(`Found ${brokenLinks.length} broken links: ${brokenUrls}`);
  }
}

