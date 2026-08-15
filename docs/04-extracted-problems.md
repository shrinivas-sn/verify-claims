# Step 2C — Problems extracted from the owner's own repo

Date: 2026-08-15. Added after the owner said they hit recurring problems while
*building*, but could not recall them on demand and asked for them to be
extracted from evidence.

Method: mine `git log` (subjects, bodies, file churn) and the repo's own
documents for recorded friction, rather than relying on memory. Everything below
is quoted from the owner's own commits and docs.

---

## Evidence

### Signal 1 — Documents drift from reality, then mislead

File churn, excluding source: `TASK_BOARD.md` (16 revisions), `CURRENT_STATE.md`
(11), `NEXT_SESSION_PLAN.md` (8), `PRODUCTION_READINESS_REVIEW.md` (7),
`project-state.json` (6). A whole commit is titled *"Reconcile the docs with the
live project"*.

In the owner's own words:

> "The handoff docs had drifted from measurable reality, in ways that would
> [mislead]"

> "…against guesses. **Inspecting the project changed what it should say.**"

> "Earlier notes saying 'nothing has ever been exercised' and 'the tables are
> empty, **migrate freely**' are obsolete — re-check row counts before any
> destructive migration."

> "The Tailwind token mismatch was listed as open. It was fixed in [an earlier
> commit]."

That third quote is the sharpest: a stale document was one step away from
authorising a destructive migration against a database holding real user records.

### Signal 2 — Tests green while production was broken

> "The harness passed **53/53 while production was broken**, because
> `tests/000_supabase_stub.sql` installed pgcrypto into public…"

> "…under one lesson: **check with a query, and make the fixture match
> production.**"

### Signal 3 — Silent failure as a recurring theme

Across unrelated commits, the same word keeps appearing:

> "Fixes **196 Tailwind classes that emitted no CSS**"
> "`text-textMain` looked correct **by accident**"
> "**silently** reopened the cross-household snapshot hole that 005 closed"
> "the 1000-row response cap instead of **silently** truncating"
> "restore refuses to guess … instead of **silently** reassigning"

### Owner's answers when shown this
- Confirmed pains: **docs/state drift** and **tests green / production broken**.
- Cost: **"hours of debugging the wrong thing."**
- Current handling: all of manual discipline, home-grown scripts, and suffering.

---

## The unifying root cause

The two confirmed pains are the same problem wearing different clothes:

> **A claim about the system is written down somewhere, is never checked against
> the running system, and drifts silently until it misleads someone into hours of
> debugging the wrong thing.**

- Docs drift = prose claims vs. actual project state.
- Fixture drift = test setup claims vs. actual production environment.

In both cases the failure is *silent* and the cost is *misdirection*, which is
worse than a crash: a crash tells you where to look.

Note the owner already built two partial solutions by hand — `project-state.json`
and `scripts/local-db.sh` — which is the strongest possible signal under the
Step 2B criteria: **they have already written a bad version of the package.**

---

## Landscape check — is this already solved?

`registry.npmjs.org` search proved useless for conceptual queries (it returned
`playwright` and `aws-cdk` for "documentation drift"), reconfirming the 2B
finding. Checked known tools by name instead **[primary]**:

| Tool | State |
|---|---|
| `markdown-doctest` | last release **2,138 days** ago — effectively dead |
| `doctest` | 962 days |
| `eslint-plugin-markdown` | **DEPRECATED** |
| `codedown` | 237 days — extracts code blocks only |
| `runmd` | 110 days — alive; executes code blocks and writes output back |
| `remark-validate-links` | 539 days — links only |

And from the wider ecosystem **[secondary]**:

| Tool | Approach | Limitation for this problem |
|---|---|---|
| Fiberplane **Drift** | anchors markdown to source via tree-sitter AST fingerprints | detects *code changed*, not *claim is false* |
| **doc-drift-guard** | checks doc examples reference real symbols | Python only; symbol existence only |
| **GitBook** drift detection | regenerates docs from OpenAPI specs | enterprise, spec-driven |
| **Dosu**, **Mintlify** | commercial, AI-assisted doc upkeep | paid products, not a library |

**The gap.** Every incumbent answers *"has the code this prose points at
changed?"* — a static question, answered by parsing. None answers *"is this
sentence still true?"* — a dynamic question, answerable only by **running
something and comparing the result**.

The owner's stale claims were exactly the dynamic kind:
- "lint: **0 errors**" → answered by running the linter
- "the tables are **empty**" → answered by a query
- "migrations 001–004 and 006 **are applied**" → answered by a query
- "build **passes**" → answered by building
- "the live database holds **10 transactions**" → answered by a query

No AST parse can verify any of those. That is the unoccupied ground.

---

## Status

**This is a candidate, not a decision.** It is the strongest lead found so far:
it is the owner's own repeatedly-evidenced itch, it has a plausible unoccupied
gap, and it is timely — every repo now carries agent-context files
(`CLAUDE.md`, `AGENTS.md`, state docs) whose staleness actively misleads both
humans and agents.

Risks to weigh in Step 3, honestly:
1. **Commercial competition is active** and better resourced (Dosu, GitBook, Mintlify).
2. **Format design is the hard part** — how a claim binds to its check, without
   the docs turning into code.
3. **Adoption friction** — it asks people to change how they write docs, which is
   historically a hard sell.
4. **It is not the "trivial practice package"** the owner already agreed to build
   first. Sequencing must be decided deliberately, not by enthusiasm.
