# KLWines E2E Tests

End-to-end test suite for KLWines staging sites (beta.klwines.com and m-beta.klwines.com) using Playwright.

## Overview

This project contains automated E2E tests covering:
- Account creation and authentication
- User login/logout flows
- Site browsing (links, search, product pages)
- Checkout process (guest and logged-in users)
- Mobile and desktop experiences

## Prerequisites

- Node.js 20.x or higher
- npm or yarn

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install --with-deps
   ```

3. **Configure environment variables (optional):**
   Create a `.env` file in the root directory:
   ```env
   TEST_USER_EMAIL=your-test-email@example.com
   TEST_USER_PASSWORD=YourTestPassword123!
   TEST_USER_FIRST_NAME=Test
   TEST_USER_LAST_NAME=User
   TEST_PRODUCT_SKUS=12345,67890
   ENV=staging
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests by environment
```bash
npm run test:staging    # Run all tests on staging
npm run test:prod      # Run production-safe tests on prod
```

### Run tests by platform
```bash
npm run test:desktop   # Desktop Chrome only
npm run test:mobile    # Mobile Safari only
```

### Run tests by environment and platform
```bash
npm run test:desktop:staging
npm run test:mobile:staging
npm run test:desktop:prod
npm run test:mobile:prod
```

### Run a specific test file
```bash
npx playwright test tests/auth/login.spec.ts
```

### Run a specific test by name
```bash
npx playwright test --grep "should login with valid credentials"
```

### Run tests with tags
```bash
npx playwright test --grep @auth
npx playwright test --grep @checkout
npx playwright test --grep @smoke
```

### Debug mode (step through tests)
```bash
npx playwright test --debug
```

### Headed mode (see browser)
```bash
npx playwright test --headed
```

## Test Structure

```
tests/
├── auth/              # Authentication tests
│   ├── create-account.spec.ts
│   └── login.spec.ts
├── browsing/          # Browsing and navigation tests
│   ├── links.spec.ts
│   └── product-detail.spec.ts
├── checkout/          # Checkout flow tests
│   └── checkout-flow.spec.ts
└── smoke/             # Smoke tests
    ├── cart.spec.ts
    └── search.spec.ts
```

## Page Objects

The project uses the Page Object Model pattern:

```
pages/
├── AccountCreationPage.ts
├── AccountPage.ts
├── CartPage.ts
├── CheckoutPage.ts
├── HomePage.ts
├── LoginPage.ts
├── ProductPage.ts
└── SearchPage.ts
```

## Test Utilities

```
utils/
├── auth.ts          # Authentication helpers
├── links.ts         # Link validation utilities
└── testData.ts      # Test data and constants
```

## Configuration

### Playwright Config (`playwright.config.ts`)

- **Environments:**
  - `staging`: beta.klwines.com (desktop) / m-beta.klwines.com (mobile)
  - `prod`: www.klwines.com (desktop) / m.klwines.com (mobile)

- **Projects:**
  - `desktop-chrome`: Desktop Chrome browser
  - `mobile-safari`: Mobile Safari (iPhone 14)

- **Default timeout:** 60 seconds
- **Retries:** 2 retries in CI, 0 locally
- **Workers:** 2 workers in CI to limit parallel account creation

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENV` | Environment (staging/prod) | `staging` |
| `TEST_USER_EMAIL` | Test account email | `test@example.com` |
| `TEST_USER_PASSWORD` | Test account password | `TestPassword123!` |
| `TEST_USER_FIRST_NAME` | Test user first name | `Test` |
| `TEST_USER_LAST_NAME` | Test user last name | `User` |
| `TEST_PRODUCT_SKUS` | Comma-separated product SKUs | `12345` |

## Test Accounts

The staging database is recreated nightly from production, so it's safe to create test accounts throughout the day. Tests automatically generate unique email addresses for each run to avoid conflicts.

## Stripe Test Cards

The checkout tests use Stripe's official test card numbers:

- **Successful payment (Visa):** `4242424242424242`
- **Successful payment (Mastercard):** `5555555555554444`
- **Successful payment (Amex):** `378282246310005`
- **Declined card:** `4000000000000002`
- **Insufficient funds:** `4000000000009995`
- **Requires 3D Secure:** `4000002760003184`

Any future expiry date and any CVV (3 digits for Visa/MC, 4 for Amex) will work.

## Viewing Test Reports

After running tests, view the HTML report:
```bash
npm run report
```

## CI/CD

Tests run automatically in Azure Pipelines:
- Triggered on changes to test files, page objects, or configuration
- Runs in parallel for desktop and mobile browsers
- Publishes test results and artifacts
- Sends notifications on failures

See `azure-pipelines.yml` for configuration details.

## Troubleshooting

### Browsers not installed
```bash
npx playwright install --with-deps
```

### Tests failing due to timing
Increase timeout in `playwright.config.ts` or use `test.setTimeout()` in specific tests.

### Environment variables not working
Ensure you're using `cross-env` in npm scripts (already configured) or set variables directly:
- **PowerShell:** `$env:ENV="staging"; npx playwright test`
- **Bash:** `ENV=staging npx playwright test`

### Account creation conflicts
Tests automatically generate unique emails. If you still see conflicts, check that the staging database was recently refreshed.

## Best Practices

1. **Use Page Objects:** All page interactions should go through page objects
2. **Use Test Utilities:** Leverage helpers in `utils/` for common operations
3. **Tag Tests:** Use tags (@auth, @checkout, @smoke) to organize and filter tests
4. **Unique Test Data:** Tests generate unique accounts automatically
5. **Clean State:** Tests use `beforeEach` hooks to ensure clean state

## Contributing

When adding new tests:
1. Follow the existing Page Object Model pattern
2. Add appropriate test tags
3. Use test utilities for common operations
4. Generate unique test data for each run
5. Update this README if adding new test categories or utilities

