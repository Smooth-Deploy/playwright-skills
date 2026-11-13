---
tags: [e2e-triage]
max_turns: 8
allowed_tools: [Skill, Read, Glob, Grep]
---

tests/checkout.spec.ts failed in CI last night with "expected 8, received 3" and passed when someone hit re-run. Is it flaky?
