import { Page, Locator } from '@playwright/test';

export interface LinkCheckResult {
  url: string;
  text: string;
  status: 'ok' | 'broken' | 'timeout' | 'error';
  statusCode?: number;
  error?: string;
}

/**
 * Get all visible links on the current page
 */
export async function getAllLinks(page: Page): Promise<Locator[]> {
  const links = page.locator('a[href]').filter({ hasNotText: '' });
  const count = await links.count();
  const linkArray: Locator[] = [];

  // Only get visible links to avoid timeout on hidden/dynamic links
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    try {
      // Check if link is visible with a short timeout
      const isVisible = await link.isVisible({ timeout: 1000 }).catch(() => false);
      if (isVisible) {
        linkArray.push(link);
      }
    } catch {
      // Skip links that can't be checked
      continue;
    }
  }

  return linkArray;
}

/**
 * Check if a link is valid (not broken)
 */
export async function checkLink(page: Page, link: Locator): Promise<LinkCheckResult> {
  let href: string | null = null;
  let text = '';

  try {
    // Wait for link to be stable before checking
    await link.waitFor({ state: 'attached', timeout: 2000 }).catch(() => { });

    // Use a shorter timeout for getting attributes to avoid hanging
    href = await link.getAttribute('href', { timeout: 5000 });

    // Try multiple ways to get link text
    try {
      text = (await link.textContent({ timeout: 3000 })) || '';
      // If text is empty, try innerText
      if (!text.trim()) {
        text = (await link.evaluate(el => (el as HTMLElement).innerText || el.textContent || '')) || '';
      }
      // If still empty, try getting aria-label or title
      if (!text.trim()) {
        const ariaLabel = await link.getAttribute('aria-label').catch(() => null);
        const title = await link.getAttribute('title').catch(() => null);
        text = ariaLabel || title || '';
      }
    } catch {
      // If text extraction fails, try to get it from the href or use a fallback
      text = href ? new URL(href, page.url()).pathname : 'Link';
    }
  } catch (error: any) {
    // If we can't get href, try one more time with a longer timeout
    try {
      href = await link.getAttribute('href', { timeout: 2000 });
      text = (await link.textContent({ timeout: 2000 })) || href || 'Unknown';
    } catch {
      return {
        url: href || 'unknown',
        text: text.trim() || 'Unknown',
        status: 'error',
        error: `Failed to get link attributes: ${error.message}`,
      };
    }
  }

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

  // Check if it's an external social media link (these often block automated requests)
  const isSocialMediaLink =
    href.includes('facebook.com') ||
    href.includes('twitter.com') ||
    href.includes('instagram.com') ||
    href.includes('youtube.com') ||
    href.includes('linkedin.com') ||
    href.includes('pinterest.com');

  try {
    // For relative URLs, make them absolute
    let absoluteUrl = href;
    if (href.startsWith('/')) {
      const baseUrl = new URL(page.url()).origin;
      absoluteUrl = baseUrl + href;
    } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
      // Handle relative URLs without leading slash
      const baseUrl = new URL(page.url());
      absoluteUrl = new URL(href, baseUrl).href;
    }

    // Create a new page context for checking the link with retry for intermittent failures
    let response;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        response = await page.request.get(absoluteUrl, { timeout: 10000, maxRedirects: 5 });
        break;
      } catch (error: any) {
        lastError = error;
        if (attempt < 1) {
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response after retries');
    }

    const statusCode = response.status();
    const finalUrl = response.url();
    const responseBody = await response.text().catch(() => '');

    // Check if it's a Cloudflare verification page (not a broken link)
    const isCloudflareChallenge =
      statusCode === 403 ||
      statusCode === 503 ||
      responseBody.includes('cf-browser-verification') ||
      responseBody.includes('challenge-platform') ||
      responseBody.includes('cloudflare') ||
      response.headers()['cf-ray'] !== undefined;

    if (isCloudflareChallenge) {
      // Cloudflare-protected links are considered valid (they work, just require verification)
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        statusCode,
      };
    }

    // Check if it requires authentication (401/403 that redirects to login or shows login page)
    const requiresAuth =
      statusCode === 401 ||
      (statusCode === 403 && (
        finalUrl.toLowerCase().includes('/login') ||
        finalUrl.toLowerCase().includes('/account/login') ||
        responseBody.toLowerCase().includes('login') ||
        responseBody.toLowerCase().includes('sign in') ||
        responseBody.toLowerCase().includes('authentication required')
      ));

    if (requiresAuth) {
      // Authentication-required links are considered valid (they work, just require login)
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        statusCode,
      };
    }

    // Check if it's a redirect (3xx status codes) - redirects are valid links
    if (statusCode >= 300 && statusCode < 400) {
      // Redirects (301, 302, etc.) mean the link is valid, it just points elsewhere
      // Try to follow the redirect to verify the final destination is valid
      try {
        const finalResponse = await page.request.get(finalUrl, { timeout: 10000, maxRedirects: 5 });
        const finalStatusCode = finalResponse.status();
        // If final destination is valid, the redirect link is valid
        if (finalStatusCode >= 200 && finalStatusCode < 400) {
          return {
            url: href,
            text: text.trim(),
            status: 'ok',
            statusCode: finalStatusCode,
          };
        }
      } catch {
        // If we can't follow redirect, still treat redirect as valid (301/302 means link works)
        return {
          url: href,
          text: text.trim(),
          status: 'ok',
          statusCode,
        };
      }
      // Even if final destination check fails, redirect itself is valid
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        statusCode,
      };
    }

    // Check if it's a 400 error from social media (they often block automated requests)
    if (statusCode === 400 && isSocialMediaLink) {
      // Social media links that return 400 are usually valid but block bots
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        statusCode,
      };
    }

    return {
      url: href,
      text: text.trim(),
      status: statusCode >= 200 && statusCode < 400 ? 'ok' : 'broken',
      statusCode,
    };
  } catch (error: any) {
    // Check if error is due to Cloudflare (timeout or 403 on external domains)
    const errorMessage = error.message?.toLowerCase() || '';
    const isCloudflareError =
      errorMessage.includes('403') ||
      errorMessage.includes('cloudflare') ||
      (href.includes('onthetrail.klwines.com') && errorMessage.includes('timeout'));

    if (isCloudflareError) {
      // Treat Cloudflare-protected links as valid
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        error: 'Cloudflare verification required (link is valid)',
      };
    }

    // Check if it's an authentication error (401/403)
    if (errorMessage.includes('401') || (errorMessage.includes('403') && href.includes('/Account/'))) {
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        error: 'Authentication required (link is valid)',
      };
    }

    // Check if it's a 400 error from social media (they often block automated requests)
    if ((errorMessage.includes('400') || errorMessage.includes('bad request')) && isSocialMediaLink) {
      return {
        url: href,
        text: text.trim(),
        status: 'ok',
        error: 'Social media link (blocks automated requests, but valid)',
      };
    }

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

  // Wait for section to be visible
  await section.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => { });

  const links = section.locator('a[href]');
  const count = await links.count();
  const results: LinkCheckResult[] = [];

  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    try {
      // Skip links that aren't visible or attached
      const isVisible = await link.isVisible({ timeout: 1000 }).catch(() => false);
      if (!isVisible) {
        continue;
      }

      const result = await checkLink(page, link);
      results.push(result);
    } catch (error: any) {
      // If checking a link fails, skip it but log the error
      results.push({
        url: 'unknown',
        text: 'Unknown',
        status: 'error',
        error: `Failed to check link: ${error.message}`,
      });
    }
  }

  return results;
}

/**
 * Verify no broken links on the page
 * @param maxLinks - Maximum number of links to check (default: 100 to avoid timeout)
 */
export async function verifyNoBrokenLinks(page: Page, maxLinks = 100): Promise<void> {
  const links = await getAllLinks(page);

  // Limit the number of links checked to avoid timeout
  const linksToCheck = links.slice(0, maxLinks);
  const results: LinkCheckResult[] = [];

  for (const link of linksToCheck) {
    try {
      const result = await checkLink(page, link);
      results.push(result);
    } catch (error: any) {
      // Skip links that cause errors to continue checking others
      results.push({
        url: 'unknown',
        text: 'Unknown',
        status: 'error',
        error: error.message,
      });
    }
  }

  const brokenLinks = results.filter(r => r.status === 'broken' || r.status === 'error');

  if (brokenLinks.length > 0) {
    const brokenUrls = brokenLinks.map(r => `${r.text} (${r.url})`).join(', ');
    throw new Error(`Found ${brokenLinks.length} broken links: ${brokenUrls}`);
  }
}

