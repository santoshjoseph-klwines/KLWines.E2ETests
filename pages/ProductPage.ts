import { Page, Locator, expect } from '@playwright/test';
export class ProductPage {
  readonly page: Page;
  readonly name: Locator;
  readonly price: Locator;
  readonly addToCart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.name = page.locator('[data-testid="pdp-name"]');
    this.price = page.locator('[data-testid="pdp-price"]');
    this.addToCart = page.getByRole('button', { name: /add to cart/i });
  }

  async expectLoaded() {
    await expect(this.name).toBeVisible();
    await expect(this.price).toBeVisible();
  }

  async addItem() {
    await this.addToCart.click();
    await this.page.waitForLoadState('networkidle');
  }
}