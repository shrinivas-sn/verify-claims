import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseClaims } from "../dist/index.js";

describe("parseClaims", () => {
  it("finds every claim, pairing each with the next non-blank line", () => {
    const markdown = readFileSync(
      new URL("./fixtures/mixed.md", import.meta.url),
      "utf8",
    );

    expect(parseClaims(markdown)).toEqual([
      {
        command: 'node -e "process.exit(0)"',
        claimText: "Passing check: **true**",
        line: 3,
      },
      {
        command: 'node -e "process.exit(1)"',
        claimText: "Failing check: **true**",
        line: 8,
      },
    ]);
  });

  it("returns an empty array when there are no claims", () => {
    const markdown = readFileSync(
      new URL("./fixtures/no-claims.md", import.meta.url),
      "utf8",
    );

    expect(parseClaims(markdown)).toEqual([]);
  });

  it("ignores a claim-shaped comment that isn't alone on its line", () => {
    const markdown = 'text <!-- claim: npm test --> more text\n';
    expect(parseClaims(markdown)).toEqual([]);
  });

  it("ignores claim comments shown as example syntax inside a fenced code block", () => {
    const markdown = [
      "Docs showing the format, not making a real claim:",
      "",
      "```markdown",
      "<!-- claim: npm run lint -->",
      "Lint: **0 errors**",
      "```",
      "",
      "<!-- claim: npm test -->",
      "Tests: **pass**",
    ].join("\n");

    expect(parseClaims(markdown)).toEqual([
      { command: "npm test", claimText: "Tests: **pass**", line: 8 },
    ]);
  });
});
