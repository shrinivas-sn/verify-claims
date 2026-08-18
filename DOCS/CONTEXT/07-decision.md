# Step 3 (revised) — The decision

Date: 2026-08-15. Supersedes the candidate choice in `05-synthesis.md`; the
technical approach in that document still stands.

The owner asked me to choose. This is the choice, with the reasoning, so it can
be overruled on the reasoning rather than on taste.

---

## Build: a CLI that checks whether claims in your docs are still true

**Name: `verify-claims`.** Free on npm (checked 2026-08-15). Scoped
`@shrinivas-sn/verify-claims` for the first publish; the unscoped name can be
claimed later if it earns an audience.

*(`claimcheck` is taken by a Dafny lemma tool, and "claim check" is also an
established enterprise-messaging pattern — two collisions, so it was dropped.
That is the Step 1 naming criteria being applied, not a hunch.)*

### What it does

You write a claim in a markdown file and attach the command that proves it:

```markdown
<!-- claim: npm run lint -->
Lint: **0 errors**
```

`verify-claims DOCS/**/*.md` runs each command, compares the result to the
claim, prints what is true and what has gone false, and exits non-zero if
anything has. That last part is what makes it usable in CI.

That is the entire v1.

---

## Why this one

**1. It is the engine of the whole thesis, not a fragment of it.**
All three evidenced faces of the problem are the same operation — *assert a
fact, run a check, compare*:

| Face | Is really | Later |
|---|---|---|
| Docs vs reality | claim + shell command | **v1** |
| Fixtures vs production | claim + database query | plugin on the same engine |
| Templates vs their source | claim + file comparison | plugin on the same engine |

Building the engine first means v2 and v3 are additions, not rewrites. Nothing
learned is thrown away.

**2. It attacks the pain you rated worst.** You said the cost is "hours of
debugging the wrong thing." Every quote behind that came from a false claim
nobody had checked — including *"the tables are empty, migrate freely"*, one step
from a destructive migration on real records.

**3. It is genuinely small.** Read a file → find annotated claims → run a command
→ compare → report. No AST parsing, no network, no database drivers, no AI. This
is a few hundred lines. It is publishable in days, which is the point — an
unshipped package teaches nothing about shipping.

**4. The gap is real.** Incumbents (Fiberplane Drift, doc-drift-guard, GitBook)
all answer *"has the anchored code changed?"* by parsing. None answers *"is this
sentence still true?"*, which requires executing something. `markdown-doctest` is
dead at 2,138 days; `eslint-plugin-markdown` is deprecated. **[primary]**

**5. You are its first user, today.** `DOCS/APP-CONTEXT/CURRENT_STATE.md` is full
of exactly the claims it checks — "lint: 0 errors", "build passes", "version
1.0.0", "the live database holds 10 transactions". It pays for itself on your own
repo before a single stranger sees it.

**6. It is timely.** Every repo now carries agent-context files (`CLAUDE.md`,
`AGENTS.md`, state docs) whose staleness misleads both humans and AI agents. The
audience for this is larger in 2026 than it would have been in 2023.

---

## What v1 deliberately excludes

Every one of these is a real feature. None belongs in a first package.

- Database/query checks (v2 — the fixtures face)
- Template drift tracking (v3 — the `dev-recipes` face)
- AST or symbol analysis — that is the incumbents' ground, and not our gap
- Auto-fixing or rewriting claims
- Any AI or LLM involvement
- Config files, plugins, watch mode, a docs site
- Multiple output formats beyond human-readable + a non-zero exit code

Ideas go in `IDEAS.md`, not in the code.

---

## Technical approach — unchanged from `05-synthesis.md`

ESM-only · Node ≥22.12 · `tsc` with no bundler · vitest, testing the built
artifact · `publint` + `@arethetypeswrong/cli` + `npm pack` as publish gates ·
changesets · GitHub Actions with OIDC trusted publishing and provenance.

---

## The hard part, named honestly

**The annotation format is the one real design decision in v1**, and it is where
this can go wrong. It has to be:
- invisible enough that docs stay readable to someone who has never heard of the
  tool (hence an HTML comment — it renders as nothing on GitHub),
- precise enough to express a real check,
- and stable, because changing it later breaks every document anyone has annotated.

Everything else in v1 is mechanical. This is the part to think about before
typing, and the part I will push back on hardest during review.

---

## Risks

| Risk | Handling |
|---|---|
| Format proves wrong after publishing | Ship `0.x` until the format has survived real use on `ghar-khata`'s own docs. Semver permits breaking changes in `0.x`; that is what it is for. |
| Running commands from a file is dangerous | It executes what the repo's own docs say — same trust level as `npm run`. State it plainly in the README; never run anything fetched remotely. |
| Commercial competition (Dosu, GitBook, Mintlify) | They sell hosted products to teams. This is a free CLI that runs in CI. Different buyer; not a head-on fight. |
| Scope creep toward the full thesis | The exclusion list above is the contract. v1 ships before v2 is discussed. |
| Practice package quietly becomes the real one | Here that is *fine and intended* — this is no longer a throwaway. The stated goal (learn to publish properly) is met either way. |

---

## What changed, and why the earlier plan was wrong

`05-synthesis.md` recommended an unrelated money-splitting utility as a
throwaway practice package. It was correctly sized but wrongly aimed: it would
have taught packaging and nothing else, and its output would have been discarded.

Widening the search to all 37 repos showed a problem big enough and specific
enough that its *smallest honest slice* is already the right size for a first
package. So the practice package and the real package collapse into one thing —
which is a better outcome than either plan alone, and it is the owner's push to
"think big" that produced it.

---

## Awaiting

Approval of this choice. On approval: Step 4, the build plan — written as
instructions for the owner to type, since the owner writes the code and I explain
and review.
