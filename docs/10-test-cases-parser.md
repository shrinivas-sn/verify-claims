# Step 5 / Phase 2 — Test-case catalogue for `parseClaims`

Date: 2026-08-15. Companion to Phase 2 of `08-build-plan.md`.

This is a **specification, not code**. The owner writes the implementation and
the test files; this document says what those tests must assert and why. Every
case is written as *input → expected output → why it matters*.

Two things to read before the cases:

1. **§1 is normative.** A test case can only have an expected output if the
   parser's contract is pinned down first. §1 pins it down, with recommendations
   where the build plan left a gap. Cases are tagged with the decision they
   depend on (`[D4]`), so if a decision is overruled you can find exactly which
   expected outputs change.
2. **§14 is the argument.** The build plan calls the annotation format "the one
   real design decision" and "the only thing that is expensive to change after
   publishing." Writing these cases surfaced concrete holes in it. §14 names
   them and recommends fixes. Read §14 before implementing §1, because two of
   its recommendations change the format itself.

### Notation used throughout

| Symbol | Means |
|---|---|
| `␉` | a literal tab character |
| `␠` | a space, where the space is the point of the case |
| `␍␊` | CRLF line ending |
| `⟨BOM⟩` | U+FEFF |
| `⟨U+2028⟩` | Unicode LINE SEPARATOR |
| `→ [...]` | the expected return value |
| `cmd` / `text` | shorthand for the `command` / `claimText` fields |

`[core]` cases must pass before Phase 2 ships. `[opt]` cases cover refinements
that may be deferred — but decide them consciously, don't let them default.

---

## 1. The contract these cases assume

Stated as an algorithm, because the edge cases fall out of it rather than out of
a single clever regex.

**Pre-processing**

- **D1** Strip one leading U+FEFF if present. It does not affect line numbers.
- **D2** Split lines on `\r\n`, `\n`, or a lone `\r`. No `\r` may survive into
  `command` or `claimText`. U+2028, U+2029 and U+0085 are **not** line breaks.
- **D3** `line` is **1-indexed** and is the line of the `<!--`, never the line of
  the claim text. Rationale: it is the only anchor that always exists (claim text
  may be empty), it is where the user must edit to fix the annotation, and it is
  stable under any future change to claim-text extent.

**Skipped regions** — no claim is ever recognised inside these:

- **D4** Fenced code blocks, per CommonMark: an opening fence is 0–3 spaces of
  indent then ≥3 backticks or ≥3 tildes; the closing fence uses the same
  character, is at least as long, and has nothing but whitespace after it. An
  unterminated fence runs to EOF.
- **D5** Indented code: any line whose indentation is ≥4 spaces or begins with a
  tab.
- **D6** YAML frontmatter: if line 1 is exactly `---` **and** a later line is
  exactly `---` or `...`, everything up to and including that closing line is
  skipped. If no closing delimiter exists, frontmatter handling is **off** for
  the whole document (see G16 — the guard exists to prevent silent claim loss).

**Recognition** — for each surviving line:

1. The line must match `^ {0,3}<!--`. The comment must **start** the line;
   0–3 spaces of indent are allowed, a tab is not.
2. Find the **first** `-->` after the `<!--`. Text between them is `inner`; text
   after it is `after`. If there is no `-->`, see D12.
3. Split `inner` at its **first** `:`. Left is `head`, right is `cmd`.
4. `head.trim()` compared case-insensitively:
   - equals `claim` → **valid claim** *(D7: the keyword is case-insensitive)*
   - matches `/^claim\s/i` (e.g. `claim timeout=30`) → **problem:
     `unsupported-options`**, not a runnable claim *(see §14.5)*
   - anything else, including `claims`, `claimant`, `todo` → **not a claim, no
     output, no problem.**
5. **D8** `command = cmd.trim()`. Internal whitespace is preserved byte for byte.
   No entity decoding, no unescaping, no shell parsing.
6. **D9** If `command === ""` (or `inner` had no `:` at all), still return the
   entry with `command: ""` and a problem. Rationale in §14.7: for a verification
   tool, a silently dropped claim is the worst possible bug, so a malformed claim
   must reach the report. **Invariant: an empty command is never executed.**

**Claim text** — first rule that applies:

- **D10** If `after.trim()` is non-empty, `claimText = after.trim()`. Same-line
  text wins over following lines.
- **D11** Otherwise take the contiguous run of following lines, stopping *before*
  the first of: a blank (whitespace-only) line, EOF, another claim-comment line,
  a line that is entirely an HTML comment, or an opening code fence. Join with
  `\n`, right-trim each line, trim the whole. No markdown is stripped or
  rendered — `**0 errors**` stays `**0 errors**`.
- Otherwise `claimText = ""`.

**Errors**

- **D12** `parseClaims` never throws on a string input, however malformed. It
  throws `TypeError` for a non-string argument.
- **D13** Problems are reported, not thrown. This catalogue writes them as a
  `problem` field on the returned entry; see §14.7 for the alternative
  (a second return channel) and why it is worth adopting now.

---

## 2. Happy path and basic shape

**A1 — the canonical example** `[core]`
```markdown
<!-- claim: npm run lint -->
Lint: **0 errors**
```
→ `[{ cmd: "npm run lint", text: "Lint: **0 errors**", line: 1 }]`
Why: the exact example in `07-decision.md`; if this ever breaks, every published
document breaks.

