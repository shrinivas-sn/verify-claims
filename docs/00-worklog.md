# npm Package Project — Work Log

Audit trail for the discovery → research → synthesis → plan → build process.
Append-only. Every session adds a dated entry. No entry = no work done.

## What this project actually is

**Goal:** the owner learns to design, build, and publish **production-grade npm
packages**, end to end, well enough to ship one that real users depend on.

**Not yet decided:** what the package does. The problem is chosen *after* the
skill is real and *after* proper problem discovery — not assumed up front.

> **Anti-hardcoding rule.** Nothing in this project is fixed to a specific
> product idea until the owner approves it in Step 3. An earlier draft of these
> docs assumed an "AI slop detector" package; the owner correctly rejected that
> as a premature, narrowing assumption and it was removed on 2026-08-15. If any
> future document starts presuming a product, that is a defect — flag it.

## Two tracks, deliberately separate

| Track | Question it answers | Depends on |
|---|---|---|
| **A — Craft** | How do I ship a production-grade npm package? | nothing — can start now |
| **B — Problem** | What is worth building that real users need? | proper discovery, not guessing |

Track A is learnable immediately and is the stated priority. Track B must not
be rushed into, because a package nobody needs teaches nothing about users.

| Status key | Meaning |
|---|---|
| ☐ | not started |
| ◐ | in progress |
| ☑ | done + approved by owner |

## Process gates

| Step | Description | Status | Approved on |
|---|---|---|---|
| 1 | Clarifying questions answered, scope unambiguous | ☑ | 2026-08-15 |
| 2 | Research (packaging landscape + problem sourcing) | ☑ | 2026-08-15 |
| 3 | Synthesis (scope, options, risks, v1 cut) | ☑ | 2026-08-15 |
| 4 | Plan written | ◐ | awaiting approval |
| 5 | Build | ☐ | — |

Rule: no step starts before the previous one is explicitly approved by the owner.

---

## 2026-08-15 — Session 1

**Done**
- Created branch `claude/npm-package-verify-claims` for tracking.
- Created this work log and the Step 1 question set.
- Asked Step 1 round 1.

**Course correction (owner-directed)**
- Owner rejected the AI-slop-detector premise: it was an assumption baked in
  from the initial prompt, not a validated problem. All product-specific
  content deleted; folder renamed `ai-slop-detector` → `npm-package-project`.
- Restated goal: **learn npm package creation properly**; pick the problem later.

**Learned about the owner (evidence, not assumption)**
- Repo shows React 19, TypeScript ~6, Vite 8, Supabase, Electron + electron-builder,
  vitest + Testing Library, PWA, IndexedDB, SQL migrations with a test harness.
- Conclusion: solid intermediate app developer. Teaching starts at packaging,
  publishing, and public API design — not at JS/npm basics.
- Gap being filled is specifically: **library authoring**, which is a different
  discipline from app authoring (public API surface, semver contracts, build
  outputs, consumer environments).

**Owner answers recorded** — see `01-clarifying-questions.md` round 1.

**Round 2 decisions (owner)**
- Practice package first, then the serious one. Pipeline is the lesson.
- Owner types the code; my role is explanation and review, **not authorship**.
- No candidate problem exists yet → Step 2 must do real problem discovery.
- Each package gets a standalone repo; this repo keeps only process/audit docs.

**Round 3 decisions (owner)**
- No package name preference; must be developer-friendly and production grade.
  → Naming *criteria* agreed now, the name itself deferred to Step 3, because a
  name should follow the function rather than precede it.
- **No time constraints.** Quality gates therefore cannot be traded for speed.
- Owner asked why publishing needs a budget → it does not. "Budget" meant time.
  Cost table recorded in `01-clarifying-questions.md`; everything needed is free.

**Step 1: CLOSED.** Scope is unambiguous. Awaiting approval to begin Step 2.

### Step 2 scope, as it now stands
Because no candidate problem exists, Step 2 has two halves:
- **2A — Craft research.** Modern npm package authoring: build tooling, dual
  ESM/CJS output, `exports` maps, type declarations, testing across consumer
  environments, semver and release automation, publish hardening (provenance,
  2FA), and what separates a package developers trust from one they don't.
- **2B — Problem discovery.** Where real, unmet, small-enough package-shaped
  problems actually come from, and a shortlist of candidates with evidence of
  demand — explicitly *not* a search for confirmation of a pre-chosen idea.

**Next**
- Await the owner's go-ahead, then run Step 2 and present findings.
- Do not begin Step 3 synthesis until Step 2 findings are reviewed.

---

## 2026-08-15 — Session 2 (Step 2 executed)

Owner approved Step 2 with "make a proper research properly done".

**Done**
- 2A craft research → `02-research-craft.md`
- 2B problem research → `03-research-problem.md`
- Built two measurement scripts → `tools/probe.py`, `tools/staleness.py`

