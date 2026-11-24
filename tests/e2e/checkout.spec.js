import { test, expect } from '@playwright/test';
import { CheckoutPage, TOTE, BOTTLE, REFERENCE_PATTERN, MESSAGES } from './checkout-page.js';

// Clean state: Playwright gives every test a brand-new browser context (no
// cookies, no storage, no shared page), and the app keeps nothing between
// loads. Each test below opens the page itself and depends on no other test.
//
// Expected values (prices, totals, messages) are written out by hand rather
// than imported from the app, so a bug in the app's own maths or wording
// cannot make the test agree with it.

let checkout;

test.beforeEach(async ({ page }) => {
  checkout = new CheckoutPage(page);
});

test.describe('Required checks', () => {
  test('TC-01 successful checkout shows exactly one confirmation with a reference', async () => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.add(BOTTLE.name);
    await expect(checkout.orderTotal).toHaveText('₹648.50');

    await checkout.nameInput.fill('Asha Verma');
    await checkout.placeOrder();

    await expect(checkout.confirmations).toHaveCount(1);
    const confirmation = checkout.confirmations.first();
    await expect(confirmation.getByRole('heading', { name: 'Order confirmed' })).toBeVisible();
    await expect(confirmation).toContainText('Thank you, Asha Verma.');
    await expect(checkout.orderReference).toHaveText(REFERENCE_PATTERN);
    await expect(confirmation).toContainText('1 × Canvas Tote Bag — ₹249.50');
    await expect(confirmation).toContainText('1 × Steel Water Bottle — ₹399.00');
    await expect(checkout.confirmationTotal).toHaveText('₹648.50');
    await expect(checkout.placeOrderButton).toHaveText('Order placed');
    await expect(checkout.placeOrderButton).toBeDisabled();
    await expect(checkout.formError).toBeHidden();
  });

  test('TC-02 blank name blocks checkout, explains why and keeps the cart', async () => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.increaseButton(TOTE.name).click();
    await expect(checkout.orderTotal).toHaveText('₹499.00');

    await checkout.placeOrder();

    await expect(checkout.formError).toBeVisible();
    await expect(checkout.formError).toContainText(MESSAGES.nameRequired);
    await expect(checkout.nameError).toHaveText(MESSAGES.nameRequired);
    await expect(checkout.nameInput).toHaveAttribute('aria-invalid', 'true');
    await expect(checkout.nameInput).toBeFocused();
    await expect(checkout.confirmations).toHaveCount(0);
    // What the customer entered is preserved.
    await expect(checkout.quantityInput(TOTE.name)).toHaveValue('2');
    await expect(checkout.orderTotal).toHaveText('₹499.00');
    await expect(checkout.placeOrderButton).toBeEnabled();

    // Fixing the field clears the message and checkout then succeeds.
    await checkout.nameInput.fill('Asha Verma');
    await expect(checkout.nameError).toBeHidden();
    await expect(checkout.formError).toBeHidden();
    await checkout.placeOrder();
    await expect(checkout.confirmations).toHaveCount(1);
    await expect(checkout.confirmationTotal).toHaveText('₹499.00');
  });

  test('TC-03 changing a quantity updates the line total and order total exactly', async () => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    await expect(checkout.lineTotal(TOTE.id)).toHaveText('₹249.50');
    await expect(checkout.orderTotal).toHaveText('₹249.50');

    // Typed quantity: 3 × 249.50 = 748.50
    await checkout.quantityInput(TOTE.name).fill('3');
    await expect(checkout.lineTotal(TOTE.id)).toHaveText('₹748.50');
    await expect(checkout.orderTotal).toHaveText('₹748.50');

    // Second product via the + button: 2 × 399.00 = 798.00; 748.50 + 798.00 = 1,546.50
    await checkout.add(BOTTLE.name);
    await checkout.increaseButton(BOTTLE.name).click();
    await expect(checkout.quantityInput(BOTTLE.name)).toHaveValue('2');
    await expect(checkout.lineTotal(BOTTLE.id)).toHaveText('₹798.00');
    await expect(checkout.orderTotal).toHaveText('₹1,546.50');

    // Decrease brings it back down: 2 × 249.50 = 499.00; 499.00 + 798.00 = 1,297.00
    await checkout.decreaseButton(TOTE.name).click();
    await expect(checkout.lineTotal(TOTE.id)).toHaveText('₹499.00');
    await expect(checkout.orderTotal).toHaveText('₹1,297.00');
  });
});

