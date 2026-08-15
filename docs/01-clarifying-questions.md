# Step 1 — Clarifying Questions

## Round 1 — asked 2026-08-15, answered 2026-08-15

Round 1 was written against a wrong premise (a pre-assumed "AI slop detector"
package). The owner rejected the premise. Questions that only existed to serve
that premise are struck out as **VOID** rather than deleted, so the record shows
what was asked and why it stopped mattering.

### Q0 — Repo home
New standalone repo vs subfolder of `ghar-khata-software`?
> **Answer: still open.** Carried to round 2.

### Q1 — Audience
> **Answer:** Primarily the owner's own usage. The owner wants a personal
> toolkit of custom packages for problems they hit. **But** if a package is
> genuinely production grade and solves a real problem, it should be public too.
>
> *Implication:* build to public standards from day one. "Personal use" is not a
> licence for lower quality — it is the same bar, just a smaller initial audience.

### Q2 — Input shape — **VOID** (product-specific)
> **Answer:** "No idea." Correctly so — undecidable before a problem is chosen.

### Q3 — Output shape
> **Answer:** No strong view; terminal output seems fine. Explicitly stated the
> real gap: **"I don't know anything about how to create packages and I want to
> learn proper about package creation."**
>
> *Implication:* this is the actual project. Output format is a downstream detail.

### Q4 — Execution model
> **Answer:** Guessed CLI, but deferred to me. Deferred to Step 2 research.

### Q5 — Accuracy bar — **VOID** (product-specific)
> **Answer:** "Don't know."

### Q6 — Reference examples — **VOID** (product-specific)
> **Answer:** Not given; premise dropped before it mattered.

### Q7 — Tech constraints
> **Answer:** **Node is the preferred target.**

### Q8 — Effort and publishing
> **Answer:** **Publishing to npm is a primary goal**, and specifically a
> package that *real users use*, that *helps them*, and that is *differentiated*
> from what already exists. Time budget not yet given → round 2.

### Q9 — Why
> **Answer:** Guard the owner's own work, **and** review others' work if the
> package is production grade.

### Owner's overriding instruction
> "Don't take anything hardcoded — you should be dynamic and adaptable."
>
> Recorded as a standing constraint on every later step. See the anti-hardcoding
> rule in `00-worklog.md`.

---

## Round 2 — asked 2026-08-15

Fewer questions, because most of round 1 collapsed into one real goal. These are
the ones where a wrong guess would send the whole project the wrong way.

### Q10 — Learning path
> **Answer: small practice package first.** Ship one tiny but real package to
> npm, where the product is deliberately trivial and the *pipeline* is the
> lesson. Only then attack the serious package.
>
> *Implication:* packaging skill and product judgement are learned separately,
> so a mistake in one is never mistaken for a mistake in the other.

### Q11 — Teaching mode
> **Answer: owner types, I explain each decision.** Optimises for the owner
> being able to repeat the process unaided, which is the whole point.
>
> *Implication:* my role in Step 5 is explanation and review, not authorship.
> I must not "helpfully" write the package. Standing constraint.

### Q12 — Time budget
> **Answer: still open.** Carried to round 3.

### Q13 — Problem sourcing
> **Answer: nothing specific comes to mind.** No candidate problem extracted
> from existing work.
>
> *Implication:* Step 2 must include genuine problem discovery. There is no
> shortcut here and no assumed product. This is exactly the trap the owner
> warned about, so it stays open until evidence closes it.

### Q0 (repeat) — Repo home
> **Answer: new standalone repo.** Each published package gets its own repo
> (own README, issues, CI, releases, npm linkage).
>
> *Implication:* `ghar-khata-software` keeps only the process/audit docs;
> package code lives elsewhere. Name still needed → round 3.

---

## Round 3 — asked 2026-08-15

Last two blanks before scope is locked.

### Q14 — Name for the practice package
> **Answer: no preference**, but it must be good, easy for developers to find
> and track, and production grade.
>
> *Resolution:* a name cannot be chosen before the package's function is chosen —
> a good package name describes what the thing does. So naming is **deferred to
> Step 3**, and the naming *criteria* are settled now instead (below). This is
> the correct order; picking a clever name first is how packages end up with
> names that lie about their contents.

#### Naming criteria (agreed, applies to every package in this project)
1. **Descriptive over clever.** A developer scanning search results should be
   able to guess what it does. `date-fns` good, `moment` weak, `lodash` only
   works because it won years ago.
2. **Scoped for the practice package** (`@shrinivas-sn/…`). Unscoped good names
   are largely taken, and scoping avoids a pointless name hunt. Free to publish
   publicly as long as `--access public` is set.
3. **Unscoped is reconsidered for the serious package**, where discoverability
   genuinely matters.
4. **Lowercase, hyphenated, no cute misspellings**, no leading `node-` or
   trailing `-js`. Must not typo-squat an existing package.
5. Repo name matches package name so npm ↔ GitHub tracking is obvious.

### Q15 — Time budget
> **Answer: no time constraints.** Owner also asked why any *budget* is needed
> to publish, having read "budget" as money.
>
> *Clarification recorded:* the question meant **time**, not money. Publishing
> is free. See the cost note below.
>
> *Implication:* with no deadline pressure, the practice package should be done
> properly rather than fast, and quality gates cannot be skipped for schedule.

#### Cost note — what publishing actually costs
| Thing | Cost |
|---|---|
| npm account | Free |
| Publishing **public** packages (scoped or not), unlimited | **Free** |
| GitHub public repo, issues, releases | Free |
| GitHub Actions CI on public repos | Free |
| npm provenance / trusted publishing | Free |
| 2FA on the npm account | Free — and should be on |
| npm **private** packages | Paid (~$7/user/month) — **not needed here** |
| Custom docs domain | Optional, only if wanted later |

Nothing in this project requires paying for anything. The only real cost is
attention.
