# verify-claims

**Your docs make factual claims. Nothing checks them. This does.**

[![npm version](https://img.shields.io/npm/v/@shrinivas-sn/verify-claims.svg)](https://www.npmjs.com/package/@shrinivas-sn/verify-claims)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## Install

```bash
npm install -D @shrinivas-sn/verify-claims
```

## Quick start

**1. Attach a command to a claim**, using an HTML comment right above it:

```markdown
<!-- claim: npm run lint -->
Lint: **0 errors**
```

The comment renders as nothing on GitHub — the doc still reads normally to
anyone who's never heard of this tool.

**2. Run it:**

```bash
npx verify-claims "docs/**/*.md"
```

```
docs/README.md
  ✓ line 12  npm run lint
  ✗ line 20  npm run build  (expected exit code 0, got exit code 1)
      src/index.ts(4,7): error TS2322: Type 'string' is not assignable to type 'number'.

1 passed, 1 failed
```

**3. Wire it into CI** so a stale claim fails the build, the same way a
failing test would:

```yaml
- run: npx verify-claims "docs/**/*.md"
```

That's the whole tool. Each claim's command actually runs; a non-zero exit
code means the claim is false.

## CLI reference

```
verify-claims [options] <pattern...>
```

| Option | Does |
|---|---|
| `--dry-run` | Lists every claim and its command without running anything |
| `-h`, `--help` | Shows usage |
| `-v`, `--version` | Shows the installed version |

- Accepts one or more glob patterns (quote them so the shell doesn't expand
  them first, e.g. `"docs/**/*.md"`). Backslash paths work on Windows.
- Runs each command through the platform's default shell (`/bin/sh` on
  Linux/macOS, `cmd.exe` on Windows), from the directory you run
  `verify-claims` in. A claim that only works in bash will fail on Windows.
- Prints a ✓/✗ report per claim, with the file, line number, command, and —
  on failure — the exit code and the last 20 lines the command printed.
- Claims inside fenced (```` ``` ```` / `~~~`) or indented code blocks are
  ignored, so docs can show the syntax without running it. Several claim
  comments stacked above one line all check that line.
- **Exit code 0** — every claim passed.
- **Exit code 1** — at least one claim failed, a file couldn't be read, or
  the pattern matched zero files (a silent pass on a typo'd pattern would
  defeat the point of the tool, so it's treated as an error).

## Security

A claim is a shell command, and `verify-claims` runs it. That is the same
trust level as `npm run`: anyone who can edit your markdown can run
commands wherever you run this tool.

- Don't run it in `pull_request_target` workflows, or in any job that holds
  secrets while checking out untrusted pull request code.
- Run `verify-claims --dry-run "docs/**/*.md"` to see exactly what a doc
  will execute before trusting it.

## Status

This section checks itself — run `verify-claims README.md` and find out if
these are still true.

<!-- claim: npm run build -->
Build: **passes**

<!-- claim: npm run lint -->
Lint: **clean**

<!-- claim: npm test -->
Tests: **pass**

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

**Before:** your docs are notes you hope are still true.
**After:** your docs tell you when they stop being true.

## Why not an existing tool

Tools in this space (Fiberplane Drift, doc-drift-guard, GitBook) answer *"has the
code this text points at changed?"* by parsing. That cannot answer `"0 errors"` —
only running the linter can. `markdown-doctest` has not shipped in over 2,000
days and `eslint-plugin-markdown` is deprecated.

See [`DOCS/CONTEXT/07-decision.md`](./DOCS/CONTEXT/07-decision.md) for the full
reasoning, including where the case is weak.

## Honest status

The evidence that this problem is real **for its author** is strong — it happened
twice in one repo, and partial fixes had already been hand-built. The evidence
that *other developers* want it is **assumed, not gathered**. No one has been
interviewed and no issue threads have been counted.

This is being built primarily to learn to publish a production-grade npm package
properly. That goal holds regardless of adoption. It is not being sold as more
than that.

## Scope

**In:** parse claims from markdown · run the attached command · non-zero exit
means the claim is false · a readable report · a CLI that fails CI.

**Out:** database checks · template drift · output matching · auto-fix · AI ·
config files · watch mode · plugins.

## Development

This repo's own history — every decision, correction, and session — is kept
under [`DOCS/`](./DOCS/README.md). Start at its index for the full build story.

## License

MIT