**A2 — flags and a `--` separator** `[core]`
```markdown
<!-- claim: npm test -- --coverage -->
Coverage: 91%
```
→ `[{ cmd: "npm test -- --coverage", text: "Coverage: 91%", line: 1 }]`
Why: `--` is legal inside an HTML5 comment and extremely common in npm scripts;
a parser that bails on `--` rejects a large fraction of real commands.

**A3 — claim below other content** `[core]`
```markdown
# Status

Some prose.

<!-- claim: npm run build -->
Build: passing
```
→ `[{ cmd: "npm run build", text: "Build: passing", line: 5 }]`
Why: proves `line` is 1-indexed and counts blank lines.

**A4 — several claims, document order** `[core]`
```markdown
<!-- claim: a -->
A

<!-- claim: b -->
B
```
→ `[{cmd:"a",text:"A",line:1}, {cmd:"b",text:"B",line:4}]`
Why: order must be document order, not hash or reverse; the report reads
top-to-bottom.

**A5 — exact object shape** `[core]`
Assert `Object.keys()` of each entry is exactly `["command","claimText","line"]`
(plus `problem` only when set), values are primitives, and the return is a real
`Array`.
Why: this is the package's public API surface; an accidental extra field becomes
a semver commitment.

**A6 — no claims at all** `[core]`
A 40-line README with no claim comments → `[]`, not `null`/`undefined`.
Why: callers must be able to `.length` and `.map` unconditionally.

**A7 — wrong argument type** `[core]`
`parseClaims(undefined)`, `parseClaims(Buffer.from("x"))`, `parseClaims(42)` →
throws `TypeError`.
Why: a Buffer stringifies to something plausible; silently parsing it hides an
encoding bug at the call site.

---

## 3. Spacing and spelling inside the comment

**B1 — no spaces anywhere** `[core]` `[D8]`
```markdown
<!--claim:npm run lint-->
Lint: 0 errors
```
→ `[{ cmd: "npm run lint", text: "Lint: 0 errors", line: 1 }]`
Why: the tightest legal form; also proves the trailing `-->` is not eaten into
the command.

**B2 — space before the colon** `[core]`
`<!-- claim : npm run lint -->` → `cmd: "npm run lint"`
Why: `head.trim() === "claim"` is the rule, so padding around the keyword must
not matter.

**B3 — multiple spaces** `[core]`
`<!--␠␠␠claim␠␠:␠␠␠npm run lint␠␠␠-->` → `cmd: "npm run lint"`
Why: hand-aligned annotations in tables of claims will do this.

**B4 — tabs** `[core]`
`<!--␉claim␉:␉npm run lint␉-->` → `cmd: "npm run lint"`
Why: `\s` in a JS regex also matches `\n`, `\r`, `\v`, U+2028 and U+00A0 — using
`\s` here quietly changes several other cases in this document. Use `[ \t]`.

**B5 — non-breaking space is not whitespace** `[core]`
`<!--\u00A0claim: npm test -->` → `[]`
Why: pinning this down prevents a copy-paste from a rendered web page from
becoming a claim that only some parsers see.

**B6 — internal command whitespace is preserved** `[core]` `[D8]`
`<!-- claim: echo␠␠a␉b -->` → `cmd: "echo␠␠a␉b"` (unchanged)
Why: collapsing whitespace would silently rewrite a command; the shell, not the
parser, decides what runs.

**B7 — uppercase keyword** `[core]` `[D7]`
`<!-- CLAIM: npm test -->` → parsed as a claim.
Why: the case-insensitive decision must be tested, not assumed. If you overrule
D7, this becomes `→ []` **and you must add a near-miss diagnostic** — a typo'd
`Claim:` that is silently ignored is exactly the invisible failure this tool
exists to prevent.

**B8 — mixed case** `[core]` `[D7]`
`<!-- Claim: npm test -->` → parsed. Same note as B7.

**B9 — indent of 1–3 spaces** `[core]` `[D5]`
```markdown
- checklist
  <!-- claim: npm test -->
  Tests pass
```
→ one claim, `line: 2`, `text: "Tests pass"`
Why: claims nested in list items are a natural style and must survive.

**B10 — indent of exactly 4 spaces** `[core]` `[D5]`
`␠␠␠␠<!-- claim: rm -rf build -->` → `[]`
Why: four spaces is an indented code block — it is *displayed* text, so treating
it as a claim would execute something the reader can see and did not annotate.
Note the deliberate cost: a claim nested more than 3 spaces deep inside a list is
also ignored. Document that.

**B11 — tab indent** `[core]` `[D5]`
`␉<!-- claim: npm test -->` → `[]`
Why: a tab is an indented code block too; the rule must not be spaces-only.

**B12 — trailing whitespace after the close** `[core]`
`<!-- claim: npm test -->␠␠␠` → parsed, `text` from the next line, unaffected.
Why: editors and `git` leave trailing spaces everywhere; an annotation must not
die from one.

---

## 4. Comment structure: multi-line, `-->`, nesting

**C1 — multi-line comment** `[core]` `[D13]`
```markdown
<!-- claim:
npm run lint
-->
Lint: 0 errors
```
→ `[]` **plus a reported problem** `unterminated-claim-comment` at line 1.
Why: one line per claim is the invariant everything else rests on (§14.3). But
this is the single most likely thing a user will try, so it must fail *loudly* —
returning a bare `[]` here is how a repo ends up with zero verified claims and a
green CI.

