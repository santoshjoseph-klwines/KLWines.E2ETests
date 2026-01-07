import { Page, Locator } from '@playwright/test';
export class HomePage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly searchButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.getByPlaceholder('Search wines');
    this.searchButton = page.getByRole('button', { name: /search/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.searchButton.click();
  }
}