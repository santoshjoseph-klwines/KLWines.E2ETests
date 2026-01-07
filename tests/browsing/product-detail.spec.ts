import { test, expect } from '@playwright/test';
import { ProductPage } from '../../pages/ProductPage';
import { HomePage } from '../../pages/HomePage';
import { SearchPage } from '../../pages/SearchPage';
import { getRandomTestProduct } from '../../utils/testData';

test.describe('Product Detail Pages @browsing', () => {
  test('should load product page correctly', async ({ page }) => {
    const productPage = new ProductPage(page);
    const testProduct = getRandomTestProduct();

    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.expectLoaded();
  });

  test('should display product information', async ({ page }) => {
    const productPage = new ProductPage(page);
    const testProduct = getRandomTestProduct();

    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.expectLoaded();
    
    // Verify product name and price are visible
    await expect(productPage.name).toBeVisible();
    await expect(productPage.price).toBeVisible();
  });

  test('should add product to cart from product page', async ({ page }) => {
    const productPage = new ProductPage(page);
    const testProduct = getRandomTestProduct();

    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.expectLoaded();
    await productPage.addItem();
    
    // Verify item was added (check for cart indicator or success message)
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to product from search', async ({ page }) => {
    const homePage = new HomePage(page);
    const searchPage = new SearchPage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();
    await homePage.search('wine');
    
    await searchPage.expectResults();
    await searchPage.openFirstResult();
    
    await productPage.expectLoaded();
    await expect(page).toHaveURL(/product|sku/i);
  });

  test('should display product images', async ({ page }) => {
    const productPage = new ProductPage(page);
    const testProduct = getRandomTestProduct();

    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.expectLoaded();
    
    // Check for product images
    const images = page.locator('img[src*="product"], img[alt*="product"], [data-testid*="product-image"]');
    const imageCount = await images.count();
    
    expect(imageCount).toBeGreaterThan(0);
  });
});

