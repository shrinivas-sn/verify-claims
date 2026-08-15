# Step 5 — Production-readiness gap analysis for `verify-claims`

Date: 2026-08-15. Audits `08-build-plan.md` (with `09-phase-0-verification.md`
and `02-research-craft.md`) against what a published npm package needs in 2026.

**This is an audit and a checklist. It contains no files to copy.** The owner
writes the code; snippets below exist only where a field name or a flag has to be
shown to be understood.

## Verification note

Facts in this document tagged **[verified here]** were checked by experiment in
this session, not recalled. Environment: Node v22.22.2, npm 10.9.7, TypeScript
7.0.2, and source read from `npm-packlist@11.3.0`, `publint@0.3.23`,
`@arethetypeswrong/cli@0.18.5` fetched from `registry.npmjs.org`. Anything I
could not check is tagged **[unverified]** and should be treated the way
`09-phase-0-verification.md` treated `[secondary]`.

---

## 1. VERDICT

**Nothing is production ready, because nothing exists.** The repo is
`README.md`, `LICENSE`, `.nvmrc`, `.gitignore`, and eleven documents. There is no
`package.json`, no `src/`, no test, no workflow. Phase 1 has not started. Any
readiness percentage would be a fiction; the correct number is zero.

That is not a criticism. What *can* be audited is the plan, and the plan is
good — better than most published packages' actual setups. Specifically:

**What the plan gets right, and needs no further argument:**

- **ESM-only, no dual publishing.** Correct for 2026, and correctly re-derived
  from primary sources after the blog-sourced version of the claim turned out to
  be wrong. This removes the single largest source of packaging bugs.
- **`tsc` as the only build step.** Right for a pure-TypeScript library + CLI
  with no assets. It also removes the most common reason CLI projects reach for a
  bundler — shebang preservation — which `tsc` handles natively ([verified here],
  §3.5).
- **`exports` with `types` first.** publint classifies
  `EXPORTS_TYPES_SHOULD_BE_FIRST` as `type: 'error'` [verified here], so Phase 6
  will enforce what Phase 1 already got right.
- **`files: ["dist"]` as an allowlist.** Correct, and it beats a root
  `.gitignore` containing `dist/` [verified here] — a real trap this avoids.
- **Tests against `dist/`, not `src/`.** Unusual and correct. Most packages get
  this wrong and never find out.
- **Trusted publishing with *no* `--provenance` flag**, Node 24+ in CI for the
  npm ≥ 11.5.1 floor, and `repository.url` exact-matching. All three are
  non-obvious, all three are failures that arrive at the last possible moment,
  and all three are already caught.
- **`engines: ">=22.13.0"` with the reasoning stated.** The reasoning is worth
  more than the number: the floor moved because of a warning a real consumer
  would see, not because of a stability marker. That is the right basis.
- **changesets over semantic-release**, and **0.x until the format survives
  dogfooding**. Both right, and Phase 9's fail condition is unusually honest.
- **"Exit 1 if any claim failed" framed as *the* feature.** Correct framing for a
  CI tool, and it puts the exit code where it belongs — in the contract.
- **Phase gating** ("it ships working before the next one starts").

**What is genuinely missing, stated plainly:**

The plan is a *build* plan, not a *package* plan. It is thorough about getting
correct bytes into the registry and nearly silent about what a stranger
encounters when they arrive. Three specific holes, in order of size:

1. **There is no CLI contract.** No `--help`, no `--version`, no documented exit
   codes, no decision about what happens when the glob matches zero files. That
   last one matters more than anything else in this document: a CI check that
   passes silently because a directory got renamed is *precisely* the failure
   mode this tool exists to prevent, and the plan would ship it by default.
2. **There is no cross-platform or process-control story** for a tool whose
   entire job is spawning shell commands. Shell vs. no shell, cwd semantics,
   timeouts, killing a hung child's grandchildren, Windows quoting — none of it
   appears outside one "Learn here: child processes, exit codes, timeouts"
   bullet. This is the largest genuinely-missing *technical* risk.
3. **The `package.json` sketch is nine fields.** It is missing every field that
   makes an npm page look like a real package, and one field
   (`publishConfig.access`) whose absence makes a scoped publish fail outright.

Plus: **there is no dependency policy at all**, and Phase 4 needs glob expansion.
That decision will get made by accident under time pressure in Phase 4 unless it
is made deliberately in Phase 1. The good news is that the answer is available
and free — see §2.F.

---

## 2. GAPS IN THE PLAN

Things a production-grade package needs that the ten phases do not mention.

### A. `package.json` fields beyond the sketch

The sketch has `name`, `version`, `type`, `engines`, `files`, `exports`, `bin`,
`repository`. Missing:

| Field | Why it matters | Caught by a tool? |
|---|---|---|
| `description` | The one line under the name in npm search results and on the package page. Absent means a blank card. | **No** |
| `keywords` | The only thing you control in npm search ranking. | **No** |
| `license: "MIT"` | Without it npm displays **"Proprietary"** — directly contradicting the `LICENSE` file you already have in the repo. | publint `USE_LICENSE`, *suggestion only* |
| `author` | Appears on the package page. String or object form. | **No** |
| `homepage` | Defaults to the GitHub repo README anchor; set it explicitly so it survives a repo move. | **No** |
| `bugs` | Becomes the "Report issues" link. Without it a consumer with a bug has nowhere to go from npmjs.com. | **No** |
| `sideEffects: false` | Lets a consumer's bundler tree-shake the library export. Only set it if `dist/index.js` and its transitive imports genuinely do nothing at import time — verify, don't assume. The `bin` is irrelevant to this; it is never tree-shaken. | publint `USE_SIDE_EFFECTS`, *suggestion only* |
| **`publishConfig: { "access": "public" }`** | **Blocker.** A scoped package defaults to `restricted`. A restricted publish on a free account fails. Locally you would hit the error and retry with `--access public`; from a trusted-publishing workflow you get a red X at the last step of Phase 8. | **No** |
| `type: "module"` | Already present ✓ | publint `USE_TYPE` |
| `engines.node` | Already present ✓ | publint `USE_ENGINES_NODE` |

**The sharp version of the tooling column** [verified here, publint 0.3.23
source]: publint sets `process.exitCode = 1` only for messages of type
`'error'`. `--strict` promotes **warnings** to errors. `USE_LICENSE`,
`USE_TYPE`, `USE_ENGINES_NODE`, `USE_SIDE_EFFECTS` and `USE_FILES` are all
`type: 'suggestion'` — so **no publint flag setting will ever fail CI on them**,
and nothing at all checks `description`, `keywords`, `author`, `homepage`,
`bugs`, or `publishConfig`. These are a pure human checklist. That is the whole
reason this section exists.

Two smaller judgement calls, both defensible either way:

- `"./package.json": "./package.json"` in `exports`. Costs nothing, avoids a
  class of tooling that wants to read it. Nice-to-have.
