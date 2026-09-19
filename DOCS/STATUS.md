# STATUS

**As of 19/09/2026.** Project: `E:\verify-claims`, package `@shrinivas-sn/verify-claims`.

## Where things stand

- **v0.1.2 is published on npm.** All 10 v1 build phases finished 18/08/2026.
- **An audit of v0.1.2** (4 bugs, 4 gaps, 1 security note, 3 edge cases) was checked against
  the code on 19/09. Findings and verification table:
  `DOCS/RESEARCH/09-codebase-audit-v0.1.2.md`.
- **Live plan: `/PLAN.md`.** 9 tasks (~59 min) to fix the in-scope findings and ship
  `0.2.0`. Not started. The branch `fix/audit-findings` doesn't exist yet.
- Baseline on `main`: `npm test` passes 11/11.

## Constraints to keep

- The v1 scope contract (`DOCS/CONTEXT/07-decision.md`) rules out output matching, so audit
  Gap 2 is deliberately **not** being fixed. Gap 3 (cwd) and Gap 4 (parallel) are deferred.
  Reasons are in PLAN.md → Decisions.
- No new runtime dependencies. Node floor `>=22.13`. Version bumps only via changesets.
- Tests import the built `dist/`, so always go through `npm test`.

## Verification limits

- The Task 7 test (unreadable file) needs `chmod`. It is skipped on Windows and only
  really runs in CI (ubuntu).
- The Task 8 test (backslash paths) is Windows-only. It runs locally and is skipped in CI.

## Blockers / needs the user

- Pushing the branch, opening the PR and merging: user's call. Merging the Changesets
  "Version Packages" PR publishes to npm, which can't be undone.

## Next up (start here)

1. Open `/PLAN.md`, run Phase 0 (`git checkout -b fix/audit-findings`, `npm test` baseline),
   then Task 1 (`VERSION` reads package.json). Watch the 40-minute cut line before Task 6.
