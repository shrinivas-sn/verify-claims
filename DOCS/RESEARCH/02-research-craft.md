# Step 2A — Craft Research: how production-grade npm packages are built in 2026

Date: 2026-08-15. Sources at the bottom.

**Method note / limitation.** This environment's egress proxy blocked most
documentation domains (`docs.npmjs.com`, `nodejs.org`, `github.blog`, `arxiv.org`
and others). `registry.npmjs.org` is reachable, so wherever a claim could be
checked against the registry directly, it was — those are marked **[primary]**.
Claims resting only on web-search summaries are marked **[secondary]** and should
be re-verified against official docs before we depend on them.

---

## Finding 1 — ESM-only is now viable. This is the big one.

~~`require(esm)` — CommonJS code being able to `require()` an ES module — is
**stable and unflagged across every supported Node LTS line** (20.19+, 22.12+,
stable marker added in 25.4.0 and backported to 24.15.0). **[secondary]**~~
**[corrected 2026-08-18]** False as stated. Checked the version-pinned Node
22.x docs directly (not the "latest" docs page, which reflects only the
current release line): `require(esm)` is marked **Stability: 1.2 - Release
candidate** on Node 22.x, including the newest 22.23.2 patch — never
"2 - Stable" on that line. The stable marker only landed in 24.15.0/25.4.0,
as the second half of this claim already said. Unflagged (no warning, no
CLI flag needed) from 22.12.0 on, "quiet" from 22.13.0 — but "unflagged"
and "Stable" are different things. ESM-only as an approach still holds; the
`engines` floor claim below did not.

Node support status as of now **[secondary]**:

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
problem (floor corrected 2026-08-18, was `>=22.12` — see above). I'd been
prepared to teach dual publishing; the research says don't.

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

**npm permanently deprecated and revoked all classic tokens on 2025-12-09.**
**[secondary — verify before relying]**

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
- 2FA on the npm account, on from day one.

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