- A top-level `"main": "./dist/index.js"` alongside `exports`. Legacy tooling
  only; `exports` wins everywhere that matters. Skip it or add it, but know
  which you chose and why.

### B. README as a package artifact vs. the repo README

**[verified here]** npm always packs, regardless of `files`:
`package.json`, `README*`, `LICENSE*`, `LICENCE*`, `COPYING*`, plus the file at
`main`, at `browser`, and **every `bin` target** (npm-packlist 11.3.0 forces
these through its strict rule set, confirmed by an actual `npm pack`).

Consequences:

- **The `LICENSE` ships automatically.** One worry removed — you only need the
  `license` *field* so npm renders it.
- **`README.md` ships automatically, and becomes the npm page verbatim.** The
  current README opens with:

  > ⚠️ **Not built yet.** This repo currently holds only the planning and research.

  That must not be the first thing on the npm page at 0.1.0. Nothing will catch
  it; the tarball test in §4 will not catch it; publint will not catch it.
- **Relative links break on npmjs.com.** The README currently links
  `./docs/README.md` and `./docs/07-decision.md`. npm's rewriting of relative
  links is inconsistent and does not cover images at all. Use absolute
  `https://github.com/shrinivas-sn/verify-claims/blob/main/...` URLs.

**Recommendation: one README, not two.** Two drift apart, which is the problem
this package exists to catch. Make the single README work as the npm page:
what it is, install line, one example, the exit-code behaviour, the security
note about running commands — all above the fold. The current content already
does this well once the banner is gone.

### C. CHANGELOG

**[verified here]** `CHANGELOG.md` is **not** in npm's always-include list and
does **not** appear in `npm pack` output with `files: ["dist"]`.

changesets will generate a `CHANGELOG.md` at the repo root, and it will not
ship. That is a decision the plan never makes. Both answers are fine:

- **Don't ship it** (default). GitHub Releases and the repo carry the history;
  the npm page links to the repo. Smaller tarball.
- **Ship it** by adding `"CHANGELOG.md"` to `files`. Offline consumers and
  vendored copies get the history.

Also missing from Phase 7: a house rule for what a changeset must *say*. Suggest
three sentences — what changed, whether the consumer must act, and the migration
if so. "Fix bug" is a changeset that produces a changelog nobody can use, and
Phase 7's stated goal is "changelogs people can read".

### D. The CLI contract — the largest UX gap

None of this is in the plan.

**`--help`.** Prints to **stdout**, exits **0**. It is the most-read
documentation the package has. Decide what bare `verify-claims` with no
arguments does — printing help and exiting non-zero (usage error) is the common
choice and the better one for a CI tool.

**`--version`.** Prints the bare version to stdout, exits 0. Implementation is
in §3.4.

**A documented exit-code contract.** This is the product; write it down before
writing it. A workable shape, for the owner to accept or replace:

```
0  all claims verified
1  at least one claim is false
2  usage error (bad flag, bad pattern, zero files matched)
3  internal error — a claim could not be evaluated at all
```

Two specific traps in that design:

- **Never propagate the child's exit code as your own.** Phase 3 says "non-zero
  exit = claim false". If the CLI then exits with whatever the child returned,
  then `command not found` (127) and a signal kill (128+n) become *your* exit
  code, and CI cannot distinguish "the docs are wrong" from "the tool is
  broken". Phase 3's `status: "errored"` has no home in the exit code otherwise.
  Map, don't pass through. Stay below 125; shells reserve 126, 127, and 128+n.
- **Zero claims found must not be success.** If a directory is renamed and the
  glob matches nothing, a tool that exits 0 has told CI that all the claims are
  true. Recommend: **zero matched files → exit 2**, with `--allow-empty` for the
  case where a repo legitimately has no annotations yet. This is the single best
  design detail available in this document and the plan does not have it.

**stdout vs. stderr discipline.** Report to stdout, diagnostics and errors to
stderr. Then `verify-claims "docs/**/*.md" > report.txt` produces a clean file
and the human still sees the errors.

**Colour.** **[verified here]** `util.styleText` on Node 22.22 returns unstyled
text when stdout is not a TTY and honours `NO_COLOR`, with no options passed.
So correct colour behaviour is available with zero dependencies and zero code.

**Error messages are a UX surface, and here they are the *primary* one.** Every
error should name the file, the line, the command, and the next action. The
parse errors are the front door of the whole product:

- `<!-- claim: -->` with no command after the colon
- a claim comment with nothing after it (end of file)
- an unterminated `<!--`
- a claim comment inside a fenced code block (must this be ignored? **decide**)
- whitespace and case variants: `<!--claim:npm run lint-->`, `<!-- Claim: ... -->`

Every one of these has a wrong answer that looks like success: the parser finds
zero claims and the run passes. Silence is the worst possible output for this
tool.

### E. Node engine enforcement — `engines` is advisory

`engines` produces an `EBADENGINE` **warning** on install, not a failure, unless
the consumer has set `engine-strict=true` in their own `.npmrc`. Setting
`engine-strict=true` in *your* repo affects *your* repo only; it does not travel
in the tarball.

So on an unsupported Node, your consumer gets a raw `SyntaxError` or an
`ERR_UNKNOWN_BUILTIN_MODULE` from deep inside `dist/`, with your package name
nowhere near the top of the stack.

**For a CLI specifically, add a runtime guard** as the first thing in
`dist/cli.js`: compare `process.versions.node` against the floor, print one line
to stderr naming both the required version and the version found, exit 2. Five
lines, no measurable cost, and it converts a stack trace into an instruction.

**A library must not do this** — it would run on every import.

One subtlety worth knowing before you write it: the guard only fires if the file
*parses* on the old Node, and it is the whole file that must parse, not just the
first line. For a floor of 22.13 in 2026 that is not a realistic problem —
syntax is not what will break, a missing builtin is. A single-file guard is
enough. Do not build a two-file loader shim for this.

### F. Dependency policy — absent, and decidable today

The plan reaches Phase 4 needing glob expansion having never decided whether the
package has runtime dependencies. **Decide in Phase 1.**

**[verified here] on Node v22.22.2 — the floor line — all of the following exist
and emit no warning:**

- `fs.globSync` / `fs.promises.glob` — glob expansion
- `util.parseArgs` — flag parsing
- `util.styleText` — colour, TTY- and `NO_COLOR`-aware by default
- `node:child_process` — the whole point of the tool

**A zero-runtime-dependency implementation is available at the stated engines
floor.** Two caveats before committing:

- `fs.glob` is Stability 1 on the Node 22 line and its option semantics
  (notably `exclude`) have moved between 22 and 24. The Node matrix in §5 pins
  that down; without the matrix, don't rely on it.
- **Shell glob expansion is not your glob.** On POSIX, `verify-claims
  docs/**/*.md` unquoted is expanded by the shell before your process starts; on
  Windows it is not. The CLI must accept both a list of already-expanded
  positionals and an unexpanded pattern. The README already quotes the pattern —
  keep that, and don't let the code assume it.

