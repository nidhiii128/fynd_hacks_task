# Defect log

Only real findings are listed. Each was observed in the running app, not invented to fill the brief.

## DEF-01: Quantity error and "—" total flash while the customer is still typing

| Field | Value |
|---|---|
| Status | **Fixed**, regression test TC-16 added |
| Severity | Low (cosmetic / UX; no wrong order could be placed) |
| Found by | Exploratory testing in Chromium while building |
| Environment | Windows 11, Chromium 159 (Playwright build), app at `http://127.0.0.1:4173` |

**Steps to reproduce (before the fix)**
1. Open the page and click **Add to cart** for Canvas Tote Bag.
2. Click in the quantity box (it shows `1`).
3. Press **Backspace** to clear it, intending to type `3`.

**Expected:** while the box is empty and still focused, no error is shown. The customer is mid-edit. An error should appear only if they leave the box empty or try to check out.

**Actual:** the red message *"Quantity must be a whole number from 1 to 10."* appeared immediately, the quantity box was marked invalid, and the line total showed `—`. Typing `3` cleared it, but the customer had been told they made a mistake when they had not.

**Evidence**
- Before the fix: [evidence/DEF-01-before-fix-error-while-typing.png](evidence/DEF-01-before-fix-error-while-typing.png)
- After the fix: [evidence/DEF-01-after-fix-no-error-while-typing.jpg](evidence/DEF-01-after-fix-no-error-while-typing.jpg)
- TC-16 was run against the pre-fix code and failed with `expect(locator).toBeHidden() … Received: visible`. It passes against the fixed code in all three browsers.

**Root cause:** the quantity box validated on every keystroke and treated "empty" the same as "invalid".

**Fix:** an empty box that still has focus is treated as "still typing". The error is shown on blur, or straight away if the customer tries to place the order (`app/js/app.js`, `renderCart`). The order total still shows `—` while the box is empty, because no correct total exists at that moment.

---

## Manual test findings

The rapid double-click and empty-cart manual tests are recorded in [MANUAL_TESTS.md](MANUAL_TESTS.md). Any defect found there gets an entry here, in the same format.
