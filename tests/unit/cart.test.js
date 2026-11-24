// Unit tests for the pure checkout logic (run with: npm run test:unit).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseQuantity,
  orderTotalPaise,
  formatINR,
  validateCheckout,
  generateReference,
  REFERENCE_PATTERN,
  MESSAGES,
} from '../../app/js/cart.js';

test('parseQuantity accepts whole numbers 1-10 only', () => {
  for (const ok of ['1', '5', '10', ' 3 ']) assert.ok(parseQuantity(ok) !== null, ok);
  for (const bad of ['0', '11', '-1', '2.5', '1e1', 'abc', '', ' ', null, undefined, '0x5']) {
    assert.equal(parseQuantity(bad), null, String(bad));
  }
});

test('totals are exact integer paise, no float drift', () => {
  assert.equal(orderTotalPaise({}), 0);
  assert.equal(orderTotalPaise({ tote: 1 }), 24950);
  assert.equal(orderTotalPaise({ tote: 3, bottle: 2 }), 154650);
  // 10 × 249.50 + 10 × 399.00 = 6,485.00
  assert.equal(orderTotalPaise({ tote: 10, bottle: 10 }), 648500);
});

test('unknown product ids are ignored in totals', () => {
  assert.equal(orderTotalPaise({ ghost: 5, tote: 1 }), 24950);
});

test('formatINR uses Indian grouping and two decimals', () => {
  assert.equal(formatINR(0), '₹0.00');
  assert.equal(formatINR(24950), '₹249.50');
  assert.equal(formatINR(154650), '₹1,546.50');
  assert.equal(formatINR(10000000), '₹1,00,000.00');
});

test('validateCheckout reports every blocking problem', () => {
  assert.deepEqual(validateCheckout({ cart: { tote: 1 }, name: 'Asha' }), []);
  const both = validateCheckout({ cart: {}, name: '   ' }).map((e) => e.message);
  assert.deepEqual(both, [MESSAGES.emptyCart, MESSAGES.nameRequired]);
  const qty = validateCheckout({ cart: { tote: 1 }, name: 'Asha', invalidQtyIds: ['tote'] });
  assert.equal(qty[0].field, 'qty-tote');
});

test('generateReference matches the published format', () => {
  const bytes = new Uint8Array([0, 31, 32, 63, 100, 200, 255, 7]);
  const ref = generateReference(bytes);
  assert.match(ref, REFERENCE_PATTERN);
  assert.equal(ref, generateReference(bytes)); // deterministic for the same bytes
});
