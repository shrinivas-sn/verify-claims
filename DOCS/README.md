<!-- docs-structure: v1 -->
# DOCS index

One row per `WORK/<date>/` folder. Keep this updated in place — don't let it drift
from what's actually in `WORK/`. Add a row the same session a new day-folder is created.

Dates in this table are written **DD/MM/YYYY** (user is India-based). This is display
text only — the `WORK/<date>/` folder name underneath stays YYYY-MM-DD, since that's
the only format that sorts correctly on disk and in `git log`.

| Date | Summary | Status | Load-bearing | Touches | Continues |
|---|---|---|---|---|---|
| 15/08/2026 | Research, problem discovery, decision to build `verify-claims`, and the 10-phase build plan | done | yes | `DOCS/`, project scope | — |
| 18/08/2026 | Built and shipped v1: all 10 build-plan phases, published to npm, one real bug found+fixed, README rewritten | done | yes | `src/`, `package.json`, `.github/workflows/`, `README.md` | 15/08/2026 |

Both entries were split out of a single continuous append-only worklog
(`00-worklog.md`) that spanned both dates — see each `WORK.md`'s Plan section
for why Plan and Execution aren't separated the usual way here.

See `CONTEXT/` for the project overview, the decision record, the build plan,
and this project's own `START-HERE.md` orientation doc (relocated, paths inside
it describe the old flat layout — see the note at its top). `RESEARCH/` holds
the discovery-phase research (clarifying questions through GitHub-wide pattern
analysis). `EXTRA/tools/` holds the two measurement scripts used during
research (niche crowdedness, staleness probes).

**Status** — `active` (in progress), `done` (finished, not touched again), `superseded`
(a later entry replaced this approach), `abandoned` (started, dropped, note why in the
WORK.md itself).

**Load-bearing** — `yes` if this session's decisions still constrain current
architecture/behavior, even if old. `no` once it's fully superseded or irrelevant to
anything still standing.

**Touches** — rough file paths or feature areas, used by `/recap` to decide whether
an old-but-load-bearing entry is relevant to what you're doing right now.

**Continues** — if this session picks up a multi-day work item, point at the earlier
date so recap follows the thread instead of treating same-topic sessions as unrelated.
