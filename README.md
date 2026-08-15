# verify-claims

**Your docs make factual claims. Nothing checks them. This does.**

> ⚠️ **Not built yet.** This repo currently holds only the planning and research.
> See [`docs/README.md`](./docs/README.md) to pick the work up.

---

## The problem

A doc says:

```markdown
Lint: 0 errors
```

True the day it was written. Is it true now? Nobody knows — the only way to find
out is to stop and run the linter, so mostly nobody does. The sentence quietly
goes false and sits there being trusted.

That is not hypothetical. From the project this tool came out of:

> "Earlier notes saying 'the tables are empty, **migrate freely**' are obsolete
> — re-check row counts before any destructive migration."

The note was true when written. By the time it was read again, the database held
real records. It was one step from wiping them.

## The idea

Attach the proof to the claim:

```markdown
<!-- claim: npm run lint -->
Lint: **0 errors**
```

Then run it:

```bash
verify-claims "docs/**/*.md"
```

It runs each command, reports which claims have gone false, and exits non-zero so
CI fails. An HTML comment renders as nothing on GitHub, so docs stay readable to
people who have never heard of this tool.

**Before:** your docs are notes you hope are still true.
**After:** your docs tell you when they stop being true.

## Why not an existing tool

Tools in this space (Fiberplane Drift, doc-drift-guard, GitBook) answer *"has the
code this text points at changed?"* by parsing. That cannot answer `"0 errors"` —
only running the linter can. `markdown-doctest` has not shipped in over 2,000
days and `eslint-plugin-markdown` is deprecated.

See [`docs/07-decision.md`](./docs/07-decision.md) for the full reasoning,
including where the case is weak.

## Honest status

The evidence that this problem is real **for its author** is strong — it happened
twice in one repo, and partial fixes had already been hand-built. The evidence
that *other developers* want it is **assumed, not gathered**. No one has been
interviewed and no issue threads have been counted.

This is being built primarily to learn to publish a production-grade npm package
properly. That goal holds regardless of adoption. It is not being sold as more
than that.

## Planned scope for v1

**In:** parse claims from markdown · run the attached command · non-zero exit
means the claim is false · a readable report · a CLI that fails CI.

**Out:** database checks · template drift · output matching · auto-fix · AI ·
config files · watch mode · plugins.

## License

MIT
