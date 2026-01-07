import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const ENV = process.env.ENV || 'staging';
const baseURLs: Record<string, string> = {
  staging: 'https://beta.klwines.com',
  prod: 'https://www.klwines.com'
};

const mobileBaseURLs: Record<string, string> = {
  staging: 'https://m-beta.klwines.com',
  prod: 'https://m.klwines.com'
};

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['list']],
  workers: process.env.CI ? 2 : undefined, // Limit workers in CI to avoid too many parallel account creations
  use: {
    baseURL: baseURLs[ENV],
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
        browserName: 'webkit',
        baseURL: mobileBaseURLs[ENV]
      }
    }
  ]
});