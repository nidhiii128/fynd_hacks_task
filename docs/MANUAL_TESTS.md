# Manual test record

| | |
|---|---|
| Tester | Nidhi Bhawari |
| Date | 24 Nov 2026 |
| OS | Windows 11 |
| Browser | Google Chrome (desktop) |
| App | local build, `npm start` at http://127.0.0.1:4173 (same code as commit `a2715db`) |

Each test started from a freshly reloaded page.

---

## M-01: Place order with an empty cart

| Step | Action | Expected | Actual |
|---|---|---|---|
| 1 | Reload, add nothing | "Your cart is empty.", total ₹0.00 | As expected |
| 2 | Click Place order, name empty | Both errors listed, no confirmation | Error box listed "Your cart is empty. Add at least one item to place an order." and "Please enter your full name." Name field outlined red with the message under it. No confirmation. |
| 3 | Type a name, click Place order | Only the cart error remains, name kept | Only the empty-cart error remained. "Nidhi" stayed in the name field. No confirmation. |
| 4 | Add Canvas Tote Bag | Error box clears | Error box cleared |
| 5 | Click Place order | One confirmation with a reference | "Order confirmed", reference `ORD-W775R9R8`, 1 × Canvas Tote Bag ₹249.50, total ₹249.50. Button changed to "Order placed" and was disabled. |

**Result:** Pass

**Evidence:**
- Step 2: [M-01-step2-empty-cart-and-blank-name.png](evidence/M-01-step2-empty-cart-and-blank-name.png)
- Step 3: [M-01-step3-name-kept-cart-still-empty.png](evidence/M-01-step3-name-kept-cart-still-empty.png)
- Step 5: [M-01-step5-order-confirmed.png](evidence/M-01-step5-order-confirmed.png)

---

## M-02: Rapid double-click on Place order

**Steps:** reload, add Steel Water Bottle, enter a name, then click Place order rapidly several times.

**Expected:** the button switches to "Placing order…" and disables straight away; exactly one confirmation appears; the reference does not change; further clicks do nothing.

**Actual:** exactly one "Order confirmed" box appeared, reference `ORD-XYGJWP7H`, 1 × Steel Water Bottle ₹399.00, total ₹399.00. No second confirmation below it. The button showed "Order placed" and was disabled.

**Result:** Pass

**Evidence:** [M-02-after-rapid-clicks-one-confirmation.png](evidence/M-02-after-rapid-clicks-one-confirmation.png)

The screenshot shows the end state. The timing itself (two clicks landing inside the 800 ms processing window) is covered by automated tests TC-10 and TC-11, which use Playwright's fake clock to make that window deterministic.

---

## Notes

- No defects found in these manual runs.
- The one defect found during exploratory testing (DEF-01, quantity error shown while retyping) is in [DEFECTS.md](DEFECTS.md).
