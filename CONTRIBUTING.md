# Contributing

## Report a problem or suggest a change

Open an issue with the bug or idea template. One problem per issue, with the steps that show it first.

## Propose a fix

1. Fork the repository and create a branch.
2. Change one skill, or fix one thing. A skill lives at `skills/<name>/SKILL.md`, and `name` in the frontmatter must equal the directory name.
3. Check it locally:

   ```
   node scripts/version.mjs
   gh skill publish --dry-run
   claude plugin validate .
   ```

4. Open a pull request against `master`. Do not bump the version.

The `validate` check must pass. Workflows on a pull request from a first-time contributor wait for the maintainer's approval before they run. Only the maintainer can merge.

A skill is a set of instructions that an agent follows with the user's permissions. Pull requests that add scripts, network calls, or instructions unrelated to the stated purpose of the skill are closed.

## Release (maintainer)

1. In a pull request, set the new version: `node scripts/version.mjs --set X.Y.Z`. Merge it.
2. Tag the merge commit on `master` and push the tag:

   ```
   git checkout master && git pull
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

The `Release` workflow then checks that the tag is on `master`, that it equals the version in the files, and that the skills are valid. Only then does it move the `stable` branch to the tagged commit and create the GitHub release. If a check fails, `stable` does not move and no release is created: delete the tag, fix, and tag again.

Users install from `stable`, so a merge to `master` reaches nobody until it is tagged. Never push to `stable` by hand.

Only the maintainer can create, move, or delete `v*` tags.
