// Page object: one place that knows how to find things on the checkout page.
// Locators prefer what a customer perceives (roles, labels, visible text);
// data-testid is used only for values with no natural accessible name.

export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByLabel('Full name');
    this.placeOrderButton = page.getByTestId('place-order');
    this.orderTotal = page.getByTestId('order-total');
    this.formError = page.getByTestId('form-error');
    this.nameError = page.getByTestId('name-error');
    this.emptyCartMessage = page.getByTestId('empty-cart');
    this.confirmations = page.getByTestId('confirmation');
    this.orderReference = page.getByTestId('order-reference');
    this.confirmationTotal = page.getByTestId('confirmation-total');
  }

  async goto() {
    await this.page.goto('/');
    await this.page.getByRole('heading', { name: 'Mini Checkout' }).waitFor();
  }

  addButton(productName) {
    return this.page.getByRole('button', { name: `Add ${productName} to cart` });
  }

  quantityInput(productName) {
    return this.page.getByRole('textbox', { name: `Quantity for ${productName}` });
  }

  increaseButton(productName) {
    return this.page.getByRole('button', { name: `Increase quantity of ${productName}` });
  }

  decreaseButton(productName) {
    return this.page.getByRole('button', { name: `Decrease quantity of ${productName}` });
  }

  removeButton(productName) {
    return this.page.getByRole('button', { name: `Remove ${productName}` });
  }

  lineTotal(productId) {
    return this.page.getByTestId(`line-total-${productId}`);
  }

  cartRow(productId) {
    return this.page.getByTestId(`cart-row-${productId}`);
  }

  async add(productName) {
    await this.addButton(productName).click();
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}

export const TOTE = { id: 'tote', name: 'Canvas Tote Bag' }; // ₹249.50
export const BOTTLE = { id: 'bottle', name: 'Steel Water Bottle' }; // ₹399.00
export const REFERENCE_PATTERN = /^ORD-[A-HJ-NP-Z2-9]{8}$/;
export const MESSAGES = {
  emptyCart: 'Your cart is empty. Add at least one item to place an order.',
  nameRequired: 'Please enter your full name.',
  invalidQuantity: 'Quantity must be a whole number from 1 to 10.',
};