test.describe('Common mistakes', () => {
  test('TC-04 empty cart blocks checkout and keeps the name entered', async () => {
    await checkout.goto();
    await expect(checkout.emptyCartMessage).toBeVisible();
    await expect(checkout.orderTotal).toHaveText('₹0.00');

    await checkout.nameInput.fill('Asha Verma');
    await checkout.placeOrder();

    await expect(checkout.formError).toContainText(MESSAGES.emptyCart);
    await expect(checkout.nameError).toBeHidden();
    await expect(checkout.nameInput).toHaveValue('Asha Verma');
    await expect(checkout.confirmations).toHaveCount(0);
  });

  test('TC-05 empty cart and blank name report both problems at once', async () => {
    await checkout.goto();
    await checkout.placeOrder();
    await expect(checkout.formError).toContainText(MESSAGES.emptyCart);
    await expect(checkout.formError).toContainText(MESSAGES.nameRequired);
    await expect(checkout.confirmations).toHaveCount(0);
  });

  test('TC-06 a name of only spaces is treated as blank', async () => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.nameInput.fill('     ');
    await checkout.placeOrder();
    await expect(checkout.nameError).toHaveText(MESSAGES.nameRequired);
    await expect(checkout.confirmations).toHaveCount(0);
  });

  for (const bad of ['0', '-1', '2.5', 'abc', '11', '']) {
    test(`TC-07 quantity "${bad}" is rejected and blocks checkout`, async () => {
      await checkout.goto();
      await checkout.add(TOTE.name);
      await checkout.nameInput.fill('Asha Verma');

      await checkout.quantityInput(TOTE.name).fill(bad);
      await checkout.quantityInput(TOTE.name).blur(); // customer moves on
      await expect(checkout.page.getByTestId('qty-error-tote')).toHaveText(MESSAGES.invalidQuantity);
      await expect(checkout.lineTotal(TOTE.id)).toHaveText('—');
      await expect(checkout.orderTotal).toHaveText('—');

      await checkout.placeOrder();
      await expect(checkout.formError).toContainText(MESSAGES.invalidQuantity);
      await expect(checkout.quantityInput(TOTE.name)).toBeFocused();
      await expect(checkout.confirmations).toHaveCount(0);

      // Correcting it restores the totals.
      await checkout.quantityInput(TOTE.name).fill('4');
      await expect(checkout.orderTotal).toHaveText('₹998.00');
      await expect(checkout.formError).toBeHidden();
    });
  }

  test('TC-08 removing items updates the total and returns to the empty state', async () => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.add(BOTTLE.name);
    await expect(checkout.orderTotal).toHaveText('₹648.50');

    await checkout.removeButton(TOTE.name).click();
    await expect(checkout.cartRow(TOTE.id)).toHaveCount(0);
    await expect(checkout.orderTotal).toHaveText('₹399.00');

    await checkout.removeButton(BOTTLE.name).click();
    await expect(checkout.emptyCartMessage).toBeVisible();
    await expect(checkout.orderTotal).toHaveText('₹0.00');
  });

  test('TC-16 (regression DEF-01) clearing a quantity to retype it shows no error until the customer leaves the box', async ({ page }) => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    const qty = checkout.quantityInput(TOTE.name);
    const qtyError = page.getByTestId('qty-error-tote');

    await qty.click();
    await page.keyboard.press('End');
    await page.keyboard.press('Backspace'); // box is now empty, still focused
    await expect(qty).toHaveValue('');
    await expect(qtyError).toBeHidden();
    await expect(qty).toHaveAttribute('aria-invalid', 'false');

    await page.keyboard.type('3');
    await expect(checkout.orderTotal).toHaveText('₹748.50');
    await expect(qtyError).toBeHidden();

    // Leaving it empty is still an error once the customer moves on.
    await qty.fill('');
    await qty.blur();
    await expect(qtyError).toHaveText(MESSAGES.invalidQuantity);
  });

  test('TC-09 quantity is capped at 10', async () => {
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.quantityInput(TOTE.name).fill('10');
    await expect(checkout.increaseButton(TOTE.name)).toBeDisabled();
    await expect(checkout.addButton(TOTE.name)).toBeDisabled();
    await expect(checkout.orderTotal).toHaveText('₹2,495.00');
  });
});

