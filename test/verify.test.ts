import { describe, expect, it } from "vitest";
import { verify } from "../dist/index.js";

describe("verify", () => {
  it("reports ok when the command exits 0", () => {
    const result = verify({
      command: 'node -e "process.exit(0)"',
      claimText: "",
      line: 1,
    });
    expect(result).toEqual({
      status: "ok",
      expected: "exit code 0",
      actual: "exit code 0",
    });
  });

  it("reports failed when the command exits non-zero", () => {
    const result = verify({
      command: 'node -e "process.exit(1)"',
      claimText: "",
      line: 1,
    });
    expect(result).toEqual({
      status: "failed",
      expected: "exit code 0",
      actual: "exit code 1",
    });
  });

  it("reports errored when the command is killed by the timeout", () => {
    const isWindows = process.platform === "win32";
    const sleepCommand = isWindows
      ? 'node -e "setTimeout(() => {}, 5000)"'
      : "sleep 5";

    const result = verify(
      { command: sleepCommand, claimText: "", line: 1 },
      200,
    );
    expect(result.status).toBe("errored");
    expect(result.actual).toMatch(/signal/);
  });
});
