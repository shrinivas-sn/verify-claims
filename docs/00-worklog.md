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
| 4 | Plan written | ☑ | 2026-08-15 (Session 8) |
| 5 | Build | ◐ | Phase 0 done bar npm 2FA (Session 10) |

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

## 2026-08-15 — Session 10 (Phase 0 re-verification)

Continued from the handoff. Task: the two `[secondary]` findings.

**Access changed since Step 2.** `nodejs.org` is now reachable. `docs.npmjs.com`
is still blocked — but it is generated from the public `npm/documentation` repo,
which clones fine, so the primary source was obtainable anyway (commit
`26eacbbb`, 2026-08-13). Recorded because "the proxy blocked it" was accepted
once already and turned out to be only half true.

**Done**
- `09-phase-0-verification.md` — the full record, with sources.
- Corrected `02-research-craft.md` in place, corrections visible (struck-through
  text plus dated notes) rather than silently rewritten.
- Updated `08-build-plan.md` (Phase 0 closed, Phase 1 and Phase 8 amended).
- Added `.nvmrc` → `24`.

**Finding 1 (npm classic tokens) — CONFIRMED.** npm's docs: *"As of November
2025, only Granular access tokens are supported. Legacy access tokens have been
removed."* Our date (2025-12-09) was a month off; the substance was right.

**Finding 2 (`require(esm)` stable on 22.12+) — WRONG.** Unflagged at 22.12.0,
stops warning at 22.13.0, but Node 22's docs still carry `Stability: 1.2 -
Release candidate` today and always will. The stable marker landed in **24.15.0**
and **25.4.0** and was never backported to the 22 line.

**Does the approach change? No — the conclusion outlived its evidence.** ESM-only
is still right; every non-EOL Node can `require()` an ESM package unflagged. But
the `>=22.12` floor was justified by a false premise and is being moved to
`>=22.13.0` (recommendation; `>=24.15.0` is the conservative alternative and is
the owner's call in Phase 1).

**Four things the research had no way to know**, all from the primary source:
1. Trusted publishing needs **npm ≥ 11.5.1 / Node ≥ 22.14.0** — and Node 22
   bundles npm 10.9.8, so **CI must run Node 24+**.
2. **`repository.url` must exactly match the GitHub repo** or the publish is
   rejected. The Phase 1 `package.json` sketch omitted the field entirely; that
   would have failed at Phase 8, eight phases after the mistake.
3. **Staged publishing** (`npm stage publish` + 2FA approval) now exists.
4. 2FA is **mandatory** to publish, not merely recommended.

**Worth noting on its own:** Node 25 — one of the two lines that marked
`require(esm)` stable — is itself already EOL (2026-06-01).

**Phase 0 status:** re-verification ✔ · repo ✔ · `.nvmrc` ✔ · npm 2FA ✘
**(owner-only — cannot be done from a session; it is the one thing left).**

**Not done, deliberately:** no `package.json`. Phase 1 is the owner's to type,
per standing constraint 1.

**Next:** owner enables npm 2FA, then Phase 1 with the two corrections applied.

---

## 2026-08-15 — Session 11 (production-readiness review, pre-Phase 1)

Owner asked "is it production ready" and asked for test cases and agents.

**The premise had to be corrected first: there is no code.** The repo is 17 files
and all of them are documents. Nothing can be production ready. What *can* be
reviewed is whether the plan will produce something that is — so the review was
aimed at the plan and at the design decisions Phases 2–4 will force.

**Method.** Four parallel agents, one per axis. Three hit the account's session /
weekly limit and were reported as failed — but all three had already written
their deliverables to disk before dying, so all four landed. Verified each for
truncation rather than trusting the status.

**Done — four new documents**
- `10-test-cases-parser.md` — ~130 cases for `parseClaims`, plus a 10-row table
  of format decisions to settle before writing any parser code.
- `11-test-cases-executor.md` — execution cases, exit-code semantics, and a
  threat model for a tool that runs shell commands out of markdown.
- `12-production-readiness.md` — gap analysis of the 10 phases against what
  production grade actually requires.
- `13-real-world-corpus.md` — real claims mined from `ghar-khata-software`, the
  fraction v1 can actually verify, and a recommended fixture set.

**Two findings that change the plan rather than decorate it**
1. **The annotation format has no extension point.** Everything after `claim:` is
   the command, so there is nowhere for an option to go. Phase 3 already defers
   the output-matching decision, which makes a future option likely. Reserve the
   options field and `<!-- /claim -->` now — it is a format break otherwise, and
   the format is the one thing that is expensive to change after publishing.
2. **The dominant failure mode is silent non-recognition.** A dozen catalogued
   near-misses produce no claim and a green exit code. For a tool whose purpose is
   to say "this document is lying to you", silence-plus-green is the worst
   possible output. `parseClaims` should return `{ claims, problems }`.

**A `[secondary]` tag closed as a side effect.** The packaging review tagged npm's
72-hour unpublish window `[unverified]`, on the grounds that `docs.npmjs.com` is
blocked. It is — but its source repo clones fine, which Session 10 had already
established. Verified and retagged `[primary]`. Recording it because the failure
was inherited: a limitation was carried forward from a previous session instead of
being re-tested. That is the same class of error as a stale claim in a document.

**Not done, deliberately:** still no code, no `package.json`, no test files. The
agents produced *specifications* to implement from, per standing constraint 1.
A test suite handed over ready-made would defeat the point of the project.

**Next:** owner settles the format decision table in `10-test-cases-parser.md`
§15, enables npm 2FA, then Phase 1.

**Follow-up in the same session.** Owner asked for a plain-terms summary and then
for the docs to be brought up to date. Two observations drove what followed: the
ten format decisions — now the gating item for the whole build — were buried in
§15 of a 998-line technical catalogue, and the entry-point README still pointed a
cold start at `07-decision.md`.

- Added `14-next-steps.md`: the three actions in order, and the ten decisions
  restated in plain language with a recommended answer each, so they can be
  approved in one go or overridden individually.
- Pointed `README.md` at it — top banner, index row, fastest-useful-path, and the
  next-action block.
- Wired the gate into `08-build-plan.md` Phase 2 itself, rather than leaving it in
  a separate review document. A gate recorded only in the document that discovered
  it is a gate the next session skips. Phase 2's ships-when now also points at the
  fixtures already selected in `13-real-world-corpus.md`.
- Corrected the Phase 2 signature in the plan to `{ claims, problems }`.
