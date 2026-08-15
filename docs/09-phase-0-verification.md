# Phase 0 — Re-verification of the `[secondary]` findings

Date: 2026-08-15 (Session 10). Closes task 1 of Phase 0 in `08-build-plan.md`.

Step 2 could not reach official documentation — the egress proxy blocked
`docs.npmjs.com` and `nodejs.org` — so the two findings the whole technical
approach rests on were tagged `[secondary]`. This document re-checks both against
primary sources and records what changed.

**Result in one line: finding 1 (npm tokens) is confirmed with a date
correction; finding 2 (`require(esm)`) is _wrong as written_, though the
conclusion drawn from it still holds.**

---

## What was reachable this time

| Source | Status | Used as |
|---|---|---|
| `nodejs.org` (incl. `/docs/latest-v22.x/`, `/dist/index.json`) | reachable | primary |
| `github.com/npm/documentation` (source of `docs.npmjs.com`) | clonable | primary |
| `raw.githubusercontent.com/nodejs/Release/main/schedule.json` | reachable | primary |
| `registry.npmjs.org` | reachable | primary |
| `docs.npmjs.com`, `docs.github.com`, `github.blog`, `npmjs.com` | **still blocked** | — |

`docs.npmjs.com` is still blocked, but it is generated from the public
`npm/documentation` repository, so the repository *is* the primary source rather
than a substitute for one. Clone verified at commit `26eacbbb` (2026-08-13,
two days old).

---

## Finding 1 — npm classic tokens are gone · **CONFIRMED** (date corrected)

`content/integrations/integrating-npm-with-external-services/about-access-tokens.mdx`:

> As of November 2025, only Granular access tokens are supported. Legacy access
> tokens have been removed.

**Correction:** `02-research-craft.md` gave the date as **2025-12-09**. The
official wording is **November 2025**. The substance — classic/legacy tokens are
removed, not merely deprecated — is confirmed. Only the date was wrong.

Trusted publishing is confirmed as the replacement
(`.../securing-your-code/trusted-publishers.mdx`): OIDC, no long-lived token,
supported for GitHub Actions, GitLab CI/CD and CircleCI, **cloud-hosted runners
only**. Provenance really is automatic — "you don't need to add the
`--provenance` flag" — when publishing via OIDC from a **public repo** to a
**public package** (not on CircleCI).

### Four things the Step 2 research did not know

These are new since the research was written and they change work in later phases:

1. **Trusted publishing has version floors: npm ≥ 11.5.1 and Node ≥ 22.14.0.**
   This bites, because Node 22 ships an npm that is too old:

   | Node | Bundled npm | Trusted publishing? |
   |---|---|---|
   | 22.23.2 | 10.9.8 | ✘ below the 11.5.1 floor |
   | 24.19.0 | 11.17.0 | ✔ |
   | 26.7.0 | 11.19.0 | ✔ |

   So the publish workflow must run **Node 24+** (or upgrade npm explicitly).
   The plan already says Node 24 locally — now there is a hard reason for it in CI too.

2. **`repository.url` in `package.json` must exactly match the GitHub repo**, or
   publishing from Actions fails. The Phase 1 `package.json` sketch omits
   `repository` entirely — see the note added to `08-build-plan.md`.

3. **Staged publishing exists** (`npm stage publish`, then a maintainer approves
   with 2FA before the version goes public). npm's strongest recommended posture
   is a stage-only trusted publisher plus "require 2FA and disallow tokens".
   Recorded as an option for Phase 8, not a requirement for it.

4. **A trusted publisher created after 2026-05-20 must declare its allowed
   actions** (`npm publish`, `npm stage publish`, or both). Ours will be new, so
   this applies.

### Bearing on Phase 0 task 2 (2FA)

`.../securing-your-code/requiring-2fa-for-package-publishing-and-settings-modification.mdx`:

> All packages now require two-factor authentication (2FA) or a granular access
> token with bypass 2FA enabled for creating and publishing packages.

2FA is not optional hardening any more — without it the first publish cannot
happen. Also, as of **August 2026** (this month), bypass-2FA tokens can no longer
perform account-identity actions such as changing 2FA settings or managing
tokens; those always require an interactive challenge.

---

## Finding 2 — `require(esm)` "stable on Node 22.12+" · **WRONG AS WRITTEN**

The research said `require(esm)` is *"stable and unflagged across every supported
Node LTS line (20.19+, 22.12+, stable marker added in 25.4.0 and backported to
24.15.0)"*. The stable-marker half is right. The **Node 22 half is not.**

