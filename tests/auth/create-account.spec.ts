import { test, expect } from '@playwright/test';
import { AccountCreationPage } from '../../pages/AccountCreationPage';
import { AccountPage } from '../../pages/AccountPage';
import { generateTestEmail, generateTestUser } from '../../utils/testData';
import { ensureLoggedOut } from '../../utils/auth';

test.describe('Account Creation @auth', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should create account with valid data', async ({ page }) => {
    const accountCreationPage = new AccountCreationPage(page);
    const accountPage = new AccountPage(page);
    // Generate a unique user for each test run
    const testUser = generateTestUser(`test-${Date.now()}`);

    await accountCreationPage.goto();
    await accountCreationPage.createAccount({
      email: testUser.email,
      password: testUser.password,
      firstName: testUser.firstName,
      lastName: testUser.lastName,
      acceptTerms: true,
    });

    await accountCreationPage.expectAccountCreated();
    await accountPage.expectLoggedIn();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    const accountCreationPage = new AccountCreationPage(page);

    await accountCreationPage.goto();
    await accountCreationPage.createAccount({
      email: 'invalid-email',
      password: 'TestPassword123!',
      acceptTerms: true,
    });

    await accountCreationPage.expectValidationErrors();
  });

  test('should show validation error for weak password', async ({ page }) => {
    const accountCreationPage = new AccountCreationPage(page);
    // Generate unique email for this test
    const uniqueEmail = generateTestEmail('weak-pwd-test');

    await accountCreationPage.goto();
    await accountCreationPage.createAccount({
      email: uniqueEmail,
      password: '123',
      acceptTerms: true,
    });

    await accountCreationPage.expectValidationErrors();
  });

  test('should show validation error for password mismatch', async ({ page }) => {
    const accountCreationPage = new AccountCreationPage(page);
    // Generate unique email for this test
    const uniqueEmail = generateTestEmail('pwd-mismatch-test');

    await accountCreationPage.goto();

    // Fill form manually to test password mismatch
    await accountCreationPage.emailInput.fill(uniqueEmail);
    await accountCreationPage.passwordInput.fill('TestPassword123!');
    if (await accountCreationPage.confirmPasswordInput.isVisible()) {
      await accountCreationPage.confirmPasswordInput.fill('DifferentPassword123!');
    }
    if (await accountCreationPage.acceptTermsCheckbox.isVisible()) {
      await accountCreationPage.acceptTermsCheckbox.check();
    }
    await accountCreationPage.createAccountButton.click();

    await accountCreationPage.expectValidationErrors();
  });

  test('should require terms acceptance', async ({ page }) => {
    const accountCreationPage = new AccountCreationPage(page);
    // Generate unique user for this test
    const testUser = generateTestUser(`terms-test-${Date.now()}`);

    await accountCreationPage.goto();

    await accountCreationPage.emailInput.fill(testUser.email);
    await accountCreationPage.passwordInput.fill(testUser.password);

    // Don't check terms checkbox
    await accountCreationPage.createAccountButton.click();

    // Should show error or prevent submission
    await accountCreationPage.expectValidationErrors();
  });
});

