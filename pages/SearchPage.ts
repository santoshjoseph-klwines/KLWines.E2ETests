import { Page, Locator, expect } from '@playwright/test';
export class SearchPage {
  readonly page: Page;
  readonly resultCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resultCards = page.locator('[data-testid="search-result-card"]');
  }

  async expectResults() {
    await expect(this.resultCards.first()).toBeVisible();
  }

  async openFirstResult() {
    await this.resultCards.first().click();
  }
}