From the History table on `nodejs.org/api/modules.html`, read per release line:

| Change | Landed in |
|---|---|
| Added, behind `--experimental-require-module` | v22.0.0, v20.17.0 |
| No longer behind the flag | v23.0.0, **v22.12.0**, v20.19.0 |
| No longer emits an experimental warning by default | v23.5.0, **v22.13.0**, v20.19.0 |
| **"This feature is no longer experimental"** | **v24.15.0** and **v25.4.0** |

And the decisive detail — the **Node 22 documentation as it stands today**
(`/docs/latest-v22.x/api/modules.html`, v22.23.2) still carries:

> **Stability: 1.2 - Release candidate**

That marker is **absent** from the v24 and v26 pages. So the promotion to stable
was never made within the Node 22 line, and will not be: it landed in 24.15.0 and
25.4.0 only. On Node 22, `require(esm)` is unflagged, quiet — and still formally
a release candidate for the entire remaining life of that line.

### Does the approach change?

**No.** ESM-only remains viable, which was the load-bearing conclusion. Every
non-EOL Node can `require()` an ESM package without a flag. Nothing about the
build, the `exports` map, or the decision to skip dual publishing changes.

### What does change: the `engines` floor

`>=22.12` is the wrong number and the reason given for it in the plan
("floor with stable `require(esm)`") is not true at that version. On exactly
22.12, a CommonJS consumer requiring this package gets an `ExperimentalWarning`
printed to their stderr. 22.13 is the first version where that stops.

Two defensible floors — this is the owner's call in Phase 1:

| Floor | Argument | Cost |
|---|---|---|
| **`>=22.13.0`** *(recommended)* | First version with no warning for consumers. Keeps all of Node 22 LTS, supported to 2027-04-30. | `require(esm)` is RC-grade, not stable, for Node 22 consumers. |
| `>=24.15.0` | `require(esm)` genuinely stable everywhere the package can run. | Excludes an LTS line that is supported for another 20 months, for a guarantee about Node's paperwork rather than its behaviour. |

Recommendation: **`>=22.13.0`**. The RC marker describes Node's confidence in its
own feature, not a behavioural difference we would hit — and the behaviour has
been unchanged since 22.12. The warning, by contrast, is real output on a real
user's terminal, which is why the floor moves off 22.12 rather than staying.

---

## Bonus: the Node support table is now primary

The table in `02-research-craft.md` was `[secondary]`. Checked against
`nodejs.org/en/about/previous-releases` and `nodejs/Release`'s `schedule.json`:

| Line | Status (2026-08-15) | EOL | Research said | |
|---|---|---|---|---|
| 26 | Current, enters LTS 2026-10-28 | 2029-04-30 | "enters LTS Oct 2026" | ✔ |
| 25 | **EOL** since 2026-06-01 | — | not listed | — |
| 24 | Active LTS (maintenance from 2026-10-20) | 2028-04-30 | Active LTS, Apr 30 2028 | ✔ |
| 22 | Maintenance LTS | 2027-04-30 | Maintenance LTS, Apr 30 2027 | ✔ |
| 20 | EOL | 2026-04-30 | dead, Apr 30 2026 | ✔ |

All correct. Retagged `[primary]`.

Worth noting for its own sake: **Node 25 is already EOL**, and 25.4.0 is one of
the two releases that marked `require(esm)` stable. A fact can be true and land
in a version nobody should run — which is the sort of thing that only shows up
when you actually go and check.

---

## Sources

- `github.com/npm/documentation` @ `26eacbbb` (2026-08-13) — the source of `docs.npmjs.com`
  - `content/integrations/integrating-npm-with-external-services/about-access-tokens.mdx`
  - `content/packages-and-modules/securing-your-code/trusted-publishers.mdx`
  - `content/packages-and-modules/securing-your-code/requiring-2fa-for-package-publishing-and-settings-modification.mdx`
- `nodejs.org/api/modules.html` (v26.7.0), `/docs/latest-v24.x/api/modules.html` (v24.19.0),
  `/docs/latest-v22.x/api/modules.html` (v22.23.2)
- `nodejs.org/en/about/previous-releases` and `nodejs.org/dist/index.json`
- `github.com/nodejs/Release` → `schedule.json`
- `registry.npmjs.org/npm` → npm latest 12.0.2 (2026-07-29)
