# Mini Checkout and Browser Test Suite

Fynd Hiring Hackathon, Nov 2026 – SDET Intern track.

A one-page checkout with two products, and Playwright tests that cover the customer journey in Chromium, Firefox and WebKit.

[![tests](https://github.com/nidhiii128/fynd_hacks_task/actions/workflows/tests.yml/badge.svg)](https://github.com/nidhiii128/fynd_hacks_task/actions/workflows/tests.yml)
[![deploy](https://github.com/nidhiii128/fynd_hacks_task/actions/workflows/deploy.yml/badge.svg)](https://github.com/nidhiii128/fynd_hacks_task/actions/workflows/deploy.yml)

Live demo: https://nidhiii128.github.io/fynd_hacks_task/

Docs:
- [Test plan](docs/TEST_PLAN.md)
- [Test results](docs/TEST_RESULTS.md)
- [Manual tests](docs/MANUAL_TESTS.md)
- [Defects](docs/DEFECTS.md)

## The app

- Canvas Tote Bag (₹249.50) and Steel Water Bottle (₹399.00)
- Add, remove or change quantities (1 to 10); line totals and the order total update straight away
- Full name is required
- A successful order shows a confirmation with a reference like `ORD-7KQ2MZ4P`
- Checkout is blocked if the cart is empty, the name is blank, or a quantity is invalid. What the customer typed is kept.
- Clicking Place order more than once still gives one confirmation

There is no backend, as the brief allows. Placing an order waits 800 ms to stand in for a server call, so the double-click case can actually be tested.

## Running it

Needs Node.js 18+ (I used 22.12.0).

```bash
npm install
npm start            # http://127.0.0.1:4173
```

## Running the tests

```bash
npx playwright install chromium firefox webkit   # first time only
npm test
```

`npm test` runs the unit tests, then the browser tests in all three browsers. Playwright starts the app itself.

Other commands:

```bash
npm run test:unit                          # logic only, no browser
npx playwright test --project=chromium     # one browser
npx playwright test -g "TC-03"             # one test
npm run test:headed                        # watch it run
npm run report                             # HTML report of the last run
```

To run the tests against the live site instead of local, set `BASE_URL`:

```bash
BASE_URL=https://nidhiii128.github.io/fynd_hacks_task/ npx playwright test
```

Failed tests keep a screenshot, video and trace in `test-results/`.

GitHub Actions runs the tests on every push. Pushing to `main` also deploys the app to GitHub Pages and runs the tests again against the deployed site.

## Layout

```
app/                 the checkout (HTML, CSS, JS)
  js/cart.js         prices, totals, validation – no DOM, unit tested
  js/app.js          rendering and events
scripts/serve.js     small static server
tests/unit/          unit tests (node:test)
tests/e2e/           Playwright tests TC-01 to TC-16
docs/                test plan, results, manual tests, defects, evidence
```

## Notes on decisions

- Money is kept in paise (integers), so totals like 3 × ₹249.50 never pick up floating-point errors.
- Duplicate orders are blocked twice over: the button disables on click, and `placeOrder()` ignores calls unless the checkout is idle. TC-11 checks the second guard on its own.
- Tests check the text the customer sees (e.g. `₹1,546.50`) and find elements by label or role. There are no fixed waits; the 800 ms delay is skipped with Playwright's fake clock.
- The name is inserted with `textContent`, so HTML in it is shown as text (TC-14).

## Assumptions and gaps

- Prices are final: no tax, shipping or discounts.
- Quantity 0 isn't allowed; Remove is used instead. Max is 10.
- Nothing persists across reloads.
- Not tested: screen readers, mobile layouts. With no server there's no server-side duplicate protection; a real store would need an idempotency key on the order request.

## Credits

Uses [Playwright](https://playwright.dev) for browser testing. Everything else is plain browser and Node.js APIs.