**C2 — `-->` inside the command** `[core]` `[§14.4]`
```markdown
<!-- claim: node -e "process.exit(a --> b ? 0 : 1)" -->
Invariant holds
```
→ `[{ cmd: 'node -e "process.exit(a -', text: 'b ? 0 : 1)" -->', line: 1,
problem: "closing-marker-in-command" }]`
Why: **this is the nastiest case in the format.** An HTML renderer ends the
comment at the *first* `-->`, so the truncated command is what a reader's browser
agrees is the annotation — and the truncated command is still *runnable* and
means something different. The parser must match the renderer (never run
something the document does not show as commented out) **and** flag it, because
running a silently truncated command is unacceptable. Trigger the flag on
`after` containing `-->`. See §14.4.

**C3 — command ending in a dash** `[core]`
`<!-- claim: echo a --->` → `cmd: "echo a -"`, no `after`, no flag.
Why: `--->` is `-` followed by `-->`; the corruption is invisible and there is
nothing in `after` to flag it on. This case exists so the behaviour is at least
*known*, and so it can be cited in the README's "don't do this" list.

**C4 — nested-looking comment** `[core]`
`<!-- <!-- claim: npm test --> -->` → `[]`
Why: the inner `<!--` means `head` is `<!-- claim`, which is not `claim`. HTML
does not nest comments; neither do we.

**C5 — two claim comments on one line** `[core]` `[D10]`
`<!-- claim: a --><!-- claim: b -->`
→ `[{ cmd: "a", text: "<!-- claim: b -->", line: 1, problem:
"closing-marker-in-command" }]`
Why: exercises "at most one claim per line" and shows the C2 flag catching a
second unrelated mistake. The alternative (scan every comment on the line) is
more code and invites C2-style ambiguity; reject it, but reject it on purpose.

**C6 — unterminated comment, no keyword** `[core]`
`<!-- this comment never closes` → `[]`, no problem.
Why: only *near-miss claims* deserve a diagnostic; flagging every stray `<!--`
turns the diagnostic into noise and gets it disabled.

**C7 — `<!---` triple-dash open** `[core]`
`<!--- claim: npm test --->` → `[]`
Why: `<!---` is the common "commented out / disabled" idiom; treating it as live
would resurrect claims a user deliberately switched off.

**C8 — text immediately after the close, no space** `[core]` `[D10]`
`<!--claim:npm test-->tests pass` → `text: "tests pass"`
Why: `after` must be trimmed but not require a leading space.

**C9 — comment closes but the keyword is on the next line** `[core]`
```markdown
<!-- -->
claim: npm test
```
→ `[]`, no problem.
Why: guards against an implementation that searches the whole document for
`claim:` rather than working line by line.

---

## 5. Command payloads

All of these are single claims on line 1 with `text` from line 2. Only the
command matters; the assertion in every case is **byte-for-byte round trip**.

| ID | Command inside the comment | Why it matters |
|---|---|---|
| **P1** `[core]` | `sh -c "echo 'a b' \| grep a"` | Quotes of both kinds and a pipe must survive untouched; the parser is not a shell lexer. |
| **P2** `[core]` | `npm run lint && npm test` | `&` is an HTML entity starter — proves no entity decoding happens. |
| **P3** `[core]` | `test -f dist/index.js \|\| exit 1` | `\|` in a command adjacent to markdown table syntax; the whole-line rule keeps them apart. |
| **P4** `[core]` | `npm run build > /dev/null 2>&1` | `>` and `<` inside a comment must not be treated as markup. |
| **P5** `[core]` | `` echo `date` `` | Backticks inside the comment must not open a markdown code span. |
| **P6** `[core]` | `test $(git status --porcelain \| wc -l) -eq 0` | `$()` and nested parens; also a real claim ("working tree is clean"). |
| **P7** `[core]` | `echo "&amp; &lt; &#39;"` | Must stay literal — decoding would produce a different command than the file contains. |
| **P8** `[core]` | `echo "✅ 🎉"` | Emoji are surrogate pairs in JS; any index arithmetic on the line must be code-unit safe. |
| **P9** `[core]` | `node -e "console.log('日本語 · Ünïcode · مرحبا')"` | Non-ASCII including RTL; also confirms the file is read as UTF-8, not latin1. |
| **P10** `[core]` | `echo "# not a heading"` | `#` inside a command is not markdown and not a shell comment to us. |
| **P11** `[core]` | `pwsh -c "Get-Item C:\Users\x"` | Backslashes must not be treated as escapes. |
| **P12** `[core]` | a command of 10,000 `x` characters | No length cap, no truncation; assert `command.length === 10000`. |
| **P13** `[core]` | command containing a raw NUL (`\u0000`) | → problem `invalid-command-character`, never returned as runnable: Node throws on argv containing NUL, and a NUL is a classic way to hide the tail of a string from a human reviewer. |

---

## 6. Encoding, line endings, file edges

**E1 — CRLF throughout** `[core]` `[D2]`
`<!-- claim: npm run lint -->␍␊Lint: 0 errors␍␊`
→ `[{ cmd: "npm run lint", text: "Lint: 0 errors", line: 1 }]`
Why: **assert no `\r` anywhere in `command` or `claimText`.** A trailing `\r`
turns `npm run lint` into a command that fails or, worse, resolves differently —
and the diff is invisible in every terminal. This is the highest-value case in
the section.

**E2 — mixed LF and CRLF** `[core]` `[D2]`
A file where line 1 ends `␍␊` and line 2 ends `␊`. Line numbers must stay
correct for a claim on line 3.
Why: a file touched by both Windows and macOS editors, i.e. most files.

