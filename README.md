# Mini Checkout and Browser Test Suite

A single-page checkout with two synthetic products, plus a Playwright test suite that runs the customer journey in Chromium, Firefox and WebKit.

Built for the Fynd Hiring Hackathon (Nov 2026), SDET Intern track.

[![tests](https://github.com/nidhiii128/fynd_hacks_task/actions/workflows/tests.yml/badge.svg)](https://github.com/nidhiii128/fynd_hacks_task/actions/workflows/tests.yml)

| | |
|---|---|
| **Test plan** (risks, approach, test cases) | [docs/TEST_PLAN.md](docs/TEST_PLAN.md) |
| **Results** | [docs/TEST_RESULTS.md](docs/TEST_RESULTS.md) |
| **Defects found** | [docs/DEFECTS.md](docs/DEFECTS.md) |
| **Manual tests** (empty cart, double-click) | [docs/MANUAL_TESTS.md](docs/MANUAL_TESTS.md) |

## What the app does

- Two products with fixed prices: **Canvas Tote Bag ₹249.50** and **Steel Water Bottle ₹399.00**.
- Add, remove, increase, decrease or type a quantity (1–10). Line totals and the order total update as you go.
- One required field: **Full name**.
- **Place order** shows a confirmation with a reference like `ORD-7KQ2MZ4P`.
- Checkout is blocked, with a clear message, when the cart is empty, the name is blank (or only spaces), or a quantity is invalid. Whatever the customer entered is kept.
- Double-clicking or repeatedly submitting produces exactly **one** confirmation.

No backend, database or payments. An 800 ms delay simulates order processing so the double-click risk is real.

## Requirements

- Node.js 18 or newer (tested on 22.12.0)
- About 500 MB of disk for the Playwright browsers

## Run the app

```bash
npm install
npm start
```

Open <http://127.0.0.1:4173>.

## Run the tests

```bash
npx playwright install chromium firefox webkit   # first time only
npm test
```

`npm test` runs the unit tests and then the browser tests in all three browsers. Playwright starts and stops the app by itself, so `npm start` is not needed first.

Other useful commands:

| Command | What it does |
|---|---|
| `npm run test:unit` | Unit tests for the money and validation logic only (no browser) |
| `npm run test:e2e` | Browser tests only, all three browsers |
| `npx playwright test --project=chromium` | Browser tests in one browser |
| `npx playwright test -g "TC-03"` | One test by ID |
| `npm run test:headed` | Watch the tests run in a visible Chromium window |
| `npm run report` | Open the HTML report from the last run |

When a test fails, its screenshot, video and trace are saved in `test-results/`. Open a trace with `npx playwright show-trace <path-to-trace.zip>`.

Tests also run on every push through GitHub Actions ([.github/workflows/tests.yml](.github/workflows/tests.yml)), and the HTML report is uploaded as a build artifact.

## Project layout

```
app/
  index.html          page structure
  styles.css          plain styling
  js/cart.js          pure logic: prices, quantity parsing, totals, validation, references
  js/app.js           DOM rendering and event handling
scripts/serve.js      zero-dependency static server
tests/
  unit/cart.test.js   Node built-in test runner
  e2e/checkout-page.js     page object (locators in one place)
  e2e/checkout.spec.js     browser tests TC-01 … TC-16
docs/                 test plan, results, defects, manual tests, evidence
```

## Design decisions

- **Money is stored as integer paise.** `249.50 × 3` with floating-point numbers can produce values like `748.4999999`. All arithmetic uses whole paise, and only the display divides by 100.
- **Two layers of duplicate-order protection.** The button is disabled the moment it is clicked, *and* the code refuses to start a second order unless the checkout is idle. TC-11 proves the second layer works even when the button is bypassed.
- **Validation explains itself.** Errors are listed in an alert box and next to the field, the field is marked `aria-invalid`, and focus moves to the first problem.
- **The customer's name is rendered with `textContent`**, never as HTML, so a name like `<img onerror=…>` cannot run code (TC-14).
- **Logic is separated from the DOM** (`cart.js`), so the maths is unit-tested without a browser.
- **Tests assert what the customer sees.** Exact on-screen text such as `₹1,546.50`, located by role and label. No fixed waits: Playwright's fake clock skips the processing delay deterministically.

## Assumptions

- Prices are in Indian rupees and include everything. There is no tax, shipping or discount.
- A quantity of 0 is not allowed; customers use **Remove** instead. The maximum is 10 per item.
- Nothing is saved between page loads. A reload is a fresh checkout, by design.
- The order reference is generated in the browser and is unique enough for a demo, not guaranteed unique across customers.

## Known gaps

See section 7 of the [test plan](docs/TEST_PLAN.md#7-not-tested--known-gaps). In short: no real screen-reader or mobile testing, and there's no server-side idempotency because there is no server.

## Credits

- [Playwright](https://playwright.dev) (Apache-2.0) for browser automation.
- Everything else uses only the browser and Node.js standard libraries.
