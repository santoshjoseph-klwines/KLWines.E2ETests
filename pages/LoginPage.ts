import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    this.loginButton = page.getByRole('button', { name: /log in|sign in|login/i });
    this.rememberMeCheckbox = page.getByLabel(/remember me/i);
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.errorMessage = page.locator('[role="alert"]').or(page.locator('.error')).or(page.locator('.error-message'));
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string, rememberMe = false) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    await this.loginButton.click();
  }

  async expectLoginSuccess() {
    await expect(this.page).not.toHaveURL(/login/i);
    // Wait for navigation away from login page
    await this.page.waitForLoadState('networkidle');
  }

  async expectLoginError(message?: string) {
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    } else {
      await expect(this.errorMessage).toBeVisible();
    }
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }
}
