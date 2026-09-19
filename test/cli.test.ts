import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..");
const cliPath = join(repoRoot, "dist", "cli.js");
const pkgVersion = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")).version;
// Relative, forward-slash patterns, matching documented real usage
// (`verify-claims "docs/**/*.md"`). Backslash paths have their own Windows-only test.
const fixture = (name: string) => `test/fixtures/${name}`;

function runCli(args: string[]) {
  return spawnSync("node", [cliPath, ...args], { encoding: "utf8", cwd: repoRoot });
}

describe("cli", () => {
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

  it.runIf(process.platform === "win32")("accepts backslash paths on Windows", () => {
    const relative = runCli(["test\\fixtures\\clean.md"]);
    expect(relative.status).toBe(0);
    expect(relative.stdout).toMatch(/1 passed, 0 failed/);

    const absolute = runCli([join(repoRoot, "test", "fixtures", "clean.md")]);
    expect(absolute.status).toBe(0);
    expect(absolute.stdout).toMatch(/1 passed, 0 failed/);
  });

  it("prints usage and exits 1 with no arguments", () => {
    const result = runCli([]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Usage: verify-claims/);
  });

  it("exits 1 when the pattern matches no files", () => {
    const result = runCli([fixture("does-not-exist-*.md")]);
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/No files matched/);
  });

  it("exits 0 and reports one passed claim for an all-passing file", () => {
    const result = runCli([fixture("clean.md")]);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/1 passed, 0 failed/);
  });

  it("exits 1 and reports both outcomes for a mixed file", () => {
    const result = runCli([fixture("mixed.md")]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/✓ line 3/);
    expect(result.stdout).toMatch(/✗ line 8/);
    expect(result.stdout).toMatch(/1 passed, 1 failed/);
  });

  it("prints the failing command's output under its ✗ line", () => {
    const result = runCli([fixture("noisy-fail.md")]);
    expect(result.status).toBe(1);
    expect(result.stdout).toMatch(/✗ line 1 .*\n {6}lint: 3 problems/);
  });

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
});