`util.parseArgs` has no help generation and no subcommands. For a single-command
CLI with three flags, that is not a loss.

**Why zero deps matters more here than for a normal library.** This package's
value proposition is trust, it is installed into other people's CI, and it
**executes shell commands**. Every runtime dependency is third-party code with
process-spawn reach inside every consumer's CI run. That is a much stronger
argument than the usual bundle-size one, and it is worth saying out loud in the
README as a feature.

**If a dependency is added anyway,** write the policy first: actively
maintained, small transitive tree, published with provenance if possible,
declared with a caret and pinned by the lockfile in CI. `tinyglobby` is the
current small choice; `fast-glob` and `globby` pull materially larger trees.

**devDependencies are not exempt.** They execute in the same CI that later holds
an OIDC token. Mitigations: `npm ci` only, lockfile committed, `--ignore-scripts`
where the dep tolerates it, and keeping the publish job's install as small and
as separate as possible (§5).

### G. `.npmignore` vs `files`, and what leaks

**[verified here]** `files: ["dist"]` is correct and sufficient. Two findings:

- It **overrides** a root `.gitignore` containing `dist/`. Tested directly: the
  tarball contained `dist/index.js`, `dist/index.d.ts`, `dist/cli.js` despite
  `dist/` being gitignored.
- **Do not add `.npmignore`.** In npm-packlist, the presence of `.npmignore`
  causes `.gitignore` to be discarded entirely for that directory. Running an
  allowlist (`files`) and a denylist (`.npmignore`) together is two mechanisms
  for one job and they will disagree eventually.

The plan already says "`npm pack --dry-run` shows only what you intend" in Phase
1's ships-when. Extend it into a specific list of things to look for:

- `tsconfig.tsbuildinfo` — **tsc writes this into `outDir`** if `incremental` or
  `composite` is on, and it contains absolute local paths. A real, common leak.
  Set `tsBuildInfoFile` outside `outDir`, or don't enable incremental.
- `.env`, editor files, `*.log`
- test fixtures, if they ever end up under `dist/`
- source maps you did not intend to ship

**Decide what `dist/` contains:** `.js` + `.d.ts` only, or also `.js.map` and
sources? Recommend `.js` + `.d.ts` for v1. Maps without sources are useless and
sources roughly double the install size. Add them when a debugging session
actually demands it.

### H. LICENSE in the tarball

Nothing to do — **[verified here]** it is packed automatically. Just add the
`license` field (§2.A) so npm renders "MIT" instead of "Proprietary".

### I. Security policy and community files

- **`SECURITY.md` — not box-ticking here.** This tool executes shell commands
  read out of a file. State the threat model explicitly: it runs what the
  repository's own documentation says, at the same trust level as `npm run`; it
  never fetches anything remotely; do not run it against a checkout you do not
  trust. `07-decision.md` already has the right sentence — it needs to live
  where a security researcher looks. Also enable GitHub **private vulnerability
  reporting** (one toggle) so there is a non-public route.
- **A bug issue template.** For a process-spawning cross-platform tool, ask for:
  package version, Node version, OS, the markdown that reproduces it, the exact
  command run, and the full output. This saves the entire first round trip on
  every single bug report. Cheap, high return.
- **`CONTRIBUTING.md`** — one screen: how to build, how to test, and that a
  changeset is required.
- `CODE_OF_CONDUCT.md`, `CODEOWNERS`, `FUNDING.yml` — nice-to-have at best at
  this size.

### J. Semver discipline for a 0.x package

Two things the plan needs to write down:

**The 0.x caret rule.** `^0.1.0` resolves to `>=0.1.0 <0.2.0`. A **minor** bump
is a breaking change for consumers on a caret range. So in 0.x the honest
mapping is: breaking → minor (`0.1 → 0.2`), everything else → patch. Choosing
"major" in a changeset takes you to **1.0.0**, which Phase 9 explicitly wants to
defer. Write the rule down or a stray keystroke ships 1.0.0.

**What the public API actually is.** `exports` with only `"."` already prevents
deep imports from becoming accidental contract — good, that's right. But for
this package the *CLI* surface is the stronger contract, because CI depends on
it. Declare, explicitly, in the README:

- **Stable:** exit codes, the flag set, the annotation format.
- **Not stable:** the exact wording and layout of the human-readable report.

Without that second line you can never improve a sentence of output without it
being arguably breaking. It is the most useful semver decision available before
0.1.0.

### K. Deprecation and unpublish reality

- **A published version is permanent in practice.** npm's unpublish window is
  narrow and conditional. **[primary — verified 2026-08-15 against
  `npm/documentation` @ `26eacbbb`, `content/policies/unpublish.mdx`]** The 72-hour
  figure is confirmed: *"as long as no other packages in the npm Public Registry
  depend on your package, you can unpublish anytime within the first 72 hours
  after publishing."* Beyond it, unpublish requires meeting all of a stricter set
  of conditions. The policy page also states the harder rule outright: *"Registry
  data is immutable, meaning once published, a package cannot change… This is true
  even if that package is unpublished."*
- **The version number is burned even after a successful unpublish.** You cannot
  republish `0.1.0` after unpublishing `0.1.0`.
- **`npm deprecate` is the actual remedy.** It leaves the version installable
  and prints a warning on install. The correct response to a bad release is
  deprecate the bad version, publish the fix as a patch immediately.

**Consequence for Phase 8, and a concrete upgrade to the plan:** the plan lists
staged publishing as "optional, and worth understanding even if you skip it."
Take it **for the first release specifically.** `npm stage publish` is the only
mechanism that makes a first publish reversible before it is public, and the
first publish is exactly the one most likely to be wrong. Make it optional again
from 0.1.1 onward.

### L. Install size and cold start

Neither is a real risk for a zero-dep tsc-only CLI. Both are worth a number now
so that a regression is visible later:

- **`npm pack --json` reports `size` and `unpackedSize`.** Print them in CI on
  every PR. For this package expect packed well under 20 kB and unpacked well
  under 100 kB. You do not need a hard gate; you need the number in the log so
  that the day it becomes 4 MB, somebody notices in the PR that caused it.
- **Cold start** matters to a CLI in CI only if it becomes silly. `time
  verify-claims --version` on a cold cache is the whole measurement. A budget of
  <150 ms is generous and would catch the actual failure mode: a heavy
  dependency imported at the top of `dist/cli.js`.
- The structural rule that keeps both true: **`dist/cli.js` must not import the
  world at module top level.** Moot in v1, load-bearing the moment a formatter
  or a glob library appears.

### M. Cross-platform and process control — the biggest technical gap

The tool spawns commands written by users into documentation. Decisions the plan
has not made, each of which has a wrong default:

