---
name: e2e-repro
description: Turn a bug report into one Playwright E2E test that is red on the bug and green once it is fixed, before anyone touches the code. Use when asked to reproduce a bug, write a regression test for a bug report, or confirm a reported bug is real. Reproduces live in a browser with playwright-cli first. A feature ticket with no bug goes to e2e-plan, and a test that already exists and fails goes to e2e-triage.
license: MIT
---

# e2e-repro

Input: a bug report (any text) and the environment file `.e2e/e2e-env.md` (base URL, accounts, login steps, reset), called ENV below. ENV names a variable for each password; the values are in `.env.e2e`, which is not committed. No `.e2e/e2e-env.md` in the repo: run the `e2e-setup` skill first. Output: one spec file with one test asserting what the reporter expected, red right now. Or, when the bug does not show up live, a "could not reproduce" report and no spec. The test never asserts the broken behaviour: green on the bug would be a test of the bug.

The product code stays unread and untouched. The test is the diagnosis; the fix is someone else's.

## 1. Expected and actual

Read the report. Write two lines, both user-visible, both checkable with a Playwright assertion:

- **expected**: what the reporter should have seen ("the cart page still lists Trail Running Socks after signing in").
- **actual**: what they saw ("the cart page is empty").

Vague report with no way to pick the page or the record: ask one precise question and stop.

## 2. Reproduce live

`playwright-cli` is installed (a prerequisite that `e2e-setup` checks) and the app is already up at the base URL. The first command is `open`; a connection error on `open` is reported as the app being down. The base URL, the login steps and the account come from ENV, never from memory or a guess.

Each line is one `playwright-cli` command:

```
open <base url><login path>
snapshot              # refs like e12
fill e12 "<account email from ENV>"
click e15
snapshot              # does this show the actual line? that is the bug
generate-locator e20
```

Follow the reporter's steps on the seeded records from ENV (the seeded key, the listed products), logging in through the UI. Loop: act, snapshot, write down the user-facing locator (`getByRole`, `getByLabel`, `getByText`; `getByTestId` only when nothing user-facing is unique). After the last step, `reload` and snapshot again: the state after reload is the server's truth and the stronger assertion.

Bug seen in the snapshot: step 3. Bug not seen: try the nearest variant once (another seeded record, a reload, the direct request with `run-code`), then stop. Report "could not reproduce", list the exact steps and what each snapshot showed, write no spec. A guess at a test that passes is worth less than that list.

Done when: a snapshot shows the actual line, and every step to it has a proven locator.

## 3. Write the test

One file, one `test`, named after the expected line. Header comment: the report title, the expected line, the actual line. Load the `e2e-spec-rules` skill and follow every rule in it. On top of those rules:

- The test is the reporter's steps, then the assertion of the expected line.
- Exact values matter most here: `toHaveText("$0.00")`, `toHaveURL("/checkout")`, `toHaveCount(1)`, since `toContainText` and `toBeVisible` on generic text let the bug slip past. Assert after the reload from step 2 when the report is about state that should persist.
- Assertions: the expected line, plus stable preconditions (the seeded row count before the step).

## 4. Run until red for the right reason

Run `npx playwright test <file>`. If the Playwright config does not load `.env.e2e`, load it into the shell first (`set -a; . ./.env.e2e; set +a`). Three outcomes:

- Fails on the expected-line assertion, and the failure message shows the actual value from step 1: done. Report the file, the assertion, and the actual value.
- Fails anywhere else (locator matches 0 or 2+, wrong wait, login): the spec is wrong. Fix it from a fresh live snapshot, never with `.first()` or a try/catch.
- Green: the test did not capture the bug. Back to step 2; the assertion or the steps missed what the reporter did.

Close the browser: `playwright-cli close`.
