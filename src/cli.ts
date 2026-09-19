#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { glob } from "tinyglobby";
import { VERSION } from "./index.js";
import { parseClaims } from "./parseClaims.js";
import { verify } from "./verify.js";

const USAGE = `Usage: verify-claims [options] <pattern...>

Options:
  --dry-run      list each claim's command without running it
  -h, --help     show this help
  -v, --version  show the version`;

function readArgs() {
  try {
    return parseArgs({
      args: process.argv.slice(2),
      allowPositionals: true,
      options: {
        "dry-run": { type: "boolean" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
      },
    });
  } catch (error) {
    // Unknown flags used to fall through to tinyglobby as patterns; fail loudly instead.
    console.error((error as Error).message);
    console.error(USAGE);
    process.exit(1);
  }
}

async function main() {
  const { values, positionals: patterns } = readArgs();
  if (values.help) {
    console.log(USAGE);
    process.exit(0);
  }
  if (values.version) {
    console.log(VERSION);
    process.exit(0);
  }
  if (patterns.length === 0) {
    console.error(USAGE);
    process.exit(1);
  }
  const dryRun = values["dry-run"] === true;

  const files = (await glob(patterns)).sort();
  if (files.length === 0) {
    console.error(`No files matched: ${patterns.join(" ")}`);
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;
  let listed = 0;

  for (const file of files) {
    const markdown = readFileSync(file, "utf8");
    const claims = parseClaims(markdown);
    if (claims.length === 0) continue;

    console.log(file);
    for (const claim of claims) {
      if (dryRun) {
        listed++;
        console.log(`  - line ${claim.line}  ${claim.command}`);
        continue;
      }
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
  if (dryRun) {
    console.log(`${listed} claims found, none run`);
    process.exit(0);
  }
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
