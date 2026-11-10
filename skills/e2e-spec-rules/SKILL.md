---
name: e2e-spec-rules
description: The rules every Playwright E2E spec in this skill set follows, covering self-contained tests, user-facing locators, exact web-first assertions, and the patterns that disqualify a spec. Use when writing, fixing or reviewing a Playwright E2E spec, and whenever plan-tests or repro-test says to follow the spec rules.
license: MIT
---

# e2e-spec-rules

Rules for a spec that fails when the feature breaks and for no other reason. ENV is the environment file `.e2e/e2e-env.md`.

- **Self-contained.** Every test reads top to bottom as the user's journey: reset (per ENV), log in through the UI, wait for the landing URL, `goto` the page under test, wait on its ready signal (per ENV), then the steps. All of it inline, in every test, as plain Playwright steps. No `beforeEach`, no helper functions, no custom fixtures, no `request` fixture: `async ({ page })` is the only signature. Repetition between tests is correct here; a reader of one test needs nothing else.
- **Locators.** `getByRole`, `getByLabel`, `getByText`; `getByTestId` only when nothing user-facing is unique. Scope with `.filter({ has })` or chain from a row or dialog. No CSS, no `.locator(...)`.
- **Ambiguity.** A locator that matches 0 or 2+ elements is fixed from a fresh live snapshot: scoped (`dialog.getByRole("alert")`) or named (`getByRole("status", { name: ... })`). A label that matches two fields (login and register forms on one page) means the testid from ENV. Never `.first()`, never a try/catch.
- **Ready signal.** Asserted like anything else: `await expect(page.getByTestId("cart-page")).toHaveAttribute("data-state", "ready")`.
- **Rows.** Found by the name the user sees (`getByRole("row", { name: "CI pipeline" })`), never by a seed id; seed ids belong only in `page.request` URLs.
- **Assertions.** Web-first only (`await expect(locator).toBeVisible()`, `toHaveCount(0)`, `toHaveURL`), on the exact element with the exact value: `toHaveText("paid")`, since `toContainText("paid")` also holds for "unpaid", and a `toHaveCount(1)` on generic text proves nothing.
- **Absence.** `await expect(row.getByRole("button", { name: "Remove" })).toHaveCount(0)` scoped to the row, never an unscoped `getByText`.
- **State that must persist or stay unchanged.** Assert it, `reload`, wait for ready, assert it again. The state after reload is the server's truth.
- **Passwords.** `process.env.E2E_PASSWORD_<NAME>`, the variable ENV names. Never the literal value.
- **URLs.** Relative everywhere, `goto("/settings")` and `page.request.delete("/api/...")` alike. The base URL lives in the Playwright config, never in the spec.

Disqualified, each one on its own: `waitForTimeout`, `if (await x.isVisible())`, `.catch(() => ...)` on a locator, regex locators guessing the UI (`/log ?in|sign ?in/`), `page.on("dialog")` for a dialog never seen live, `.first()`/`.last()`/`.nth()` to silence ambiguity, `.or()` to hedge between two guesses (`.and()` and `.filter()` narrow and are fine).
