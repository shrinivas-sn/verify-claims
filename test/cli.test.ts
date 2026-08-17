import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(testDir, "..");
const cliPath = join(repoRoot, "dist", "cli.js");
// Relative, forward-slash patterns only — matches documented real usage
// (`verify-claims "docs/**/*.md"`). Absolute Windows paths break tinyglobby's
// matching; see the Phase 5 worklog entry.
const fixture = (name: string) => `test/fixtures/${name}`;

function runCli(args: string[]) {
  return spawnSync("node", [cliPath, ...args], { encoding: "utf8", cwd: repoRoot });
}

describe("cli", () => {
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
});
