#!/usr/bin/env node
// node scripts/skill-refs.mjs   check that every e2e-* name in a SKILL.md or the README is a skill directory
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..");
const skills = readdirSync(join(repo, "skills"));
const notSkills = ["e2e-env"];
const files = ["README.md", ...skills.map((name) => `skills/${name}/SKILL.md`)];
let missing = 0;
for (const file of files) {
  readFileSync(join(repo, file), "utf8").split("\n").forEach((line, index) => {
    for (const [name] of line.matchAll(/\be2e-[a-z]+(?:-[a-z]+)*/g)) {
      if (skills.includes(name) || notSkills.includes(name)) continue;
      console.error(`${file}:${index + 1}  ${name} is not a directory under skills/`);
      missing += 1;
    }
  });
}
if (missing) process.exit(1);
console.log(`skill references ok (${files.length} files)`);
