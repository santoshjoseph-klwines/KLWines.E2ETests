import { Page, Locator, expect } from '@playwright/test';

export class AccountPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly logoutButton: Locator;
  readonly accountMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('text=/welcome|hello|hi/i');
    this.logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i }).or(page.getByRole('link', { name: /log out|sign out|logout/i }));
    this.accountMenu = page.locator('[data-testid="account-menu"]').or(page.locator('.account-menu'));
  }

  async goto() {
    // Try common account paths
    const paths = ['/account', '/my-account', '/profile', '/dashboard'];
    for (const path of paths) {
      try {
        await this.page.goto(path);
        await this.page.waitForLoadState('domcontentloaded');
        if (await this.logoutButton.or(this.welcomeMessage).isVisible({ timeout: 1000 })) {
          return;
        }
      } catch {
        continue;
      }
    }
    // Fallback to account if none work
    await this.page.goto('/account');
  }

  async expectLoggedIn(userName?: string) {
    if (userName) {
      await expect(this.page.locator(`text=/${userName}/i`)).toBeVisible();
    } else {
      // Check that we're not on login page and user-specific content is visible
      await expect(this.page).not.toHaveURL(/login/i);
      await expect(this.logoutButton.or(this.welcomeMessage)).toBeVisible();
    }
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSection(sectionName: string) {
    const sectionLink = this.page.getByRole('link', { name: new RegExp(sectionName, 'i') });
    await sectionLink.click();
  }
}
