---
name: e2e-plan
description: Turn a ticket or user story into a Playwright E2E spec that a user would trust. Use when asked to write, add or generate end-to-end tests for a feature, fix or ticket. Walks every step live in a browser with playwright-cli before writing it. A bug report goes to e2e-repro, and a spec that already exists and fails goes to e2e-triage.
license: MIT
---

# e2e-plan

Input: a ticket (any text) and the environment file `.e2e/e2e-env.md` (base URL, accounts, login steps, reset), called ENV below. ENV names a variable for each password; the values are in `.env.e2e`, which is not committed. Output: one spec file in which every line was proven in a live browser.

No `.e2e/e2e-env.md` in the repo: run the `e2e-setup` skill first. It writes that file and checks that `playwright-cli` is installed.

A spec earns trust by two properties: **red on regression** (it fails when the feature breaks) and **green on clean** (it never fails for any other reason). Every step below serves one of the two.

## 1. Done lines, before touching the app

Read the ticket. Write 2 to 5 **done lines**: outcomes a user sees on screen when the ticket is done. Example: "Signed in as owner, the owner's team row shows no Remove action". Not: "DELETE returns 403".

A ticket that names a rule ("X must not be possible", "only admins can Y") yields two done lines: the UI hides the action, **and** the rule holds when the action is attempted anyway (direct request, stale page, second tab). The second line is where real regressions hide.

A ticket that names a number (a threshold, a price, a count) yields two done lines: one at the number and one just below it, each with the exact values the user sees, computed from the prices ENV lists. Example: a $100.00 subtotal shows $0.00 shipping, a $99.00 subtotal shows $5.99. A rule tested only far from its edge is not tested.

A ticket that removes, revokes or deletes one thing yields a done line about one neighbour that must survive: a sibling row, key or member the user still sees after the action and after a reload, named by its own text (another member's Remove button is still there; the "Deploy key" row still reads active). Proving one thing is gone says nothing about the rest.

A ticket that says "nothing changes" or "stays the same" after an error yields a done line about the **server's** state: what the page shows after a reload. The page in front of the user still holds the client's copy; the server may already have changed.

Every page the ticket names ("before paying", "on the confirmation page") and every "then" clause ("then confirm again", "then places the order") is its own done line, asserted on that page, by that action. A retry the ticket describes happens the way the ticket describes it: from the same dialog, not after a reload.

A done line is proven by doing it, not by seeing the control for it. "X still works" means do X and read the page after. "Lands on page P" means assert what the user sees on P: every line item, not only an id or a total. "Hidden" or "empty" means drive the app to that state first and assert what it actually shows; a count at zero is usually absent, not "0".

Ticket too vague to write done lines: stop and ask one precise question. Guessing produces a test of the wrong thing.

Done when: every done line is user-visible and checkable with a Playwright assertion, and every page and "then" in the ticket has one.

## 2. Scenarios

Group done lines into at most 3 scenarios, ranked: permission boundary and failure path first, happy path last. A done line the ticket places after another step (sign out after the guest cart merged, retry after the decline) is tested in that scenario right after that step; starting it from a shortcut state (a cart built while already signed in) tests a flow the ticket never names. Each scenario starts from reset state and logs in on its own. A guest scenario resets too: a cookie cart is server state, and a spec that passes only in a fresh browser is not repeatable. The reset is the one ENV names; if ENV marks it unverified, verify it live in step 3 (call it once, reload, see the seed) and then use it. A done line that mutates (remove a member, switch a plan, place an order) is performed, never downgraded to a read-only check because reset looked uncertain: without the reset the test is not repeatable, and without the mutation the ticket is not tested. Use the seeded records ENV names (the seeded member, the seeded key, the listed products); inventing data through another flow tests that flow instead.

## 3. Walk each scenario live

`playwright-cli` is installed (a prerequisite that `e2e-setup` checks) and the app is already up at the base URL. The first command is `open`; a connection error on `open` is reported as the app being down. The base URL, the login steps and the account come from ENV, never from memory or a guess.

Each line is one `playwright-cli` command:

```
open <base url><login path>
snapshot              # refs like e12
fill e12 "<account email from ENV>"
click e15
snapshot              # what changed? that is the assertion
generate-locator e20  # user-facing locator for the spec
run-code "async page => { const r = await page.request.delete('<api path of the rule under test>'); return r.status(); }"
```

Loop per step: act, snapshot, run `generate-locator` on the ref; a locator typed from memory or guessed from the snapshot text is not proven. When it returns a testid and the snapshot shows a role with a user-facing name, write the role form (`getByRole("article").filter({ hasText: "Classic Cotton T-Shirt" }).getByRole("button", { name: "Add to cart" })`); the testid stays only when nothing user-facing is unique, as with a badge that is just a number. Write down the locator and the assertion that the snapshot proves. Reach each page the way the spec will: `open` once, then clicks. For a rule check, run the direct request with `run-code`, then `reload` and snapshot. For a failure path, trigger the error, then `reload` and snapshot. In both, the user-visible state after reload is the assertion; the state before reload is a second, weaker one.

A step enters the spec only after it ran once live and the snapshot showed the expected result. A locator that returns 0 or 2+ elements live gets fixed live, never with `.first()`, `.last()` or a try/catch in the spec.

Done when: every done line has a proven locator and assertion.

## 4. Write the spec

One file. Header comment lists the done lines and which test covers each. Load the `e2e-spec-rules` skill and follow every rule in it; one disqualified pattern disqualifies the spec. On top of those rules:

- One `test` per scenario, named after the done line.
- Assert the exact element touched or revealed in step 3.
- Direct rule check: `page.request` for the attempt (it carries the page's login cookies; the `request` fixture is a stranger with no session), `expect(res.status())` for the code, then `reload` and a visible assertion.

## 5. Run until green

Run the spec with `npx playwright test <file>`. If the Playwright config does not load `.env.e2e`, load it into the shell first (`set -a; . ./.env.e2e; set +a`). A failure is one of two things:

- The spec is wrong (locator matches 0 or 2+ elements, wrong wait, wrong order): fix it from a fresh live snapshot. A locator that matches 2+ gets scoped (`dialog.getByRole("alert")`) or named (`getByRole("status", { name: ... })`), never `.first()`.
- The app is wrong: the ticket is not done. Report it with the failing assertion. The assertion stays.

Then read the spec against the done lines: every done line maps to one assertion.

Scan the spec: `node ../e2e-spec-rules/scripts/check-spec.mjs <file>`, a path from this skill's directory, where `e2e-spec-rules` is installed next to this skill. It prints one line per disqualified pattern and exits 1 when it finds any. Fix every finding from a fresh live snapshot, run the spec again, and scan again until it prints nothing.

Close the browser: `playwright-cli close`.

Last, run the `e2e-assess` skill on the ticket and the spec, and fix every miss it reports.
