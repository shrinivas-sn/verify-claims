# 18/08/2026 — v1 build: phases 0-9 shipped, npm package live

<!-- Title date is DD/MM/YYYY (display). The folder name this file lives in stays
YYYY-MM-DD for correct sorting -- don't rename the folder to match the title. -->

## Plan

*(No separate plan phase -- this source is a continuous append-only session log
where each session already narrates intent and outcome together. See Execution.
The plan being executed is DOCS/CONTEXT/08-build-plan.md, approved the prior
session on 2026-08-15.)*

## Execution

<!-- Verbatim from DOCS/00-worklog.md, Sessions 10-21 (2026-08-18). -->

## 2026-08-18 — Session 10 (Phase 0 finished)

**Done**
- Re-verified both `[secondary]` findings against official docs (Claude opened
  the pages directly and read them, since the earlier proxy block that forced
  web-search summaries no longer applies):
  - `docs.npmjs.com/about-access-tokens`: confirms legacy access tokens were
    removed and only granular tokens remain — but dates it **November 2025**,
    not the Dec 9, 2025 date the research had. Substance holds, date corrected.
  - `nodejs.org/api/modules.html`: confirms `require(esm)` is stable (not
    experimental), added in v22.0.0/v20.17.0. Trusted publishing (OIDC) also
    independently confirmed current at `docs.npmjs.com/trusted-publishers`.
  - Both findings can be relied on for the Phase 1+ technical approach.
- Owner created an npmjs.com account (`shrinivas-sn`) and turned on 2FA via
  passkey (device biometric), with one security key also registered.

**Phase 0 status:** repo created ✔ · npm account + 2FA ✔ · re-verification of
the two `[secondary]` findings ✔. **Phase 0 is complete.**

**Next:** Phase 1 — `package.json` written by hand, by the owner, with each
field explained.

---

## 2026-08-18 — Session 11 (ownership constraint flipped, Phase 1 shipped)

**Decision:** Owner changed standing constraint #1. Claude now writes all
package code, ships each phase working, gives a short why-note after. Owner
reviews and approves, doesn't type code. Reason: owner wants to learn the
architecture and shipping process, not syntax-typing; the build plan's own
"done" bar was already "owner can explain every file," not "owner typed every
file." Updated in `README.md` and `08-build-plan.md`.

**Done — Phase 1**
- `package.json` (scoped `@shrinivas-sn/verify-claims`, ESM-only, `engines
  >=22.12`, `files`/`exports`/`bin` wired for a future CLI).
- `tsconfig.json` (`nodenext` module/resolution, strict, `dist` output).
- `src/index.ts`, `src/cli.ts` — stub files, just enough for the build
  pipeline to prove itself; real logic starts Phase 2.
- Installed `typescript` as the only dev dependency so far.
- Verified: `npm run build` emits `dist/*.js` + `.d.ts`; `npm pack --dry-run`
  ships exactly `LICENSE`, `README.md`, `package.json`, `dist/*` — no `src`,
  no `node_modules`, nothing extra. Local Node is 22.15.0, satisfies the
  `>=22.12` floor.

**Phase 1 status:** ✔ complete.

**Next:** Phase 2 — write `parseClaims(markdown)`, the function that finds
`<!-- claim: -->` comments in a markdown file. No CLI yet.

---

## 2026-08-18 — Session 12 (Phase 2 shipped)

**Done — Phase 2**
- `src/parseClaims.ts`: `parseClaims(markdown) → Claim[]`, where a `Claim` is
  `{ command, claimText, line }`. Finds lines matching
  `<!-- claim: <command> -->` (must be the whole line, trimmed), then takes
  the next non-blank line as `claimText`. Skips blank lines in between so a
  comment followed by an empty line still finds its claim.
- Exported from `src/index.ts` as the package's public API surface.
- Verified against a fixture markdown file with 3 claims, an unrelated prose
  paragraph, and a blank line between one comment and its claim text — all 3
  parsed correctly with correct line numbers. (Used a local fixture instead of
  `ghar-khata-software/DOCS` — that repo isn't available in this environment;
  same effect, real-shaped markdown rather than a synthetic one-liner.)

**Phase 2 status:** ✔ complete.

**Next:** Phase 3 — `verify(claim)`, runs the command and compares the exit
code. Simplest rule only: non-zero exit = claim false. No output-matching yet.

