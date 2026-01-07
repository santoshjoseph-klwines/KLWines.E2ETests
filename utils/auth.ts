import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AccountCreationPage } from '../pages/AccountCreationPage';
import { AccountPage } from '../pages/AccountPage';
import { getTestUser, generateTestUser } from './testData';
import type { TestUser } from './testData';

/**
 * Login as a test user
 */
export async function loginAsTestUser(page: Page, user?: TestUser): Promise<void> {
  const testUser = user || getTestUser();
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
  await loginPage.expectLoginSuccess();
}

/**
 * Create a test account
 */
export async function createTestAccount(page: Page, user?: TestUser): Promise<TestUser> {
  const testUser = user || generateTestUser();
  const accountCreationPage = new AccountCreationPage(page);
  
  await accountCreationPage.goto();
  await accountCreationPage.createAccount({
    email: testUser.email,
    password: testUser.password,
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    acceptTerms: true,
  });
  await accountCreationPage.expectAccountCreated();
  
  return testUser;
}

/**
 * Logout from the current session
 */
export async function logout(page: Page): Promise<void> {
  const accountPage = new AccountPage(page);
  
  // Try to find logout button on current page
  if (await accountPage.logoutButton.isVisible({ timeout: 2000 })) {
    await accountPage.logout();
  } else {
    // Navigate to account page first
    await accountPage.goto();
    await accountPage.logout();
  }
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const accountPage = new AccountPage(page);
  try {
    await accountPage.expectLoggedIn();
    return true;
  } catch {
    return false;
  }
}

/**
 * Ensure user is logged out (logout if currently logged in)
 */
export async function ensureLoggedOut(page: Page): Promise<void> {
  if (await isLoggedIn(page)) {
    await logout(page);
  }
}

