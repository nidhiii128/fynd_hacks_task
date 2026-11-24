// Pure checkout logic: no DOM access, so it can be unit-tested in Node.
// All money is held as integer paise (1 rupee = 100 paise) to avoid
// floating-point rounding errors such as 0.1 + 0.2 = 0.30000000000000004.

export const PRODUCTS = Object.freeze([
  Object.freeze({ id: 'tote', name: 'Canvas Tote Bag', pricePaise: 24950 }), // ₹249.50
  Object.freeze({ id: 'bottle', name: 'Steel Water Bottle', pricePaise: 39900 }), // ₹399.00
]);

export const MIN_QTY = 1;
export const MAX_QTY = 10;

export function findProduct(id, products = PRODUCTS) {
  return products.find((p) => p.id === id) ?? null;
}

/**
 * Turns raw user input into a valid quantity, or null when it is not a
 * whole number between MIN_QTY and MAX_QTY. "2.5", "-1", "1e1", "" and
 * "abc" are all rejected rather than silently coerced.
 */
export function parseQuantity(raw) {
  const text = String(raw ?? '').trim();
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  return n >= MIN_QTY && n <= MAX_QTY ? n : null;
}

export function lineTotalPaise(pricePaise, qty) {
  return pricePaise * qty;
}

/** cart is a plain object: { productId: quantity } */
export function orderTotalPaise(cart, products = PRODUCTS) {
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = findProduct(id, products);
    return product ? sum + lineTotalPaise(product.pricePaise, qty) : sum;
  }, 0);
}

export function itemCount(cart) {
  return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(paise) {
  // Dividing only for display; arithmetic above stays in integers.
  return inr.format(paise / 100);
}

export const MESSAGES = Object.freeze({
  emptyCart: 'Your cart is empty. Add at least one item to place an order.',
  nameRequired: 'Please enter your full name.',
  invalidQuantity: `Quantity must be a whole number from ${MIN_QTY} to ${MAX_QTY}.`,
});

/**
 * Returns a list of { field, message } problems that block checkout.
 * An empty list means the order can be placed.
 */
export function validateCheckout({ cart, name, invalidQtyIds = [] }) {
  const errors = [];
  if (itemCount(cart) === 0) {
    errors.push({ field: 'cart', message: MESSAGES.emptyCart });
  }
  if (invalidQtyIds.length > 0) {
    errors.push({ field: `qty-${invalidQtyIds[0]}`, message: MESSAGES.invalidQuantity });
  }
  if (String(name ?? '').trim() === '') {
    errors.push({ field: 'name', message: MESSAGES.nameRequired });
  }
  return errors;
}

// No 0/O or 1/I so a reference read over the phone is unambiguous.
const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** randomBytes: a Uint8Array of at least 8 random bytes. */
export function generateReference(randomBytes) {
  let ref = 'ORD-';
  for (let i = 0; i < 8; i++) {
    ref += REF_ALPHABET[randomBytes[i] % REF_ALPHABET.length];
  }
  return ref;
}

export const REFERENCE_PATTERN = /^ORD-[A-HJ-NP-Z2-9]{8}$/;
