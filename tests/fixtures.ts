import { test as base } from '@playwright/test';
import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AccountPage } from '../pages/AccountPage';
import { loginAsTestUser, getTestUser } from '../utils/auth';

type AuthenticatedPage = {
  authenticatedPage: Page;
  loginPage: LoginPage;
  accountPage: AccountPage;
};

/**
 * Custom fixture for authenticated pages
 */
export const test = base.extend<AuthenticatedPage>({
  authenticatedPage: async ({ page }, use) => {
    await loginAsTestUser(page);
    await use(page);
  },
  
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  
  accountPage: async ({ page }, use) => {
    const accountPage = new AccountPage(page);
    await use(accountPage);
  },
});

export { expect } from '@playwright/test';

