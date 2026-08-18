# Worklog overview — project framing (not date-specific)

<!-- Verbatim from the top of DOCS/00-worklog.md (lines 1-49), before the
first dated session entry. Split out during the docs restructure because it
describes the project's tracks/process gates, not a single dated session. -->

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