**E3 — lone CR line endings** `[opt]` `[D2]`
`<!-- claim: a -->␍text␍` → one claim, `line: 1`, `text: "text"`.
Why: CommonMark treats a bare CR as a line break. Rare, but if you decide it is
*not* a break, then `command` would end up as `a -->␍text` — so pick one and
test it.

**E4 — BOM before a claim on line 1** `[core]` `[D1]`
`⟨BOM⟩<!-- claim: npm test -->␊Tests pass`
→ one claim at `line: 1`.
Why: without a BOM strip, the line no longer starts with `<!--` and the claim
vanishes silently. Windows tooling writes BOMs by default.

**E5 — no trailing newline** `[core]`
`# Doc␊<!-- claim: npm test -->` (file ends there, no `\n`)
→ `[{ cmd: "npm test", text: "", line: 2 }]`
Why: a naive `split("\n")` plus "drop the last empty element" implementation
drops the claim itself.

**E6 — trailing whitespace on the claim-text line** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->
Tests pass␠␠␠
```
→ `text: "Tests pass"`
Why: two trailing spaces are a markdown hard line break; they must not appear in
the report.

**E7 — U+2028 inside a line** `[opt]` `[D2]`
`<!-- claim: echo a⟨U+2028⟩b -->` → one claim, `cmd: "echo a⟨U+2028⟩b"`, one line.
Why: U+2028 is a line terminator to `eval` and to some editors but not to
`split("\n")`. Anything using `\s` in the trim will also behave oddly. Pick "not
a line break" and prove it.

**E8 — U+0085 (NEL)** `[opt]`
Same as E7 with U+0085 → not a line break.
Why: same class of bug, different code point; one test covers the family.

**E9 — zero-byte input** `[core]`
`parseClaims("")` → `[]`
Why: empty files exist, and `[]` must be reached without touching `lines[0]`.

**E10 — whitespace-only input** `[core]`
`parseClaims("\n\n␠␉\n")` → `[]`
Why: same, with a non-empty lines array.

**E11 — no-newline single line that is only a claim** `[core]`
`parseClaims("<!-- claim: npm test -->")` → `[{ cmd:"npm test", text:"", line:1 }]`
Why: the smallest possible valid document; it is also what a unit test will most
often pass in, so it must not be an accident that it works.

---

## 7. Position and the extent of `claimText`

**F1 — claim is the very first line** `[core]` — covered by A1/E4; assert
`line === 1` explicitly, since off-by-one lives here.

**F2 — claim is the very last line, nothing after** `[core]` `[D11]`
```markdown
Some prose.

<!-- claim: npm test -->
```
→ `[{ cmd: "npm test", text: "", line: 3 }]`
Why: answers the question the build plan does not — `claimText` is `""`, never
`null`, never the *preceding* line. Consumers can then do
`text || "(no claim text)"`.

**F3 — blank line between comment and text** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->

Tests pass
```
→ `text: ""`
Why: the adjacency rule made explicit. This is a real authoring mistake and the
report must show an empty claim rather than guess. See §14.1 for the fork.

**F4 — two adjacent claims, no prose between** `[core]` `[D11]`
```markdown
<!-- claim: npm run lint -->
<!-- claim: npm test -->
Everything green
```
→ `[{cmd:"npm run lint", text:"", line:1}, {cmd:"npm test", text:"Everything green", line:2}]`
Why: without "stop at the next claim comment", the first claim's text would be
the second claim's *comment* — invisible in the rendered doc and confusing in the
report.

**F5 — following line is a non-claim HTML comment** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->
<!-- todo: speed this up -->
Tests pass
```
→ `text: ""`
Why: `claimText` should never be text that renders as nothing; a report quoting
`<!-- todo: ... -->` back at the user is nonsense.

**F6 — following content is a heading** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->
## Tests pass
```
→ `text: "## Tests pass"` (markers kept)
Why: no markdown parsing in v1 (an explicit v1 exclusion), so the raw line is the
honest answer; stripping `##` starts an endless "which markers do we strip"
argument. The *reporter* may prettify.

**F7 — following content is a table** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->
| Suite | Result |
|---|---|
| unit | pass |
```
→ `text: "| Suite | Result |\n|---|---|\n| unit | pass |"`
Why: the multi-line block rule; also proves `|` in `claimText` will not break a
reporter that prints tables.

**F8 — following content is a list** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->
- unit: pass
- e2e: pass
```
→ `text: "- unit: pass\n- e2e: pass"`
Why: same rule, and the list items contain `:` — proves claim-text parsing is
entirely separate from command parsing.

**F9 — multi-paragraph block** `[core]` `[D11]`
```markdown
<!-- claim: npm test -->
First paragraph.

Second paragraph.
```
→ `text: "First paragraph."`
Why: the blank-line stop, made visible. This is the rule most likely to surprise
someone; it must be documented in the README with this exact example.

**F10 — text on the same line wins** `[core]` `[D10]`
```markdown
<!-- claim: npm test --> Tests pass
Unrelated next line.
```
→ `text: "Tests pass"` (not `"Tests pass\nUnrelated next line."`)
Why: same-line text is an unambiguous delimiter; once present, the following-line
rule must not also fire.

**F11 — claim inside a list item, text on the same line** `[core]`
```markdown
- <!-- claim: npm test --> Tests pass
- <!-- claim: npm run lint --> Lint clean
```
→ `[]`
Why: **the line does not start with `<!--`** — the `-␠` prefix defeats rule 1.
This is a legitimate-looking annotation style that silently does nothing, and it
is the strongest argument for the near-miss diagnostic in §14.7. Decide whether
to allow a leading list marker (`[-*+]␠` or `\d+[.)]␠`) before publishing; if you
allow it, this case flips to two claims and G12 gets harder.

