---
name: e2e-release-confidence
description: 'Ship call for a change before deploy: which user flows the diff touches, which tests prove each one, where the gaps are, and a verdict of ship, ship-with-risk or hold. Use when asked "can this ship", before a deploy or merge, or whenever a green suite is the only argument for releasing.'
license: MIT
---

# e2e-release-confidence

Input: the diff (a patch file or a git range), the ticket behind it, the app source with the diff applied, a running build of it, the suite, and the environment file `.e2e/e2e-env.md`, called ENV below. No `.e2e/e2e-env.md` in the repo: run the `e2e-setup` skill first. Output: a verdict with the evidence per flow. No test and no app file changes; the app is left exactly as found.

A green suite says nothing on its own. A flow counts as **proven** only when a test is green with the change and red without it. Green both ways is theater: the test does not see the change.

## 1. Map the diff to flows

Read every hunk. For each, name the user-visible flow it changes: what a user does and what they then see (revoke a key, the row shows revoked; cart at $100, shipping shows $0.00). Trace from the hunk only as far as needed to name the flow: the handler it sits in, the page that renders its result. Then compare with the ticket: a hunk that serves no line of the ticket is an unintended change and gets its own flow.

Tag flows that move money, change who can do what, or delete data (**critical**). A gap there is a hold, not a risk.

## 2. Find the candidates

For each flow, list the tests whose assertions name that outcome. Title and assertions decide, not file name. A test that only drives through the flow without asserting its outcome is not a candidate.

## 3. Prove

Run the candidates on the build with the change. If the Playwright config does not load `.env.e2e`, load it into the shell first (`set -a; . ./.env.e2e; set +a`).

```bash
npx playwright test <files> --reporter=line
```

Red here: the change breaks a flow the suite guards, verdict **hold**, step 5.

Then remove the change and run the same tests. The working tree must hold nothing uncommitted except the change itself; anything else there: stop and ask, since reversing a patch over it can lose it.

```bash
git apply -R <patch>      # a git range: git diff <range> > <patch> first
npx playwright test <files> --reporter=line
git apply <patch>
```

After each `git apply`, wait until the running build serves that state before the run. ENV says how the app runs: a dev server reloads on its own, a built app needs its rebuild and restart.

Red without the change proves the flow. Green without the change: the test does not see the change. Count the flow as a gap, and say which test looked like coverage and why it is not (what it asserts instead).

Put the change back before anything else and confirm the build is the candidate again (one candidate run green, or the hunk visible in the source).

## 4. Verdict

- **ship**: every flow proven. No unintended change.
- **ship-with-risk**: every proven flow is proven, at least one flow has no proving test, none of the gaps is critical. Each gap names what a user would hit if the change is wrong there, and the done line a new test needs (hand to the `e2e-plan` skill).
- **hold**: a candidate is red with the change, a critical flow has no proving test, or the diff changes something the ticket did not ask for.

## 5. Report

```
Verdict: ship-with-risk
Change: shipping threshold 20000 -> 10000 in server.ts computeTotals (1 hunk, matches ticket)
Flows:
- covered declined card shows the error, keeps the cart, and a valid card then places the order: green with change, red without (alert text)
- gap guest cart survives sign-in: no test asserts the cart after login; a user could lose their cart silently. Done line: items added as guest are in the cart after signing in.
Risk: one gap, not critical.
```

The `Verdict:` line is first. Each `covered` line carries the exact test title and both run outcomes. Each `gap` line names the flow, what a user would hit, and the done line for the missing test. For hold, a `Hold because:` line names the red test or the critical gap or the unintended hunk.
