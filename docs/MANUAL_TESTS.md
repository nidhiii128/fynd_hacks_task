# Manual test record

> **TO FILL IN:** run each test yourself in a real browser, replace every `_TODO_`, and save screenshots or a screen recording in `docs/evidence/`. Delete this note when done.

Start the app with `npm start`, then open <http://127.0.0.1:4173>. Reload the page before each test so it starts clean.

| Field | Value |
|---|---|
| Tester | _TODO_ |
| Date | _TODO_ |
| OS | _TODO_ (e.g. Windows 11) |
| Browsers | _TODO_ (e.g. Chrome 1xx, Edge 1xx, Firefox 1xx) |
| App version | git commit `_TODO_` |

---

## M-01: Place order with an empty cart

| Step | Action | Expected |
|---|---|---|
| 1 | Reload the page. Do not add anything. | "Your cart is empty." is shown. Order total is `₹0.00`. |
| 2 | Click **Place order** with the name empty. | Red box: "We could not place your order:", listing *"Your cart is empty. Add at least one item to place an order."* and *"Please enter your full name."* No confirmation. |
| 3 | Type a name, click **Place order** again. | Only the empty-cart message remains. The name is still in the box. No confirmation. |
| 4 | Add one item. | The red box disappears without another click. |
| 5 | Click **Place order**. | One confirmation with an `ORD-XXXXXXXX` reference. |

**Actual result:** _TODO: what you saw, step by step_

**Pass / Fail:** _TODO_

**Evidence:** _TODO: e.g. `evidence/M-01-empty-cart.png`_

---

## M-02: Rapid double-click on Place order

Try each variation, reloading the page in between.

| Variation | How | Expected |
|---|---|---|
| a | Add an item, enter a name, **double-click** Place order. | Button changes to "Placing order…" and greys out, then **one** confirmation. |
| b | Same, but click **5+ times as fast as you can**. | One confirmation. |
| c | Same, but put the cursor in the name box and **press Enter 5+ times quickly**. | One confirmation. |
| d | After the confirmation appears, try clicking Place order again. | The button says "Order placed" and does nothing. The reference does not change. |

**Actual result:**
- a: _TODO_
- b: _TODO_
- c: _TODO_
- d: _TODO_

**Pass / Fail:** _TODO_

**Evidence:** _TODO: a short screen recording is best, e.g. `evidence/M-02-double-click.mp4` (Windows: Win+Alt+R with Xbox Game Bar, or Win+Shift+S then Record)_

---

## Exploratory notes

_TODO: anything else you tried and what happened. If something behaved wrongly, log it in [DEFECTS.md](DEFECTS.md) with steps, expected, actual and evidence._