**F12 — claim text is only whitespace on the next line** `[core]`
```markdown
<!-- claim: npm test -->
␠␠␠
More text
```
→ `text: ""`
Why: a whitespace-only line is a blank line for the stop rule.

**F13 — following block is a fenced code block** `[opt]` `[D11]`
````markdown
<!-- claim: npm test -->
```
$ npm test
0 failures
```
````
→ default rule: `text: ""`. Optional refinement: `claimText` is the entire fenced
block, fence lines included, verbatim.
Why: pasting command output under a claim is a very natural style, and `""` makes
the report useless for exactly the docs most worth checking. Cheap to add once
the fence tracker exists — but if you add it, D4 must still apply *inside* that
block (see G4).

**F14 — very long claim text** `[opt]`
A claim followed by 400 non-blank lines → all 400 captured, no truncation.
Why: truncation is a reporting decision, not a parsing one; keep the parser
lossless so the reporter can change its mind.

---

## 8. Contexts where a claim must NOT be recognised

This section is a **security boundary**, not a niceness feature: a false positive
here executes a shell command that the document displays as an example.

**G1 — inside a plain fence** `[core]` `[D4]`
````markdown
```
<!-- claim: rm -rf / -->
```
````
→ `[]`
Why: the single most important negative case. Every README documenting this tool
contains an example claim inside a fence — including this package's own.

**G2 — fence with an info string** `[core]` `[D4]`
Same as G1 with ` ```markdown ` → `[]`
Why: the info string is the *normal* case in documentation; a fence regex that
requires the line to be exactly three backticks and nothing else misses it.

**G3 — tilde fence** `[core]` `[D4]`
`~~~` … `<!-- claim: npm test -->` … `~~~` → `[]`
Why: tildes are the standard way to show a backtick fence, so docs about this
tool will use them.

**G4 — fence inside a fence** `[core]` `[D4]`
`````markdown
````markdown
```
<!-- claim: npm test -->
```
````
`````
→ `[]`
Why: the closing fence must be *at least as long* as the opening one; a parser
that toggles on any three-backtick run closes early and then treats the claim as
live code.

**G5 — tilde fence containing a backtick fence** `[core]` `[D4]`
`~~~` … ` ``` ` … `<!-- claim: npm test -->` … ` ``` ` … `~~~` → `[]`
Why: fence state is per character type; a shared boolean gets this wrong.

**G6 — closing fence with trailing text is not a close** `[core]` `[D4]`
```` ``` ```` … ` ```js ` … `<!-- claim: npm test -->` → `[]`
Why: only whitespace may follow a closing fence; otherwise the block is still
open.

**G7 — unterminated fence runs to EOF** `[core]` `[D4]`
An opening fence at line 10, with claims at lines 20 and 30, and no closing fence
→ `[]`.
Why: correct per CommonMark, and **silently loses every later claim** — which is
the failure mode this tool exists to catch, occurring inside the tool itself.
Emit a problem (`unterminated-code-fence`) so a mangled document cannot report a
clean bill of health.

**G8 — indented fence** `[core]` `[D4]`
A fence opened with 2 spaces of indent, claim inside → `[]`; the closing fence
may be indented differently (0–3).
Why: fences inside list items are indented; a column-0 assumption breaks them.

**G9 — indented code block** `[core]` `[D5]`
```markdown
Example:

    <!-- claim: npm publish -->
    Published
