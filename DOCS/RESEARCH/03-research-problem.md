# Step 2B — Problem Research: where a package worth publishing comes from

Date: 2026-08-15.

**Headline: no validated problem was found, and I am not inventing one.**
That was flagged as a real possible outcome before Step 2 started, and it is what
happened. What this half produced instead is a *working instrument* for finding
one, plus the first measurements from it. That is a better deliverable than a
guess dressed as a recommendation.

---

## Finding 1 — The honest scale of the problem

npm holds roughly **1.3 million packages**. Concrete crowdedness from the
registry search API **[primary]**:

| Query | Matching packages |
|---|---|
| `keywords:cli` | 100,207 |
| "offline sync indexeddb" | 59,509 |
| "sql migration testing postgres" | 147,815 |
| "excel export typescript" | 569,435 |

"I'll think of an idea and check if it exists" does not survive contact with
these numbers. Something exists. The question is never *does it exist* but
**is the incumbent actually serving people well.**

---

## Finding 2 — npm's own quality signals are broken. Don't trust them.

This one is mine, from primary measurement, and it invalidates the obvious
approach.

The registry search API returns a `score.detail` object with `quality`,
`popularity`, and `maintenance`, plus an `updated` timestamp. The intuitive move
is to sort by low maintenance score to find neglected packages.

**It does not work.** Measured across every niche probed, `quality` and
`maintenance` came back **1.00 for essentially every package**, and `updated` sat
at 0–1 days for packages that had not shipped a release in years. The scores are
saturated; `updated` tracks metadata touches, not publishes.

Relevance is also poor — `@typescript-eslint/project-service` ranked in the top
results for "excel export typescript".

**Correct method:** ignore the scores. Take the search hits, then read each
package's real publish timeline from its registry document
(`registry.npmjs.org/<pkg>`, the `time` object, excluding `created`/`modified`).
That gives true last-release dates. Scripts implementing both passes are in the
session scratchpad and should be moved into the package repo when it exists.

---

## Finding 3 — The measurable opportunity pattern

The only gap a newcomer can realistically enter is a **decaying incumbent**: high
usage, no recent releases. Real examples found **[primary]**:

| Package | Weekly downloads | Last release |
|---|---|---|
| `accounting` | 416,630 | **4,412 days** (~12 years) |
| `currency-formatter` | 131,917 | **1,780 days** (~5 years) |
| `react-currency-format` | 23,470 | 1,661 days |
| `pg-node-migrations` | 129,349 | 1,578 days |

400k weekly downloads on a package untouched for twelve years is a real,
measurable signal: people need the function, nobody is tending it.

**But read the counter-evidence honestly.** Two reasons a package can be old and
still fine:
1. **It's finished.** Small pure-function libraries genuinely reach done. No
   commits ≠ neglect.
2. **The niche moved on.** `Intl.NumberFormat` is now built into every runtime,
   which is likely *why* `accounting` stopped — its job went to the platform.
   Rebuilding it would be rebuilding something the browser already does.

So staleness is a **screening filter, not a verdict**. Every candidate it surfaces
needs the follow-up question: *is this stale because it's done, because the
platform ate it, or because it's genuinely abandoned while still needed?* Only
the third is an opportunity.

---

## Finding 4 — What actually differentiates a new package

Given saturation, "same thing but mine" fails. The differentiators that are
defensible for a solo author:

1. **Maintenance responsiveness.** Research on npm maintainer responsiveness
   found a large share of issues go unanswered and many advisories unpatched.
   Answering issues within days is a genuine, if unglamorous, edge — and it is
   the one thing a solo author can beat big projects at.
2. **Types correctness.** A large fraction of packages fail `attw`. Being the one
   in a niche whose types resolve in every mode is a real reason to switch.
3. **Modern packaging.** ESM-only, small dep tree, provenance-signed. Post-2025
   supply-chain worms, dependency count is now a *selection criterion*, not a
   detail.
4. **Scope discipline.** Doing one thing completely beats doing eight things at
   60%. This is the main advantage a solo author has over a committee.

Note what is *not* on this list: novelty. Almost no successful package was a new
idea. They were existing ideas done properly.

---

## Finding 5 — Where to actually look next

"Scratch your own itch" is the historically dominant origin story for successful
libraries, and the reasoning holds: you can only judge whether a solution is good
if you personally feel the problem. You answered that you have no candidate
itch — which is honest, and means we look in the places where itches are
*recorded* rather than remembered:

1. **Your own repo's friction.** Not "what did I wish existed" (you already said
   nothing comes to mind) but the empirical version: which files did you rewrite
   most, and where did you write awkward glue? Git history answers this without
   you having to introspect. **Cheapest next step, and I can run it.**
2. **Stale-but-used sweep.** Run the instrument across niches you know, collect
   every package over ~1M downloads with no release in 2+ years, then apply the
   Finding-3 triage.
3. **Issue archaeology.** In a niche you know, read the incumbent's most-reacted
   open issues. Long-open, heavily-upvoted issues are demand with a receipt.
4. **The internal-tool test.** Something you'd build for yourself anyway, so it
   ships regardless of whether strangers adopt it. Removes the "nobody used it"
   failure mode entirely.

---

## Recommendation for sequencing

**Do not pick the serious problem now.** You already decided the practice package
comes first, and that decision looks even better after this research: the
practice package's product should be *deliberately trivial* precisely so that
zero judgement is spent on it.

Run problem discovery **during** the practice build, not before it. By the time
you've published once, you'll read these signals better — and you'll have felt
which parts of packaging are painful, which is itself a source of package ideas.

---

## Open question this raises

The practice package still needs *something* to do. It should be:
- small enough to finish in days,
- real enough that publishing it isn't a lie,
- boring enough that no product judgement is wasted on it,
- and ideally something you personally would install.

I have deliberately **not** chosen it — that's a Step 3 decision and it's yours.
I'll bring 3–4 candidates with tradeoffs when you approve Step 3.

---

## Sources

- [Small World with High Risks: A Study of Security Threats in the npm Ecosystem (USENIX Security '19)](https://www.usenix.org/system/files/sec19-zimmermann.pdf) — ecosystem concentration, 1.3M package scale
- [What About Our Bug? A Study on the Responsiveness of NPM Package Maintainers](https://arxiv.org/pdf/2511.04986) — maintainer responsiveness *(abstract via search; PDF blocked by egress, re-verify)*
- [The npm faker package and the unexpected demise of open source libraries — Snyk](https://snyk.io/blog/npm-faker-package-open-source-libraries/)
- [Lessons from npm's Security Failures — OneUptime](https://oneuptime.com/blog/post/2025-09-09-lessons-from-npm-security-failures/view)
- [Scratch your own itch — Open Source Development Course](https://code-maven.com/osdc/osdc-collab-dev/scratch-your-own-itch.html)
- [The Itch to Scratch Model: The Foundation of Open Source Success, and Failure](https://www.robotscooking.com/itch/)
- **[primary]** `registry.npmjs.org` search + package documents, queried 2026-08-15
