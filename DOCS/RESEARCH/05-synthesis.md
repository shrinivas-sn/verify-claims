# Step 3 — Synthesis

Date: 2026-08-15. **Awaiting owner approval. No plan is written until this is
confirmed.**

---

## 1. Confirmed scope

| | |
|---|---|
| **Goal** | Owner learns to build and publish production-grade npm packages |
| **Sequence** | Trivial practice package first → then the real one |
| **Mode** | Owner writes the code; I explain and review. Not my authorship. |
| **Target** | Node, TypeScript, published publicly to npm |
| **Repo** | Standalone per package; this repo keeps process/audit docs only |
| **Time** | No constraint. Quality gates are not tradeable for speed. |
| **Cost** | Zero. Public publishing, CI, and provenance are all free. |

**The real package (later, not now):** a checker for claims about a project that
have gone silently false — root cause extracted from the owner's own repo in
`04-extracted-problems.md`. Parked deliberately.

---

## 2. What to build as the practice package

Criteria agreed: small enough to finish in days, real enough that publishing it
isn't a lie, boring enough that no product judgement is wasted, and something the
owner would genuinely install.

### Candidate A — Split a money amount without losing paise ⭐ recommended

Divide an amount into shares that **sum exactly back to the original**, using the
largest-remainder method.

Straight from the owner's `007_farmers_and_settlements.sql`:

> "Rounding each slice independently loses money permanently — three ₹33,333.33
> slices of ₹1,00,000 are a paisa short, **forever**. §4.3: integer paise,
> largest remainder."

- **Real?** Yes — already implemented in SQL for farmer settlements, and the
  owner hit the bug it prevents.
- **Incumbents [primary]:** `largest-remainder` last released **2,473 days ago**
  (~7 years); `apportionment` **1,572 days**. Both decaying, both niche.
- **Why it's the right first package:** a pure function. No network, no
  filesystem, no async, no config. Zero runtime complexity means **100% of the
  learning goes into packaging and publishing** rather than into debugging your
  own logic.
- **Tests are meaningful, not ceremonial.** There is a hard invariant — the
  shares must sum to the input, exactly, always — which makes property-based
  testing natural and genuinely catches bugs.
- **Teaches:** public API design, edge cases (negatives, zero, more shares than
  units, custom rounding), semver on a small surface.

### Candidate B — npm package staleness CLI

Port the `tools/probe.py` / `tools/staleness.py` scripts to TypeScript.

- **Real?** Yes — built and used during this research, and it found things npm's
  own search could not.
- **Teaches additionally:** `bin` entries, CLI argument parsing, async, network
  error handling, terminal output.
- **Against:** network, rate limits, caching and retries are all failure surface.
  Debugging those steals attention from the actual lesson. Better as package #2.

### Candidate C — Indian currency formatting

Generalise `src/utils/currency.ts`.

- **Against, and I'd argue against it:** `Intl.NumberFormat` already does this
  natively. My 2B research found `accounting` (416k weekly downloads) went
  untouched for ~12 years most likely *because the platform ate its job*.
  Rebuilding what the runtime already provides is the weakest option here.

**Recommendation: A.** B is a good second package. C should be dropped.

---

## 3. Technical approach

Each choice follows from Step 2 research, not convention.

| Decision | Choice | Why |
|---|---|---|
| Module format | **ESM-only** | `require(esm)` is stable on every supported LTS; Node 20 is EOL. Dual publishing solves a problem that no longer exists. |
| Node floor | **`>=22.12`** | Lowest version with stable `require(esm)`. Node 22 is supported to Apr 2027. |
| Build | **`tsc` alone, no bundler** | Pure-TS library with no assets. The consumer's bundler does the bundling. One less tool between you and understanding the package. |
| Tests | **vitest** | You already use it in this repo. Zero new learning. |
| Test target | **the built artifact, not `src/`** | Most packaging bugs are invisible to tests that import from source. |
| Validation | **`publint` + `@arethetypeswrong/cli` + `npm pack`** | In CI *and* `prepublishOnly`. Catches the whole class of exports-map bugs in seconds. |
| Releases | **changesets** | Forces an explicit human semver decision every change. That judgement is the skill; semantic-release hides it behind commit conventions. |
| Publishing | **GitHub Actions + OIDC trusted publishing** | Classic tokens were revoked Dec 2025. Provenance is automatic. Any tutorial saying "add an NPM_TOKEN secret" is teaching an obsolete, insecure habit. |
| Name | **scoped**, `@shrinivas-sn/…` | Free, publicly publishable with `--access public`, no name-squatting fight. |

**Deliberately excluded from v1:** monorepo, bundler, dual CJS, benchmarks,
docs site, browser build. Each is a real thing to learn — none belongs in a first
package, and adding them would obscure the lesson.

---

## 4. Risks and unknowns

| Risk | Severity | Handling |
|---|---|---|
| **Some Step 2 findings are `[secondary]`** — token revocation date and `require(esm)` status came from search summaries because the proxy blocked official docs | **Medium** | Re-verify against `docs.npmjs.com` and `nodejs.org` at the start of Step 5, before depending on them. Written into the plan as a task, not left to memory. |
| Trusted publishing setup fails in CI | Medium | Most likely place to get stuck. Budget real time; fall back to a manual first publish and automate after, rather than blocking on it. |
| ESM-only annoys a future consumer | Low | The first consumer is you. Revisit only if a real complaint arrives. |
| Practice package quietly becomes "the real one" | Medium | Named risk because it's the common failure. It ships, then we stop and return to the real problem. |
| Scope creep into a "useful" library | Medium | v1 does one thing. Ideas go in a file, not the code. |
| Publishing a name you later regret | Low | Scoped name; unpublishing within 72h is possible, and a rename is cheap at zero users. |

---

## 5. v1 versus later

**v1 (`0.1.0` → `1.0.0`)**
- One exported function, fully documented
- Full test suite including the sum invariant
- ESM-only build via `tsc`, correct `exports` map with `types` first
- CI: typecheck, test, lint, `publint`, `attw`, `npm pack`
- Published to npm via trusted publishing, with provenance
- README that shows the real use case in the first screen
- Changelog generated from changesets

**Later**
- Additional rounding strategies, if a real need appears
- Candidate B as package #2
- Then the real package from `04-extracted-problems.md`

**Definition of done for the practice package:** it is on npm, `npm i` works in a
fresh project, the types resolve, provenance shows on the package page, **and the
owner can explain every file in the repo.** That last clause is the actual goal.

---

## 6. What I need from the owner

1. **Approve or change candidate A.**
2. **Confirm the technical approach**, especially ESM-only and no bundler.
3. **Name**, once A is settled — I'll propose options against the Step 1 criteria.

No plan gets written until 1 and 2 are answered.
