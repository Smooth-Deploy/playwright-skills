# Smooth Deploy Playwright skills

Agent skills for testing with Playwright, installable into Claude Code, OpenCode and other agents.

Skills:

- `release-canary`: replies with the installed release version. Use it to check that an install or an update worked.

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
