# Step 4 — Build plan for `verify-claims`

Date: 2026-08-15. Written as instructions for the owner to type. Standing
constraint: the owner writes the code, I explain each decision and review.

Rule for every phase: **it ships working before the next one starts.** No phase
is "mostly done".

---

## Phase 0 — Prep (before any code)

1. ☑ **Re-verify the `[secondary]` research.** Done 2026-08-15 →
   `09-phase-0-verification.md`.
   - npm classic tokens are gone; trusted publishing is the current path —
     **confirmed** (date corrected: November 2025, not 2025-12-09).
   - `require(esm)` is stable on Node 22.12+ — **wrong as written.** Unflagged at
     22.12, quiet at 22.13, but *never* marked stable on the Node 22 line; that
     happened in 24.15.0 and 25.4.0 only. **The approach does not change** —
     ESM-only is still viable — but the `engines` floor in Phase 1 does.
2. ☐ npm account + **2FA on**. *Owner-only — cannot be done from a session.*
   Now mandatory rather than good practice: npm requires 2FA (or a bypass-2FA
   granular token) to publish any package.
3. ☑ New GitHub repo: `verify-claims`. Public. MIT.
4. ☑ Node 24 locally (`.nvmrc` → `24`). Also required in CI at Phase 8: trusted
   publishing needs npm ≥ 11.5.1, and Node 22 still bundles npm 10.9.8.

*Why first: everything downstream assumes these. Cheap now, expensive later.*
*Vindicated — one of the two was wrong.*

---

## Phase 1 — Skeleton that publishes nothing yet

`package.json`, by hand, not `npm init` — the point is understanding each field:

```jsonc
{
  "name": "@shrinivas-sn/verify-claims",
  "version": "0.1.0",
  "type": "module",                  // ESM-only
  "engines": { "node": ">=22.13.0" },// first release where require(esm) is quiet
  "files": ["dist"],                 // what actually ships
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "bin": { "verify-claims": "./dist/cli.js" },
  "repository": {                    // must match the repo exactly — see below
    "type": "git",
    "url": "git+https://github.com/shrinivas-sn/verify-claims.git"
  }
}
```

**Learn here:** `exports` (types first — order matters, first match wins),
`files` vs `.gitignore`, why `main` is legacy, what `bin` does.

**Two changes from Phase 0's verification — read the reasons, don't just copy:**

- **`engines` was `>=22.12`, with the reason "floor with stable `require(esm)`".**
  That reason was false. 22.12 unflags the feature but still prints an
  `ExperimentalWarning` to a CommonJS consumer's stderr; **22.13.0** is the first
  quiet release. It is *never* marked stable on the Node 22 line — that is
  24.15.0 and 25.4.0. `>=24.15.0` is the defensible alternative if you would
  rather not ship against a release-candidate feature at all; it costs you Node
  22 LTS, which is supported until 2027-04-30. **This one is your call.**
- **`repository` was missing entirely, and it is not optional.** npm rejects a
  trusted-publishing publish whose `repository.url` does not exactly match the
  GitHub repository. Omitting it means Phase 8 fails at the last step, for a
  reason the error message will not make obvious.

Then `tsconfig.json` (`"module": "nodenext"`), and `tsc` as the only build step.

**Ships when:** `npm run build` emits `dist/`, and `npm pack --dry-run` shows
only what you intend.

---

## Phase 2 — Find claims in a markdown file

One function. No CLI yet, no running anything.

```
parseClaims(markdown) → [{ command, claimText, line }]
```

Format (the one real design decision — think before typing):

```markdown
<!-- claim: npm run lint -->
Lint: **0 errors**
```

Chosen because an HTML comment renders as nothing on GitHub, so docs stay
readable to people who don't have the tool.

**Learn here:** designing a public API, naming, what to export vs keep private.

**Ships when:** tested against real files from `ghar-khata-software/DOCS`.

---

## Phase 3 — Run the check and compare

```
verify(claim) → { status: "ok" | "failed" | "errored", expected, actual }
```

Start with the simplest useful rule: **run the command; non-zero exit = claim
false.** That alone covers "lint: 0 errors" and "build passes".

Do **not** add output-matching yet. Ship the simple rule, use it, then decide.

**Learn here:** child processes, exit codes, timeouts, not over-designing v1.

---

## Phase 4 — CLI

`verify-claims "DOCS/**/*.md"` → readable report, **exit 1 if any claim failed**.

That exit code is what makes it work in CI. It is the feature.

**Learn here:** `bin`, shebang, argument parsing, writing for humans *and* CI.

---

## Phase 5 — Tests against the built artifact

vitest, importing from `dist/`, **not** `src/`.

**Learn here:** why source-importing tests miss most packaging bugs.

---

## Phase 6 — CI

GitHub Actions on every PR: typecheck → test → lint → `publint` → `attw` →
`npm pack`.

**Learn here:** the two validators, and the class of bugs they catch.

---

## Phase 7 — Release plumbing

`changesets`. Write a changeset per change; decide patch/minor/major yourself
each time.

**Learn here:** semver as a judgement call, and changelogs people can read.

---

## Phase 8 — Publish

GitHub Actions + **OIDC trusted publishing**. No `NPM_TOKEN` secret anywhere.

Verified requirements (2026-08-15, `09-phase-0-verification.md`) — get these
wrong and the failure arrives at the last possible moment:

- `permissions: id-token: write` in the workflow. Without it there is no OIDC token.
- **Node 24+ in CI.** Trusted publishing needs npm ≥ 11.5.1; Node 22 bundles 10.9.8.
- `repository.url` in `package.json` matching the repo exactly (Phase 1).
- Register the trusted publisher on npmjs.com *before* the first publish, with
  the **workflow filename** exactly right — npm does not validate the config when
  you save it, only when you publish.
- Since 2026-05-20 you must also pick the **allowed actions** (`npm publish`,
  `npm stage publish`, or both).
- **Do not add `--provenance`.** Provenance is automatic under trusted publishing
  from a public repo. Tutorials that add the flag predate this.

Optional, and worth understanding even if you skip it: **staged publishing** —
CI runs `npm stage publish`, then you approve with 2FA before the version goes
public. Combined with "require 2FA and disallow tokens", it is npm's strongest
recommended posture.

**Ships when:** `npm i @shrinivas-sn/verify-claims` works in a fresh project,
types resolve, and provenance shows on the npm page.

---

## Phase 9 — Dogfood

Annotate the real claims in `ghar-khata-software/DOCS`, add the check to that
repo's CI, and live with it.

**This is the phase that decides v1.0.0.** The format survives real use, or it
changes while still in `0.x` — which is what `0.x` is for.

---

## Done means

Published, installable, types resolve, provenance visible, **and the owner can
explain every file in the repo.** The last clause is the actual goal.

## Not in v1

Database checks · template drift · output matching · auto-fix · AI · config
files · watch mode · plugins · docs site. Ideas go in `IDEAS.md`.
