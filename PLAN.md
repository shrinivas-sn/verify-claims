# PLAN — Fix the v0.1.2 audit findings (target: v0.2.0)

**Written 19/09/2026.** Temporary file — deleted when this closes.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task.
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every in-scope bug and gap from the v0.1.2 audit in one ~60-minute session and
leave a changeset ready for a `0.2.0` release.

**Architecture:** The package still has four source files. `parseClaims.ts` gets
CommonMark-correct fence and indent handling. `verify.ts` captures command output instead of
discarding it. `cli.ts` switches to `node:util` `parseArgs` for real flags. No new
dependencies and no new source files.

**Tech stack:** TypeScript 5.9 (`tsc`, no bundler), ESM-only, Node ≥22.13, vitest 4 (tests
import the **built** `dist/`), tinyglobby, changesets.

**Spec:** `DOCS/RESEARCH/09-codebase-audit-v0.1.2.md`. Read its **Verification — 19/09/2026**
table: two findings were narrowed and three are deliberately out of scope (see Decisions).

**What this changes:** `src/index.ts`, `src/cli.ts`, `src/verify.ts`, `src/parseClaims.ts`,
`test/*.test.ts`, `test/index.test.ts` (new), `test/fixtures/noisy-fail.md` (new),
`README.md`, `.github/workflows/ci.yml`, `.changeset/audit-fixes.md` (new).

**Done means:** On branch `fix/audit-findings`, every task below is checked or explicitly
cut in the Progress Log. `npm run typecheck && npm run lint && npm test && npm run packcheck`
all pass, and `node dist/cli.js README.md` reports `3 passed, 0 failed`. A minor changeset
is committed. Nothing has been pushed or published without the user's go-ahead.

## Global Constraints

- Node floor stays `>=22.13` (`package.json` `engines`). Only `node:` built-ins may be added.
- Runtime dependencies stay exactly `tinyglobby`. **No new packages.**
- Never hand-edit `package.json` `version`. Bumps go through a changeset.
- Tests import `../dist/index.js`, so always run them through `npm test`, which builds first.
  Run a single file with `npm test -- test/<file>.test.ts`.
- Scope contract (`DOCS/CONTEXT/07-decision.md` § "What v1 deliberately excludes"): no output
  matching, no config files, no plugins, no watch mode, no extra output formats.
- CLI test patterns are relative with forward slashes (`test/fixtures/x.md`), and `cwd` is the repo root.
- Match the existing style: double quotes, 2-space indent, trailing commas, sparse comments
  that say *why*.

## Time budget and cut line

| Step | Minutes | Running total |
|---|---|---|
| Phase 0 setup | 2 | 2 |
| T1 VERSION | 4 | 6 |
| T2 CLI flags + `--dry-run` | 10 | 16 |
| T3 failure output | 9 | 25 |
| T4 stacked claims | 3 | 28 |
| T5 fence matching | 6 | 34 |
| T6 indented code | 4 | 38 |
| T7 unreadable file | 5 | 43 |
| T8 backslash paths | 3 | 46 |
| T9 README + CI + changeset | 8 | 54 |
| Phase 2 verification | 5 | 59 |

**Cut line:** if the clock passes **40 minutes** before T6 starts, skip T6 and T8. Both are
independent of everything else. Log them as `cut` in the Progress Log and still do T7 and T9.
T9 and Phase 2 are never cut.

---

## Phases

### Phase 0 — Setup

- [ ] **Step 1: Branch off main**

```bash
git checkout -b fix/audit-findings
```

- [ ] **Step 2: Baseline**

Run: `npm test`
Expected: `Tests  11 passed (11)`. If not, stop; the baseline is broken, so don't start.

**Gate:** baseline green.

### Phase 1 — Fixes (Tasks 1–9)

---

### Task 1: `VERSION` reads package.json

**Files:**
- Modify: `src/index.ts:1`
- Create: `test/index.test.ts`

**Interfaces:**
- Produces: `export const VERSION: string`, always equal to `package.json` `version`. T2's
  `--version` flag prints it.

- [ ] **Step 1: Write the failing test** at `test/index.test.ts`

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VERSION } from "../dist/index.js";

