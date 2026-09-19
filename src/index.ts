import { readFileSync } from "node:fs";

// Read at runtime so the changesets bump in package.json is the only place the number lives.
const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };
export const VERSION = pkg.version;
export { parseClaims } from "./parseClaims.js";
export type { Claim } from "./parseClaims.js";
export { verify } from "./verify.js";
export type { VerifyResult } from "./verify.js";
