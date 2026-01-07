import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { CartPage } from '../../pages/CartPage';
import { ProductPage } from '../../pages/ProductPage';
import { loginAsTestUser, ensureLoggedOut } from '../../utils/auth';
import { TEST_SHIPPING_ADDRESSES, TEST_PAYMENT_INFO, getRandomTestProduct } from '../../utils/testData';

test.describe('Checkout Flow @checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start with a clean state
    await ensureLoggedOut(page);
  });

  test('should complete guest checkout flow', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const testProduct = getRandomTestProduct();

    // Add product to cart
    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.expectLoaded();
    await productPage.addItem();

    // Go to cart
    await cartPage.goto();
    await cartPage.expectHasItems();
    await cartPage.startCheckout();

    // Fill shipping information
    await checkoutPage.fillShippingInfo(TEST_SHIPPING_ADDRESSES.california);
    await checkoutPage.continueToNextStep();

    // Fill payment information using Stripe test card
    await checkoutPage.fillPaymentInfo(TEST_PAYMENT_INFO.validVisa);
    await checkoutPage.continueToNextStep();

    // Review and place order
    await checkoutPage.reviewOrder();
    await checkoutPage.placeOrder();

    // Verify order confirmation
    await checkoutPage.expectOrderConfirmation();
  });

  test('should complete checkout as logged-in user', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const testProduct = getRandomTestProduct();

    // Login first
    await loginAsTestUser(page);

    // Add product to cart
    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.expectLoaded();
    await productPage.addItem();

    // Go to cart and checkout
    await cartPage.goto();
    await cartPage.expectHasItems();
    await cartPage.startCheckout();

    // Fill shipping (may be pre-filled for logged-in users)
    await checkoutPage.fillShippingInfo(TEST_SHIPPING_ADDRESSES.california);
    await checkoutPage.continueToNextStep();

    // Fill payment
    await checkoutPage.fillPaymentInfo(TEST_PAYMENT_INFO.validVisa);
    await checkoutPage.continueToNextStep();

    // Review and place order
    await checkoutPage.reviewOrder();
    await checkoutPage.placeOrder();

    // Verify order confirmation
    await checkoutPage.expectOrderConfirmation();
    const orderNumber = await checkoutPage.getOrderNumber();
    expect(orderNumber).toBeTruthy();
  });

  test('should validate shipping information', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const testProduct = getRandomTestProduct();

    // Add product and go to checkout
    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.addItem();
    await cartPage.goto();
    await cartPage.startCheckout();

    // Try to continue without filling shipping info
    await checkoutPage.continueButton.click();

    // Should show validation errors
    await expect(checkoutPage.shippingSection).toBeVisible();
  });

  test('should validate payment information', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const testProduct = getRandomTestProduct();

    // Add product and go to checkout
    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.addItem();
    await cartPage.goto();
    await cartPage.startCheckout();

    // Fill shipping and continue
    await checkoutPage.fillShippingInfo(TEST_SHIPPING_ADDRESSES.california);
    await checkoutPage.continueToNextStep();

    // Try to continue without payment info
    await checkoutPage.continueButton.click();

    // Should show validation errors
    await expect(checkoutPage.paymentSection).toBeVisible();
  });

  test('should show order summary in review step', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const testProduct = getRandomTestProduct();

    // Add product and go to checkout
    await page.goto(`/Products/${testProduct.sku}`);
    await productPage.addItem();
    await cartPage.goto();
    await cartPage.startCheckout();

    // Complete shipping and payment
    await checkoutPage.fillShippingInfo(TEST_SHIPPING_ADDRESSES.california);
    await checkoutPage.continueToNextStep();
    await checkoutPage.fillPaymentInfo(TEST_PAYMENT_INFO.validVisa);
    await checkoutPage.continueToNextStep();

    // Verify review section shows order details
    await checkoutPage.reviewOrder();
    await expect(checkoutPage.reviewSection).toBeVisible();
  });
});

