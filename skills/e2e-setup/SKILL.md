---
name: e2e-setup
description: Learn a web app once and write .e2e/e2e-env.md, the environment file every other E2E skill reads first. Also checks that playwright-cli, which the other E2E skills rely on, is installed. Use when a repo has no .e2e/e2e-env.md yet, when asked to set up or prepare Playwright E2E testing for an app, or when that file is stale after an auth, roles or seed change.
license: MIT
---

# e2e-setup

Input: the repo (if any), a base URL, one test account. Output: `.e2e/e2e-env.md`, committed. Later sessions read it instead of re-learning the app, so it holds what a QA engineer needs on day one and nothing a reader can get from one `cat`.

Facts come from code first. A crawl sees only what is reachable and misses roles, flags and reset hooks; the code has all three. Steps 1 and 2 use file reading and search only. The browser is used once, in step 3, to prove the file, and `playwright-cli` is the one command needed.

Every E2E skill needs `playwright-cli`. If `playwright-cli --version` fails, ask the user to run `npm install -g @playwright/cli@latest`, then continue.

## 1. Read

In this order, stopping when the question is answered:

1. README, `package.json` scripts, Dockerfile or compose: how it runs, ports.
2. Routes or pages: the URL list and which ones need a session.
3. Auth: login route, session cookie or token, redirect when signed out, roles or plan tiers, feature flags that gate UI.
4. Seed, fixtures, migrations: test accounts, seeded records a test can rely on by name, prices.
5. Test hooks: reset or reseed endpoints, latency or failure toggles, anything under `_` or `debug`.
6. Ready signals: `data-state`, `aria-busy`, loading text, toasts. Locator conventions: `data-testid` pattern, labels on inputs.
7. Existing Playwright config and specs: base URL, `storageState`, what is already covered.

Done when: every section of the file below has either a fact with its source file, or `unknown`.

## 2. Ask

Collect every `unknown` and every guess into one short list and ask the user once. Typical gaps: base URL per environment, which account is safe to use, how to reset state, what must never be touched (production data, real emails, real payments). No user available: keep the list as the file's `Open questions` section.

## 3. Prove

One smoke check. Each step is one `playwright-cli` command, in this order: `open <base url><login path>`, `snapshot`, `fill <email ref> <email>`, `fill <password ref> <password>`, `click <submit ref>`, `snapshot`, `close`.

Write down the exact labels and button name of the login form and the landing URL as seen, since specs will repeat these steps verbatim. The app is already running at the base URL given; a 404 or connection error on `open` goes under `Open questions` and the login section stays `(unverified)`.

Done when: the login steps in the file ran once live.

## 4. Write

`.e2e/e2e-env.md`, markdown, under 60 lines, these headings in this order:

```
# Test environment: <app name>
- Base URL: <url>
- Reset: <endpoint or command, or "none: tests must clean up">
- Never touch: <list, or "nothing known">

## Accounts
- <email> / <password>, <role>, <what they own in the seed>

## Login
<the exact steps as proven: goto, labels, button, landing URL>

## Pages
- <path>: <what it is>, <auth required?>, <ready signal>

## Seed facts tests can rely on
- <records by display name, prices, counts>

## Test hooks
- <toggle>: <effect>, <how to turn on and off>

## Conventions
- Locators: <testid pattern, label style>
- Ready signals: <attribute and values>

## Existing suite
- <config path, how to run, what is covered, or "none">

## Open questions
- <each unknown or guess>
```

Mark every line that came from a guess with `(unverified)`. Done when the file exists, the login section was proven in step 3, and `Open questions` lists every guess.