```
→ `[]`
Why: the pre-fence way of showing code; still common in older docs, and `npm
publish` is a genuinely dangerous false positive.

**G10 — inline code span alone on a line** `[core]`
`` `<!-- claim: npm test -->` `` → `[]`
Why: the line starts with a backtick, so rule 1 rejects it — confirm the
whole-line anchor is doing this work rather than luck.

**G11 — inline code span mid-sentence** `[core]`
```markdown
Write `<!-- claim: npm test -->` above the line you want checked.
```
→ `[]`
Why: prose about the tool must never execute; also proves the parser is not doing
a global regex scan.

**G12 — blockquote** `[core]`
`> <!-- claim: npm test -->` → `[]`
Why: a decision, not an accident. Stripping `>` would make quoted *examples* of
annotations live. Blockquotes are for quoting other people's text; a claim in one
has no clear owner. Document that claims do not work in blockquotes.

**G13 — nested blockquote / lazy continuation** `[core]`
`>> <!-- claim: npm test -->` and a `>`-prefixed fence → `[]`
Why: confirms G12 is not depth-sensitive and that the fence tracker is not
confused by `>` prefixes.

**G14 — table cell** `[core]`
`| lint | <!-- claim: npm run lint --> | ok |` → `[]`
Why: annotating a table row is a thing people will try; it must fail visibly
(§14.7), not half-work. If you later support it, the `|` delimiters give you a
free claim-text boundary — noted in §14.1.

**G15 — YAML frontmatter** `[core]` `[D6]`
```markdown
---
title: Status
<!-- claim: npm test -->
---
Body
```
→ `[]`
Why: frontmatter is metadata, not rendered content; a claim there is either a
mistake or someone's unrelated YAML.

**G16 — unterminated frontmatter guard** `[core]` `[D6]`
A document whose line 1 is `---` (a thematic break) with claims below and no
second `---` → **all claims parsed normally**.
Why: without the guard, one stray `---` at the top of a file silently disables
every claim in it. The guard trades a rare false positive for the elimination of
a catastrophic silent-loss case.

**G17 — `---` thematic break mid-document** `[core]`
A `---` on line 20 with claims either side → both parsed.
Why: only line 1 can open frontmatter.

**G18 — inside a raw HTML block** `[core]`
```markdown
<div align="center">
<!-- claim: npm test -->
Tests pass
</div>
```
→ one claim at `line: 2`, `text: "Tests pass"`
Why: the comment is still invisible when rendered, so the claim is legitimate —
this is a case that must **not** be skipped. It also confirms you did not
over-generalise "HTML block = skip".

**G19 — inside `<pre>`** `[opt]`
A claim comment inside a `<pre>` block → parsed (an HTML comment is invisible
even inside `<pre>`).
Why: tempting to skip by analogy with code fences; the analogy is wrong. If you
disagree, decide it explicitly — `<script>` and `<textarea>` are the only
elements where `<!--` is literal text, and neither belongs in markdown docs.

---

## 9. Non-claim comments that must be ignored

All → `[]` with **no** problem reported, unless stated.

| ID | Input | Why it matters |
|---|---|---|
| **H1** `[core]` | `<!-- todo: npm test -->` | The generic case: other keywords are none of our business. |
| **H2** `[core]` | `<!-- claimant -->` | Prefix match must not fire; `head` must equal `claim` exactly. |
| **H3** `[core]` | `<!-- claims: npm test -->` | Plural. `/^claim/` matches it, `head === "claim"` does not — this case is the reason for the equality rule. |
| **H4** `[core]` | `<!-- proclaim: shout -->` | Suffix match must not fire either. |
| **H5** `[core]` | `<!-- claim-check: x -->` / `<!-- claim_check: x -->` | Adjacent naming from other tools; `head` is not `claim`. |
| **H6** `[core]` | `<!-- prettier-ignore -->`, `<!-- markdownlint-disable -->` | Real directives that co-exist in the same files; they must pass through untouched. |
| **H7** `[core]` | `<!-- claim -->` (no colon at all) | → **problem** `missing-command`, entry with `cmd: ""`. Almost certainly a broken claim, not someone else's comment. |
| **H8** `[core]` | `<!-- verify-claims: npm test -->` | Ignored today. Decide in §14.6 whether to reserve it as an alias before publishing. |
| **H9** `[core]` | `<!-- claim timeout=30: npm test -->` | → **problem** `unsupported-options`, **not** a runnable claim. Silently discarding an option the author wrote is how you get a command running without its timeout. See §14.5. |
| **H10** `[opt]` | `<!-- /claim -->` | Ignored, no problem — reserved for a future end marker (§14.2). Reserving it now costs nothing and keeps future documents backward-compatible. |

---

## 10. Malformed and degenerate claims

**I1 — empty command** `[core]` `[D9]`
`<!-- claim: -->` → `[{ cmd: "", text: <next line>, line: 1, problem: "empty-command" }]`
Why: visible in the report as an error; the alternative (drop it) means a
half-typed claim reads as "all claims pass".

**I2 — whitespace-only command** `[core]` `[D9]`
`<!--claim:␠␉␠-->` → same as I1.
Why: trimming must happen before the emptiness check, not after.

**I3 — the empty command is never executed** `[core]`
A contract test at the Phase 3 boundary: any claim with `command === ""` must be
reported as `errored` without spawning a process.
Why: an empty string passed to a shell is a no-op that **exits 0** — a malformed
claim would otherwise report as *passing*. This is the single worst possible bug
in the package.

**I4 — double colon** `[core]`
`<!-- claim:: npm test -->` → `cmd: ": npm test"`, no problem.
Why: splitting on the *first* colon is what makes `curl http://x` work; document
the consequence rather than special-casing it.

**I5 — command that is a URL** `[core]`
`<!-- claim: curl -sf https://example.com/health -->` → `cmd` intact.
Why: the colon in `https:` is after the first colon, so it must survive; this is
the case I4 exists to protect.

**I6 — colon-first command** `[opt]`
`<!-- claim: :; echo hi -->` → `cmd: ":; echo hi"`.
Why: `:` is a valid shell builtin; proves no over-eager stripping.

---

## 11. Scale, ordering, and pathological input

**J1 — many claims** `[core]`
A generated document with 500 claims → 500 entries, `line` strictly increasing
and matching the generator.
Why: catches accumulator and index bugs that a 3-claim fixture cannot.

**J2 — duplicate identical claims** `[core]`
The same `<!-- claim: npm test -->` twice at lines 3 and 9 → two entries.
Why: no deduplication in the parser; two documents' worth of context may
legitimately assert the same thing, and dedup (if ever wanted) belongs to the
runner as a cache.

**J3 — large file** `[core]`
A 5 MB / ~100k-line document with claims at lines 1, 50000 and the last line →
correct line numbers, completes in well under a second.
Why: line numbers computed by repeated `indexOf`/`slice` degrade to O(n²) and
this is where that shows.

**J4 — catastrophic backtracking probe** `[core]`
10,000 lines of `<!--` with no `-->`, then a line of 5,000 `-` characters, then
`<!-- claim: npm test -->` → parses in milliseconds, one claim.
Why: a lazy quantifier plus optional whitespace groups is a classic ReDoS shape;
this package will run in CI on untrusted-ish documents.

**J5 — one very long line** `[opt]`
A single 1 MB line that is a valid claim → parsed, no stack or buffer issue.
Why: minified content and base64 blobs do appear in docs.