test.describe('Duplicate orders', () => {
  // The app simulates 800 ms of order processing. Playwright's fake clock
  // lets us fast-forward through that window instead of sleeping, so the test
  // is both quick and deterministic: if a second order had been scheduled,
  // runFor() would fire it before we count confirmations.

  test('TC-10 double-clicking Place order produces one confirmation', async ({ page }) => {
    await page.clock.install();
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.nameInput.fill('Asha Verma');

    await checkout.placeOrderButton.dblclick();
    // Soft: report these but still go on to count confirmations, which is the
    // outcome the customer actually cares about.
    await expect.soft(checkout.placeOrderButton).toHaveText('Placing order…');
    await expect.soft(checkout.placeOrderButton).toBeDisabled();

    await page.clock.runFor(5000);
    await expect(checkout.confirmations).toHaveCount(1);
    await expect(checkout.orderReference).toHaveCount(1);
  });

  test('TC-11 repeated submits that bypass the disabled button still produce one order', async ({ page }) => {
    await page.clock.install();
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.nameInput.fill('Asha Verma');

    // Simulates a fast script, a stuck Enter key or a race the disabled
    // attribute cannot catch: five submits in the same JavaScript tick.
    await page.evaluate(() => {
      const form = document.getElementById('checkout-form');
      for (let i = 0; i < 5; i++) form.requestSubmit();
    });

    await page.clock.runFor(5000);
    await expect(checkout.confirmations).toHaveCount(1);
  });

  test('TC-12 the order reference does not change after confirmation', async ({ page }) => {
    await page.clock.install();
    await checkout.goto();
    await checkout.add(TOTE.name);
    await checkout.nameInput.fill('Asha Verma');
    await checkout.placeOrder();
    await page.clock.runFor(1000);

    const reference = await checkout.orderReference.textContent();
    await checkout.placeOrderButton.click({ force: true }); // clicks the disabled button anyway
    await page.keyboard.press('Enter');
    await page.clock.runFor(5000);

    await expect(checkout.confirmations).toHaveCount(1);
    await expect(checkout.orderReference).toHaveText(reference);
  });
});

test.describe('Other customer journeys', () => {
  test('TC-13 keyboard-only checkout works (Enter in the name field submits)', async ({ page }) => {
    await checkout.goto();
    await checkout.addButton(TOTE.name).focus();
    await page.keyboard.press('Enter');
    await expect(checkout.orderTotal).toHaveText('₹249.50');

    await checkout.nameInput.focus();
    await page.keyboard.type('Asha Verma');
    await page.keyboard.press('Enter');
    await expect(checkout.confirmations).toHaveCount(1);
  });

  test('TC-14 a name containing HTML is shown as text, not run as code', async ({ page }) => {
    let dialogOpened = false;
    page.on('dialog', async (d) => {
      dialogOpened = true;
      await d.dismiss();
    });
    await checkout.goto();
    await checkout.add(TOTE.name);
    const nasty = '<img src=x onerror=alert(1)>';
    await checkout.nameInput.fill(nasty);
    await checkout.placeOrder();

    await expect(checkout.confirmations.first()).toContainText(`Thank you, ${nasty}.`);
    await expect(checkout.confirmations.locator('img')).toHaveCount(0);
    expect(dialogOpened).toBe(false);
  });

  test('TC-15 "Start a new order" returns to a clean checkout', async () => {
    await checkout.goto();
    await checkout.add(BOTTLE.name);
    await checkout.nameInput.fill('Asha Verma');
    await checkout.placeOrder();
    await expect(checkout.confirmations).toHaveCount(1);

    await checkout.page.getByRole('button', { name: 'Start a new order' }).click();
    await expect(checkout.confirmations).toHaveCount(0);
    await expect(checkout.emptyCartMessage).toBeVisible();
    await expect(checkout.orderTotal).toHaveText('₹0.00');
    await expect(checkout.nameInput).toHaveValue('');
    await expect(checkout.placeOrderButton).toHaveText('Place order');
    await expect(checkout.placeOrderButton).toBeEnabled();
  });
});
