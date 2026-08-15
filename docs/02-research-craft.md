# Step 2A — Craft Research: how production-grade npm packages are built in 2026

Date: 2026-08-15. Sources at the bottom.

**Method note / limitation.** This environment's egress proxy blocked most
documentation domains (`docs.npmjs.com`, `nodejs.org`, `github.blog`, `arxiv.org`
and others). `registry.npmjs.org` is reachable, so wherever a claim could be
checked against the registry directly, it was — those are marked **[primary]**.
Claims resting only on web-search summaries are marked **[secondary]** and should
be re-verified against official docs before we depend on them.

> **Re-verified 2026-08-15 (Session 10).** Findings 1 and 4 have been checked
> against primary sources; corrections are inline below and the full record is in
> `09-phase-0-verification.md`. Finding 1 was **wrong** and is struck through
> where wrong. Findings 3's `[secondary]` half is still unverified.

---

## Finding 1 — ESM-only is now viable. This is the big one.

~~`require(esm)` — CommonJS code being able to `require()` an ES module — is
**stable and unflagged across every supported Node LTS line** (20.19+, 22.12+,
stable marker added in 25.4.0 and backported to 24.15.0).~~ **[secondary]**

> **CORRECTED 2026-08-15 — this was wrong.** *Unflagged* on every supported line
> is right; ***stable* is not.** `require(esm)` is unflagged from 22.12.0 and
> stops warning at 22.13.0, but Node 22's own docs still mark it
> **`Stability: 1.2 - Release candidate`** today (v22.23.2) and always will — the
> promotion to stable landed only in **24.15.0** and **25.4.0**, and was never
> backported to the 22 line. The conclusion below (ESM-only is viable) survives
> unchanged; the **`>=22.12` floor does not** — see `09-phase-0-verification.md`.