---

## 2026-08-18 — Session 13 (Phase 3 shipped)

**Done — Phase 3**
- `src/verify.ts`: `verify(claim) → { status, expected, actual }`, using
  `execSync` with a 60s timeout, `stdio: "ignore"` (no output capture — v1
  doesn't need it, per "don't over-design").
  - `status: "ok"` — exit code 0.
  - `status: "failed"` — non-zero exit code (the claim rule: command ran,
    reported failure).
  - `status: "errored"` — the process didn't produce an exit code at all
    (killed by a signal, e.g. the 60s timeout; or a genuine spawn failure).
- Added `@types/node` as a dev dependency (needed for `node:child_process`
  and `NodeJS.ErrnoException` types — Phase 1 didn't need it yet).

**Finding, worth knowing:** a nonexistent command (typo'd claim annotation)
does **not** hit `errored` on this OS. `execSync` always runs through a shell;
when the shell can't find the command, the *shell* exits non-zero (e.g. 1),
which looks identical to a real command failing. So a typo in a claim's
command currently reports as `failed`, not `errored`. Verified with 3 cases:
exit 0 → ok, exit 1 → failed, nonexistent command → failed (not errored).
Acceptable for v1 (the claim is false either way, and it still surfaces to
the user) — not fixing now, matches "ship the simple rule, use it, then
decide."

**Phase 3 status:** ✔ complete.

**Next:** Phase 4 — CLI. `verify-claims "docs/**/*.md"` → readable report,
exit 1 if any claim failed.

---

## 2026-08-18 — Session 14 (Phase 4 shipped)

**Done — Phase 4**
- `src/cli.ts`: `verify-claims <pattern...>` — globs markdown files, parses
  and verifies claims in each, prints a per-file/per-claim report (✓/✗ with
  line, command, and expected-vs-actual on failure), then a summary line and
  exit code (`0` all passed, `1` anything failed or no files matched).
- Added `tinyglobby` as the one runtime dependency, for glob pattern matching.
  Checked `fs.globSync` (Node's built-in) first — it's still experimental on
  Node 22.15.0 (prints an `ExperimentalWarning` to stderr), so not shippable
  in a CLI. `tinyglobby` confirmed on the real npm registry: small dependency
  footprint (`fdir` + `picomatch`), no bloat.
- Accepts multiple pattern arguments (not just one), mainly so shell-expanded
  globs on Unix still work correctly, not just literal quoted patterns.

**Verified (manual, 4 cases):** no arguments → usage message, exit 1 · glob
matches nothing → error message, exit 1 · one passing + one failing claim in
a file → correct ✓/✗ report, exit 1 · all-passing file → exit 0.

**Phase 4 status:** ✔ complete.

**Next:** Phase 5 — tests against the built artifact (vitest, importing from
`dist/`, not `src/`).

---

## 2026-08-18 — Session 15 (Phase 5 shipped, one real bug found + fixed)

**Done — Phase 5**
- `vitest` added; `npm test` now runs `npm run build && vitest run` — tests
  import from `dist/`, never `src/`, per the plan.
- `test/parseClaims.test.ts`, `test/verify.test.ts`, `test/cli.test.ts` — 11
  tests total, `test/fixtures/*.md` for realistic markdown inputs.
- `verify()` gained an optional second parameter, `timeoutMs` (defaults to the
  existing 60s), so the `errored`/timeout path is actually testable without a
  real 60-second wait. Small, justified addition to make Phase 3 code
  testable — not scope creep.

**Bug found and fixed, surfaced by testing against real files (this repo's
own docs):** `parseClaims` didn't know about fenced code blocks. The example
snippets in `07-decision.md` and `08-build-plan.md` — meant to *illustrate*
the `<!-- claim: -->` syntax inside a ` ```markdown ` block — were being
parsed as real claims and run for real, causing false failures on our own
docs. Fixed: `parseClaims` now tracks fence state (` ``` ` or `~~~`) and skips
claim-matching while inside one. Regression test added. Re-ran the CLI
against `docs/**/*.md` and `README.md` — 0 false positives now.

**Known limitation, not fixing now:** absolute Windows paths (e.g.
`E:\verify-claims\...`) don't work as glob patterns — `tinyglobby` expects
forward slashes and mishandles a `E:/...`-style absolute pattern (resolves to
a garbled path). Not fixing because it's not the documented usage pattern —
`verify-claims "docs/**/*.md"` (relative, forward-slash) is what the README
and all examples show, and that works correctly. Flagged for anyone who tries
an absolute path later.

**Phase 5 status:** ✔ complete.

**Next:** Phase 6 — CI. GitHub Actions on every PR: typecheck → test → lint →
`publint` → `attw` → `npm pack`.

---

## 2026-08-18 — Session 16 (Phase 6 shipped)

**Done — Phase 6**
- `.github/workflows/ci.yml`: runs on every PR and push to `main`. Steps:
  `npm ci` → `npm run typecheck` → `npm run lint` → `npm test` → `npm run
  packcheck`. Used `actions/checkout@v7` / `actions/setup-node@v7` — checked
  GitHub's release API directly rather than assume; v6 exists but v7 is
  actually current for both, so pinned to that instead of an already-
  superseded version.
- Added `eslint` + `typescript-eslint` (flat config, `eslint.config.js`),
  `publint`, and `@arethetypeswrong/cli` (attw) as dev dependencies. Versions
  confirmed against the real npm registry before installing, not assumed.
- New `package.json` scripts: `typecheck` (`tsc --noEmit`), `lint`
  (`eslint .`), `packcheck` (`publint` + `attw --pack . --profile esm-only`).

**One real decision, not a bug:** `attw`'s default profile flags this package
for failing Node10 resolution and for CJS `require()` only getting dynamic
`import()`. Both are **expected consequences of the deliberate ESM-only
design** (Finding 1 in `02-research-craft.md` — the whole reason this project
went ESM-only is `require(esm)` being stable, not that it needed to also
support legacy CJS/Node10 resolution). Used attw's `--profile esm-only`,
built for exactly this case, instead of failing CI on an intended tradeoff.

**Verified:** ran `npm ci` from a clean `node_modules`/`dist`, then all four
CI steps in order, locally — all pass, matching what the workflow will run.

**Phase 6 status:** ✔ complete.

**Next:** Phase 7 — release plumbing (`changesets`).

---

## 2026-08-18 — Session 17 (Phase 7 shipped)

**Done — Phase 7**
- `@changesets/cli` installed (version checked against the real registry
  first). `changeset init` is interactive and can't run non-interactively, so
  wrote `.changeset/config.json` by hand instead — standard schema, `access:
  public` (required: scoped packages default to restricted), `baseBranch:
  main`.
- Added `publishConfig.access: public` to `package.json` — without it,
  `npm publish` would reject a scoped package by default regardless of the
  changesets config.
- New scripts: `changeset` (record a change), `version` (`changeset
  version` — bumps + writes `CHANGELOG.md` from pending changesets),
  `release` (build + `changeset publish`, used in Phase 8's CI job).

**Verified without leaving side effects:** wrote a throwaway demo changeset,
ran `changeset status --verbose` (read-only) — correctly detected the
package and computed a patch bump to `0.1.1`. Deleted the demo file before
committing; real version stays `0.1.0` until an actual release. Re-running
`changeset status` afterward correctly reported "changed packages with no
changesets" — expected: Phases 1-6 predate this tool, so that history has no
changesets, and that's exactly the condition the tool is meant to flag. Not
wiring `changeset status` into CI as a hard gate — that's an enforcement
policy decision beyond what this phase asked for, not needed for the
tooling to work.

**Phase 7 status:** ✔ complete.

**Next:** Phase 8 — publish. GitHub Actions + OIDC trusted publishing, no
`NPM_TOKEN` secret. Requires registering the trusted publisher on
npmjs.com first (package Settings → Trusted Publisher) — owner action,
walked through when we get there.

---

## 2026-08-18 — Session 18 (Phase 8, part 1: first publish, live on npm)

**Realization mid-phase:** trusted publishing (OIDC) can only be registered
against a package that already exists on the registry — npmjs.com's Trusted
Publisher UI lives under an existing package's Settings. A never-published
package has to get its first release some other way. Since my local npm CLI
wasn't authenticated (checked with `npm whoami`, confirmed `ENEEDAUTH`), and
publishing under the owner's identity isn't something I should do even if it
were, **the owner ran the first publish manually**: `npm login` (browser +
passkey), then `npm publish` from the repo root (browser + passkey again,
for the publish-specific 2FA challenge since 2FA is on).

**Done**
- `.github/workflows/release.yml` added: `changesets/action`, triggers on
  push to `main`, opens/updates a "Version Packages" PR when changesets are
  pending, publishes via OIDC (`id-token: write`) when merged — no
  `NPM_TOKEN`. Explicitly upgrades npm in CI (`npm install -g npm@latest`)
  since trusted publishing needs npm CLI ≥11.5.1, not guaranteed from
  `setup-node`'s bundled version.
- **`@shrinivas-sn/verify-claims@0.1.0` is live on npm**, published manually
  by the owner. `npm publish` auto-corrected `bin["verify-claims"]` from
  `"./dist/cli.js"` to `"dist/cli.js"` (cosmetic, npm's preferred form) —
  kept the correction, rebuilt, retested, all still green.
- **Smoke-tested for real**, fresh temp project, actual registry install:
  `npm install @shrinivas-sn/verify-claims` → `npx verify-claims claims.md`
  → correct ✓ output, exit 0. Type declarations present in
  `node_modules/.../dist/index.d.ts`.
- Provenance does **not** show on this release — expected, it only applies
  to OIDC/trusted-publishing releases (confirmed in `docs.npmjs.com` earlier
  in Phase 0). This manual release was the necessary bootstrap; every
  release after Part 2 (trusted publisher registration, next) will have it.

**Phase 8 status:** part 1 (workflow + first publish) ✔ done. Part 2
(register trusted publisher on npmjs.com) — owner action, next.

**Next:** owner registers the trusted publisher on npmjs.com pointing at
`release.yml`, then Phase 9 — dogfood the tool on this repo's own docs.

---

## 2026-08-18 — Session 19 (Phase 8 part 2 + Phase 9 shipped — v1 build done)

**Owner registered the trusted publisher** on npmjs.com (GitHub Actions,
`shrinivas-sn/verify-claims`, workflow `release.yml`, `npm publish` allowed,
no environment restriction — solo maintainer, that gate wasn't needed).

**Phase 9 — dogfood:**
- Fixed the README's own stale claim: the "⚠️ Not built yet" banner was true
  when written, then quietly went false once the package was built and
  published — a live instance of the exact problem this tool exists to
  catch. Replaced with a real published-package banner.
- Added a "## Status" section to `README.md` using the tool's own
  `<!-- claim: -->` syntax against `npm run build` / `npm run lint` / `npm
  test` — the README checks itself.
- `ci.yml` gained a step running the built CLI against this repo's own
  `README.md` + `docs/**/*.md` — genuinely eating the dogfood in CI, not
  just locally.
- Added a real changeset for this (README ships in the npm package
  regardless of the `files` field — always included).

**Two real bugs found and fixed while wiring the actual release, both
things I should have verified instead of trusting memory:**
1. `release.yml` used `changesets/action`'s old input names (`publish`,
   `version`) — v2.1.0 renamed them to `publish-script`/`version-script`.
   Caught by the workflow's own first failed run, fixed immediately.
2. GitHub blocks the default `GITHUB_TOKEN` from creating PRs unless the
   repo explicitly allows it (Settings → Actions → General → Workflow
   permissions). Not a code bug — a repo setting. **Asked the owner for
   explicit confirmation** before changing it (broadens what the token can
   do repo-wide), got yes, flipped it via `gh api`
   (`default_workflow_permissions: write`,
   `can_approve_pull_request_reviews: true`).

**Full pipeline verified for real, not simulated:**
- Pushed → CI green (typecheck, lint, test, packcheck, dogfood check) → 
  `changesets/action` opened a real "Version Packages" PR (`0.1.0` →
  `0.1.1`) with a correct auto-generated `CHANGELOG.md` entry from the
  changeset text.
- **Asked the owner for explicit confirmation before merging** (merging
  triggers a real, public `npm publish`) — got yes, merged.
- CI ran the publish job automatically. Verified on the registry:
  `@shrinivas-sn/verify-claims@0.1.1` live, published by `GitHub Actions
  <npm-oidc-no-reply@github.com>` (confirms real OIDC, not a stored token),
  **and `attestations.provenance` present** (SLSA predicate) — the one thing
  the manual first release couldn't have.

**Phase 8 status:** ✔ fully complete (both parts).
**Phase 9 status:** ✔ shipped. Ongoing per its own definition — "if the
owner stops annotating claims, that's the signal the tool doesn't work even
for its author." Not a one-time task; revisit this call over time.

**All 10 phases of `08-build-plan.md` are now done.** The build-plan's own
"done means" bar: published ✔, installable ✔, types resolve ✔, provenance
visible ✔, and the owner can explain every file — carried by the working
relationship established this session (Claude writes, explains per phase,
owner reviews/approves) rather than the original "owner types it" mechanism.

**Next:** no fixed next action — this was the last planned phase. Natural
next steps if the owner wants them: annotate more real docs, watch whether
claims keep getting added over time (the actual fail-condition test), or
start a genuinely new package/idea using what got learned here.

---

## 2026-08-18 — Session 20 (found and fixed a bug in Phase 0's own verification)

**Owner asked to check an old open PR** (`#1`, "Close Phase 0: re-verify the
`[secondary]` findings", from a separate session, 2026-08-15) to see if it
was still needed before closing it.

**It was not stale — it was a correct, unmerged correction to Session 10's
work.** That PR had independently re-verified the same two Phase 0 findings
and reached a different conclusion on one of them: `require(esm)` is **not**
"Stable" on Node 22.x. Checked this myself directly (`nodejs.org/docs/latest-v22.x/api/modules.html`,
not the `/api/` "latest" page) to confirm before acting on it: the page
shows **"Stability: 1.2 - Release candidate"** for "Loading ECMAScript
modules using require()," on Node 22.23.2 — the newest 22.x patch as of
today. Session 10's "confirmed" verdict checked Node's *latest* docs page
(v26 at the time), which reflects the current release line's status, not
what was true for the actual `engines: >=22.12` floor already shipped in
the published package. That was the bug: verifying a claim against the
wrong version of the source.

**Fixed for real, not just noted:**
- `package.json` `engines.node`: `>=22.12` → `>=22.13` (the unflagged
  minimum on the 22.x line — full "Stable" only exists on 24.15.0+/25.4.0+,
  which the owner chose not to require, trading a wider compatible floor
  against dropping the release-candidate caveat entirely — asked the owner
  directly which floor they wanted before changing anything already
  published).
- `02-research-craft.md` Finding 1: struck through and corrected in place,
  same convention the other PR used, not silently rewritten.
- `08-build-plan.md` Phase 1 snippet and `README.md`'s "must not skip"
  section corrected to match.
- New changeset, rebuilt, retested (typecheck/lint/test/packcheck all
  green), ready for the automated release pipeline to publish as a patch.

**Still open:** the other PR (`#1`) also carries 5 unmerged docs files
(test-case catalogs, a production-readiness checklist, a real-world corpus,
next-steps) never reviewed. Not evaluated yet — separate decision from this
fix, deferred to the owner.

**Status:** engines-floor bug fixed, released as `0.1.2` via the automated
OIDC pipeline (verified live on the registry). PR `#1` not yet closed —
still has unreviewed value (the docs files above).

---

## 2026-08-18 — Session 21 (README rewritten for usability)

**Owner asked for a more user/developer-friendly `README.md`** — the
existing one was a pitch/essay (problem, idea, philosophy) with no
Install, Quick Start, or CLI reference. Someone landing on the repo
wanting to actually use the tool had nothing concrete to follow.

**Done**
- Added `Install`, `Quick start` (annotate → run → wire into CI, with
  real example output), and a `CLI reference` section (exact flag
  behavior, both exit codes explained — previously undocumented).
- Kept all the philosophy sections (problem, idea, why-not-X, honest
  status) but moved them below the practical usage — practical-first
  ordering.
- Renamed "Planned scope for v1" → "Scope" (it's shipped, not planned).
- Added a `Development` section pointing to `docs/00-worklog.md`.
- Verified: `node dist/cli.js "README.md"` still finds and passes all 3
  Status-section claims correctly at their new line numbers.

**Status:** committed and pushed to `main`. No new npm release needed for
this — README content only updates on npm's page at next actual publish,
not on every GitHub push.

**Next:** none required. All optional: decide on stray PR `#1`'s unreviewed
docs files, consider extracting a reusable "ship an npm package" recipe,
or keep dogfooding (the ongoing Phase 9 test).

## Notes

Migrated from DOCS/00-worklog.md during the docs restructure (Phase 4). See
also WORK/2026-08-15/ for the preceding research/decision/plan sessions.
