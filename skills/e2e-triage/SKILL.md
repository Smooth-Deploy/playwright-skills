---
name: e2e-triage
description: Classify one failing Playwright test as real, app-intermittent, test-flaky or environment by rerunning it on the same build, then fix or quarantine only when the test itself is at fault. Use when a test failed in CI, when asked whether a failure is flaky, or before anyone touches product code because of a red test. A bug with no test yet goes to e2e-repro, and a whole suite goes to e2e-prune.
license: MIT
---

# e2e-triage

Input: one failing spec (file, test name, the failure output if there is one) and the environment file `.e2e/e2e-env.md` (base URL, accounts, reset, test hooks), called ENV below. No `.e2e/e2e-env.md` in the repo: run the `e2e-setup` skill first; it also checks that `playwright-cli` is installed. Output: a verdict, the evidence for it, and one action. Product code is never read or changed: a test made green by changing the app validates nothing.

Four verdicts, one each:

- **real**: fails every run on the same assertion, and that assertion is what a user sees. The app is wrong. The test stays as it is.
- **app-intermittent**: passes some runs, and the failing runs show the app misbehaving in a user-visible way (an error banner, "try again", a request that returns 500, a page that stays on the old state). The app is wrong some of the time. The test stays as it is: it caught something. This is the verdict teams miss when they file everything mixed under "flaky".
- **test-flaky**: passes some runs, and the failing runs show the test at fault: a sleep instead of a wait, a count or `textContent` read before the page is ready, a locator that matches two elements, an assertion on a toast. The test gets fixed or quarantined.
- **environment**: nothing to do with app or test: connection refused on the base URL, the app not up, DNS, a timeout on the very first navigation. Nothing changes; report what was unreachable.

## 1. Is the app up

`playwright-cli open <base url>`. Connection refused or no response: verdict **environment**, report, stop. Reached: `playwright-cli close`, continue.

## 2. Rerun on the same build

```bash
npx playwright test <file> --repeat-each 5 --retries 0 --reporter=line
```

If the Playwright config does not load `.env.e2e`, load it into the shell first (`set -a; . ./.env.e2e; set +a`); a run without the passwords fails at login and proves nothing. Same build, same environment, no code change in between. Write down the tally (passed/failed out of 5) and, for every failed run, the first `Error:` line and the assertion it points at. Retries hide the signal; they stay at 0.

## 3. Classify from the evidence

- 0 passed, same assertion every time: **real**.
- 5 passed: the CI failure is not reproducible here. Verdict **environment** unless the CI output names an assertion, then rerun 10 more times before deciding.
- Mixed: read the failing runs. Error text that comes from the page (alert, banner, status message, wrong value rendered by the app) is **app-intermittent**. Error text that comes from the test (`expect(received).toBe(expected)` after a `waitForTimeout`, strict mode violation, `toHaveCount` on a page not yet ready, a locator that resolved to 0 elements once) is **test-flaky**. When unsure, open the page live with `playwright-cli` and snapshot at the step that failed: what a user would see there decides.

For **real** and **app-intermittent**, write the bug: the assertion, expected and actual values, the rate (1 in 5), the steps. The test is not touched, not skipped, not retried.

## 4. test-flaky: fix, prove, or quarantine

Fix the test, never the app and never by waiting longer. The fixed test follows the `e2e-spec-rules` skill. The usual fixes:

- `waitForTimeout` becomes a web-first assertion on the thing being waited for: `await expect(page.getByRole("article")).toHaveCount(8)`, or the page's ready signal from ENV (`await expect(page.getByTestId("products-page")).toHaveAttribute("data-state", "ready")`).
- `const n = await locator.count(); expect(n).toBe(x)` becomes `await expect(locator).toHaveCount(x)`. Same for `textContent()`, `isVisible()`, `inputValue()`.
- A locator matching two elements gets scoped to its row, dialog or form, or uses the testid from ENV. Never `.first()`, `.nth()`, `.or()`.
- An assertion on a toast or spinner is replaced by one on the state the toast announced.

Prove it: `npx playwright test <file> --repeat-each 10 --retries 0`. 10 of 10 green is a fix. Anything less, or no visible cause: quarantine, so the suite tells the truth about it:

```ts
// quarantined <today's date>: failed 6/10 on the same build. Cause: count read after a fixed 1s sleep,
// page data arrives in 0.2-2s. Owner: <team or name from the file's history>.
test.fixme("the shop lists all 8 products", async ({ page }) => {
```

Quarantine shows as skipped in every report. Deleting the test, adding `retries`, or marking it `test.fail` hides it instead.

## Report

```
Verdict: test-flaky
Runs: 4 passed, 6 failed out of 10 on the same build
Evidence: Error: expect(received).toBe(expected) // cards 3, expected 8, after waitForTimeout(1000)
Action: replaced the sleep and count with await expect(page.getByRole("article")).toHaveCount(8); 10/10 green
```

The `Verdict:` line is always first and names exactly one of the four.
