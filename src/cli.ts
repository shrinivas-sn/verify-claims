#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { glob } from "tinyglobby";
import { parseClaims } from "./parseClaims.js";
import { verify } from "./verify.js";

async function main() {
  const patterns = process.argv.slice(2);
  if (patterns.length === 0) {
    console.error('Usage: verify-claims "docs/**/*.md"');
    process.exit(1);
  }

  const files = (await glob(patterns)).sort();
  if (files.length === 0) {
    console.error(`No files matched: ${patterns.join(" ")}`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  for (const file of files) {
    const markdown = readFileSync(file, "utf8");
    const claims = parseClaims(markdown);
    if (claims.length === 0) continue;

    console.log(file);
    for (const claim of claims) {
      const result = verify(claim);
      if (result.status === "ok") {
        passed++;
        console.log(`  ✓ line ${claim.line}  ${claim.command}`);
      } else {
        failed++;
        console.log(
          `  ✗ line ${claim.line}  ${claim.command}  (expected ${result.expected}, got ${result.actual})`,
        );
      }
    }
  }

  console.log("");
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