- **Shell or no shell?** `<!-- claim: npm run lint -->` is a command *string*.
  Running it without a shell means tokenising it yourself, which is wrong for
  anything containing `&&`, quotes, or a glob. Running it with a shell means
  `sh -c` on POSIX and `cmd.exe /d /s /c` on Windows — different quoting rules,
  different builtins. **Recommend `shell: true`, and document that the claim
  command is interpreted by the platform shell**, so `npm run lint` is portable
  and `FOO=1 some-cmd` is not. A second argument for `shell: true`: on Windows,
  `npm` is a `.cmd` shim, which a shell-less spawn cannot execute.
- **cwd: the markdown file's directory, or the invocation directory?** Both are
  surprising to somebody. Recommend `process.cwd()`, because that matches how
  the repo's own scripts run — but this must be in the README either way.
- **Timeout.** A hung command must not hang a consumer's CI. Default timeout
  plus `--timeout`. A timeout kill is `errored`, not `failed` — they are
  different facts and Phase 3's type already distinguishes them.
- **Killing the child's children.** `child.kill()` on a shell kills the shell,
  not its grandchildren. On POSIX that means `detached: true` and
  `process.kill(-pid)`; on Windows, `taskkill /T /F`. This surfaces exactly once,
  as "the CI job ran for six hours". v1 may punt — but punt *explicitly*, in a
  comment, not by omission.
- **Environment.** Pass through. Note that `npm_*` variables leak in from the
  parent `npm run`, which can make a command behave differently under the tool
  than in a terminal.
- **Line endings and encoding.** CRLF must not break the annotation match or the
  reported line number. A UTF-8 BOM must not break the first line.
- **Serial or parallel?** Serial for v1 — annotated commands frequently contend
  for the same build directory. It is a decision, not a default.

**If Windows is not going to be tested, say so.** Declaring POSIX-only in the
README (and optionally the `os` field) is a legitimate v1 scope choice. Shipping
untested Windows support is not.

---

## 3. THE ESM-ONLY + BIN COMBINATION

### 3.1 `tsc` not adding `.js` extensions

**[verified here, TypeScript 7.0.2]** With `"module": "nodenext"` **and**
`"moduleResolution": "nodenext"`, an extensionless relative import is a
**compile error**, not a silent runtime failure:

```
error TS2835: Relative import paths need explicit file extensions in ECMAScript
imports when '--moduleResolution' is 'node16' or 'nodenext'. Did you mean './lib.js'?
```

With the extension present, tsc emits `import { a } from "./lib.js";` verbatim —
it never rewrites specifiers, in either direction.

So the plan's tsconfig choice already closes this hole. **The hole reopens the
moment `moduleResolution` becomes `"bundler"` or `module` becomes `"esnext"`** —
which is what most tutorials show and what a fair number of editor quick-fixes
suggest. Rule: `nodenext` for both, and treat any suggestion to change either as
a red flag requiring a reason.

Corollary that feels wrong and is right: in a `.ts` file you write
`from "./lib.js"` referring to `lib.ts`. That is correct. Do not "fix" it.

### 3.2 `"module": "nodenext"` implications beyond extensions

- Emitted module format follows `package.json#type` and the file extension.
  `"type": "module"` + `.ts` → ESM emit. Correct here.
- It applies Node's real `exports`/`imports` resolution at typecheck time, so
  tsc sees your package the way Node will. This is why `nodenext` and `attw`
  tend to agree, and why the plan needs both anyway — they check different
  things (§3.6).
- Node has **no directory-index and no extension fallback**: `import './util'`
  and `import './dir'` both fail at runtime. `nodenext` catches both at compile
  time. `moduleResolution: "bundler"` catches neither.
- `.mts` / `.cts` become meaningful. You need neither.
- Setting `module: nodenext` while leaving `moduleResolution` at `node10` or
  `bundler` is the classic half-configuration. Recent TypeScript errors on the
  mismatch, but set both explicitly rather than relying on that.
- Worth adding, not in the plan: **`verbatimModuleSyntax: true`**. It forces
  type-only imports to be written `import type`, which removes an entire class
  of "tsc elided the import I needed at runtime" bug. Cheap, and it makes the
  emit predictable, which is the whole reason for choosing tsc-only.
- **Set `rootDir` explicitly.** Not in the plan, and it has a consequence in
  §3.4: without it, tsc infers the output root from the common source directory,
  so one stray included file outside `src/` silently re-bases everything to
  `dist/src/…` and every relative path assumption breaks at once.

### 3.3 `__dirname` and `__filename` are absent

Use **`import.meta.dirname`** and **`import.meta.filename`** (Node 20.11+/21.2+,
so unconditionally available at any floor under discussion). Prefer these over
the `fileURLToPath(new URL('.', import.meta.url))` incantation that most blog
posts still show — that advice predates `import.meta.dirname` and is now just
longer.

Also gone: `require`. `createRequire(import.meta.url)` exists if you ever need
it. You should not need it here.

Before importing `node:url` out of habit: check whether the CLI needs a
self-relative path at all. If every path comes from `argv` and `process.cwd()`,
the answer is no.

### 3.4 Reading `package.json` at runtime for `--version`

**[verified here]** with `module`/`moduleResolution: nodenext`, `rootDir: "src"`,
TypeScript 7.0.2, Node 22.22.2:

```ts
import pkg from "../package.json" with { type: "json" };
```

- compiles **without** `resolveJsonModule`,
- does **not** trip the `rootDir` boundary check,
- is emitted verbatim,
- runs and prints the version with **zero bytes on stderr** — no
  `ExperimentalWarning`.

The path arithmetic works in both layouts: `dist/cli.js` → `../package.json` is
the repo root during development, and `package/package.json` inside the
installed tarball — which is always packed (§2.B).

Three caveats:

- It embeds the entire `package.json` in the module graph, `scripts` and
  `devDependencies` included. About 1 kB; not a secret; not worth avoiding.
- **If the emit layout ever becomes `dist/src/cli.js`, the `..` breaks.** An
  explicit `rootDir` (§3.2) is what prevents that.
- The alternative — a build-time generated `version.ts` — removes the runtime
  read but adds a codegen step that can go stale and defeats "tsc is the only
  build step". For this build, the JSON import is the better trade.

**What not to do:** `readFileSync(join(import.meta.dirname, '../package.json'))`.
It works, but it fails at runtime instead of at build time, needs a try/catch,
and is slower. The JSON import is statically checked.

### 3.5 Shebang survival through tsc

**[verified here]** TypeScript 7.0.2 emits `#!/usr/bin/env node` verbatim as the
first line of `dist/cli.js`. It preserves a leading shebang and does not hoist
imports above it. **No post-build `sed`, `shx`, or banner plugin is needed.**

This is worth dwelling on: shebang handling is one of the main reasons CLI
projects reach for a bundler. With tsc-only, that reason does not exist. The
plan's build choice is better than it looks.