---

## 12. Real-file regression fixtures

**K1 — this package's own README** `[core]`
Run `parseClaims` over `verify-claims/README.md` → must find only the claims that
are genuinely annotated, and **zero** claims from documentation examples.
Why: the self-referential case. The README will show `<!-- claim: npm run lint
-->` as an example; if fence handling is wrong the tool attacks its own docs.
This test is worth more than any three synthetic cases.

**K2 — `ghar-khata-software/DOCS/APP-CONTEXT/CURRENT_STATE.md`** `[core]`
Annotate it, snapshot the parse. This is the "ships when" condition already in
Phase 2 of the build plan.
Why: the first honest contact with real prose; expect it to surface a case not in
this document, and add that case here when it does.

**K3 — the kitchen-sink golden file** `[core]`
One fixture combining a BOM, CRLF, frontmatter, nested fences, a blockquote, a
table, valid claims before and after each hazard, and no trailing newline →
snapshot the full output.
Why: a single file that fails loudly if any rule regresses; keep it as the
canary, with the per-rule cases above for diagnosis.

---

## 13. Invariants worth asserting as properties

If you reach for `fast-check` (optional for v1, but these hold as hand-written
assertions too), these are the invariants that catch the bugs unit tests miss:

1. **Never throws** on any string input.
2. **No stray whitespace**: no returned `command` or `claimText` has leading or
   trailing whitespace, and neither ever contains `\r`.
3. **Line numbers are in range**: `1 <= line <= lineCount`, strictly increasing
   across the array.
4. **Line ending independence**: `parseClaims(s) ≡ parseClaims(s.replace(/\n/g,
   "\r\n"))` for every fixture in this document.
5. **BOM independence**: `parseClaims(s) ≡ parseClaims("\uFEFF" + s)`.
6. **Fence containment**: for any document `d` and any string `x`, wrapping `x`
   in a fence longer than any backtick run inside `x` yields no claims from `x`.
7. **Never executable-empty**: no entry has `command === ""` without a `problem`.
8. **Prefix stability**: appending text to a document never changes the
   `command`, `claimText` or `line` of a claim that precedes an unterminated
   construct — *this one will fail* for unterminated fences (G7) and is the
   precise reason G7 needs a diagnostic.

---

## 14. Format design problems this exposes

The build plan is right that the annotation format is the expensive decision.
Writing the cases above turned up seven concrete problems with it. Where there is
a genuine fork I give the options and pick one.

A framing that helps: **the on-disk syntax is expensive to change; the JavaScript
return shape is not.** `parseClaims` returning an extra field is an additive,
non-breaking change in `0.x` and even in `1.x`. So spend the design budget on the
syntax and be relaxed about the object.

### 14.1 `claimText` has no delimiter — this is the largest hole

`<!-- claim: cmd -->` says where a claim *starts* and never says where it ends.
Every rule for the extent is a guess about intent:

| Option | Pros | Cons |
|---|---|---|
| **(a)** Next single line | Trivial; unambiguous | Breaks tables, lists, any multi-line claim (F7, F8) |
| **(b)** Contiguous non-blank lines *(recommended)* | Handles tables/lists; one rule, one stop condition | A blank line silently empties it (F3); multi-paragraph truncates (F9) |
| **(c)** Until the next blank line **or** heading **or** claim | Slightly smarter | More rules to explain, more ways to be surprised, needs markdown knowledge v1 said it would not have |
| **(d)** Explicit end marker `<!-- /claim -->` | Exact; supports any block | Doubles the annotation burden; two markers to keep in sync |

**Recommendation: (b), plus same-line text (D10) as an explicit opt-in.**
Same-line text is the cheap escape hatch: when the extent matters, the author
writes `<!-- claim: cmd --> the claim` and there is nothing to guess. Reserve (d)
for later (see 14.2).

**And be honest about the stakes:** in v1, `claimText` is decorative — Phase 3
checks only the exit code, so nothing compares the text to reality. Its extent
only starts to *matter* in a future output-matching version. That is an argument
for fixing the rule now while it is free, not for treating it as unimportant.

### 14.2 A claim over a multi-line block has no representation

Today the only answers are "the block happens to be contiguous" (b) or "give up".
A doc with a claim about a whole section — a table of five metrics, a
multi-paragraph invariant — cannot express it.

**Recommendation:** do not implement an end marker in v1, but **reserve
`<!-- /claim -->` now**: parse it, ignore it, never treat it as prose or as
claim text (H10). Reserving is free today and means documents written against a
future block form will not be misparsed by an older installed version. Reserving
syntax before you need it is exactly the kind of decision that is cheap now and
expensive after publishing.

### 14.3 Multi-line commands: don't

An HTML comment may span lines, so users **will** write:
```
<!-- claim:
  npm run lint
-->
```
Allowing it would cost: the "one claim per line" invariant that makes fence,
blockquote and indent handling simple; a well-defined `line`; and any hope of a
simple recognizer. The gain is readability for long commands.

**Recommendation: forbid it, and reject it loudly (C1).** The escape hatch
already exists and is better: put the long command in `package.json` scripts or a
shell script and claim `npm run check:x`. That also makes the command runnable by
hand, which a comment-embedded 200-character pipeline is not. Say so in the
README next to the rejection message.

### 14.4 There is no escaping, and `-->` is unrepresentable

HTML5 permits `--` inside a comment (so `npm test -- --coverage` is fine, A2) but
a comment ends at the first `-->`, full stop. There is no escape sequence in HTML
comments — none, at all. So:

