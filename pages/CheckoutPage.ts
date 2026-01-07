import { Page, Locator, expect } from '@playwright/test';

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  phone?: string;
}

export interface PaymentInfo {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName?: string;
  billingAddressSameAsShipping?: boolean;
}

export class CheckoutPage {
  readonly page: Page;
  readonly shippingSection: Locator;
  readonly paymentSection: Locator;
  readonly reviewSection: Locator;
  readonly continueButton: Locator;
  readonly placeOrderButton: Locator;
  readonly orderConfirmation: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shippingSection = page.locator('[data-testid="shipping"]').or(page.locator('text=/shipping/i'));
    this.paymentSection = page.locator('[data-testid="payment"]').or(page.locator('text=/payment/i'));
    this.reviewSection = page.locator('[data-testid="review"]').or(page.locator('text=/review|order summary/i'));
    this.continueButton = page.getByRole('button', { name: /continue|next/i });
    this.placeOrderButton = page.getByRole('button', { name: /place order|complete order|submit order/i });
    this.orderConfirmation = page.locator('text=/order confirmed|thank you|order number/i');
  }

  async goto() {
    await this.page.goto('/checkout');
  }

  async fillShippingInfo(info: ShippingInfo) {
    await this.page.getByLabel(/first name/i).fill(info.firstName);
    await this.page.getByLabel(/last name/i).fill(info.lastName);
    await this.page.getByLabel(/address|street/i).first().fill(info.address1);
    
    if (info.address2) {
      const address2Field = this.page.getByLabel(/address 2|apartment|suite/i);
      if (await address2Field.isVisible({ timeout: 1000 })) {
        await address2Field.fill(info.address2);
      }
    }

    await this.page.getByLabel(/city/i).fill(info.city);
    
    const stateField = this.page.getByLabel(/state/i);
    if (await stateField.isVisible({ timeout: 1000 })) {
      await stateField.selectOption(info.state);
    } else {
      // Try as text input
      await this.page.getByPlaceholder(/state/i).fill(info.state);
    }
    
    await this.page.getByLabel(/zip|postal/i).fill(info.zipCode);

    if (info.country) {
      const countryField = this.page.getByLabel(/country/i);
      if (await countryField.isVisible({ timeout: 1000 })) {
        await countryField.selectOption(info.country);
      }
    }

    if (info.phone) {
      const phoneField = this.page.getByLabel(/phone/i);
      if (await phoneField.isVisible({ timeout: 1000 })) {
        await phoneField.fill(info.phone);
      }
    }
  }

  async selectShippingMethod(method: string) {
    const methodOption = this.page.getByLabel(new RegExp(method, 'i'));
    await methodOption.check();
  }

  async fillPaymentInfo(info: PaymentInfo) {
    await this.page.getByLabel(/card number|credit card/i).fill(info.cardNumber);
    
    const expiryField = this.page.getByLabel(/expir|exp date/i);
    if (await expiryField.isVisible()) {
      await expiryField.fill(`${info.expiryMonth}${info.expiryYear}`);
    } else {
      const monthField = this.page.getByLabel(/month/i);
      const yearField = this.page.getByLabel(/year/i);
      if (await monthField.isVisible()) {
        await monthField.selectOption(info.expiryMonth);
        await yearField.selectOption(info.expiryYear);
      }
    }

    await this.page.getByLabel(/cvv|cvc|security code/i).fill(info.cvv);

    if (info.cardholderName) {
      const nameField = this.page.getByLabel(/cardholder|name on card/i);
      if (await nameField.isVisible({ timeout: 1000 })) {
        await nameField.fill(info.cardholderName);
      }
    }

    if (info.billingAddressSameAsShipping === false) {
      const checkbox = this.page.getByLabel(/billing.*same|use.*shipping/i);
      if (await checkbox.isVisible({ timeout: 1000 })) {
        await checkbox.uncheck();
        // Fill billing address if needed
      }
    }
  }

  async continueToNextStep() {
    await this.continueButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async reviewOrder() {
    // Verify order summary is visible
    await expect(this.reviewSection).toBeVisible();
  }

  async placeOrder() {
    await this.placeOrderButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectOrderConfirmation() {
    await expect(this.orderConfirmation).toBeVisible({ timeout: 10000 });
  }

  async getOrderNumber(): Promise<string | null> {
    const orderNumberElement = this.page.locator('text=/order.*#?[0-9]+/i');
    if (await orderNumberElement.isVisible()) {
      const text = await orderNumberElement.textContent();
      const match = text?.match(/#?([0-9]+)/);
      return match ? match[1] : null;
    }
    return null;
  }
}

