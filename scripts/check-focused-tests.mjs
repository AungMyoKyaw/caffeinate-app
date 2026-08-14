import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const failures = [];
const testExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const forbidden = [
  /\b(?:describe|it|test)\.(?:skip|only|todo)\s*\(/,
  /\b(?:xdescribe|xit|xtest)\s*\(/,
  /\btest\.skipIf\s*\(/,
  /\btest\.runIf\s*\(/
];

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) {
      walk(path);
      continue;
    }
    if (!testExtensions.has(extname(path)) || !/\.test\.[^.]+$/.test(path)) continue;
    const source = readFileSync(path, "utf8");
    for (const pattern of forbidden) {
      if (pattern.test(source)) failures.push(path.replace(`${root}/`, ""));
    }
  }
}

walk(join(root, "src"));

if (failures.length > 0) {
  console.error(`Focused or disabled tests found: ${[...new Set(failures)].join(", ")}`);
  process.exit(1);
}

console.log("Test focus check passed: zero skipped, disabled, todo, or focused tests found.");
