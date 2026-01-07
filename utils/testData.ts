/**
 * Test data utilities and constants
 */

export interface TestUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface TestProduct {
  sku: string;
  name?: string;
}

// Counter for ensuring uniqueness even in parallel test execution
let emailCounter = 0;

/**
 * Get test account credentials from environment variables
 */
export function getTestUser(): TestUser {
  const email = process.env.TEST_USER_EMAIL || 'test@example.com';
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!';
  const firstName = process.env.TEST_USER_FIRST_NAME || 'Test';
  const lastName = process.env.TEST_USER_LAST_NAME || 'User';

  return {
    email,
    password,
    firstName,
    lastName,
  };
}

/**
 * Generate a unique test email address
 * Uses timestamp, random number, counter, and worker ID for maximum uniqueness
 */
export function generateTestEmail(prefix = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000); // Increased range
  const counter = ++emailCounter;
  // Use process ID or worker ID if available (for parallel execution)
  const workerId = process.env.TEST_PARALLEL_INDEX || process.pid || Math.floor(Math.random() * 1000);
  
  return `${prefix}-${timestamp}-${workerId}-${counter}-${random}@test.klwines.com`;
}

/**
 * Generate test user data
 */
export function generateTestUser(prefix = 'test'): TestUser {
  return {
    email: generateTestEmail(prefix),
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  };
}

/**
 * Get test product SKUs from environment or use defaults
 */
export function getTestProducts(): TestProduct[] {
  const productSkus = process.env.TEST_PRODUCT_SKUS?.split(',') || ['12345'];
  return productSkus.map(sku => ({ sku: sku.trim() }));
}

/**
 * Get a random test product
 */
export function getRandomTestProduct(): TestProduct {
  const products = getTestProducts();
  return products[Math.floor(Math.random() * products.length)];
}

/**
 * Test shipping addresses
 */
export const TEST_SHIPPING_ADDRESSES = {
  california: {
    firstName: 'Test',
    lastName: 'User',
    address1: '123 Test Street',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    phone: '4155551234',
  },
  newYork: {
    firstName: 'Test',
    lastName: 'User',
    address1: '456 Test Avenue',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phone: '2125551234',
  },
};

/**
 * Stripe test payment information
 * These are Stripe's official test card numbers for different scenarios
 * See: https://stripe.com/docs/testing
 */
export const TEST_PAYMENT_INFO = {
  // Successful payment - Visa
  validVisa: {
    cardNumber: '4242424242424242',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    cardholderName: 'Test User',
  },
  // Successful payment - Mastercard
  validMastercard: {
    cardNumber: '5555555555554444',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    cardholderName: 'Test User',
  },
  // Successful payment - American Express
  validAmex: {
    cardNumber: '378282246310005',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '1234',
    cardholderName: 'Test User',
  },
  // Declined card - generic decline
  declinedCard: {
    cardNumber: '4000000000000002',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    cardholderName: 'Test User',
  },
  // Insufficient funds
  insufficientFunds: {
    cardNumber: '4000000000009995',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    cardholderName: 'Test User',
  },
  // Requires authentication (3D Secure)
  requiresAuthentication: {
    cardNumber: '4000002760003184',
    expiryMonth: '12',
    expiryYear: '2025',
    cvv: '123',
    cardholderName: 'Test User',
  },
};

