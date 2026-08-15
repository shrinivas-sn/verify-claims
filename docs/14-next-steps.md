# What to do next

Date: 2026-08-15 (Session 11). This is the "you just sat down, what now" page.
Plain language on purpose — the detail lives in the documents it points at.

---

## Where you actually are

Nothing is built. The repo is documents only: research, a decision, a 10-phase
plan, and a review of that plan. That is not a criticism — Phase 0 was always
"prep before code", and it caught two real mistakes before they cost anything.

| Phase 0 item | Status |
|---|---|
| Re-verify the two shaky research findings | ☑ done — one of them was wrong |
| GitHub repo, public, MIT | ☑ done |
| Node 24 locally (`.nvmrc`) | ☑ done |
| **npm account + 2FA** | ☐ **you, only you** |

One new gate was added by the review, and it comes before Phase 1:

| New gate | Status |
|---|---|
| **Settle the annotation format** (10 questions, below) | ☐ **you** |

---

## Do these three things, in this order

### 1. Answer the ten format questions

**Why this is first.** The format is the tag you write in your markdown. Once
you publish and start using it in real docs, changing it breaks every document
you have already annotated. Everything else in this project can be fixed in a
patch release. This cannot. So it gets decided deliberately, before code.

Each question below has a recommended answer. **If you agree with all ten, just
say "all defaults" and we move on.** Override any you disagree with.

| # | Question, in plain terms | Recommended |
|---|---|---|
| 1 | Should `<!-- CLAIM: ... -->` in capitals work too? | **Yes** — accept any case |
| 2 | How much text after the tag counts as "the claim"? | **Everything up to the next blank line** |
| 3 | Can you put the claim on the same line as the tag? | **Yes** — it is the way to be unambiguous |
| 4 | If the command itself contains `-->`, where does the tag end? | **At the first `-->`** — same as GitHub sees it — and warn |
| 5 | Can the tag be split over several lines? | **No** — reject it with a clear message |
| 6 | Should claims work inside quotes, tables, and bullet lists? | **No** in v1 — but say so rather than ignore them |
| 7 | Reserve `<!-- /claim -->` and a slot for future options? | **Yes, both, now** — see below |
| 8 | Should the parser report problems, not just claims? | **Yes** — see below |
| 9 | Should a fenced code block be capturable as the claim? | **No** — nice idea, later |
| 10 | Rename the keyword to something less generic than `claim`? | **No** — keep `claim:` |

Two of these are worth understanding rather than just approving.

**Question 7 — reserve room for later.** Right now, everything after `claim:` is
the command. There is nowhere to add anything. If you later want
`<!-- claim timeout=30s: npm test -->`, you cannot — that slot does not exist.
The fix is about three lines of code today: decide that the space between `claim`
and `:` is reserved, and that anything in it is an error for now. That keeps the
door open forever. Skip it and you are choosing a breaking change later.

And it matters that unknown options are an **error**, not ignored. If an old copy
of the tool silently drops `timeout=30s`, it runs the command with no timeout —
doing something the author explicitly asked it not to do.

**Question 8 — do not fail silently.** The review found about a dozen ways to
write a tag that *looks* right but isn't: split over two lines, indented four
spaces, inside a table, `claims:` instead of `claim:`. Today all of them produce
the same result — **no claims found, everything green, no complaint.**

That is the worst possible behaviour for this specific tool. Its whole job is to
tell you a document is lying, so quietly checking nothing while reporting success
is worse than crashing. Three fixes, in value order:

1. `parseClaims` returns problems alongside claims.
2. The CLI always prints a count — `12 claims in 4 files`. If you annotated 13,
   you notice.
3. Detect the near-misses and name them.

**If only one ships in v1, ship number 2.** It is nearly free.

### 2. Turn on npm 2FA

You have to do this one — it cannot be done from a session. It is also no longer
optional: npm now requires 2FA to publish anything at all.

Go to npmjs.com → account settings → two-factor authentication. Use an
authenticator app. Save the recovery codes somewhere you will still have them in
a year.

### 3. Start Phase 1

Write `package.json` by hand, per `08-build-plan.md`. Two corrections from Phase 0
are already applied to the sketch there:

- `engines` is `>=22.13.0`, not `>=22.12` — the old value was justified by a claim
  that turned out to be false.
- `repository` must be present and must match your GitHub URL exactly, or the
  publish in Phase 8 will be rejected. It was missing from the original sketch.

---

## What the review found, in one paragraph each

**`10-test-cases-parser.md`** — around 130 test cases for finding claims in
markdown: weird spacing, Windows line endings, claims inside code blocks that must
*not* count, and so on. Plus the ten questions above.

**`11-test-cases-executor.md`** — test cases for actually running the commands:
what counts as "the claim is false" versus "we could not tell", timeouts, commands
that hang, and a threat model. Worth knowing: this tool runs shell commands out of
markdown files, so running it on a repo you do not trust is running code you have
not read. That needs saying out loud in the README.

**`12-production-readiness.md`** — what a publishable package needs that the plan
does not mention: `--help` and `--version`, error messages as a real feature,
license in the tarball, testing the packed tarball rather than the source, CI
hardening.

**`13-real-world-corpus.md`** — real claims mined from your `ghar-khata-software`
docs. It found your `README.md` already contains false statements, and a dozen
wrong file paths in `CODEBASE_STANDARDS.md`. Also useful: which files to leave
alone. Old review notes and session logs are *history* — they are supposed to be
out of date, and annotating them would just produce a permanently red build.

---

## The honest state of things

The evidence that this problem is real **for you** is strong and got stronger —
the corpus review found live, currently-false claims in your own docs without
having to look hard.

The evidence that other developers want this is still **assumed**. Nobody has been
interviewed. That has not changed and should not be quietly forgotten. The project
is justified as learning to publish properly, which holds either way.

The fail condition still stands: after Phase 9, if you stop annotating claims,
the tool does not work even for its author. Stop and pick something else.
