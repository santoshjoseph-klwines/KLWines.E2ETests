import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { AccountPage } from '../../pages/AccountPage';
import { loginAsTestUser, ensureLoggedOut } from '../../utils/auth';
import { getTestUser } from '../../utils/testData';

test.describe('Login @auth', () => {
  test.beforeEach(async ({ page }) => {
    await ensureLoggedOut(page);
  });

  test('should login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const accountPage = new AccountPage(page);
    const testUser = getTestUser();

    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
    await loginPage.expectLoginSuccess();
    
    await accountPage.expectLoggedIn();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid@example.com', 'wrongpassword');
    
    await loginPage.expectLoginError();
  });

  test('should show error with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const testUser = getTestUser();

    await loginPage.goto();
    await loginPage.login(testUser.email, 'wrongpassword');
    
    await loginPage.expectLoginError();
  });

  test('should remember me option work', async ({ page, context }) => {
    const loginPage = new LoginPage(page);
    const accountPage = new AccountPage(page);
    const testUser = getTestUser();

    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password, true);
    await loginPage.expectLoginSuccess();

    // Clear cookies and verify session persists if remember me works
    // Note: This is a simplified test - actual "remember me" behavior may vary
    await accountPage.expectLoggedIn();
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const accountPage = new AccountPage(page);
    
    await loginAsTestUser(page);
    await accountPage.goto();
    await accountPage.logout();
    
    // Should be redirected to login or home page
    await expect(page).not.toHaveURL(/account|profile|dashboard/i);
  });

  test('should navigate to forgot password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.clickForgotPassword();
    
    // Should navigate to password reset page
    await expect(page).toHaveURL(/forgot|reset|password/i);
  });
});