**Environment limitation (affects confidence, recorded honestly)**
- The egress proxy blocked `docs.npmjs.com`, `nodejs.org`, `github.blog`,
  `arxiv.org`, `esmodules.com` and others. `registry.npmjs.org` was reachable.
- Findings are therefore tagged **[primary]** (verified against the registry) or
  **[secondary]** (web-search summaries only). Secondary claims — notably the
  classic-token revocation date and the `require(esm)` stabilisation — must be
  re-verified against official docs before we build on them.

**Findings that change the plan**
1. **ESM-only is now viable.** `require(esm)` is stable across all supported LTS
   lines and Node 20 is EOL, so dual ESM/CJS publishing is largely obsolete for a
   new package. The hardest thing I expected to teach is mostly gone.
2. **tsup is decaying.** Every 2026 blog recommends it; the registry shows its
   last release was 2025-11-12 (~9 months). `tsdown` moved under the `rolldown`
   org and ships weekly, but is pre-1.0.
3. **A bundler may not be needed at all** for a pure-TS library — `tsc` suffices.
4. **Token-based publishing is dead**; OIDC trusted publishing + provenance is
   the path, and most tutorials now teach an insecure habit.
5. **npm's own quality/maintenance scores are saturated at 1.00 and useless** for
   gap analysis. Real publish dates must be read from the registry document.
   This invalidated the obvious approach to 2B and forced a second instrument.

**2B outcome: no validated problem found.** Predicted in advance; not papered
over. Delivered a method and first measurements instead of a guess.

**Step 2: COMPLETE.** Awaiting owner review before Step 3 synthesis.

### Standing constraints (apply to every later step)
1. No assumed product. The problem is chosen on evidence, in Step 3 at the earliest.
2. Owner writes the package code. I explain and review.
3. Personal-use is not an excuse for lower quality — public standards throughout.
4. Every session appends to this log before work starts and after it ends.

---

## 2026-08-15 — Session 3 (Step 2C: problem extraction)

Owner reported recurring problems in their *build process*, could not recall them
on demand, and asked to be interrogated / have them extracted.

**Done**
- Mined git history and repo docs for recorded friction → `04-extracted-problems.md`
- Put the evidence to the owner and recorded their confirmations
- Ran a landscape check on the resulting candidate

**Owner confirmed**
- Pains: docs/state drift from reality; tests green while production broken
- Cost: "hours of debugging the wrong thing"
- Current handling: manual discipline + home-grown scripts + suffering, all at once

**Extracted root cause (both pains are one problem)**
> A claim about the system is written down, never checked against the running
> system, and drifts silently until it misleads someone into hours of debugging
> the wrong thing.

**Strongest supporting signal:** the owner already hand-built two partial
solutions (`project-state.json`, `scripts/local-db.sh`) — i.e. a bad version of
the package already exists in their repo.

**Landscape:** incumbents (Fiberplane Drift, doc-drift-guard, GitBook, Dosu) all
answer "has the anchored code changed?" via static analysis. None answers "is
this sentence still true?", which requires executing a check. The owner's stale
claims were all of the executable kind ("lint: 0 errors", "the tables are empty").
`markdown-doctest` is dead (2,138 days); `eslint-plugin-markdown` is deprecated;
`runmd` is alive but targets code-example output, not state claims.

**Status: candidate, not a decision.** Risks recorded: active commercial
competition, format design difficulty, adoption friction, and the fact that this
is *not* the trivial practice package already agreed for first build.

**Next:** Step 3 synthesis — sequencing (practice package vs going straight at
this), scope options with tradeoffs, and owner approval before any plan.

---

## 2026-08-15 — Session 4 (Step 3 synthesis)

Owner chose the practice-package-first route ("yes let's practice").

**Done**
- Wrote `05-synthesis.md`: confirmed scope, three practice-package candidates,
  technical approach, risks, v1 cut.
- Checked candidate incumbents on the registry **[primary]**: `largest-remainder`
  last released 2,473 days ago, `apportionment` 1,572 days. Both decaying.

**Recommendation:** candidate A — split a money amount into shares that sum
exactly back, largest-remainder. Chosen because it is a pure function, so all the
learning lands on packaging rather than on debugging logic, and because the owner
already wrote it in SQL (`007_farmers_and_settlements.sql`) after hitting the bug
it prevents.

**Argued against candidate C** (currency formatting): `Intl.NumberFormat` already
does it, and 2B evidence suggests the platform is exactly why that niche's
incumbent went stale.

**Carried forward as a plan task, not a memory:** re-verify the `[secondary]`
Step 2 findings (npm classic-token revocation, `require(esm)` stabilisation)
against official docs before building on them.

**Step 3: awaiting owner approval.** No plan until candidate and approach are
confirmed.

---

## 2026-08-15 — Session 5 (Step 2D: GitHub-wide pattern analysis)

Owner rejected the narrow framing: "don't restrict yourself to such small, think
big — there are a lot of problems and patterns you can identify from my GitHub."

**Done**
- Listed all 37 repos under `shrinivas-sn`; cloned and read `dev-recipes` and
  `budget-buddy` in full → `06-github-wide-patterns.md`

