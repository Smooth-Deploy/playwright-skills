---
name: e2e-prune
description: Review a Playwright suite and propose which tests to drop and which steps to trim, with one reason per finding. Use when a suite has grown faster than anyone can read it, when asked which tests are noise, duplicates or theater, or before a maintenance pass. Proposes only; changes no test and no app file. One spec checked against its ticket goes to e2e-assess, and a test that fails goes to e2e-triage.
license: MIT
---

# e2e-prune

Input: a suite directory (`tests/`, `e2e/`) and the environment file `.e2e/e2e-env.md`, called ENV below. No `.e2e/e2e-env.md` in the repo: run the `e2e-setup` skill first. Output: a report that names every test to drop, every step to trim, and the reason. Nothing is edited: deletion is the team's call, the skill supplies the evidence.

A test earns its place by failing when the user-visible behaviour it names breaks. Everything else is cost: minutes per run, a line in every failure report, a thing to update when the page changes.

## Classes

Each dropped test gets exactly one class, the strongest that applies:

- **no-assert**: no `expect` on anything a user sees. `goto` then `waitFor`, `toHaveURL` alone, a page `toBeVisible`. It is green against an empty page. Catches nothing.
- **duplicate**: asserts the same user-visible outcome as another test, through the same flow. Different title, different locators, same facts checked. One copy stays: the one that asserts more (a subset is the copy to drop); on equal assertions, the shorter one with the more durable locators. Overlap alone is not duplication: two tests that share setup steps but check different outcomes both stay, since a suite is run in parts.
- **implementation-coupled**: asserts how the page is built, not what it shows. CSS classes, element ids, DOM structure (`div > span`), API response shape, request payloads, data attributes other than the test ids ENV names as stable. Breaks on a refactor that changes nothing for the user. Where it also checks a user outcome, the test may be worth rewriting instead of dropping; say so.
- **wrong-scope**: not an end-to-end check. Arithmetic on constants, a unit test of a helper, a pixel or CSS-value check, a test with no `page` interaction. Right thing, wrong layer.

**trim** is for tests that stay: steps that prove nothing the test is about. Title checks, a `reload` with no state to re-read, a detour to a page the test never asserts on, the same assertion repeated after an action that could not change it, a reset (per ENV) when nothing was changed. Name the step, keep the test.

## 1. Run the suite once

If the Playwright config does not load `.env.e2e`, load it into the shell first (`set -a; . ./.env.e2e; set +a`).

```bash
npx playwright test --reporter=line
```

A failing test gets reported as failing, not classified: triage comes first (the `e2e-triage` skill). Note runtime per test; a drop saves that time on every run.

## 2. Read every test

For each test write down: title, pages visited, outcomes asserted (what the user would see), locator style. Two tests with the same outcomes list are duplicate candidates; a test with an empty outcomes list is no-assert or wrong-scope; a test whose assertions name markup is coupled. Steps that add nothing to the outcomes list are trim candidates.

Reading the test is enough for the verdict. Open the page with `playwright-cli` only when a locator's meaning is unclear (does `.badge` carry the status the user reads, or decoration?).

## 3. Report

Summary line, then one line per finding, nothing else per finding:

```
Suite: 10 tests, 4 files, 14.2s. Proposed: drop 7, trim 1, keep 2.

- drop checkout page opens: no-assert: only toHaveURL after goto, green on an empty page
- drop shipping fee drops to zero once the cart passes $100: duplicate: same amounts on /cart as "socks alone pay $5.99 shipping..." (shipping.spec.ts:3), keep that one
- drop product grid renders eight cards with price tags: implementation-coupled: asserts article.card.product and span.price classes
- drop shipping and tax math: wrong-scope: arithmetic on constants, never opens a page
- trim guest cart survives sign-in and is gone after sign-out: toHaveTitle twice, reload on /, empty-cart check before anything is added: none bear on the merge
```

Title is the exact test title. Class is one of the four. Reason names the evidence from the test body. A keep needs no line.
