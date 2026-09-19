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

const TAIL_LINES = 20;

// Test runners and linters put their verdict at the end, so show the tail, not the head.
function printTail(output: string) {
  const lines = output.split(/\r?\n/);
  const tail = lines.slice(-TAIL_LINES);
  if (lines.length > tail.length) {
    console.log(`      … ${lines.length - tail.length} earlier lines hidden`);
  }
  for (const line of tail) console.log(`      ${line}`);
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
  let unreadable = 0;

  for (const file of files) {
    let markdown: string;
    try {
      markdown = readFileSync(file, "utf8");
    } catch (error) {
      unreadable++;
      console.log(file);
      console.log(`  ✗ could not read file (${(error as NodeJS.ErrnoException).code ?? "unknown error"})`);
      continue;
    }
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
        if (result.output) printTail(result.output);
      }
    }
  }

  console.log("");
  const unreadableNote = unreadable > 0 ? `, ${unreadable} unreadable` : "";
  if (dryRun) {
    console.log(`${listed} claims found, none run${unreadableNote}`);
    process.exit(unreadable > 0 ? 1 : 0);
  }
  console.log(`${passed} passed, ${failed} failed${unreadableNote}`);
  process.exit(failed > 0 || unreadable > 0 ? 1 : 0);
}

main();
