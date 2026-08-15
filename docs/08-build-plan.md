# Step 4 — Build plan for `verify-claims`

Date: 2026-08-15. Written as instructions for the owner to type. Standing
constraint: the owner writes the code, I explain each decision and review.

Rule for every phase: **it ships working before the next one starts.** No phase
is "mostly done".

---

## Phase 0 — Prep (before any code)

1. **Re-verify the `[secondary]` research.** Step 2 could not reach official docs
   (proxy blocked). Confirm on `docs.npmjs.com` and `nodejs.org`:
   - npm classic tokens are gone; trusted publishing is the current path
   - `require(esm)` is stable on Node 22.12+
   If either is wrong, the approach changes — so this is first, not later.
2. npm account + **2FA on**.
3. New GitHub repo: `verify-claims`. Public. MIT.
4. Node 24 locally (`.nvmrc`).

*Why first: everything downstream assumes these. Cheap now, expensive later.*

---

## Phase 1 — Skeleton that publishes nothing yet

`package.json`, by hand, not `npm init` — the point is understanding each field:

```jsonc
{
  "name": "@shrinivas-sn/verify-claims",
  "version": "0.1.0",
  "type": "module",                 // ESM-only
  "engines": { "node": ">=22.12" }, // floor with stable require(esm)
  "files": ["dist"],                // what actually ships
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" }
  },
  "bin": { "verify-claims": "./dist/cli.js" }
}
```

**Learn here:** `exports` (types first — order matters, first match wins),
`files` vs `.gitignore`, why `main` is legacy, what `bin` does.

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