Node support status as of now **[primary — verified 2026-08-15 against
`nodejs.org/en/about/previous-releases` and `nodejs/Release`'s `schedule.json`]**:

| Line | Status | EOL |
|---|---|---|
| 26 | Current | enters LTS Oct 2026 |
| 24 | **Active LTS** | Apr 30, 2028 |
| 22 | Maintenance LTS | Apr 30, 2027 |
| 20 | **dead** | Apr 30, 2026 |

Node 20 is already end-of-life. So the lowest Node any supported consumer runs
already has `require(esm)`.

**Consequence:** the entire "dual ESM/CJS publishing" apparatus — two build
outputs, `module-sync` conditions, the dual-package hazard, "masquerading as CJS"
bugs — is **largely obsolete for a new package**. Most of the tutorials on this
are 2022–2024 material solving a problem that has since been fixed upstream.

**This materially simplifies what you have to learn.** A new package in 2026 can
be ESM-only with `"engines": { "node": ">=22.13" }` and simply not have the
problem. I'd been prepared to teach dual publishing; the research says don't.

> **Floor corrected 2026-08-15:** was `>=22.12`. On exactly 22.12 a CommonJS
> consumer sees an `ExperimentalWarning`; 22.13.0 is the first release that is
> quiet. Alternative floor `>=24.15.0` (where the feature is formally stable)
> considered and not recommended — it would drop Node 22 LTS, supported until
> 2027-04-30, to gain a paperwork guarantee rather than a behavioural one.

*Caveat:* ESM-only still hurts consumers stuck on dead Node or on bundlers that
mis-resolve. For a package whose first user is you, that risk is near zero.

---

## Finding 2 — The recommended bundler is decaying, and you may not need one

Every 2026 blog I found recommends **tsup** as the default library bundler.
The registry says otherwise **[primary]**:

| Package | Latest | Last release | Home | Note |
|---|---|---|---|---|
| `tsup` | 8.5.1 | **2025-11-12** (~9 months) | `egoist/tsup` | not deprecated, but cadence collapsed |
| `tsdown` | 0.22.14 stable, 0.23 rc | **2026-08-12** | **`rolldown/tsdown`** | active; still 0.x |
| `unbuild` | 3.6.1 | 2025-08-15 (~12 months) | UnJS | also slowing |
| `publint` | 0.3.23 | 2026-08-04 | — | actively maintained |
| `@changesets/cli` | **3.0.0** | 2026-08-11 | — | actively maintained |

tsup's release history: 2024-10, 2025-01, 2025-02, 2025-05, 2025-11. That is a
project winding down, not a dead one — but recommending it as *the* default in
2026 is blog inertia, not a live assessment.

`tsdown` has moved under the **rolldown** org — i.e. adopted by the Rolldown/Vite
team — and ships continuously. The tradeoff is honest: it is where the ecosystem
is going, but it is pre-1.0 and can break under you.

**Third option, and my actual recommendation for the practice package: no bundler
at all.** A pure-TypeScript library with no CSS, assets, or JSX can be built by
`tsc` alone. Applications need bundling; libraries mostly do not — the consumer's
bundler does that job. Starting with plain `tsc` means one less tool between you
and understanding what a package actually *is*, and you can add a bundler later
when something concretely demands it. You already have TypeScript ~6 in your app,
so this is familiar ground.

---

## Finding 3 — Two validators are non-negotiable

- **`publint`** — audits `package.json` itself: `exports` map, `files`, `bin`,
  deprecated fields, main/module mistakes.
- **`@arethetypeswrong/cli` (attw)** — resolves the *published artifact* through
  every TypeScript resolution mode and reports which ones return wrong types.

Both run in seconds. The standard is to wire them into `prepublishOnly` and CI,
alongside `npm pack`, so a broken package cannot leave your machine.
**[secondary, but publint's maintenance is [primary]]**

The single most common packaging bug they catch: **`types` must come first in
every conditional `exports` block.** Ordering in an exports map is significant —
first match wins — so putting `types` after `import`/`require` silently breaks
type resolution for consumers while working fine locally.

---

## Finding 4 — Publishing security changed hard, and old tutorials are dangerous

**npm permanently deprecated and revoked all classic tokens.**
**[primary — verified 2026-08-15 against the `npm/documentation` source]**

> **Date corrected 2026-08-15:** the research said **2025-12-09**. npm's own docs
> say ***November 2025***: *"As of November 2025, only Granular access tokens are
> supported. Legacy access tokens have been removed."* The substance — removed,
> not merely deprecated — is confirmed; only the date was wrong.

The replacement is **OIDC trusted publishing**: you register a specific GitHub
Actions (or GitLab CI) workflow as a trusted publisher for the package, and CI
publishes with short-lived, workflow-scoped credentials. No long-lived token
exists to leak. **Provenance attestations are published by default** under
trusted publishing, giving consumers a verifiable link from package to the exact
commit and workflow that built it.

This followed the self-replicating npm supply-chain worms of 2025–2026.

**Practical consequences for us:**
- Any tutorial that says "create an npm token and put it in secrets" is **out of
  date and teaches an insecure habit**. Skip those.
- We should publish from CI via trusted publishing from the very first release —
  it is *easier* than tokens, not harder, and it is free.
- 2FA on the npm account, on from day one. **Verified 2026-08-15: this is now
  mandatory, not advice** — all packages require 2FA (or a bypass-2FA granular
  token) to publish at all.

**Added 2026-08-15 from the primary source** — constraints the search summaries
did not surface, all of which land in Phase 1 or Phase 8:
- Trusted publishing requires **npm ≥ 11.5.1 and Node ≥ 22.14.0**. Node 22 bundles
  npm 10.9.8, which is too old — so **CI must run Node 24+** (24.19.0 bundles
  11.17.0).
- **`repository.url` must exactly match the GitHub repo** or the publish fails.
- Cloud-hosted runners only; self-hosted is unsupported.
- Provenance is automatic *only* for a public package from a **public** repo, and
  not at all on CircleCI.
- **Staged publishing** (`npm stage publish` → maintainer approves with 2FA) now
  exists and is npm's strongest recommended posture. Optional for us.

---

## Finding 5 — Release automation: changesets over semantic-release

| | semantic-release | changesets |
|---|---|---|
| Version source | parses commit messages (`feat:`, `fix:`) | explicit `.changeset/*.md` files |
| Changelog quality | mechanical, often poor for users | prose you wrote deliberately |
| Flow | push → auto release | PR adds changeset → bot opens "Version Packages" PR → merge → publish |
| Monorepo | ok | best in class |

**Recommendation: changesets**, for one reason that matters to a learner — it
forces an explicit, human decision about *what changed and why it is major/minor/
patch*, on every change. semantic-release hides that decision behind commit
message conventions. You want the reps on semver judgement; that judgement is
the actual skill, and it is the one that breaks strangers' builds when wrong.

Also: `@changesets/cli` just hit 3.0.0 and is actively maintained. **[primary]**

---

## Finding 6 — What "production grade" concretely means

Synthesising across sources, the checklist for a package a stranger will trust:

**Correctness**
- ESM-only, `exports` map with `types` first, no deep-import surface you didn't
  intend to support
- `files` allowlist so you ship `dist` and not your whole repo
- `engines` declaring the real Node floor
- Declaration files that resolve in every mode attw checks

**Contract**
- Semver taken seriously; a documented public API and an explicitly *private* rest
- Changelog a human can read
- Deprecation policy rather than silent removals

**Trust**
- CI on every PR: typecheck, test, lint, `publint`, `attw`, `npm pack`
- Trusted publishing + provenance
- Tests that run against the **built artifact**, not just source — most packaging
  bugs are invisible to tests that import from `src/`
- README that shows the actual use case in the first screen

**Maintenance** — the differentiator, see 2B.

---

## What this changes vs. what you originally asked for

1. **Less to learn than expected.** Dual ESM/CJS was going to be the hardest
   part; it's now mostly unnecessary. Good news.
2. **You may not need a bundler**, which removes another whole tool.
3. **Publishing security is now the fiddly part** — trusted publishing and CI
   config — and it is where most tutorials will actively mislead you.
4. Net: the practice package is *more* achievable than I assumed, and the time
   is better spent on API design and semver discipline than on build plumbing.

---

## Sources

Search-derived **[secondary]**:
- [tsup vs tsdown vs unbuild 2026 — PkgPulse](https://www.pkgpulse.com/guides/tsup-vs-tsdown-vs-unbuild-typescript-library-bundling-2026)
- [The State of TypeScript Tooling in 2026 — PkgPulse](https://www.pkgpulse.com/guides/state-of-typescript-tooling-2026)
- [publint vs arethetypeswrong vs Knip 2026 — PkgPulse](https://www.pkgpulse.com/guides/publint-vs-arethetypeswrong-vs-knip-2026)
- [The package.json exports Map Is the Most Important File You're Writing Wrong — DEV](https://dev.to/gabrielanhaia/the-packagejson-exports-map-is-the-most-important-file-youre-writing-wrong-5a0o)
- [Dual Publishing ESM and CJS Modules with tsup and attw — johnnyreilly](https://johnnyreilly.com/dual-publishing-esm-cjs-modules-with-tsup-and-are-the-types-wrong)
- [require(esm) in Node.js: from experiment to stability — Joyee Cheung](https://joyeecheung.github.io/blog/2025/12/30/require-esm-in-node-js-from-experiment-to-stability/)
- [The End of Dual CJS/ESM Builds in Node.js — OpenReplay](https://blog.openreplay.com/end-dual-cjs-esm-builds-nodejs/)
- [npm trusted publishing with OIDC is generally available — GitHub Changelog](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [Securing Your NPM Publishing: Transitioning to Trusted Publishing — Speakeasy](https://www.speakeasy.com/blog/npm-trusted-publishing-security)
- [The Ultimate Guide to NPM Release Automation — Oleksii Popov](https://oleksiipopov.com/blog/npm-release-automation/)
- [Intentional Releases: Why Choose Changesets over Semantic-Release](https://levelup.gitconnected.com/intentional-releases-why-chose-changesets-over-semantic-release-9d16d693540b)
- [Node 22 vs Node 24 in 2026 — PkgPulse](https://www.pkgpulse.com/guides/nodejs-22-vs-nodejs-24-2026)
- [nodejs/Release](https://github.com/nodejs/Release)

Registry-verified **[primary]**: `registry.npmjs.org` documents for `tsup`,
`tsdown`, `unbuild`, `publint`, `@changesets/cli`, queried 2026-08-15.