**The exec bit, and the myth around it.** **[verified here]**, three separate
facts:

1. tsc emits `dist/cli.js` with mode **0644**. No exec bit.
2. `npm pack` **faithfully preserves** whatever mode the file has — a 0644
   source produces `-rw-r--r--` in the tarball, a 0755 source produces
   `-rwxr-xr-x`.
3. **It does not matter for npm consumers.** Packing a 0644 bin, installing that
   tarball into a temp project, and running it: npm chmod'd the installed file to
   `0755`, symlinked `node_modules/.bin/<name>` at it, and `npx <name>` ran
   correctly. Verified end to end on npm 10.9.7; re-confirm on npm 11+ when CI
   is up, since that is what will actually publish.

So "you must `chmod +x` your bin" is close to folklore for npm installs. Where
the exec bit genuinely matters: running `./dist/cli.js` directly out of a fresh
clone, and non-npm installers **[unverified]**. A `chmod +x` in the build script
costs nothing — do it, but know it is not the bug people say it is.

**Windows** has neither an exec bit nor shebang honouring. npm writes `.cmd` and
`.ps1` shims that invoke `node` directly. The shebang is still required (publint
errors without it, §3.6) and the shim is what actually runs.

### 3.6 What `publint` and `attw` will and will not catch here

**[verified here — publint 0.3.23 source]**

publint **will fail CI** on (`type: 'error'`):

| Code | Meaning |
|---|---|
| `BIN_FILE_NOT_EXECUTABLE` | Despite the name, **this is a shebang check** — source comment reads `// Check that file has shebang`, and the message is *"It should start with a shebang, e.g. `#!/usr/bin/env node`"*. It does **not** check the file mode. |
| `FILE_NOT_PUBLISHED` | A `bin` or `exports` target that exists on disk but is excluded from the tarball — i.e. a `files` mistake. |
| `FILE_DOES_NOT_EXIST` | A target that isn't there at all. |
| `EXPORTS_TYPES_SHOULD_BE_FIRST` | Confirms the ordering rule the research called out. |
| `FILE_INVALID_FORMAT` / `MODULE_SHOULD_BE_ESM` | A `.js` file whose actual content format contradicts `type` and the extension. |
| `EXPORTS_DEFAULT_SHOULD_BE_LAST`, `TYPES_NOT_EXPORTED`, `INVALID_REPOSITORY_VALUE` | Assorted, all relevant. |

publint will **only whisper** (`type: 'suggestion'`, never fails at any flag
setting): `USE_LICENSE`, `USE_TYPE`, `USE_ENGINES_NODE`, `USE_SIDE_EFFECTS`,
`USE_FILES`. `--strict` promotes *warnings* to errors, not suggestions — so
`--strict` will **not** save you here. Decide `--level` / `--strict` deliberately
in Phase 6 rather than accepting the default.

publint will **never** catch: missing `description`, `keywords`, `author`,
`homepage`, `bugs`, or a missing `publishConfig.access` on a scoped package.

**attw** **[verified here — profiles and problem kinds read from
`@arethetypeswrong/cli@0.18.5` and `@arethetypeswrong/core`]**:

- Its entire vocabulary is type resolution: `NoResolution`,
  `UntypedResolution`, `FalseCJS`, `FalseESM`, `FalseExportDefault`,
  `InternalResolutionError`, `NamedExports`.
- **It does not look at `bin` at all.** A broken shebang, a wrong exit code, a
  CLI that throws on startup — all invisible to attw.
- Profiles, exactly: `strict` (default, ignores nothing), `node16` (ignores
  `node10`), `esm-only` (ignores `node10` **and `node16-cjs`**).

**A specific recommendation on the profile, because the obvious choice is
wrong.** "ESM-only package → `--profile esm-only`" is the reflex. But
`esm-only` suppresses `node16-cjs`, which is the resolution mode a **CommonJS
consumer** uses — and the entire point of `09-phase-0-verification.md` is that a
CommonJS consumer on Node ≥ 22.13 *can* `require()` this package and you want
that to keep working. Suppressing that mode hides the one compatibility story
the project spent a whole verification document on.

Run `strict` first, read what it says, and then choose **`node16`** (ignoring
`node10`, which genuinely does not apply to a package with a `>=22.13` floor)
unless there is a concrete reason to go further. Make it a decision with a
recorded reason, not a flag copied from a blog.

**Neither tool ever runs your CLI.** The only thing that catches "the published
bin does not start" is §4's tarball test.

---

## 4. TESTING STRATEGY BEYOND UNIT TESTS

**What the plan gets right:** vitest against `dist/`, not `src/`. Keep it. It
already catches bad `exports` resolution, missing runtime extensions, and wrong
emit format — the class most projects ship broken.

**But `dist/` is not the tarball, and the tarball is not an installed package.**
Three different artifacts. Tests against `dist/` still see files that `files`
might exclude, still resolve through the filesystem rather than through a real
`node_modules` lookup, and never touch bin linking.

### 4.1 Fixture-based integration tests

A `test/fixtures/` tree of small markdown files, one per parser decision:

- a passing claim, a failing claim
- a command that does not exist (→ `errored`, not `failed`)
- a command that hangs (→ timeout → `errored`)
- `<!-- claim: -->` with no command
- a claim comment as the last line of the file
- CRLF line endings; a UTF-8 BOM
- a file with zero claims
- a claim-looking comment inside a fenced code block (ignored? **the fixture is
  where you answer that**)
- whitespace and case variants: `<!--claim:npm run lint-->`, `<!-- Claim: … -->`
- multiple claims attached to one command, and one claim with a multi-line
  command

**These fixtures are the format specification.** `07-decision.md` says the
annotation format is the one real design decision in v1 and the part that must
be stable. Prose in a README cannot pin a parser; a fixture directory can. Write
them before the parser, not after.

### 4.2 The packed-tarball end-to-end test — the one that catches what nothing else does

The flow:

1. `npm pack` → a `.tgz`
2. `mkdtemp` a directory outside the repo
3. write a minimal consumer `package.json` there
4. `npm install /abs/path/to/verify-claims-0.1.0.tgz`
5. run `node_modules/.bin/verify-claims` against a fixture; assert stdout **and
   exit code**
6. separately, `import()` the library export from that temp project to prove
   `exports` resolves through a real package lookup

**Why nothing else catches it.** This is the only test that passes through:

- **`files`** — a file omitted from the tarball is still present in `dist/`, so
  every dist-level test passes and the consumer gets `ERR_MODULE_NOT_FOUND`.
- **npm's bin linking** — the shim, the symlink, the exec bit, the shebang.
  §3.5's chmod behaviour is only observable here.
- **Node's real `exports` resolution** from an external package directory, not a
  relative path. Bare-specifier resolution and relative resolution are different
  code paths in Node.
- **Absence of devDependencies** — it proves the package runs without vitest,
  typescript, or anything else you happened to have installed.

