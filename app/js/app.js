import {
  PRODUCTS,
  MIN_QTY,
  MAX_QTY,
  MESSAGES,
  findProduct,
  parseQuantity,
  lineTotalPaise,
  orderTotalPaise,
  formatINR,
  validateCheckout,
  generateReference,
} from './cart.js';

// Simulated order-processing time. There is no backend; the delay exists so
// a double-click has a real window in which a second order could slip in.
const PROCESSING_MS = 800;

const $ = (id) => document.getElementById(id);
const els = {
  productList: $('product-list'),
  emptyCart: $('empty-cart'),
  cartTable: $('cart-table'),
  cartRows: $('cart-rows'),
  orderTotal: $('order-total'),
  form: $('checkout-form'),
  formError: $('form-error'),
  name: $('name'),
  nameError: $('name-error'),
  placeOrder: $('place-order'),
  confirmations: $('confirmations'),
  rowTemplate: $('cart-row-template'),
};

function freshState() {
  return {
    cart: {}, // productId -> last valid quantity, insertion ordered
    drafts: {}, // productId -> raw text in the quantity box
    status: 'idle', // 'idle' | 'placing' | 'placed'
    showErrors: false, // becomes true after the first failed attempt
    reference: null,
  };
}

let state = freshState();
const rowEls = new Map(); // productId -> <tr>

// ---------- derived values ----------

function invalidQtyIds() {
  return Object.keys(state.cart).filter((id) => parseQuantity(state.drafts[id]) === null);
}

function currentErrors() {
  return validateCheckout({ cart: state.cart, name: els.name.value, invalidQtyIds: invalidQtyIds() });
}

// ---------- actions ----------

function addToCart(id) {
  if (state.status !== 'idle') return;
  const next = Math.min((state.cart[id] ?? 0) + 1, MAX_QTY);
  setQuantity(id, next);
}

function setQuantity(id, qty) {
  state.cart[id] = qty;
  state.drafts[id] = String(qty);
  render();
}

function onQuantityTyped(id, raw) {
  state.drafts[id] = raw;
  const qty = parseQuantity(raw);
  if (qty !== null) state.cart[id] = qty;
  render();
}

function removeFromCart(id) {
  if (state.status !== 'idle') return;
  delete state.cart[id];
  delete state.drafts[id];
  render();
}

function placeOrder() {
  // Guard 1: only an idle checkout can start an order. Together with the
  // disabled button this makes repeated clicks / submits a no-op.
  if (state.status !== 'idle') return;

  const errors = currentErrors();
  if (errors.length > 0) {
    state.showErrors = true;
    render();
    focusField(errors[0].field);
    return;
  }

  state.status = 'placing';
  state.showErrors = false;
  render();

  setTimeout(() => {
    // Guard 2: never confirm twice, even if something above changes.
    if (state.status !== 'placing') return;
    state.reference = generateReference(crypto.getRandomValues(new Uint8Array(8)));
    state.status = 'placed';
    render();
    renderConfirmation(els.name.value.trim());
  }, PROCESSING_MS);
}

function startNewOrder() {
  state = freshState();
  els.name.value = '';
  els.confirmations.replaceChildren();
  render();
  els.productList.querySelector('button')?.focus();
}

function focusField(field) {
  if (field === 'name') els.name.focus();
  else if (field.startsWith('qty-')) rowEls.get(field.slice(4))?.querySelector('.qty-input').focus();
  else els.productList.querySelector('button')?.focus();
}

// ---------- rendering ----------

function renderProducts() {
  for (const p of PRODUCTS) {
    const li = document.createElement('li');
    li.dataset.testid = `product-${p.id}`;
    const name = document.createElement('span');
    name.textContent = p.name;
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = formatINR(p.pricePaise);
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = 'Add to cart';
    add.setAttribute('aria-label', `Add ${p.name} to cart`);
    add.dataset.productId = p.id;
    add.addEventListener('click', () => addToCart(p.id));
    li.append(name, price, add);
    els.productList.append(li);
  }
}

function createRow(product) {
  const row = els.rowTemplate.content.firstElementChild.cloneNode(true);
  const { id, name } = product;
  row.dataset.testid = `cart-row-${id}`;
  row.querySelector('.item-name').textContent = name;
  row.querySelector('.unit-price').textContent = formatINR(product.pricePaise);

  const input = row.querySelector('.qty-input');
  input.setAttribute('aria-label', `Quantity for ${name}`);
  input.id = `qty-${id}`;
  input.addEventListener('input', () => onQuantityTyped(id, input.value));
  input.addEventListener('blur', () => render());

  const err = row.querySelector('.qty-error');
  err.id = `qty-error-${id}`;
  err.dataset.testid = `qty-error-${id}`;
  input.setAttribute('aria-describedby', err.id);

  const dec = row.querySelector('.qty-dec');
  dec.setAttribute('aria-label', `Decrease quantity of ${name}`);
  dec.addEventListener('click', () => setQuantity(id, Math.max(state.cart[id] - 1, MIN_QTY)));

  const inc = row.querySelector('.qty-inc');
  inc.setAttribute('aria-label', `Increase quantity of ${name}`);
  inc.addEventListener('click', () => setQuantity(id, Math.min(state.cart[id] + 1, MAX_QTY)));

  row.querySelector('.line-total').dataset.testid = `line-total-${id}`;

  const remove = row.querySelector('.remove');
  remove.setAttribute('aria-label', `Remove ${name}`);
  remove.addEventListener('click', () => removeFromCart(id));
  return row;
}

