#!/usr/bin/env node
// node scripts/version.mjs              check that all version markers agree
// node scripts/version.mjs v1.2.3       also check that they equal this tag
// node scripts/version.mjs --set 1.2.3  write a new version to all markers
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  [".claude-plugin/plugin.json", /("version"\s*:\s*")([^"]*)/],
  ["skills/release-canary/SKILL.md", /(release-canary version: )([^\s`]+)/],
];
const semver = /^\d+\.\d+\.\d+$/;
const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const [arg, value] = process.argv.slice(2);
if (arg === "--set") {
  if (!semver.test(value ?? "")) fail("usage: version.mjs --set X.Y.Z");
  for (const [file, pattern] of targets) {
    const path = join(repo, file);
    const source = readFileSync(path, "utf8");
    if (!pattern.test(source)) fail(`${file}: no version marker found`);
    writeFileSync(path, source.replace(pattern, `$1${value}`));
  }
  console.log(`version set to ${value}`);
  process.exit(0);
}

const found = targets.map(([file, pattern]) => {
  const match = readFileSync(join(repo, file), "utf8").match(pattern);
  if (!match) fail(`${file}: no version marker found`);
  return [file, match[2]];
});
const expected = arg ? arg.replace(/^v/, "") : found[0][1];
if (!semver.test(expected)) fail(`not a semantic version: ${expected}`);
const wrong = found.filter(([, version]) => version !== expected);
if (wrong.length) fail(wrong.map(([file, version]) => `${file}: version ${version}, expected ${expected}`).join("\n"));
console.log(`version ${expected} ok`);