I ran exactly this flow in this session against a synthetic package; it took
about two seconds end to end. Cost is not the objection.

**Run it in CI on every PR, and locally behind `npm run test:e2e`** — not in
watch mode. **Run it before the first publish, not after.** It is the single
highest-value test in the plan and the plan does not have it.

### 4.3 CI matrix

Minimum honest matrix for a tool that spawns shell commands:

| OS | Node |
|---|---|
| `ubuntu-latest` | **22.13.0 exactly**, 24, 26 |
| `windows-latest` | 24 |
| `macos-latest` | 24 |

Rationale per axis, because a matrix without one is just cost:

- **The Node axis** catches `fs.glob` semantic drift between 22 and 24 (§2.F)
  and any API you assumed without checking.
- **Pin the exact floor**, not `22.x`. If `engines` claims `>=22.13.0`, CI must
  run `22.13.0`. `actions/setup-node` with a floating `22` will resolve to
  22.23.x and test nothing about the claim you published.
- **The OS axis is not optional here.** Windows will break first, and it will
  break in shell quoting or in `npm`-as-a-`.cmd`-shim. macOS is the cheapest leg
  and catches BSD-vs-GNU tool differences in whatever commands your own fixtures
  run.

If Windows is out of scope for v1, §2.M's alternative applies: say so in the
README and drop the leg deliberately.

### 4.4 Snapshot testing of CLI output, and its brittleness

Snapshots are right for "does the report read well" and wrong for almost
everything else. Concrete ways a CLI snapshot rots:

absolute paths · elapsed-time numbers · ANSI colour · cwd · `\` vs `/` ·
Node version inside a stack trace · ordering when anything runs in parallel

Mitigations, all mandatory if you snapshot at all: force `NO_COLOR=1`, run from
a fixed cwd, normalise path separators and elapsed times before comparing, and
snapshot **stdout only** — never a stack trace.

The deeper hazard: a snapshot that changes on every cosmetic edit trains you to
run `-u` without reading the diff, at which point the snapshot is worse than no
test.

**Keep at most three:** the happy report, the failure report, and `--help`.
`--help` is the one place a full snapshot genuinely pays, because the help text
*is* the contract. Assert everything else with explicit
`expect(out).toContain(...)` on the specific line that matters.

### 4.5 Exit-code contract tests

Once §2.D's contract exists, one test per code — asserted against a **real
spawned process**, not an internal function's return value. `execFile` or
`spawnSync` on `dist/cli.js` in the dist suite, and on the installed bin in the
e2e suite. These are the CI-facing contract and should be the hardest tests in
the repo to change.

Include the trap cases: a claim whose command exits 127, and one killed by
timeout. Both must map to *your* codes, not leak the child's.

### 4.6 What NOT to test

- **Don't test that tsc compiles.** The typecheck step does that.
- **Don't test private functions.** Test two public seams — `parseClaims` and
  `verify` — plus the CLI. Everything else is free to be refactored.
- **Don't assert the exact wording of human-readable lines.** You declared that
  wording unstable in §2.J; testing it makes it stable by accident.
- **Don't mock `child_process` on the core path.** The whole value of this tool
  is that it really runs a command; a mocked spawn tests your mock. Use real,
  trivial, portable commands in fixtures — `node -e "process.exit(1)"` is
  portable, `true` and `exit 0` are not on Windows `cmd`.
- **Don't set a coverage threshold.** On a three-hundred-line package, coverage
  percentage is theatre. The tarball test is worth more than 100% line coverage,
  and a threshold gate will eventually be satisfied by a test nobody wanted.
- **Don't test Node itself** — that `exports` resolves, that ESM imports work.
- **Don't add a "fast" suite against `src/`.** The plan is right; the exception
  is how the rule erodes.

---

## 5. CI / RELEASE HARDENING

Beyond the plan's typecheck → test → lint → publint → attw → `npm pack`.

### Concurrency

- **PR workflow:** `concurrency: { group: <workflow>-<ref>, cancel-in-progress:
  true }`. Superseded pushes stop burning minutes.
- **Publish workflow:** a concurrency group, but **`cancel-in-progress: false`**.
  Cancelling a publish mid-flight is how you get a tag without a package or a
  package without a release. Most templates copy one block into both files and
  get this wrong.

### `npm ci` vs `npm i`

Always `npm ci` in CI. It installs exactly the lockfile, **fails** if
`package.json` and the lock disagree (which is information a PR should give
you), and wipes `node_modules` first so runs are reproducible. `npm i` mutates
the lockfile inside CI and can silently resolve a different transitive version
between the PR run and the release run — meaning the thing you tested is not the
thing you published.

This requires **`package-lock.json` committed**. It is not currently gitignored,
which is right. Committing a lockfile for a *library* is correct: it pins your
dev and CI environment and has no effect on consumers, who resolve from your
declared ranges. Write that down so nobody helpfully deletes it.

Consider `npm ci --ignore-scripts` in jobs that do not need lifecycle scripts.
Verify per-dependency that nothing breaks; it is the cheapest single
supply-chain mitigation available for a repo that will later run a job holding
`id-token: write`.

### Caching — and why the release build must not cache

`actions/setup-node` with `cache: npm` on PR jobs is fine: it caches npm's
download cache keyed on the lockfile hash, not `node_modules`, so integrity
checks still run.

**On the publish job, restore no cache at all.** The point of provenance is that
the attestation describes a build whose inputs came from the checked-out commit
and the registry. A stale or poisoned cache is an unattested input inside that
chain, and it is invisible in the resulting attestation. A cold install costs
roughly twenty seconds and buys the entire reason for doing OIDC publishing.

Related: never build `dist/` in one job, cache or upload it, and publish it from
another. Rebuild in the publish job from a clean checkout.

### Pinning action SHAs vs tags

`actions/checkout@v5` is a **mutable tag**. A compromised or force-moved tag
runs attacker-controlled code inside a job that may hold `id-token: write`.

- **Publish workflow: pin every action to a full 40-character commit SHA**, with
  the version in a trailing comment (`uses: actions/checkout@<sha> # v5.0.0`).
  No exceptions.
- **PR workflow:** SHA pinning is good practice; floating tags on `actions/*` are
  a defensible risk. Pick one and be consistent.

Pinning does not mean going stale — both Dependabot and Renovate understand
SHA-pins-with-version-comments and will open bump PRs.

### Least-privilege `permissions:`

Set `permissions: {}` (or `contents: read`) at the **workflow top level** so
every job starts with nothing, then grant per job. Note that declaring any
`permissions:` block switches the token away from the repository default to
explicit-only, which is the behaviour you want.

| Job | Needs |
|---|---|
| PR checks | `contents: read` |
| changesets "Version Packages" PR | `contents: write`, `pull-requests: write` |
| **publish** | `contents: read`, `id-token: write` — **and nothing else** |

