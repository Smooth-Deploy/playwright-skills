#!/usr/bin/env node
// node scripts/check-spec.test.mjs   check that the spec scan flags every rule and passes a clean spec
import assert from "node:assert/strict";
import { scan } from "../skills/e2e-spec-rules/scripts/check-spec.mjs";

const bad = {
  sleep: `await page.waitForTimeout(1000);`,
  "position-pick": `await page.getByRole("button").first().click();`,
  hedge: `await page.getByText("Log in").or(page.getByText("Sign in")).click();`,
  "css-locator": `await page.locator(".cart").click();`,
  "visible-branch": `if (await page.getByRole("dialog").isVisible()) {`,
  "swallowed-error": `await page.getByRole("button", { name: "Close" }).click().catch(() => {});`,
  "regex-locator": `await page.getByRole("button", { name: /log ?in/i }).click();`,
  "regex-url": `await expect(page).toHaveURL(/account/);`,
  "shared-setup": `test.beforeEach(async ({ page }) => {`,
  "request-fixture": `test("removes the key", async ({ page, request }) => {`,
  "absolute-url": `await page.goto("http://localhost:3000/settings");`,
};
for (const [rule, line] of Object.entries(bad)) {
  assert.deepEqual(scan(line).map((f) => f.rule), [rule], line);
}

const good = `
// never waitForTimeout here, see http://example.test
test("owner sees no Remove action on their own row", async ({ page }) => {
  await page.request.post("/api/test/reset");
  await page.goto("/login"); // not page.locator
  await page.getByLabel("Email").fill("owner@example.test");
  await page.getByLabel("Password").fill(process.env.E2E_PASSWORD_OWNER);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/team");
  const row = page.getByRole("row", { name: "Olivia Owner" }).filter({ hasText: "owner" });
  await expect(row.getByRole("button", { name: "Remove" })).toHaveCount(0);
});
`;
assert.deepEqual(scan(good), []);
assert.equal(scan("\n\nawait page.waitForTimeout(5);")[0].line, 3);
console.log("check-spec ok");
