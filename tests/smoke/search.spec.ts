import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { SearchPage } from '../../pages/SearchPage';
import { ProductPage } from '../../pages/ProductPage';

test.describe('Search flow @smoke @prod-safe', () => {
  test('user can search and open a product', async ({ page }) => {
    const home = new HomePage(page);
    const search = new SearchPage(page);
    const pdp = new ProductPage(page);

    await home.goto();
    await home.search('Cabernet Sauvignon');

    await search.expectResults();
    const resultCount = await search.resultCards.count();
    expect(resultCount).toBeGreaterThan(0);
    
    await search.openFirstResult();

    await pdp.expectLoaded();
    await expect(page).toHaveURL(/product|sku/i);
    await expect(pdp.name).toBeVisible();
  });

  test('should display search results', async ({ page }) => {
    const home = new HomePage(page);
    const search = new SearchPage(page);

    await home.goto();
    await home.search('wine');

    await search.expectResults();
    const resultCount = await search.resultCards.count();
    expect(resultCount).toBeGreaterThan(0);
  });

  test('should handle empty search results', async ({ page }) => {
    const home = new HomePage(page);
    const search = new SearchPage(page);

    await home.goto();
    await home.search('nonexistentproductxyz123');

    // Should either show no results message or empty state
    await page.waitForLoadState('networkidle');
    const hasResults = await search.resultCards.count() > 0;
    const hasNoResultsMessage = await page.locator('text=/no results|not found|no products/i').isVisible();
    
    expect(hasResults || hasNoResultsMessage).toBeTruthy();
  });
});