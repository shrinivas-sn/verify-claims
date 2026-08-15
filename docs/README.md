# START HERE — npm Package Project

Entry point for any new session. Read this first, then `00-worklog.md`.

---

## The one-line summary

The owner is learning to build and publish production-grade npm packages. The
first package is **`verify-claims`** — a CLI that runs the check attached to a
claim in a markdown file and reports which claims have gone false.

**This repo is the home of that package.** It holds the planning and research;
no package code exists yet. Phase 0 is done — the repo you are reading exists.
Start at **Phase 1** of `08-build-plan.md`, after the Phase 0 re-verification
task below.

> **This copy is authoritative.** The same documents also exist in
> `shrinivas-sn/ghar-khata-software` under `DOCS/npm-package-project/`, where the
> discovery happened. Treat that copy as a historical snapshot and update this
> one. Two copies of a document drifting apart is precisely the problem this
> package exists to catch — noted deliberately rather than pretended away.

---

## Read in this order

| File | What it holds |
|---|---|
| `00-worklog.md` | **The audit trail.** Every session, every decision, why. Append to it. |
| `01-clarifying-questions.md` | Scope questions and the owner's answers |
| `02-research-craft.md` | How npm packages are built in 2026 |
| `03-research-problem.md` | How to find a problem worth solving |
| `04-extracted-problems.md` | The owner's real pains, mined from this repo |
| `06-github-wide-patterns.md` | Patterns across all 37 of their repos |
| `05-synthesis.md` | Scope + technical approach *(its candidate choice is superseded)* |
| `07-decision.md` | **What we're building and why** |
| `08-build-plan.md` | **The 10 phases to follow** |
| `tools/` | Scripts that measure npm niche crowdedness and staleness |

Fastest useful path: this file → `07-decision.md` → `08-build-plan.md`.

---

## Standing constraints — do not violate these

1. **The owner writes the package code.** Your role is to explain each decision
   and review. Do not author it for them. This was chosen deliberately so they
   can repeat the process unaided.
2. **No assumed product.** An earlier draft of this project assumed an "AI slop
   detector" from the initial prompt; the owner rejected it as a premature
   assumption. If a document starts presuming something unvalidated, flag it.
3. **Public quality standards throughout**, even though the first user is the
   owner. "Personal use" is not a licence for lower quality.
4. **No time pressure.** Quality gates are not tradeable for speed.
5. **Append to `00-worklog.md`** before and after each session. No entry = no
   work done.

---

## Where things stand

| Step | Status |
|---|---|
| 1 — Clarifying questions | ☑ done |
| 2 — Research | ☑ done |
| 3 — Synthesis + decision | ☑ done |
| 4 — Build plan | ☑ approved |
| 5 — Build | ◐ Phase 0 partly done (repo created) |

**Next action:** finish Phase 0 of `08-build-plan.md` — re-verify the two
`[secondary]` findings against official docs, and turn on npm 2FA. Then Phase 1.

---

## Two things the next session must not skip

**1. Phase 0 exists for a reason.** Two findings the whole approach rests on —
that npm classic tokens are gone, and that `require(esm)` is stable on Node
22.12+ — came from web-search summaries, because this environment's proxy blocked
`docs.npmjs.com` and `nodejs.org`. They are tagged `[secondary]` throughout.
**Re-verify both against official docs before building on them.** If either is
wrong, the technical approach changes.

**2. The honest state of the case.** The evidence is strong that this problem is
real *for the owner* — it happened twice in this repo, and they had already
hand-built partial fixes. The evidence that *other developers* want this is
**assumed, not gathered**. Nobody has interviewed a user or counted an issue
thread. The project is justified primarily as a vehicle for learning to publish
properly, which holds regardless of adoption. Do not oversell it beyond that.

---

## The fail condition, agreed in advance

After Phase 9 (using the tool on this repo's own docs for a few weeks): if the
owner **stops annotating claims**, that is the signal the tool does not work even
for its author. Stop and pick something else. This is a real test, not a
formality.
