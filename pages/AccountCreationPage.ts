import { Page, Locator, expect } from '@playwright/test';

export interface AccountCreationData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms?: boolean;
}

export class AccountCreationPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly phoneInput: Locator;
  readonly acceptTermsCheckbox: Locator;
  readonly createAccountButton: Locator;
  readonly errorMessages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/password/i).or(page.locator('input[type="password"]'));
    this.confirmPasswordInput = page.getByLabel(/confirm password|re-enter password/i).or(page.locator('input[name*="confirm"][type="password"]'));
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.phoneInput = page.getByLabel(/phone/i);
    this.acceptTermsCheckbox = page.getByLabel(/accept|agree|terms/i);
    this.createAccountButton = page.getByRole('button', { name: /create account|sign up|register/i });
    this.errorMessages = page.locator('[role="alert"]').or(page.locator('.error')).or(page.locator('.error-message'));
  }

  async goto() {
    // Try common registration paths
    const paths = ['/register', '/signup', '/create-account', '/account/create'];
    for (const path of paths) {
      try {
        await this.page.goto(path);
        await this.page.waitForLoadState('domcontentloaded');
        if (await this.emailInput.isVisible({ timeout: 1000 })) {
          return;
        }
      } catch {
        continue;
      }
    }
    // Fallback to register if none work
    await this.page.goto('/register');
  }

  async createAccount(data: AccountCreationData) {
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    
    if (data.confirmPassword) {
      if (await this.confirmPasswordInput.isVisible({ timeout: 1000 })) {
        await this.confirmPasswordInput.fill(data.confirmPassword);
      }
    } else if (await this.confirmPasswordInput.isVisible({ timeout: 1000 })) {
      await this.confirmPasswordInput.fill(data.password);
    }

    if (data.firstName && await this.firstNameInput.isVisible({ timeout: 1000 })) {
      await this.firstNameInput.fill(data.firstName);
    }

    if (data.lastName && await this.lastNameInput.isVisible({ timeout: 1000 })) {
      await this.lastNameInput.fill(data.lastName);
    }

    if (data.phone && await this.phoneInput.isVisible({ timeout: 1000 })) {
      await this.phoneInput.fill(data.phone);
    }

    if (data.acceptTerms !== false && await this.acceptTermsCheckbox.isVisible({ timeout: 1000 })) {
      await this.acceptTermsCheckbox.check();
    }

    await this.createAccountButton.click();
  }

  async expectAccountCreated() {
    // Wait for navigation away from registration page
    await this.page.waitForLoadState('networkidle');
    await expect(this.page).not.toHaveURL(/register|signup|create-account/i);
  }

  async expectValidationErrors() {
    await expect(this.errorMessages.first()).toBeVisible();
  }

  async expectFieldError(fieldName: string) {
    const field = this.page.getByLabel(new RegExp(fieldName, 'i'));
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  }
}