The publish job does **not** need `packages: write` (that is GitHub Packages,
not npm). If it also creates the git tag or the GitHub Release, prefer splitting
that into a separate job so the OIDC-bearing job stays minimal.

Two more on the publish workflow:

- **Never trigger it on `pull_request`.** A fork PR must not be able to reach a
  job with `id-token: write`. Trigger on push to the default branch (the merged
  Version PR) or on a tag.
- Add `if: github.repository == 'shrinivas-sn/verify-claims'` so forks do not
  attempt to publish.
- **Put a comment at the top of the publish workflow saying that renaming the
  file breaks publishing.** The trusted publisher is registered against the
  workflow *filename*; npm validates it only at publish time. This is the
  highest-surprise failure mode remaining in Phase 8, and a comment is the whole
  fix.
- Trusted publishing is **cloud-runner only**. Never move these jobs to a
  self-hosted runner.

### Branch protection and repo settings

On `main`: require the PR status checks, require the branch to be up to date,
disallow force-push, disallow deletion. For a solo repo the two that carry real
weight are *required status checks* and *no force-push* — they protect the
provenance chain from the commit that provenance points at being rewritten.

Three free toggles on a public repo, all worth turning on now: **secret
scanning**, **push protection**, **private vulnerability reporting**.

### What blocks a merge vs. what merely warns

**Blocks:**

- typecheck
- unit tests on every matrix leg
- the packed-tarball e2e test (§4.2)
- `publint` at error level
- `attw` on the chosen profile
- `npm pack --dry-run` succeeding
- lint **errors** (not style)
- **a missing changeset on a PR that touches `src/`** — and *not* on a docs-only
  PR. changesets ships an action for exactly this; configure it rather than
  relying on remembering.

**Warns only:**

