import { Page, Locator, expect } from '@playwright/test';
export class CartPage {
  readonly page: Page;
  readonly lineItems: Locator;
  readonly checkoutBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.lineItems = page.locator('[data-testid="cart-line-item"]');
    this.checkoutBtn = page.getByRole('button', { name: /checkout/i });
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async expectHasItems() {
    await expect(this.lineItems.first()).toBeVisible();
  }

  async startCheckout() {
    await this.checkoutBtn.click();
  }
}