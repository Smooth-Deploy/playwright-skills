---
name: e2e-assess
description: Review a Playwright E2E spec against its ticket and report what it fails to prove. Use after writing or changing a spec, when asked whether a test is good enough or tests the right thing, or as the last step of e2e-plan before handing a spec over. Invoke with the ticket (a path, or the ticket text), then the spec path. A whole suite goes to e2e-prune, and a test that fails goes to e2e-triage.
license: MIT
context: fork
background: false
---

# e2e-assess

Arguments: `$ARGUMENTS` (the ticket as a path or as its text, then the spec path). Read both. Output: a verdict per axis and a list of misses, each with the line to add. The reviewer changes nothing and has not seen how the spec was written; the author fixes.

Read the ticket first and list its claims: every outcome, every page named, every "then" clause. A page named in the ticket is a claim about what the user sees on it: the items, the amount, the status. URL or heading alone leaves it unticked. Then read the spec once, top to bottom, and tick each claim against the assertion that proves it. An unticked claim is a miss. Only after that read for the other axes.

## Axes, score 0-3 each

Scale: 0 missing or wrong, 1 weak, 2 good, 3 what an expert would write. 3 is rare; when unsure, 2.

1. **coverage**: every claim ticked. A rule proven with other seed data counts. Any claim without an assertion scores 0.
2. **user_visible**: assertions on text, URL, element present or gone. API status alone or DOM structure alone scores 1. Readiness waits on `data-state` or `aria-busy` are fine.
3. **boundaries**: the failure path and the rule edge from the ticket are exercised (the declined card, the forbidden action attempted anyway, the exact threshold), not only the happy path.
4. **proof_strength**: the assertion fails when the feature silently breaks. Exact values (`toHaveText("paid")`, since `toContainText("paid")` holds for "unpaid"), reload before asserting state the ticket says must persist, absence scoped to a row or dialog, nothing that passes on an empty page.
5. **decoupling**: `getByRole`, `getByLabel`, `getByText`, `getByTestId`, rows found by the name the user sees. No CSS, no `.locator(`, no sleeps, no `if (await x.isVisible())`, no `.first()`, no `.or()`, no seed id in a `goto` path, no `goto` after the first page of a test.
6. **noise**: every step serves a claim, no duplicated scenario. An assertion on transient text (toast, spinner) that the ticket does not claim is noise. Inline login and setup repeated in each test is required house style, never noise. An untouched neighbour checked after a destructive action, and a merge checked after a flow that carries state across a boundary (guest cart into an account), serve the ticket even when it does not name them.

## Report

```
coverage 2  user_visible 3  boundaries 2  proof_strength 1  decoupling 3  noise 2   total 13/18
misses:
- "then places the order and shows the confirmation": confirmation page never asserts the items. Add after the URL check:
  await expect(page.getByRole("row", { name: "Fleece Beanie" })).toHaveCount(1)
- "stays the same": plan asserted before reload only. Add page.reload(), wait for ready, assert again.
```

Done when: every ticket claim appears either as ticked or as a miss with a concrete line. A spec with zero misses and no axis under 2 is ready.
