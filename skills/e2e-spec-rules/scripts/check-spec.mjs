#!/usr/bin/env node
// node check-spec.mjs <spec file>...   list the disqualified patterns in each spec
// Prints one line per finding (file:line  rule  why) and exits 1 when there is any.
// Reads the files it is given and nothing else. No network, no writes.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const rules = [
  ["sleep", /\bwaitForTimeout\s*\(/, "wait on a web-first assertion, not on time"],
  ["position-pick", /\.(first|last)\s*\(\s*\)|\.nth\s*\(/, "scope or name the locator instead of picking by position"],
  ["hedge", /\.or\s*\(/, "one proven locator, not two guesses"],
  ["css-locator", /\.locator\s*\(/, "use getByRole, getByLabel, getByText or getByTestId"],
  ["visible-branch", /\bif\s*\(.*\.isVisible\s*\(/, "a test has one path; assert the state instead of branching on it"],
  ["swallowed-error", /\.catch\s*\(/, "a caught failure hides the regression"],
  ["regex-locator", /\bgetBy\w+\(\s*\/|\b(name|hasText|hasNotText)\s*:\s*\//, "use the exact text from the live snapshot"],
  ["regex-url", /\btoHaveURL\(\s*\//, "assert the exact URL string"],
  ["shared-setup", /\b(beforeEach|beforeAll)\s*\(/, "setup goes inline in every test"],
  ["request-fixture", /\(\s*\{[^}]*\brequest\b[^}]*\}\s*\)\s*=>/, "page.request carries the session; the request fixture does not"],
  ["absolute-url", /["'`]https?:\/\//, "relative URLs only; the base URL lives in the Playwright config"],
];

export function scan(text) {
  const findings = [];
  text.split("\n").forEach((raw, index) => {
    const line = raw.replace(/(^|\s)\/\/.*$/, "");
    for (const [rule, pattern, why] of rules) {
      if (pattern.test(line)) findings.push({ line: index + 1, rule, why });
    }
  });
  return findings;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("usage: node check-spec.mjs <spec file>...");
    process.exit(2);
  }
  let count = 0;
  for (const file of files) {
    for (const { line, rule, why } of scan(readFileSync(file, "utf8"))) {
      console.log(`${file}:${line}  ${rule}  ${why}`);
      count += 1;
    }
  }
  process.exit(count ? 1 : 0);
}
