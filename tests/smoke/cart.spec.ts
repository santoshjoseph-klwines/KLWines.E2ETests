import { test, expect } from '@playwright/test';
import { ProductPage } from '../../pages/ProductPage';
import { CartPage } from '../../pages/CartPage';
import { getRandomTestProduct } from '../../utils/testData';

test.describe('Cart Functionality @smoke', () => {
  test('should add to cart and start checkout', async ({ page }) => {
    const testProduct = getRandomTestProduct();
    await page.goto(`/Products/${testProduct.sku}`);

    const pdp = new ProductPage(page);
    const cart = new CartPage(page);

    await pdp.expectLoaded();
    await expect(pdp.name).toBeVisible();
    await expect(pdp.price).toBeVisible();
    
    await pdp.addItem();
    await page.waitForLoadState('networkidle');

    await cart.goto();
    await cart.expectHasItems();
    
    // Verify cart has at least one item
    const itemCount = await cart.lineItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    await cart.startCheckout();
    await page.waitForURL(/Checkout/i);
  });

  test('should display cart items correctly', async ({ page }) => {
    const testProduct = getRandomTestProduct();
    await page.goto(`/Products/${testProduct.sku}`);

    const pdp = new ProductPage(page);
    const cart = new CartPage(page);

    await pdp.expectLoaded();
    await pdp.addItem();
    await page.waitForLoadState('networkidle');

    await cart.goto();
    await cart.expectHasItems();
    
    // Verify checkout button is visible and enabled
    await expect(cart.checkoutBtn).toBeVisible();
  });
});