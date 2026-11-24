# Test plan: Mini Checkout

## 1. Scope

**In scope:** the single-page checkout in `app/`. That covers adding and removing items, changing quantities, line and order totals, the required name field, validation messages, placing an order, the confirmation and its reference, and duplicate-order protection.

**Out of scope:** payments, a backend, stock levels, taxes, shipping, discounts, persistence across reloads, mobile layouts and screen-reader testing with real assistive technology. None of these exist in the brief or the app.

## 2. Risks, ranked

Priority = impact × likelihood. Money and duplicate orders come first, because those are where a real store loses revenue or customer trust.

| # | Risk | Impact | Likelihood | Priority | How it is covered |
|---|------|--------|-----------|----------|-------------------|
| R1 | Customer is charged twice / sees two confirmations after a double-click or repeated submit | High | Medium | **P1** | TC-10, TC-11, TC-12 (automated); manual double-click test M-02; mutation check (section 6) |
| R2 | Order total or line total is wrong (rounding, stale total after a change) | High | Medium | **P1** | TC-03, TC-08, TC-09, TC-01; unit tests on integer-paise maths |
| R3 | Order is placed with an empty cart or no name | High | Medium | **P1** | TC-02, TC-04, TC-05, TC-06; manual empty-cart test M-01 |
| R4 | Invalid quantity (0, negative, decimal, text, >10) is accepted or silently changed | Medium | High | **P2** | TC-07 (6 values), unit tests on `parseQuantity` |
| R5 | Customer loses what they typed after a validation error | Medium | Medium | **P2** | TC-02 (cart kept), TC-04 (name kept) |
| R6 | Validation message is unclear, missing, or not tied to the field | Medium | Medium | **P2** | TC-02, TC-04, TC-05, TC-07 assert exact message text, `aria-invalid` and focus |
| R7 | Customer name is rendered as HTML (script injection) | High | Low | **P2** | TC-14 |
| R8 | Confirmation shows wrong reference, items or total | High | Low | **P2** | TC-01 (reference format, items, total), TC-12 (reference never changes) |
| R9 | Behaviour differs between browsers | Medium | Low | **P3** | Whole suite runs on Chromium, Firefox and WebKit |
| R10 | Keyboard-only customer cannot check out | Medium | Low | **P3** | TC-13 |
| R11 | Error messages flash while the customer is mid-edit | Low | High | **P3** | TC-16 (regression for DEF-01) |

## 3. Approach

- **Automated browser tests** (Playwright, `tests/e2e/checkout.spec.js`) cover the customer journey end to end in three browsers.
- **Unit tests** (Node's built-in runner, `tests/unit/cart.test.js`) cover the pure money and validation logic, so maths bugs are caught in milliseconds and pinpointed.
- **Manual tests** cover the empty cart and the rapid double-click, as the brief asks, and are recorded with evidence in [MANUAL_TESTS.md](MANUAL_TESTS.md).
- **Exploratory testing** was done while building. Findings are logged in [DEFECTS.md](DEFECTS.md).

### Rules every automated test follows

1. **Clean state.** Each test gets a fresh browser context (no cookies or storage) and opens the page itself. No test depends on another, and tests run in parallel and in any order.
2. **Assert what the customer sees.** Totals are checked as the exact on-screen text (`₹1,546.50`), not as internal numbers. Locators use roles and labels (`getByRole`, `getByLabel`). `data-testid` is used only for values with no accessible name, such as totals.
3. **No fixed waits.** Playwright's auto-retrying `expect` waits for the UI. The 800 ms "order processing" delay is skipped with Playwright's fake clock (`page.clock.runFor`), which is both faster and deterministic.
4. **Independent expected values.** Prices, totals and messages are written out in the test, not imported from the app, so a bug in the app cannot make the test agree with it.
5. **No retries.** `retries: 0`, so a flaky test fails visibly instead of hiding.
6. **Evidence on failure.** Screenshot, video and trace are kept for any failing test.

## 4. Test cases

The three checks the brief requires are **TC-01, TC-02 and TC-03**.

| ID | Title | Risk | Type |
|----|-------|------|------|
| **TC-01** | Successful checkout shows exactly one confirmation with a reference | R1, R8 | Required |
| **TC-02** | Blank name blocks checkout, explains why and keeps the cart | R3, R5, R6 | Required |
| **TC-03** | Changing a quantity updates the line total and order total exactly | R2 | Required |
| TC-04 | Empty cart blocks checkout and keeps the name entered | R3, R5 | Extra |
| TC-05 | Empty cart and blank name report both problems at once | R3, R6 | Extra |
| TC-06 | A name of only spaces is treated as blank | R3 | Extra |
| TC-07 | Quantities `0`, `-1`, `2.5`, `abc`, `11` and empty are rejected and block checkout | R4 | Extra |
| TC-08 | Removing items updates the total and returns to the empty state | R2 | Extra |
| TC-09 | Quantity is capped at 10 | R2, R4 | Extra |
| TC-10 | Double-clicking Place order produces one confirmation | R1 | Extra |
| TC-11 | Five submits in the same tick (bypassing the disabled button) produce one order | R1 | Extra |
| TC-12 | Order reference does not change after confirmation | R1, R8 | Extra |
| TC-13 | Keyboard-only checkout works | R10 | Extra |
| TC-14 | A name containing HTML is shown as text, not run as code | R7 | Extra |
| TC-15 | "Start a new order" returns to a clean checkout | R5 | Extra |
| TC-16 | Regression for DEF-01: no error while the customer is retyping a quantity | R11 | Extra |

Test data: two synthetic products, **Canvas Tote Bag ₹249.50** (chosen on purpose because it has paise, which exposes rounding bugs) and **Steel Water Bottle ₹399.00**. The customer name is the fictional "Asha Verma".

## 5. Entry and exit criteria

- **Entry:** `npm install` and `npx playwright install` succeed, and the page loads at `http://127.0.0.1:4173`.
- **Exit:** all unit and browser tests pass in all three browsers, both manual tests are recorded with evidence, and every defect found is either fixed (with a regression test) or listed as open.

## 6. How we know the tests can fail

A test that can never fail proves nothing. The duplicate-order protection was deliberately broken to check that the tests catch it (the app was restored afterwards):

| Change made to the app | Result |
|---|---|
| Removed both "only one order" guards in the code, kept the disabled button | TC-11 failed: **5 confirmations** instead of 1 |
| Also stopped disabling the button | TC-10, TC-11 and TC-12 failed (2, 5 and 3 confirmations) |
| Put back the pre-fix code for DEF-01 | TC-16 failed: error visible while typing |

## 7. Not tested / known gaps

- Real screen readers (NVDA, VoiceOver). Only ARIA attributes and focus are asserted.
- Mobile viewports and touch input.
- Reloading or closing the tab while "Placing order…" is shown. With no backend, the order is simply lost; a real store would need a server-side idempotency key.
- Very long names. The field is limited to 80 characters by `maxlength`, but layout with long names was not checked.
- Locales other than `en-IN` currency formatting.
- Performance and load. Not meaningful without a backend.
