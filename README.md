# Smooth Deploy Playwright skills

Agent skills for testing with Playwright, installable into Claude Code, OpenCode and other agents.

Skills:

- `e2e-setup`: learns a web app once and writes `.e2e/e2e-env.md`, the environment file the other skills read. Run it first.
- `e2e-plan`: turns a ticket into a Playwright E2E spec in which every step was proven in a live browser.
- `e2e-repro`: turns a bug report into one test that is red on the bug and green once it is fixed.
- `e2e-triage`: classifies one failing test as real, app-intermittent, test-flaky or environment by rerunning it on the same build.
- `e2e-release-confidence`: ship call for a diff. Which user flows it touches, which tests prove each one, the gaps, and a verdict of ship, ship-with-risk or hold.
- `e2e-prune`: proposes which tests to drop and which steps to trim, one reason per finding. Changes nothing.
- `e2e-spec-rules`: the rules every spec follows. `e2e-plan` and `e2e-repro` load it; install it with them.
- `e2e-assess`: reviews a spec against its ticket and reports what the spec fails to prove. `e2e-plan` runs it as its last step.
- `release-canary`: replies with the installed release version. Use it to check that an install or an update worked.

## Prerequisite

The skills drive the browser with [`playwright-cli`](https://github.com/microsoft/playwright-cli):

```
npm install -g @playwright/cli@latest
```

`e2e-setup` checks for it; the other skills assume it is there.

## Install

The `stable` branch always points at the latest release. Install from it, not from `master`.

### Claude Code

```
claude plugin marketplace add Smooth-Deploy/playwright-skills@stable
claude plugin install playwright-skills@smooth-deploy
```

### OpenCode, and any other agent

With the GitHub CLI (follows release tags):

```
gh skill install Smooth-Deploy/playwright-skills --all --agent opencode
```

Or with `npx skills`:

```
npx skills add https://github.com/Smooth-Deploy/playwright-skills/tree/stable -a opencode -y
```

Replace `opencode` with your agent (`claude-code`, `codex`, `cursor`, and others).

## Update

| Installed with | Update command | Automatic |
| --- | --- | --- |
| Claude Code plugin | `claude plugin marketplace update smooth-deploy && claude plugin update playwright-skills@smooth-deploy` | Yes, after you enable it once: `/plugin`, Marketplaces, `smooth-deploy`, Enable auto-update |
| `gh skill` | `gh skill update --all` | No |
| `npx skills` | `npx skills update -y` | No |

Ask your agent for the "release canary" to see which version you have.

## Contributing

Issues and pull requests from forks are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md). Only the maintainer merges and releases.

## License

MIT. See [LICENSE](./LICENSE).
