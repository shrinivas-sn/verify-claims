import { execSync } from "node:child_process";
import type { Claim } from "./parseClaims.js";

export interface VerifyResult {
  status: "ok" | "failed" | "errored";
  expected: string;
  actual: string;
}

const TIMEOUT_MS = 60_000;

export function verify(claim: Claim): VerifyResult {
  const expected = "exit code 0";

  try {
    execSync(claim.command, { stdio: "ignore", timeout: TIMEOUT_MS });
    return { status: "ok", expected, actual: "exit code 0" };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & {
      status?: number | null;
      signal?: string | null;
    };

    if (typeof err.status === "number") {
      return { status: "failed", expected, actual: `exit code ${err.status}` };
    }
    if (err.signal) {
      // Includes the timeout case: execSync kills with SIGTERM when it exceeds TIMEOUT_MS.
      return { status: "errored", expected, actual: `terminated by signal ${err.signal}` };
    }
    return { status: "errored", expected, actual: err.message ?? "unknown error" };
  }
}
