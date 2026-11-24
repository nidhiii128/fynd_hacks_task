# Test results

## Environment

| Item | Version |
|---|---|
| OS | Windows 11 |
| Node.js | 22.12.0 |
| Playwright | 1.65.1 |
| Chromium | 159.0.8154.6 (Playwright build) |
| Firefox | 159.0 (Playwright build) |
| WebKit | 27.2 (Playwright build) |

## Summary

| Suite | Command | Result |
|---|---|---|
| Unit tests (money and validation logic) | `npm run test:unit` | **6 / 6 passed** |
| Browser tests, 21 tests × 3 browsers | `npm run test:e2e` | **63 / 63 passed** in ~42 s |
| Flakiness check, every browser test run 3 times | `npx playwright test --repeat-each=3` | **189 / 189 passed**, 0 flaky |

## Required checks

| Check from the brief | Test | Chromium | Firefox | WebKit |
|---|---|---|---|---|
| Successful checkout produces a confirmation | TC-01 | ✅ | ✅ | ✅ |
| Missing field blocks checkout | TC-02 | ✅ | ✅ | ✅ |
| Quantity change updates the exact total | TC-03 | ✅ | ✅ | ✅ |

The extra tests TC-04 to TC-16 also pass in all three browsers. See [TEST_PLAN.md](TEST_PLAN.md) for what each one covers.

## Checking that the tests can fail

| Deliberate break in the app | Tests that caught it |
|---|---|
| Removed the code guards against a second order | TC-11 (5 confirmations instead of 1) |
| Removed the guards and the disabled button | TC-10, TC-11, TC-12 |
| Restored the pre-fix DEF-01 behaviour | TC-16 |

All breaks were reverted, and the full suite passes on the final code.

## Defects

| ID | Summary | Severity | Status |
|---|---|---|---|
| DEF-01 | Quantity error flashes while the customer is still typing | Low | Fixed, regression test TC-16 |

Details and evidence: [DEFECTS.md](DEFECTS.md). Manual test results: [MANUAL_TESTS.md](MANUAL_TESTS.md).

## Reproducing these results

```bash
npm install
npx playwright install chromium firefox webkit
npm test                 # unit + browser tests
npm run report           # opens the HTML report with per-step details
```