- publint suggestions (they cannot fail anyway — §3.6)
- lint style-only rules
- install-size change under threshold (print the number, don't gate it)
- advisories on dependency-update PRs

**Do not add:** a coverage threshold gate (§4.6).

### Dependabot vs. Renovate

- **Dependabot is the right amount of machinery here.** Zero config, native.
  Enable **two** ecosystems: `npm` (weekly, grouped — these are all devDeps) and
  **`github-actions`**. The second is the one everyone forgets, and it is the one
  that keeps the SHA pins from rotting.
- **Renovate** is better at grouping, auto-merge policy, and lockfile
  maintenance. It earns its configuration cost at maybe twenty dependencies. Not
  at zero runtime dependencies.
- Either way: **do not enable auto-merge to `main`** on a repo that publishes via
  OIDC unless the *full* required-check suite including the tarball test gates
  it. An auto-merged bump that lands on top of a Version PR is a publish nobody
  read.

### Post-publish verification

Phase 8's "Ships when" clause — installs in a fresh project, types resolve,
provenance shows — is currently a manual check. Turn it into a job: after
publishing, wait, install the **real published package** from the registry into
a clean temp directory, run `--version`, and run `npm audit signatures`. That
last command is the only automated confirmation that provenance actually landed,
as opposed to being expected to.

---

## 6. PRIORITISED CHECKLIST

Severity is deliberately harsh. **Blocker** means: it ships broken, it makes an
irreversible mistake, or the publish fails. Everything else is not a blocker.

Items marked ✓ in Rationale are already correct in the plan and are listed only
so the checklist is complete.

| # | Item | Phase | Severity | Rationale |
|---|---|---|---|---|
| 1 | `publishConfig: {"access": "public"}` | 1 | **Blocker** | Scoped packages default to `restricted`; the publish fails at the last step of Phase 8 and no tool warns. |
| 2 | `license: "MIT"` field | 1 | **Blocker** | Without it npm displays "Proprietary", contradicting the LICENSE already in the repo. |
| 3 | `description` | 1 | **Blocker** | The npm card is blank without it, and the version number is permanent. |
| 4 | Remove the "Not built yet" banner from README; make all links absolute | 1/8 | **Blocker** | The README is always packed and *is* the npm page; relative links break there. |
| 5 | Set `rootDir` explicitly; keep `tsconfig.tsbuildinfo` out of `outDir` | 1 | **Blocker** | tsbuildinfo leaks absolute local paths into the tarball; implicit rootDir re-basing silently breaks `../package.json`. |
| 6 | Decide dependency policy — recommend zero runtime deps | 1 | **Blocker** | Verified feasible at the 22.13 floor (`fs.globSync`, `util.parseArgs`, `util.styleText`); deciding in Phase 4 means deciding under pressure. |
| 7 | Audit `npm pack --dry-run` contents against a written list | 1 | **Blocker** | ✓ in the plan as a ships-when; the list of what to look for is not. |
| 8 | `repository.url` exactly matching the GitHub repo | 1 | **Blocker** | ✓ already caught in the plan. Publishing fails without it. |
| 9 | Shell/no-shell decision + a default command timeout | 3 | **Blocker** | A hung child hangs the consumer's CI; a shell-less spawn cannot run `npm` on Windows. |
| 10 | Document and implement an exit-code contract; never propagate the child's code | 4 | **Blocker** | The exit code *is* the product. Propagating 127 makes "docs are wrong" indistinguishable from "tool is broken". |
| 11 | Zero-files-matched → non-zero exit (with `--allow-empty`) | 4 | **Blocker** | A silent pass after a directory rename is exactly the failure this tool exists to prevent. |
| 12 | `--help` and `--version` | 4 | **Blocker** | A `bin` without them is not a CLI. Version read verified working via a JSON import (§3.4). |
| 13 | Packed-tarball e2e test, before the first publish | 5/6 | **Blocker** | The only test that exercises `files`, bin linking, and real `exports` resolution. ~2s to run. |
| 14 | Windows CI leg — or declare POSIX-only in the README | 6 | **Blocker** | Shipping untested Windows support for a shell-spawning tool is the choice, not the omission. |
| 15 | Commit `package-lock.json`; use `npm ci` everywhere | 6 | **Blocker** | Without it the release build can resolve different code than the PR build tested. |
| 16 | Publish job: `contents: read` + `id-token: write` only, SHA-pinned actions, no cache, fork guard, never on `pull_request` | 8 | **Blocker** | This job holds the OIDC credential; everything else in the repo is downstream of it not being compromised. |
| 17 | Register the trusted publisher with the exact workflow filename and allowed actions | 8 | **Blocker** | ✓ in the plan. Add the "renaming this file breaks publishing" comment. |
| 18 | Write the 0.x semver rule down (breaking → **minor**; `major` ships 1.0.0) | 7 | **Blocker** | One stray changeset choice ships 1.0.0 and forfeits the whole point of Phase 9. |
| 19 | Use **staged publishing** for the first release specifically | 8 | **Blocker** | The only mechanism that makes a first publish reversible; unpublish is not a safety net. |
| 20 | `keywords`, `author`, `homepage`, `bugs` | 1 | Important | Discovery and the "Report issues" link. Nothing checks any of them. |
| 21 | `sideEffects: false` — after verifying import-time purity | 1 | Important | Free tree-shaking for the library export; publint suggests it and will never enforce it. |
| 22 | `verbatimModuleSyntax: true` | 1 | Important | Removes the "tsc elided an import I needed at runtime" class outright. |
| 23 | Runtime Node-version guard as the first statement of the bin | 4 | Important | Turns a raw SyntaxError into one actionable line. `engines` is advisory. |
| 24 | stdout for the report, stderr for diagnostics | 4 | Important | Makes redirecting output to a file usable; free to get right, expensive to change later. |
| 25 | Error messages naming file, line, command, and next action | 2/3/4 | Important | Parse errors are the front door of the product; every wrong answer here looks like success. |
| 26 | Fixture suite as the format specification (CRLF, BOM, fenced code, whitespace/case, last-line claim) | 2 | Important | `07-decision.md` calls the format the one real design decision; fixtures are the only place it can be pinned. |
| 27 | Document cwd semantics for spawned commands | 4 | Important | Both possible answers surprise somebody; only the undocumented one is a bug. |
| 28 | Exit-code tests against a real spawned process | 5 | Important | The CI-facing contract must be the hardest thing in the repo to change accidentally. |
| 29 | Node matrix including the **exact** floor 22.13.0, plus 24 and 26 | 6 | Important | A floating `22` resolves to 22.23.x and tests nothing about the published claim. |
| 30 | macOS CI leg | 6 | Important | Cheapest leg; catches BSD/GNU differences in the commands fixtures actually run. |
| 31 | Decide `attw --profile` with a recorded reason — recommend `node16`, not `esm-only` | 6 | Important | `esm-only` suppresses `node16-cjs`, the exact CJS-consumer path `09-phase-0-verification.md` spent a document establishing. |
| 32 | Decide publint `--level` / `--strict` | 6 | Important | Default settings silently ignore five `USE_*` suggestions; `--strict` does not fix that. Know what you're gating on. |
| 33 | Concurrency groups: cancel PR runs, **never** cancel the publish run | 6/8 | Important | A cancelled publish leaves a tag without a package. |
| 34 | Branch protection: required checks, no force-push, no deletion | 6 | Important | Protects the commit that provenance points at from being rewritten. |
| 35 | Secret scanning, push protection, private vulnerability reporting | 6 | Important | Three free toggles on a public repo. |
| 36 | Dependabot for `npm` **and `github-actions`** | 6 | Important | The actions ecosystem is what keeps SHA pins from rotting; it is the one people forget. |
| 37 | Define blocking vs. warning checks; require a changeset only on `src/` changes | 6/7 | Important | Otherwise docs PRs get blocked and real changes slip through unversioned. |
| 38 | `SECURITY.md` with the "executes shell commands" threat model | 8 | Important | Not box-ticking for this package specifically. The right sentence already exists in `07-decision.md`. |
| 39 | Bug issue template asking version / Node / OS / repro markdown / output | 6 | Important | Saves the entire first round trip on every report for a cross-platform spawning tool. |
| 40 | Decide whether `CHANGELOG.md` ships (verified: not auto-included) | 7 | Important | changesets will generate it and `files: ["dist"]` will silently exclude it. |
| 41 | Declare the public surface: exit codes and format stable, report wording **not** stable | 7 | Important | Without the second half you can never improve a line of output without it being arguably breaking. |
| 42 | Post-publish smoke job: install from the registry, `--version`, `npm audit signatures` | 8 | Important | Turns Phase 8's manual "ships when" clause into a check that runs every release. |
| 43 | Print `npm pack --json` size and unpackedSize on every PR | 6 | Important | You need the number in the log the day it becomes 4 MB, not a gate before then. |
| 44 | `CONTRIBUTING.md` — one screen | 6 | Important | Build, test, changeset required. Nothing else. |
| 45 | Punt grandchild-process reaping **explicitly**, in a comment | 3 | Important | `child.kill()` on a shell leaves grandchildren alive; the symptom is a six-hour CI job, once. |
| 46 | Decide serial vs. parallel execution (recommend serial for v1) | 3 | Important | Commands contend for the same build directory. A decision, not a default. |
| 47 | Handle both shell-expanded positionals and an unexpanded pattern | 4 | Important | POSIX shells expand before you see it; Windows does not. |
| 48 | Cap snapshots at three (happy, failure, `--help`) with `NO_COLOR` and path normalisation | 5 | Important | Brittle snapshots train you to `-u` without reading, at which point they are worse than nothing. |
| 49 | `chmod +x dist/cli.js` in the build script | 1 | Nice-to-have | Verified npm chmods it at install anyway; only matters running from a clone. Free, so do it — but it isn't the bug folklore says. |
| 50 | `"./package.json": "./package.json"` in `exports` | 1 | Nice-to-have | Costs nothing, avoids a small class of tooling breakage. |
| 51 | A legacy top-level `"main"` alongside `exports` | 1 | Nice-to-have | `exports` wins everywhere current. Choose either, but know why. |
| 52 | `os` field if declaring POSIX-only | 1 | Nice-to-have | Only if #14 goes the "declare unsupported" way. |
| 53 | Source maps in `dist/` | 1 | Nice-to-have | Useless without shipping sources; roughly doubles install size with them. Add when a real debugging session demands it. |
| 54 | `npm ci --ignore-scripts` in jobs that tolerate it | 6 | Nice-to-have | Cheapest supply-chain mitigation available, but needs per-dependency verification. |
| 55 | `CODE_OF_CONDUCT.md`, `CODEOWNERS` | 6 | Nice-to-have | Low value at this size. |
| 56 | Renovate instead of Dependabot | 6 | Nice-to-have | Earns its config cost at ~20 dependencies, not at zero. |
| 57 | Cold-start budget (`time verify-claims --version` < 150 ms) | 6 | Nice-to-have | Only catches a heavy top-level import, which zero deps already prevents. |

---

## What this audit did not check

- ~~**npm's unpublish window (72 hours) and its conditions.**~~ **Closed
  2026-08-15.** `docs.npmjs.com` is blocked, but it is generated from the public
  `npm/documentation` repo, which clones — so the primary source was available
  after all. 72 hours confirmed; §2.K is now `[primary]`. *(Worth noting how this
  one resolved: the blocker was assumed from the previous session rather than
  re-tested. The same wrong assumption is recorded in Session 10's worklog entry.)*
- **npm 11's bin-linking chmod behaviour.** Verified on npm 10.9.7 only. Phase 8
  will run npm 11+; re-confirm there.
- **Whether non-npm installers (pnpm, yarn, bun) set the exec bit** on a bin
  packed at 0644. Assume they do, verify if a user reports otherwise.
- **`fs.glob`'s exact option-semantics differences between Node 22 and 24.** The
  matrix in §4.3 makes this observable rather than assumed; that is the point of
  the matrix.
