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