**The owner was right, and it changed the conclusion.** One repo was too small a
sample. Widening it produced a materially better-supported thesis.

**Findings**
1. **Serial rebuilds.** Three personal-finance apps, three wellness/habit apps,
   two each of student portal, price list, portfolio, chest-xray.
   `budget-buddy`'s package name is literally `my-expense-tracker`.
2. **The owner already built the mitigation by hand.** `dev-recipes` exists to
   stop "the next project repeating the same mistakes" — via copy-paste templates.
3. **Hard evidence that lessons don't travel.** `ghar-khata`'s `currency.ts`
   carries a documented fix (a column of amounts not summing to its printed
   total). `budget-buddy`, same domain, has `en-IN` formatting inline in 12+
   places with inconsistent options — including the exact bug `currency.ts`
   prevents. The knowledge existed and did not reach the next project.

**Unifying thesis:** something asserts a fact about a system, nothing checks it,
it goes silently false, and someone loses hours acting on it. Three evidenced
faces: docs vs reality, fixtures vs production, copied templates vs their source.

**Supersedes the Step 3 recommendation.** The money-splitting utility was
correctly sized but wrongly aimed — it taught packaging while teaching nothing
about the owner's actual problem. Recorded as rejected, with the reason.

**New approach to sequencing:** v1 should be the smallest real slice of the big
idea, not an unrelated toy. Keeps the ambition, keeps shippability.

**Next:** owner picks the v1 slice. Then Step 3 is revised and re-approved.

---

## 2026-08-15 — Session 6 (decision)

Owner asked me to make the call: "I don't know you tell me."

**Decision → `07-decision.md`: build `verify-claims`** — a CLI that runs the
command attached to a claim in your markdown and tells you which claims have
gone false. Name checked free on npm; `claimcheck` rejected for two collisions.

**Why this and not a slice of it:** all three faces of the thesis are the same
operation — assert, check, compare. Docs/shell is v1; fixtures/query and
templates/file-compare become plugins on the same engine rather than rewrites.

**Consequence:** the practice package and the real package collapse into one.
The Step 3 money-splitting recommendation is formally withdrawn — correctly
sized, wrongly aimed, and its output would have been discarded.

**Named as the hard part:** the annotation format. It is the only real design
decision in v1 and the only thing that is expensive to change after publishing.
Ship `0.x` until it survives real use on this repo's own docs.

**Next:** on approval, Step 4 — the build plan, written as instructions for the
owner to type, per the standing constraint that I explain and review rather than
author.

---

## 2026-08-15 — Session 7 (Step 4: build plan)

Owner needed several rounds to understand what the package does; explained via
their own `CURRENT_STATE.md`, then a fridge-note analogy. Also clarified a real
confusion: nothing is being built in `ghar-khata-software` — it was used only as
evidence and as a familiar example. The package gets its own repo.

**Verified live during the explanation** (all three claims in `CURRENT_STATE.md`
were true as of today, because the owner reconciled that file a day earlier):
`Version 1.0.0` ✓, `npm run lint` → 0 errors ✓, `npm run build` → passes ✓.
The point stands regardless: nothing keeps them true.

**Done**
- `08-build-plan.md`: ten phases, each shipping before the next starts.

**Phase 0 is re-verification of the `[secondary]` Step 2 findings**, deliberately
placed first because the whole approach depends on them and the research proxy
could not reach official docs.

**Next:** owner approval, then Phase 0.

---

## 2026-08-15 — Session 8 (handoff prepared)

Owner is starting a fresh session to do the build.

**Done**
- Added `README.md` as the entry point for a cold start.
- Renamed the working branch `claude/ai-slop-detection-discovery-50tkzu` →
  `claude/npm-package-verify-claims`. The old name was a leftover from the
  dropped premise and no longer described the work.
- Merged the project docs into `main` (clean fast-forward, additive only — 12
  files, all under `DOCS/npm-package-project/`) so a new session finds them
  without needing to know a branch name.

**Step 4: approved.** Build plan stands. Next action is Phase 0.

---

## 2026-08-15 — Session 9 (repo created, handoff complete)

**Done**
- `shrinivas-sn/verify-claims` created by the owner and pushed to.
  (The Claude GitHub App cannot create repositories — `create_repository`
  returns 403 `Resource not accessible by integration`. It is not a grantable
  permission; repo creation stays manual. Everything after creation works.)
- Seeded the repo: `README.md`, `LICENSE` (MIT), `.gitignore`, and `docs/`
  carrying all planning documents plus the two research scripts.
- Marked this repo's `docs/README.md` as the authoritative copy; the
  `ghar-khata-software` copy is now a historical snapshot.

**Phase 0 status:** repo created ✔ · npm account + 2FA ✘ · re-verification of the
two `[secondary]` findings ✘. Those two remain before Phase 1.

**Next:** finish Phase 0, then Phase 1 — `package.json` written by hand, by the
owner, with each field explained.

---

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