describe("VERSION", () => {
  it("matches package.json", () => {
    const pkg = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8"),
    );
    expect(VERSION).toBe(pkg.version);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- test/index.test.ts`
Expected: FAIL, `expected '0.1.0' to be '0.1.2'`.

- [ ] **Step 3: Implement.** Replace line 1 of `src/index.ts` with:

```ts
import { readFileSync } from "node:fs";

// Read at runtime so the changesets bump in package.json is the only place the number lives.
const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
export const VERSION = pkg.version;
```

(`dist/index.js` → `../package.json` is the package root. npm always ships
`package.json`, so this resolves for installed copies too.)

- [ ] **Step 4: Run it and confirm it passes**

Run: `npm test`
Expected: all tests pass (12).

- [ ] **Step 5: Commit**

```bash
git add src/index.ts test/index.test.ts
git commit -m "fix: read VERSION from package.json instead of hardcoding it"
```

---

### Task 2: Real CLI flags (`--help`, `--version`, `--dry-run`, unknown-flag error)

**Files:**
- Modify: `src/cli.ts` (whole file)
- Modify: `test/cli.test.ts`

**Interfaces:**
- Consumes: `VERSION` from T1.
- Produces: in `src/cli.ts`, `main()` has local `dryRun: boolean`, counters `passed`,
  `failed`, `listed`, and a `for (const claim of claims)` loop with an `else` failure branch.
  T3, T7 and T8 edit these exact lines.

- [ ] **Step 1: Write the failing tests.** In `test/cli.test.ts`, add under the existing imports:

```ts
import { readFileSync } from "node:fs";
```

and after the `const repoRoot = …` line:

```ts
const pkgVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;
```

Then add these inside `describe("cli", …)`:

```ts
  it("prints help and exits 0 for --help", () => {
    const result = runCli(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage: verify-claims/);
  });

  it("prints the package version and exits 0 for --version", () => {
    const result = runCli(["--version"]);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(pkgVersion);
  });

  it("rejects an unknown flag instead of treating it as a glob", () => {
    const result = runCli(["--nope", fixture("clean.md")]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Unknown option '--nope'/);
    expect(result.stderr).not.toMatch(/No files matched/);
  });

  it("lists claims without running them under --dry-run", () => {
    const result = runCli(["--dry-run", fixture("mixed.md")]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/- line 8 {2}node -e "process\.exit\(1\)"/);
    expect(result.stdout).toMatch(/2 claims found, none run/);
    expect(result.stdout).not.toMatch(/✗/);
  });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test -- test/cli.test.ts`
Expected: the 4 new tests FAIL (`No files matched: --help` etc.). The 4 old ones pass.

- [ ] **Step 3: Implement.** Replace `src/cli.ts` entirely with:

```ts
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
```

- [ ] **Step 4: Run and confirm everything passes**

Run: `npm test`
Expected: all pass (16). The existing "no arguments" test still passes because `USAGE`
starts with `Usage: verify-claims`.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "feat(cli): add --help, --version, --dry-run; reject unknown flags"
```

---

### Task 3: Show what a failing command printed

**Files:**
- Modify: `src/verify.ts` (whole file)
- Modify: `src/cli.ts` (the `else` failure branch from T2, plus a helper)
- Create: `test/fixtures/noisy-fail.md`
- Modify: `test/verify.test.ts`, `test/cli.test.ts`

**Interfaces:**
- Consumes: T2's `cli.ts` failure branch.
- Produces: `VerifyResult.output?: string`, which holds stdout then stderr, each
  `trimEnd()`-ed and joined by `\n`. It is set only when the command did not pass *and*
  printed something. This is an additive public-API change.

- [ ] **Step 1: Write the failing tests.** Add to `describe("verify", …)` in `test/verify.test.ts`:

```ts
  it("returns what the command printed when it fails", () => {
    const result = verify({
      command: `node -e "console.log('out-line'); console.error('err-line'); process.exit(2)"`,
      claimText: "",
      line: 1,
    });
    expect(result).toEqual({
      status: "failed",
      expected: "exit code 0",
      actual: "exit code 2",
      output: "out-line\nerr-line",
    });
  });
```

Create `test/fixtures/noisy-fail.md`:

```markdown
<!-- claim: node -e "console.error('lint: 3 problems'); process.exit(1)" -->
Lint: **clean**
```

Add to `describe("cli", …)` in `test/cli.test.ts`:

```ts
  it("prints the failing command's output under its ✗ line", () => {
    const result = runCli([fixture("noisy-fail.md")]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/✗ line 1 .*\n {6}lint: 3 problems/);
  });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test`
Expected: the 2 new tests FAIL. `output` is missing, and nothing is printed under `✗`.

- [ ] **Step 3: Implement `verify.ts`.** Replace the file with:

```ts
import { execSync } from "node:child_process";
import type { Claim } from "./parseClaims.js";

export interface VerifyResult {
  status: "ok" | "failed" | "errored";
  expected: string;
  actual: string;
  /** What the command printed (stdout, then stderr). Set only when it did not pass and printed something. */
  output?: string;
}

const TIMEOUT_MS = 60_000;
// execSync's 1 MiB default would kill a chatty-but-passing test run.
const MAX_BUFFER = 16 * 1024 * 1024;

export function verify(claim: Claim, timeoutMs: number = TIMEOUT_MS): VerifyResult {
  const expected = "exit code 0";

  try {
    execSync(claim.command, {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: MAX_BUFFER,
    });
    return { status: "ok", expected, actual: "exit code 0" };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      status?: number | null;
      signal?: string | null;
      stdout?: string | null;
      stderr?: string | null;
    };
    const printed = [err.stdout, err.stderr]
      .map((stream) => stream?.trimEnd())
      .filter(Boolean)
      .join("\n");
    const output = printed ? { output: printed } : {};

    if (typeof err.status === "number") {
      return { status: "failed", expected, actual: `exit code ${err.status}`, ...output };
    }
    if (err.signal) {
      // Includes the timeout case: execSync kills with SIGTERM when it exceeds TIMEOUT_MS.
      return { status: "errored", expected, actual: `terminated by signal ${err.signal}`, ...output };
    }
    return { status: "errored", expected, actual: err.message ?? "unknown error", ...output };
  }
}
```

- [ ] **Step 4: Implement the CLI side.** In `src/cli.ts`, add above `async function main()`:

```ts
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
```

and in the failure branch, directly after the `console.log(` … `);` that prints the `✗` line, add:

```ts
        if (result.output) printTail(result.output);
```

- [ ] **Step 5: Run and confirm everything passes**

Run: `npm test`
Expected: all pass (18). The timeout test must still finish well under 5 s.
(Pre-checked 19/09: `execSync` with piped stdio and a 200 ms timeout returned in 209 ms on
Windows.)

- [ ] **Step 6: Commit**

```bash
git add src/verify.ts src/cli.ts test/verify.test.ts test/cli.test.ts test/fixtures/noisy-fail.md
git commit -m "feat: show a failing claim's output instead of discarding it"
```

---

### Task 4: Stacked claims share the text below them

**Files:**
- Modify: `src/parseClaims.ts:26-33` (the `claimText` loop)
- Modify: `test/parseClaims.test.ts`

**Interfaces:**
- Produces: `CLAIM_COMMENT` is reused inside the `claimText` search. No signature change.

- [ ] **Step 1: Write the failing test.** Add to `describe("parseClaims", …)`:

```ts
  it("gives stacked claims the text below them, not each other's comment", () => {
    const markdown = [
      "<!-- claim: npm run lint -->",
      "<!-- claim: npm test -->",
      "Build: passes",
    ].join("\n");

    expect(parseClaims(markdown)).toEqual([
      { command: "npm run lint", claimText: "Build: passes", line: 1 },
      { command: "npm test", claimText: "Build: passes", line: 2 },
    ]);
  });
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npm test -- test/parseClaims.test.ts`
Expected: FAIL. The first claim's `claimText` is `"<!-- claim: npm test -->"`.

- [ ] **Step 3: Implement.** Replace the `claimText` loop with:

```ts
    let claimText = "";
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      // Several commands stacked above one statement all prove that statement.
      if (next === "" || CLAIM_COMMENT.test(next)) continue;
      claimText = next;
      break;
    }
```

- [ ] **Step 4: Run and confirm everything passes.** Run: `npm test`. Expected: all pass (19).

- [ ] **Step 5: Commit**

```bash
git add src/parseClaims.ts test/parseClaims.test.ts
git commit -m "fix(parser): stacked claims share the statement below them"
```

---

### Task 5: Fences close only on a matching fence (CommonMark)

**Files:**
- Modify: `src/parseClaims.ts:8` (`FENCE`) and `:13-21` (the `inFence` toggle)
- Modify: `test/parseClaims.test.ts`

**Interfaces:**
- Produces: `FENCE = /^(`{3,}|~{3,})/`, and a loop-local `openFence: string` that replaces
  `inFence: boolean`. T6 adds one line **above** this block.

- [ ] **Step 1: Write the failing tests**

```ts
  it("keeps a longer fence open across a shorter nested fence", () => {
    const markdown = [
      "````markdown",
      "```",
      "<!-- claim: npm run lint -->",
      "```",
      "````",
      "",
      "<!-- claim: npm test -->",
      "Tests: **pass**",
    ].join("\n");

    expect(parseClaims(markdown)).toEqual([
      { command: "npm test", claimText: "Tests: **pass**", line: 7 },
    ]);
  });

  it("does not let a ~~~ line close a ``` fence", () => {
    const markdown = [
      "```",
      "~~~",
      "<!-- claim: npm run lint -->",
      "```",
      "",
      "<!-- claim: npm test -->",
      "Tests: **pass**",
    ].join("\n");

    expect(parseClaims(markdown)).toEqual([
      { command: "npm test", claimText: "Tests: **pass**", line: 6 },
    ]);
  });
```

- [ ] **Step 2: Run them and confirm they fail**

Run: `npm test -- test/parseClaims.test.ts`
Expected: both FAIL, because `npm run lint` is picked up as a claim.

- [ ] **Step 3: Implement.** Change line 8 to:

```ts
const FENCE = /^(`{3,}|~{3,})/;
```

Replace `let inFence = false;` and the fence block at the top of the loop (from
`const trimmed = …` through `if (inFence) continue;`) with:

```ts
  let openFence = ""; // the ``` or ~~~ run that opened the current fence; "" when outside one

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    const fence = trimmed.match(FENCE)?.[1];

    if (openFence) {
      // CommonMark: only a bare run of the same character, at least as long, closes a fence.
      if (fence && fence[0] === openFence[0] && fence.length >= openFence.length && trimmed === fence) {
        openFence = "";
      }
      continue;
    }
    if (fence) {
      openFence = fence;
      continue;
    }
```

(The `for` header moves into this block, so delete the old `for (…) {` line. Everything from
`const match = trimmed.match(CLAIM_COMMENT);` onward stays as it is.)

- [ ] **Step 4: Run and confirm everything passes.** Run: `npm test`. Expected: all pass (21),
  including the original "fenced code block" test.

- [ ] **Step 5: Commit**

```bash
git add src/parseClaims.ts test/parseClaims.test.ts
git commit -m "fix(parser): close fences only on a matching CommonMark fence"
```

---

### Task 6: Indented code blocks are not claims ✂ *(cuttable)*

**Files:**
- Modify: `src/parseClaims.ts` (one constant, one line)
- Modify: `test/parseClaims.test.ts`

**Interfaces:**
- Consumes: T5's loop.
- Produces: `INDENTED = /^( {4}|\t)/`, checked on the raw (untrimmed) line.

- [ ] **Step 1: Write the failing test**

```ts
  it("ignores claim comments in an indented code block", () => {
    const markdown = [
      "Example:",
      "",
      "    <!-- claim: npm run lint -->",
      "    Lint: **0 errors**",
      "",
      "\t<!-- claim: npm run build -->",
      "",
      "<!-- claim: npm test -->",
      "Tests: **pass**",
    ].join("\n");

    expect(parseClaims(markdown)).toEqual([
      { command: "npm test", claimText: "Tests: **pass**", line: 8 },
    ]);
  });
```

- [ ] **Step 2: Run it and confirm it fails.** Run: `npm test -- test/parseClaims.test.ts`.
  Expected: FAIL, with 3 claims found instead of 1.

- [ ] **Step 3: Implement.** Under the `FENCE` constant, add:

```ts
// Four spaces or a tab starts an indented code block in CommonMark: example text, never a claim.
const INDENTED = /^( {4}|\t)/;
```

Then make this the **first** line inside the `for` loop, above `const trimmed = …`:

```ts
    if (INDENTED.test(lines[i])) continue;
```

(This is safe inside an open fence too. A line indented 4+ spaces can't be a CommonMark
closing fence, so skipping it changes nothing there.)

- [ ] **Step 4: Run and confirm everything passes.** Run: `npm test`. Expected: all pass (22).

- [ ] **Step 5: Commit**

```bash
git add src/parseClaims.ts test/parseClaims.test.ts
git commit -m "fix(parser): ignore claim comments inside indented code blocks"
```

---

### Task 7: An unreadable file is reported, not a crash

**Files:**
- Modify: `src/cli.ts` (the `readFileSync` line and the summary block)
- Modify: `test/cli.test.ts`

**Interfaces:**
- Consumes: T2's loop and summary.
- Produces: counter `unreadable`. Any unreadable file makes the exit code 1, including
  under `--dry-run`.

The test needs `chmod`, so it is **POSIX-only**. It is skipped on Windows and when running
as root. It runs for real in CI (ubuntu, non-root runner). On a Windows machine, confirm it
shows as `skipped`, then rely on CI for the actual run.

- [ ] **Step 1: Write the failing test.** Extend the `node:fs` import in `test/cli.test.ts` to:

```ts
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
```

Then add inside `describe("cli", …)`:

```ts
  const canChmod = process.platform !== "win32" && process.getuid?.() !== 0;

  it.skipIf(!canChmod)("reports an unreadable file and exits 1 instead of crashing", () => {
    const dir = join(repoRoot, "test", ".tmp-unreadable");
    const file = join(dir, "locked.md");
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, '<!-- claim: node -e "process.exit(0)" -->\nok\n');
    chmodSync(file, 0o000);
    try {
      const result = runCli(["test/.tmp-unreadable/*.md"]);
      expect(result.status).toBe(1);
      expect(result.stdout).toMatch(/could not read file \(EACCES\)/);
      expect(result.stdout).toMatch(/1 unreadable/);
      expect(result.stderr).not.toMatch(/at readFileSync/);
    } finally {
      chmodSync(file, 0o644);
      rmSync(dir, { recursive: true, force: true });
    }
  });
```

- [ ] **Step 2: Run it.** Run: `npm test -- test/cli.test.ts`.
  Expected on Linux/macOS: FAIL with an `EACCES` stack trace. Expected on Windows: `skipped`.

- [ ] **Step 3: Implement.** In `src/cli.ts`, add `let unreadable = 0;` next to the other
  counters, and replace `const markdown = readFileSync(file, "utf8");` with:

```ts
    let markdown: string;
    try {
      markdown = readFileSync(file, "utf8");
    } catch (error) {
      unreadable++;
      console.log(file);
      console.log(`  ✗ could not read file (${(error as NodeJS.ErrnoException).code ?? "unknown error"})`);
      continue;
    }
```

Replace the summary block (from `console.log("");` to the final `process.exit`) with:

```ts
  console.log("");
  const unreadableNote = unreadable > 0 ? `, ${unreadable} unreadable` : "";
  if (dryRun) {
    console.log(`${listed} claims found, none run${unreadableNote}`);
    process.exit(unreadable > 0 ? 1 : 0);
  }
  console.log(`${passed} passed, ${failed} failed${unreadableNote}`);
  process.exit(failed > 0 || unreadable > 0 ? 1 : 0);
```

- [ ] **Step 4: Run and confirm everything passes.** Run: `npm test`. Expected: all pass. On
  Windows, 1 is skipped.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "fix(cli): report unreadable files instead of crashing"
```

---

### Task 8: Backslash paths work on Windows ✂ *(cuttable)*

**Files:**
- Modify: `src/cli.ts` (the `glob(patterns)` line)
- Modify: `test/cli.test.ts` (new test, plus the stale comment at lines 9-11)

**Interfaces:** none new.

The test is **Windows-only**, and this machine is Windows, so it runs locally. Absolute
forward-slash paths already work (checked 19/09). Only backslashes fail.

- [ ] **Step 1: Write the failing test**

```ts
  it.runIf(process.platform === "win32")("accepts backslash paths on Windows", () => {
    const relative = runCli(["test\\fixtures\\clean.md"]);
    expect(relative.status).toBe(0);
    expect(relative.stdout).toMatch(/1 passed, 0 failed/);

    const absolute = runCli([join(repoRoot, "test", "fixtures", "clean.md")]);
    expect(absolute.status).toBe(0);
    expect(absolute.stdout).toMatch(/1 passed, 0 failed/);
  });
```

Replace the comment above `const fixture = …` with:

```ts
// Relative, forward-slash patterns, matching documented real usage
// (`verify-claims "docs/**/*.md"`). Backslash paths have their own Windows-only test.
```

- [ ] **Step 2: Run it and confirm it fails.** Run: `npm test -- test/cli.test.ts`.
  Expected: FAIL, `No files matched: test\fixtures\clean.md`.

- [ ] **Step 3: Implement.** Replace `const files = (await glob(patterns)).sort();` with:

```ts
  // tinyglobby only understands "/". On Windows a backslash is always a separator, never an escape.
  const globPatterns =
    process.platform === "win32" ? patterns.map((p) => p.replaceAll("\\", "/")) : patterns;
  const files = (await glob(globPatterns)).sort();
```

- [ ] **Step 4: Run and confirm everything passes.** Run: `npm test`. Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/cli.ts test/cli.test.ts
git commit -m "fix(cli): accept backslash paths on Windows"
```

---

### Task 9: README, CI dogfood, changeset

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/ci.yml:27`
- Create: `.changeset/audit-fixes.md`

Only document what actually shipped. If T6 or T8 was cut, leave out its bullet.

- [ ] **Step 1: README, "CLI reference".** Replace the fenced usage line and the bullet list
  with:

````markdown
```
verify-claims [options] <pattern...>
```

| Option | Does |
|---|---|
| `--dry-run` | Lists every claim and its command without running anything |
| `-h`, `--help` | Shows usage |
| `-v`, `--version` | Shows the installed version |

- Accepts one or more glob patterns (quote them so the shell doesn't expand
  them first, e.g. `"docs/**/*.md"`). Backslash paths work on Windows.
- Runs each command through the platform's default shell (`/bin/sh` on
  Linux/macOS, `cmd.exe` on Windows), from the directory you run
  `verify-claims` in. A claim that only works in bash will fail on Windows.
- Prints a ✓/✗ report per claim, with the file, line number, command, and —
  on failure — the exit code and the last 20 lines the command printed.
- Claims inside fenced (```` ``` ```` / `~~~`) or indented code blocks are
  ignored, so docs can show the syntax without running it. Several claim
  comments stacked above one line all check that line.
- **Exit code 0** — every claim passed.
- **Exit code 1** — at least one claim failed, a file couldn't be read, or
  the pattern matched zero files (a silent pass on a typo'd pattern would
  defeat the point of the tool, so it's treated as an error).

## Security

A claim is a shell command, and `verify-claims` runs it. That is the same
trust level as `npm run`: anyone who can edit your markdown can run
commands wherever you run this tool.

- Don't run it in `pull_request_target` workflows, or in any job that holds
  secrets while checking out untrusted pull request code.
- Run `verify-claims --dry-run "docs/**/*.md"` to see exactly what a doc
  will execute before trusting it.
````

- [ ] **Step 2: README, fix the dead links.** Change
  `[`docs/07-decision.md`](./docs/07-decision.md)` to
  `[`DOCS/CONTEXT/07-decision.md`](./DOCS/CONTEXT/07-decision.md)`. Replace the
  "Development" paragraph with:

```markdown
This repo's own history — every decision, correction, and session — is kept
under [`DOCS/`](./DOCS/README.md). Start at its index for the full build story.
```

- [ ] **Step 3: README, Quick start sample output.** Add one indented output line under the
  `✗` line so the sample matches the new behavior:

```
docs/README.md
  ✓ line 12  npm run lint
  ✗ line 20  npm run build  (expected exit code 0, got exit code 1)
      src/index.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'.

1 passed, 1 failed
```

- [ ] **Step 4: CI dogfood.** In `.github/workflows/ci.yml`, change the last line to:

```yaml
      - run: node dist/cli.js "README.md"
```

(`docs/**/*.md` has matched nothing on Linux since the `DOCS/` restructure, and `DOCS/`
holds no claims. Checked 19/09: zero claims in `DOCS/**/*.md`.)

- [ ] **Step 5: Changeset.** Create `.changeset/audit-fixes.md`:

```markdown
---
"@shrinivas-sn/verify-claims": minor
---

Add `--help`, `--version` and `--dry-run`, and show a failing command's output. Fix: stacked
claims taking each other's comment as their text, nested and indented code blocks being
parsed as claims, backslash paths on Windows, a crash on unreadable files, and the stale
`VERSION` export.
```

- [ ] **Step 6: Commit**

```bash
git add README.md .github/workflows/ci.yml .changeset/audit-fixes.md
git commit -m "docs: document new flags, security model, and fix dead links"
```

**Gate:** all T1–T9 commits exist, or cut tasks are logged.

### Phase 2 — Verification

- [ ] **Step 1: Full gate**

```bash
npm run typecheck && npm run lint && npm test && npm run packcheck
```

Expected: every command exits 0. `publint` and `attw` report no problems.

- [ ] **Step 2: Dogfood.** Run: `node dist/cli.js README.md`. Expected: `3 passed, 0 failed`.

- [ ] **Step 3: Spot-check by hand**

```bash
node dist/cli.js --version            # 0.1.2 (the changeset bumps it on release, not now)
node dist/cli.js --dry-run README.md  # 3 claims found, none run
node dist/cli.js --bogus              # Unknown option '--bogus' … exit 1
```

- [ ] **Step 4: Log it.** Append a Progress Log entry with the real output of Steps 1–3.

**Gate — needs the user.** Pushing the branch, opening the PR and merging are the user's
call. Merging to `main` makes the Changesets action open a "Version Packages" PR. Merging
*that* publishes `0.2.0` to npm, which is public and irreversible. Do not do any of these
unprompted.

---

## Decisions

- Audit moved from root `plan.md` to `DOCS/RESEARCH/09-codebase-audit-v0.1.2.md`, with a
  verification table appended (19/09/2026).
- **Gap 2 (claim text never checked) is NOT implemented.** "Output matching" is on the v1
  exclusion list (`07-decision.md`, `08-build-plan.md`). Reopening it is a v2 conversation
  for the user, not a fix.
- **Gap 3 (cwd) is deferred.** Running claims from the markdown file's folder would silently
  change what every existing claim runs. Workaround: `cd packages/app && npm test` inside the
  claim, or run the CLI from that folder.
- **Gap 4 (parallel) is deferred.** README's own claims (`npm run build`, and `npm test`,
  which also builds) both write `dist/`, so a parallel run would race. Serial stays the
  default.
- **Security:** keep the "same trust as `npm run`" model from `07-decision.md`. The fix is the
  README section that record promised but never shipped, plus `--dry-run` to inspect first.
- **Blockquote claims stay ignored.** A quote is someone else's text, and running it is the
  unsafe default.
- **Shell portability:** documented only. No cross-shell layer.
- **Bug 4 narrowed:** tinyglobby returns files only, so only `EACCES` needed handling.
- **Edge 2 narrowed:** absolute forward-slash paths already worked. Only backslashes are fixed.
- Stacked claim comments all get the statement below them as `claimText`.
- A line indented 4+ spaces or a tab is code, never a claim (CommonMark indented code block).
- Flags use `node:util` `parseArgs`, so no new dependency. Unknown flags now exit 1 instead
  of being treated as globs.
- Release as **minor** (0.1.2 → 0.2.0): new flags plus the additive `VerifyResult.output`.

---

## Progress Log

*(Append only. Newest at the bottom. Never rewrite an entry — if it turned out wrong,
add a new one saying so. This log is what makes resuming cheap: a cold session reads
the last entry and knows exactly where to start.)*

### Planning — 19/09/2026
Done:       Verified every audit finding against the code. Moved the audit to
            DOCS/RESEARCH/09-codebase-audit-v0.1.2.md with a verification table. Wrote this
            plan (9 tasks, ~59 min, cut line at T6/T8).
Verified:   `npm test` → Test Files 3 passed (3), Tests 11 passed (11).
            `node dist/cli.js --help` → "No files matched: --help", exit 1 (Bug 3 is real).
            parseClaims on stacked claims → claim 1 claimText "<!-- claim: npm test -->" (Bug 2).
            `node dist/cli.js 'test\fixtures\clean.md'` → "No files matched" (backslash case).
            `node dist/cli.js "E:/verify-claims/test/fixtures/clean.md"` → 1 passed.
            execSync + piped stdio + 200 ms timeout on Windows → SIGTERM/ETIMEDOUT in 209 ms.
            parseArgs unknown flag → "Unknown option '--nope'. To specify a positional …".
Surprises:  Bug 4 is mostly not real: directories never reach readFileSync. Gap 2 conflicts
            with the project's own scope contract. README has two more dead links
            (docs/00-worklog.md, docs/README.md), and the CI dogfood pattern has matched
            nothing since the DOCS/ restructure. None of that was in the audit.
Next:       Phase 0 step 1: `git checkout -b fix/audit-findings`, then Task 1.
Commit:     see /save-check commit for this session