- A command containing `-->` cannot be written (C2), and the truncation is
  *silent and still runnable*, which is the dangerous kind.
- `--->` corrupts the last character invisibly (C3).

Options: (i) invent an escape (`--\>`) — breaks the "renders as nothing on
GitHub" property, since renderers do not know it; (ii) match the **last** `-->`
on the line — makes the parser disagree with every renderer, meaning the tool
runs something the document does not show as commented out; (iii) match the first
`-->` (HTML-correct) and **flag** the leftovers.

**Recommendation: (iii).** The governing principle is *the parser must agree with
the renderer* — the whole justification for HTML comments is that what a reader
sees and what the tool sees are the same thing. Where they cannot agree, the
tool complains instead of guessing. Document `-->` as unusable in a command, with
`sh -c` / an npm script as the workaround.

### 14.5 The format has no extension point — this is the one to fix before publishing

"Everything after `claim:` is the command" consumes the entire grammar. There is
nowhere to put a timeout, an expected exit code, an expected output pattern, a
`skip-on-ci`, or an id — and Phase 3's own plan ("decide on output matching after
using it") means at least one of these is *likely*, not hypothetical. Today's only
routes are a new keyword per option (`<!-- claim-timeout: ... -->`, ugly and
unordered) or smuggling it into the command string.

**Recommendation: reserve the space between `claim` and `:` now.** In v1 it must
be empty or whitespace; anything else is `unsupported-options` (H9) rather than
silently ignored. That single rule keeps
`<!-- claim timeout=30s: npm test -->` available forever, at the cost of ~3 lines
of code and one test. Rejecting rather than ignoring matters: an old version that
silently drops `timeout=30s` runs the command without the timeout its author
required.

### 14.6 The keyword is a common English word, and namespacing is a real fork

`claim` is generic. Legal, insurance, and spec-writing documents use `<!-- claim:
... -->` for their own purposes, and the tool would try to execute those as shell
commands.

Options: `verify-claims:` (collision-proof, verbose, ugly in every doc);
`claim:` (short, readable, collision-prone); support both.

**Recommendation: keep `claim:`.** The line-anchored rule (must start the line,
not in a fence, not in a blockquote) already makes accidental collision unlikely,
and the format's entire value is that it is unobtrusive enough for people who do
not use the tool. Mitigations if it ever bites: a `--marker` flag, and accepting
`<!-- verify-claims: ... -->` as an explicit alias (H8) — worth reserving that
name now for the same reason as 14.2.

### 14.7 No identity, and no channel for "I found something wrong"

Two related gaps:

**Identity.** Nothing correlates a claim across runs. Reordering a document or
editing a command makes it a different claim. That is fine for v1 (run
everything, report everything) and blocks anything later that needs continuity:
baselines, "this claim has been failing for 3 weeks", per-claim ignores, GitHub
review annotations. Fixing it means an id, and an id means the options field
from 14.5. Another reason to reserve it.

**Diagnostics.** This is the important one. Look at how many cases in this
catalogue are *near misses that produce nothing*: a multi-line comment (C1), a
list-prefixed claim (F11), a table-cell claim (G14), a blockquoted claim (G12),
a 4-space-indented claim (B10), an unterminated fence swallowing the rest of the
file (G7), a typo'd `claims:` (H3). In every one, a user who believes they
annotated a claim gets **silence and a green exit code**. For a tool whose entire
purpose is "this document is lying to you", silently verifying nothing is the
worst failure mode available — worse than crashing.

**Recommendations, in order of value:**

1. Give `parseClaims` a way to report problems. Either a `problem?: string` field
   on returned entries (what this catalogue assumes) or, better,
   `parseClaims(md) -> { claims, problems }`. The second is the honest shape;
   both are cheap now and awkward after 1.0.
2. Make the CLI always print a count — `12 claims in 4 files` — so zero is
   visible. A user who annotated 13 will notice.
3. Add near-miss detection for the cases above. It is a handful of regexes and it
   converts the most common authoring mistakes from silence into a one-line fix.

If only one of the three ships in v1, ship (2).

---

## 15. Decisions the owner must make before writing the parser

Everything else in this document follows from these. None can be deferred past
the first publish without cost.

| # | Question | Recommendation | Section |
|---|---|---|---|
| 1 | Is `claim` case-insensitive? | Yes | D7, B7 |
| 2 | How far does `claimText` extend? | Contiguous non-blank lines, plus same-line text | 14.1 |
| 3 | Same-line claim text allowed? | Yes — it is the disambiguator | D10, F10 |
| 4 | First or last `-->`? | First (HTML-correct), flag leftovers | 14.4 |
| 5 | Multi-line commands? | No, and reject loudly | 14.3 |
| 6 | Claims in blockquotes / table cells / list-prefixed lines? | No; diagnose them | G12, G14, F11 |
| 7 | Reserve `<!-- /claim -->` and the options field? | Yes, both, now | 14.2, 14.5 |
| 8 | Does `parseClaims` report problems? | Yes — `{ claims, problems }` if you are willing to change the signature | 14.7 |
| 9 | Capture a fenced block as `claimText`? | Nice to have; defer | F13 |
| 10 | Keyword namespacing? | Keep `claim:`; reserve `verify-claims:` | 14.6 |

When a case here is resolved differently from the recommendation, edit §1 and the
affected case rather than leaving the two out of step — a stale specification
sitting in `docs/` is the exact thing this package exists to catch.