function renderCart(locked) {
  const ids = Object.keys(state.cart);

  for (const [id, row] of rowEls) {
    if (!(id in state.cart)) {
      row.remove();
      rowEls.delete(id);
    }
  }

  for (const id of ids) {
    const product = findProduct(id);
    let row = rowEls.get(id);
    if (!row) {
      row = createRow(product);
      rowEls.set(id, row);
      els.cartRows.append(row);
    }
    const draft = state.drafts[id];
    const qty = parseQuantity(draft);
    const input = row.querySelector('.qty-input');
    if (input.value !== draft) input.value = draft; // never clobber what is being typed
    input.disabled = locked;
    // DEF-01 fix: a box the customer has just cleared and is still typing in
    // is not an error yet. It becomes one on blur or on a checkout attempt.
    const stillTyping = draft.trim() === '' && document.activeElement === input && !state.showErrors;
    const showQtyError = qty === null && !stillTyping;
    input.setAttribute('aria-invalid', String(showQtyError));

    const err = row.querySelector('.qty-error');
    err.hidden = !showQtyError;
    err.textContent = showQtyError ? MESSAGES.invalidQuantity : '';

    row.querySelector('.qty-dec').disabled = locked || qty === null || qty <= MIN_QTY;
    row.querySelector('.qty-inc').disabled = locked || qty === null || qty >= MAX_QTY;
    row.querySelector('.remove').disabled = locked;
    row.querySelector('.line-total').textContent =
      qty === null ? '—' : formatINR(lineTotalPaise(product.pricePaise, qty));
  }

  els.emptyCart.hidden = ids.length > 0;
  els.cartTable.hidden = ids.length === 0;
  // A total that includes an invalid quantity would be a lie, so show a dash.
  els.orderTotal.textContent = invalidQtyIds().length > 0 ? '—' : formatINR(orderTotalPaise(state.cart));

  for (const btn of els.productList.querySelectorAll('button')) {
    btn.disabled = locked || (state.cart[btn.dataset.productId] ?? 0) >= MAX_QTY;
  }
}

function renderErrors() {
  const errors = state.showErrors ? currentErrors() : [];
  if (errors.length === 0) {
    els.formError.hidden = true;
    els.formError.replaceChildren();
  } else {
    const intro = document.createElement('p');
    intro.textContent = 'We could not place your order:';
    intro.style.margin = '0';
    const list = document.createElement('ul');
    for (const e of errors) {
      const li = document.createElement('li');
      li.textContent = e.message;
      list.append(li);
    }
    els.formError.replaceChildren(intro, list);
    els.formError.hidden = false;
  }

  const nameError = errors.find((e) => e.field === 'name');
  els.nameError.hidden = !nameError;
  els.nameError.textContent = nameError ? nameError.message : '';
  els.name.setAttribute('aria-invalid', String(Boolean(nameError)));
}

function render() {
  const locked = state.status !== 'idle';
  renderCart(locked);
  renderErrors();
  els.name.disabled = locked;
  els.placeOrder.disabled = locked;
  els.placeOrder.textContent =
    state.status === 'placing' ? 'Placing order…' : state.status === 'placed' ? 'Order placed' : 'Place order';
}

function renderConfirmation(customerName) {
  const box = document.createElement('article');
  box.className = 'confirmation';
  box.dataset.testid = 'confirmation';
  box.setAttribute('role', 'status');

  const h = document.createElement('h2');
  h.textContent = 'Order confirmed';
  h.tabIndex = -1;

  const thanks = document.createElement('p');
  thanks.textContent = `Thank you, ${customerName}. Your order has been placed.`; // textContent: never HTML

  const ref = document.createElement('p');
  ref.append('Order reference: ');
  const code = document.createElement('span');
  code.className = 'reference';
  code.dataset.testid = 'order-reference';
  code.textContent = state.reference;
  ref.append(code);

  const items = document.createElement('ul');
  for (const [id, qty] of Object.entries(state.cart)) {
    const p = findProduct(id);
    const li = document.createElement('li');
    li.textContent = `${qty} × ${p.name} — ${formatINR(lineTotalPaise(p.pricePaise, qty))}`;
    items.append(li);
  }

  const total = document.createElement('p');
  total.append('Order total: ');
  const strong = document.createElement('strong');
  strong.dataset.testid = 'confirmation-total';
  strong.textContent = formatINR(orderTotalPaise(state.cart));
  total.append(strong);

  const again = document.createElement('button');
  again.type = 'button';
  again.textContent = 'Start a new order';
  again.addEventListener('click', startNewOrder);

  box.append(h, thanks, ref, items, total, again);
  els.confirmations.append(box);
  h.focus();
}

// ---------- wiring ----------

els.form.addEventListener('submit', (event) => {
  event.preventDefault();
  placeOrder();
});
els.name.addEventListener('input', () => {
  if (state.showErrors) renderErrors();
});

renderProducts();
render();
