# Step 5 — Real-world corpus: the proposed annotation format, stress-tested

Date: 2026-08-15. Written for Phase 2 of `08-build-plan.md`, which says the
parser "ships when tested against real files from `ghar-khata-software/DOCS`".

Source: `/workspace/ghar-khata-software` (read-only reference clone; nothing in
it was modified, and no build, test or lint command was run inside it — every
"actual" value below comes from reading files).

**132 real claims** were extracted verbatim with `file:line`. They are catalogued
in §2, classified in §3, run against the proposed format in §4, measured against
the v1 rule in §5, and checked for current truth in §6.

---

## The three numbers, up front

| Question | Answer |
|---|---|
| What fraction of real claims can v1 cover *at all*? | **79 / 132 — 60%** |
| What fraction work with a bare project command, no expected value written into the annotation? | **41 / 132 — 31%** |
| What fraction of claims that *were* checked turned out to be currently **false**? | **54 of the 132**, including 12 of 13 file-size claims and every test-count claim but two |

The 60% is the honest ceiling for v1. The 31% is the honest ceiling for v1 *as
specified* — "non-zero exit = false, no output matching" — if the annotation is
not allowed to restate the number the prose is asserting. §5 explains why the
gap between those two figures is the single design decision left in v1.

---

## 1. Survey of the corpus

**26 markdown files, 6,700 lines, 372 kB.** No other markdown exists in the repo
(`node_modules` and `.git` excluded).

| Group | Files | Lines | Character |
|---|---:|---:|---|
| `DOCS/APP-CONTEXT/` | 12 | 5,605 | The agent-context set. Mixed register: measured state, historical narrative, prescriptive spec, and task bookkeeping. **This is where essentially every checkable claim lives.** |
| `DOCS/npm-package-project/` | 10 | 1,660 | The planning trail for *this* package (00–08 plus a README and `tools/`). Meta — claims about npm, not about the app. |
| Root `README.md` | 1 | 328 | Setup, migrations, security model, commands, backup runbook. Second-densest claim source. |
| `DOCS/FAMILY-GUIDE.md`, `DOCS/FARMER-GUIDE-KN.md` | 2 | 241 | End-user instructions, deliberately jargon-free. Claims are about *UI behaviour*, not about the build. |
| `DOCS/APP-RELATED/cheque-feature-backup.md` | 1 | 215 | A historical record, opened with a hand-written "⚠️ Superseded" banner. |

### File inventory

| Lines | File |
|---:|---|
| 842 | `DOCS/APP-CONTEXT/COMPLETE_CONTEXT.md` |
| 761 | `DOCS/APP-CONTEXT/FARMER_MODULE_PLAN.md` |
| 655 | `DOCS/APP-CONTEXT/ENGINEERING_SPEC.md` |
| 627 | `DOCS/APP-CONTEXT/SYSTEM_DESIGN.md` |
| 593 | `DOCS/APP-CONTEXT/NEXT_SESSION_PLAN.md` |
| 447 | `DOCS/APP-CONTEXT/CURRENT_STATE.md` |
| 442 | `DOCS/APP-CONTEXT/PRODUCTION_READINESS_REVIEW.md` |
| 416 | `DOCS/APP-CONTEXT/CODEBASE_STANDARDS.md` |
| 328 | `README.md` |
| 320 | `DOCS/npm-package-project/00-worklog.md` |
| 319 | `DOCS/APP-CONTEXT/PROJECT_SETUP.md` |
| 314 | `DOCS/APP-CONTEXT/TASK_BOARD.md` |
| 215 | `DOCS/APP-RELATED/cheque-feature-backup.md` |
| 194 | `DOCS/npm-package-project/02-research-craft.md` |
| 165 | `DOCS/npm-package-project/03-research-problem.md` |
| 156 | `DOCS/FAMILY-GUIDE.md` |
| 156 | `DOCS/npm-package-project/08-build-plan.md` |
| 151 | `DOCS/npm-package-project/01-clarifying-questions.md` |
| 147 | `DOCS/npm-package-project/07-decision.md` |
| 144 | `DOCS/npm-package-project/05-synthesis.md` |
| 144 | `DOCS/npm-package-project/06-github-wide-patterns.md` |
| 139 | `DOCS/npm-package-project/04-extracted-problems.md` |
| 110 | `DOCS/APP-CONTEXT/PHASE7_FEATURES.md` |
| 90 | `DOCS/npm-package-project/README.md` |
| 85 | `DOCS/FARMER-GUIDE-KN.md` |
| 79 | `DOCS/APP-CONTEXT/PRODUCT_DOCUMENT.md` |

### Character, and why it matters for the format

Five registers coexist, sometimes inside one file. The format has to survive all
five, and it does not survive them equally:

1. **Measured present state** — `CURRENT_STATE.md` "Health at a glance", a
   7-row markdown table where every row is a claim. Perfect target, worst layout.
2. **Historical narrative** — `TASK_BOARD.md` session log, `PRODUCTION_READINESS_REVIEW.md`
   findings "written as originally diagnosed". These record what *was* true.
   Annotating them would be wrong: they are supposed to be stale.
3. **Prescriptive spec** — `CODEBASE_STANDARDS.md`, `ENGINEERING_SPEC.md`.
   Written as "must", read as "is". Annotating turns an aspiration into a CI failure.
4. **Task bookkeeping** — checkbox lists where the `[x]` *is* the claim.
5. **End-user prose** — `FAMILY-GUIDE.md`. Claims about tap counts and button
   labels; nothing a shell can reach.

**Registers 2 and 3 are 40% of the corpus and must not be annotated.** That is
not a format bug, but the README needs to say it, or the first user will
annotate `PRODUCTION_READINESS_REVIEW.md` and get a permanently red build.

---

## 2. The claims

132 claims, verbatim, with `file:line`. Grouped by kind. The **Class** column is
defined in §3; **State** is from §6 (T = currently true, F = currently false,
? = not verifiable by inspection alone, H = historical, correct in its own tense).

### Kind 1 — Build / lint / typecheck / CI gate (9)

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C01 | `CURRENT_STATE.md:49` | `| Build (\`npm run build\`) | passes — \`tsc -b\` + vite |` | a1 | ? |
| C02 | `CURRENT_STATE.md:50` | `| Lint (\`npm run lint\`) | **0 errors** (was 26) |` | a1 | ? |
| C03 | `CURRENT_STATE.md:56` | `| CI | GitHub Actions on every push and PR |` | a1 | T |
| C04 | `README.md:320` | "GitHub Actions runs lint, typecheck, build and tests on every push and pull request (`.github/workflows/ci.yml`), plus an advisory-only production audit." | a1 | T |
| C05 | `NEXT_SESSION_PLAN.md:387` | "Baseline to hold: **0 lint errors, build passes, 99 tests passing.**" | a2 | F |
| C06 | `NEXT_SESSION_PLAN.md:470` | "- [x] `npm run lint` 0 errors · `npm run build` passes · **111 tests passing**" | a2 | F |
| C07 | `FARMER_MODULE_PLAN.md:674` | "Baseline to hold: **0 lint errors, build passes, 97 existing tests still green.**" | a2 | F |
| C08 | `TASK_BOARD.md:182` | "Lint 0 errors, build passes, 97 tests passing." | a2 | H |
| C09 | `PROJECT_SETUP.md:288` | "[ ] TypeScript compiles: npx tsc --noEmit (zero errors)" | a1 | F |

C09 is false as an *instruction*: `tsconfig.json` is a 6-line project-references
stub, so `tsc --noEmit` checks nothing. The real gate is `tsc -b`.

### Kind 2 — Version and dependency (11)

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C10 | `CURRENT_STATE.md:48` | `| Version | **1.0.0** (was \`0.0.0\`) |` | a2 | **T** |
| C11 | `README.md:18` | "**Status:** version `1.0.0`." | a2 | **T** |
| C12 | `NEXT_SESSION_PLAN.md:486` | "Version `1.0.0` — read from `package.json` at build time, shown in the footer and sidebar." | b | ? |
| C13 | `NEXT_SESSION_PLAN.md:487` | "**Not yet tagged.**" | a1 | ? |
| C14 | `README.md:16` | "**Stack:** React 19 · TypeScript · Vite · Tailwind 4 · Zustand · Supabase (Postgres)" | a2 | **T** |
| C15 | `COMPLETE_CONTEXT.md:42` | `| **Excel Export** | SheetJS (xlsx) | 0.18.x | Client-side Excel generation |` | a2 | **F** |
| C16 | `COMPLETE_CONTEXT.md:47` | `| **Offline (planned)** | idb | 8.0.x | IndexedDB wrapper (dependency installed, not deeply integrated yet) |` | c | **F** |
| C17 | `README.md:325` | "`exceljs` pulls in `uuid@8.3.2`, which carries two moderate advisories with no upstream fix yet." | a2 | ? |
| C18 | `CURRENT_STATE.md:54` | `| Production advisories | 2 moderate (\`uuid\` via \`exceljs\`, no upstream fix) |` | b | ? |
| C19 | `README.md:32` | "Requires Node 20+ and a Supabase project." | c | **F** |
| C20 | `PROJECT_SETUP.md:85` | "npm install xlsx" | a1 | **F** |

C19: nothing in the repo declares a Node floor — there is no `engines` field —
while CI pins `node-version: 22` and the toolchain is TypeScript `~6.0.2` /
Vite `^8`. "Node 20+" is unenforceable and almost certainly wrong.

### Kind 3 — Test and check counts (21)

Four different test counts and three different check counts are asserted across
the corpus. Only two are current.

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C21 | `CURRENT_STATE.md:51` | `| Tests (\`npm run test:run\`) | **128 passing**, 13 files |` | a2 | **T** |
| C22 | `README.md:304` | "111 tests covering the parts where a mistake costs money:" | a2 | **F** |
| C23 | `PRODUCTION_READINESS_REVIEW.md:258` | "> **FIXED.** 111 tests now cover the query layer, backup round-trip, offline queue, entry form and the error reporter" | a2 | **F** |
| C24 | `NEXT_SESSION_PLAN.md:387` | "99 tests passing" | a2 | **F** |
| C25 | `NEXT_SESSION_PLAN.md:471` | "(97 plus 14 covering the error reporter)" | a2 | **F** |
| C26 | `TASK_BOARD.md:182` | "97 tests passing" | a2 | H |
| C27 | `TASK_BOARD.md:255` | "128 Vitest tests" | a2 | **T** |
| C28 | `COMPLETE_CONTEXT.md:54` | `| \`npm run test:run\` | Runs all Vitest unit tests (currently 18 assertions) |` | a2 | **F** |
| C29 | `COMPLETE_CONTEXT.md:735` | "- **Total**: 18 test assertions" | a2 | **F** |
| C30 | `COMPLETE_CONTEXT.md:734` | "- **Test Files**: `currency.test.ts`, `date.test.ts`, `validation.test.ts` + store tests in `src/store/test/`" | a1 | **F** |
| C31 | `PRODUCTION_READINESS_REVIEW.md:225` | "21 tests cover queue ordering, retriable-vs-permanent classification, and the concurrent-drain guard." | a2 | **T** |
| C32 | `CURRENT_STATE.md:52` | `| SQL checks (\`npm run test:sql\`) | **55/55** — the farmer settlement maths |` | b | ? |
| C33 | `CURRENT_STATE.md:381` | "`src/db/migrations/tests/007_farmer_tests.sql` (55 checks, run via `npm run test:sql`)" | b | ? |
| C34 | `README.md:147` | "then runs `src/db/migrations/tests/007_farmer_tests.sql` — 55 checks including a 10,000-case property test on the split." | b | ? |
| C35 | `TASK_BOARD.md:254` | "Verified: 53/53 SQL checks on a local Postgres 16 with a Supabase stub" | b | **F** |
| C36 | `TASK_BOARD.md:281` | "The harness passed 53/53 while production was broken, because the stub had installed pgcrypto into `public`" | c | H |
| C37 | `CURRENT_STATE.md:53` | `| Browser walk-through | **25/25** — \`node scripts/verify-browser.mjs\` |` | b | ? |
| C38 | `CURRENT_STATE.md:138` | "What it currently proves (25/25 as of this writing):" | b | ? |
| C39 | `CURRENT_STATE.md:26` | "built app in Chromium with Supabase stubbed and passes 16/16 checks" | b | **F** |
| C40 | `TASK_BOARD.md:213` | "headless Chromium with Supabase stubbed: **16/16 checks pass**" | b | **F** |
| C41 | `NEXT_SESSION_PLAN.md:34` | "Supabase stubbed and passes 16/16 checks" | b | **F** |

**C39 contradicts C37 inside the same file, 27 lines apart.**

### Kind 4 — Bundle size (7)

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C42 | `CURRENT_STATE.md:55` | `| Initial bundle | **151 kB gzip** across 4 entry chunks (was 267 kB, and 490 kB before that) |` | b | ? |
| C43 | `CURRENT_STATE.md:414` | "**Bundle — halved.** 151 kB gzip initial, down from 267 kB (146 kB before the farmer module added its own screens…)" | b | ? |
| C44 | `NEXT_SESSION_PLAN.md:436` | "the initial bundle is **146 kB gzip**" | b | **F** |
| C45 | `TASK_BOARD.md:112` | "- [x] V1-01 · Route-level code splitting (initial bundle 267 → 146 kB gzip)" | b | **F** |
| C46 | `TASK_BOARD.md:204` | "from 267 kB gzip to **146 kB** — `recharts` (112 kB gzip) now only loads for whoever opens Reports." | b | **F** |
| C47 | `PRODUCTION_READINESS_REVIEW.md:274` | "initial bundle down from 490 kB gzip to 267 kB" | b | H |
| C48 | `CURRENT_STATE.md:415` | "Reports (which owns all of `recharts`, 112 kB gzip)" | b | ? |

### Kind 5 — Live database state (18)

Every one of these needs a query against a hosted Postgres. **None is reachable
by v1.** They are the v2 face of the thesis, and they are 14% of the corpus.

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C49 | `CURRENT_STATE.md:16` | "As of 2026-08-14 the live database holds **10 transactions** across both ledgers, 1 joined household member, 37 categories and 2 backup snapshots, with soft-deleted rows present." | b | ? |
| C50 | `CURRENT_STATE.md:12` | "**Backend status: done.** Migrations `001`–`004` plus `006` are applied." | b | ? |
| C51 | `CURRENT_STATE.md:71` | "`007_farmers_and_settlements.sql` | **Applied 2026-08-14.**" | b | ? |
| C52 | `CURRENT_STATE.md:88` | "`pg_cron` is enabled and **confirmed firing** — `gharkhata-daily-backup` runs at 20:30 UTC / 02:00 IST and a `scheduled` snapshot exists, not just a registered job." | b | ? |
| C53 | `CURRENT_STATE.md:235` | "The live database confirmed it: **0 cheque rows, 0 cheque transactions, ever.**" | b | ? |
| C54 | `CURRENT_STATE.md:98` | "**Enable leaked-password protection** — Authentication → Policies. This is a live security-advisor WARN." | b | ? |
| C55 | `NEXT_SESSION_PLAN.md:44` | `| \`_v1\` functions | 7 |` | b | ? |
| C56 | `NEXT_SESSION_PLAN.md:45` | `| Permissive \`USING (true)\` policies | **0** — the hole is closed |` | b | ? |
| C57 | `NEXT_SESSION_PLAN.md:111` | "**Every table has 0 rows.** `family_members`, `categories`, `transactions`, `cheque_details`, `farming_details` — all empty. **Nothing can be lost.** This is the single most useful fact in this document: migrate freely." | b | **F** |
| C58 | `NEXT_SESSION_PLAN.md:116` | "**1 user already exists in `auth.users`.**" | b | **F** |
| C59 | `NEXT_SESSION_PLAN.md:105` | `| \`002_atomic_writes.sql\` | ❌ **no** | \`0\` functions matching \`%_v1\` |` | b | **F** |
| C60 | `NEXT_SESSION_PLAN.md:93` | `| Postgres | **17.6.1.127** (note: prior local verification used PG16) |` | b | ? |
| C61 | `NEXT_SESSION_PLAN.md:90` | `| Project ref / id | **\`pohjrvyeteavraucyrga\`** |` | b | ? |
| C62 | `NEXT_SESSION_PLAN.md:54` | `| Existing data | 5 transactions intact, 0 orphaned rows |` | b | **F** |
| C63 | `NEXT_SESSION_PLAN.md:62` | "**Invite code for `My Household`: `e1aa921ac1e2`.**" | b | ? |
| C64 | `FARMER_MODULE_PLAN.md:10` | "23 functions present, `anon` can execute none of them, 7 farmer tables with 7 policies and no client table grants, `permissive_true` still 0" | b | ? |
| C65 | `TASK_BOARD.md:271` | "Verified afterwards against the live database: 23 functions, `anon` can execute none, 7 farmer tables with 7 policies and no client grants, `permissive_true` still 0, the 10 real transactions untouched" | b | ? |
| C66 | `NEXT_SESSION_PLAN.md:118` | "**`pgcrypto` IS installed** (v1.3, `extensions` schema)" | b | ? |

**C57 is the claim the whole package exists for.** It is one step from a
destructive migration, and it is now false — the file itself says so three lines
later, in a correction a human had to remember to write.

### Kind 6 — Repo structure and file existence (23)

Every one is `test -f`, `test -d` or `grep -q`. **This is the format's home
ground: 23 claims, 23 exit-code-native commands, and 15 of them are false.**

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C67 | `README.md:56-61` | six-row migration table naming `001`,`002`,`003`,`004`,`006`,`007` under `src/db/migrations/` | a1 | **T** |
| C68 | `README.md:66` | "There is no `005` in the repo." | a1 | **T** |
| C69 | `CURRENT_STATE.md:377` | "`007_farmers_and_settlements.sql` · `src/db/queries/farmerQueries.ts` · `src/store/farmerStore.ts` · `src/features/farmers/` (owner) · `src/features/farmer-app/` (Kannada) · `src/i18n/kn.ts`." | a1 | **T** |
| C70 | `CURRENT_STATE.md:108` | "There is no `vercel.json` in the repo" | a1 | **T** |
| C71 | `CURRENT_STATE.md:160` | "`src/index.css` imports Inter from **Google Fonts** over the network." | a1 | **T** |
| C72 | `CURRENT_STATE.md:219` | "**Tests run pinned to `Asia/Kolkata`** (`vite.config.ts`)." | a1 | **T** |
| C73 | `CODEBASE_STANDARDS.md:120` | "`pages\\` ← one file per screen… `DashboardPage.tsx` … `SettingsPage.tsx`" | a1 | **F** |
| C74 | `CODEBASE_STANDARDS.md:161` | "`router\\` └── `AppRouter.tsx`" | a1 | **F** |
| C75 | `CODEBASE_STANDARDS.md:136` | "`localDB.ts` ← IndexedDB setup and access / `syncWorker.ts` ← sync queue processor" | a1 | **F** |
| C76 | `CODEBASE_STANDARDS.md:152` | "`constants\\` … `categories.ts` … `cropSeasons.ts`" | a1 | **F** |
| C77 | `CODEBASE_STANDARDS.md:56` | "`sync.ts` ← SyncQueueItem, SyncOperation, SyncStatus" | a1 | **F** |
| C78 | `CODEBASE_STANDARDS.md:171` | "`tailwind.config.ts`" | a1 | **F** |
| C79 | `CODEBASE_STANDARDS.md:47` | "`project-state.json`" | a1 | **F** |
| C80 | `CODEBASE_STANDARDS.md:53` | "`cheque.ts` ← ChequeDetails, ChequeStatus" | a1 | **F** |
| C81 | `CODEBASE_STANDARDS.md:157` | "`hooks\\` ← global hooks used across multiple features" | a1 | **F** |
| C82 | `PROJECT_SETUP.md:30` | "`E:\\ghar-khataa-software\\docs\\project-state.json` → current phase and next task" | a1 | **F** |
| C83 | `PROJECT_SETUP.md:24` | "All docs: `E:\\ghar-khataa-software\\docs\\` / All code: `E:\\ghar-khataa-software\\app\\`" | a1 | **F** |
| C84 | `TASK_BOARD.md:2` | "> Location: `E:\\ghar-khataa-software\\docs\\TASK_BOARD.md`" | a1 | **F** |
| C85 | `PROJECT_SETUP.md:311` | "npm run electron" | a1 | **F** |
| C86 | `PRODUCTION_READINESS_REVIEW.md:300` | "No `.env.example`." | a1 | **F** |
| C87 | `PRODUCTION_READINESS_REVIEW.md:295` | "`README.md` is still the unmodified Vite template." | a1 | **F** |
| C88 | `PRODUCTION_READINESS_REVIEW.md:256` | "Two duplicate test setup files (`src/test/setup.ts`, `src/store/test/setup.ts`)." | a1 | **F** |
| C89 | `PRODUCTION_READINESS_REVIEW.md:298` | "`getMonthName` is defined twice (`TransactionList.tsx`, `DashboardSummary.tsx`), plus a third variant in `useReportsData.ts`." | a1 | **T** |

C89 is the interesting one: it is the *only* unfixed item in that document's
slop list, and it is still exactly true — a Stage-4 task nobody closed.

### Kind 7 — Size and line-count claims (16)

`COMPLETE_CONTEXT.md` annotates thirteen files with their length. **Twelve are
wrong.** These are shell-checkable, but only by writing the number into the
command — see §3.

| # | file:line | Verbatim | Claimed | Actual | State |
|---|---|---|---:|---:|---|
| C90 | `PRODUCTION_READINESS_REVIEW.md:4` | "Full read of `src/` (~7,800 LOC)" | 7,800 | 13,381 | **F** |
| C91 | `PRODUCTION_READINESS_REVIEW.md:297` | "`DOCS/APP-CONTEXT/` holds 3,800 lines of generated documents" | 3,800 | 5,605 | **F** |
| C92 | `PRODUCTION_READINESS_REVIEW.md:300` | "14 `any` types." | 14 | 8 | **F** |
| C93 | `COMPLETE_CONTEXT.md:360` | "`transactionStore` (the main store, 225 lines)" | 225 | 242 | **F** |
| C94 | `COMPLETE_CONTEXT.md:385` | "`memberStore` (59 lines)" | 59 | 58 | **F** |
| C95 | `COMPLETE_CONTEXT.md:397` | "`categoryStore` (59 lines)" | 59 | 71 | **F** |
| C96 | `COMPLETE_CONTEXT.md:409` | "`uiStore` (58 lines)" | 58 | 58 | **T** |
| C97 | `COMPLETE_CONTEXT.md:422` | "`syncStore` (24 lines, placeholder)" | 24 | 242 | **F** |
| C98 | `COMPLETE_CONTEXT.md:434` | "`transactionQueries.ts` (461 lines — largest file)" | 461 | 283 | **F** |
| C99 | `COMPLETE_CONTEXT.md:447` | "`memberQueries.ts` (46 lines)" | 46 | 45 | **F** |
| C100 | `COMPLETE_CONTEXT.md:454` | "`categoryQueries.ts` (46 lines)" | 46 | 45 | **F** |
| C101 | `COMPLETE_CONTEXT.md:461` | "`backupQueries.ts` (130 lines)" | 130 | 501 | **F** |
| C102 | `COMPLETE_CONTEXT.md:558` | "`FloatingAddSheet` (mobile bottom sheet, 313 lines)" | 313 | 320 | **F** |
| C103 | `COMPLETE_CONTEXT.md:600` | "`DetailedEntryForm` (403 lines — unified form)" | 403 | 377 | **F** |
| C104 | `COMPLETE_CONTEXT.md:612` | "`TransactionList` (390 lines — largest component)" | 390 | 389 | **F** |
| C105 | `COMPLETE_CONTEXT.md:658` | "`SettingsTab` (419 lines)" | 419 | 1,109 | **F** |

C104 is doubly false: off by one *and* no longer the largest component —
`SettingsTab.tsx` is 1,109 lines. C98 is doubly false the other way: the number
shrank and `backupQueries.ts` (501) is now the largest file in `db/`.

### Kind 8 — Code content and feature-implemented (15)

| # | file:line | Verbatim | Class | State |
|---|---|---|---|---|
| C106 | `COMPLETE_CONTEXT.md:341` | "**RLS Policies**: All tables have Row Level Security enabled with permissive \"allow all for anon\" policies (single-family trust model, no auth)." | a1 | **F** |
| C107 | `COMPLETE_CONTEXT.md:786` | "`CASH`, `UPI`, `CHEQUE`, `BANK_TRANSFER` (Note: `PAYMENT_METHODS` constant array excludes CHEQUE — it's only shown via `PaymentMethodSelector` which includes all 4)" | a1 | **F** |
| C108 | `COMPLETE_CONTEXT.md:775` | "### Categories (27 seeded)" + the 27 names that follow | a2 | **mixed** |
| C109 | `COMPLETE_CONTEXT.md:789` | "### Error Messages (21)" | a2 | **F** (19) |
| C110 | `COMPLETE_CONTEXT.md:746` | "Transaction list with swipe-to-reveal, filters, search, pagination, date grouping" | b | **F** |
| C111 | `COMPLETE_CONTEXT.md:750` | "Cheque lifecycle management (pending → cleared/bounced with validation)" | a1 | **F** |
| C112 | `COMPLETE_CONTEXT.md:768` | "…but **no actual offline queue or sync logic is implemented**. The app requires internet to work." | a1 | **F** |
| C113 | `ENGINEERING_SPEC.md:434` | "always use: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })" | a1 | **F** |
| C114 | `SYSTEM_DESIGN.md:86` | "payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'CHEQUE', 'BANK_TRANSFER'))" | a1 | **F** |
| C115 | `SYSTEM_DESIGN.md:182` | "### 3.7 Table: `sync_queue` — Tracks all offline entries waiting to sync. Lives in local storage (IndexedDB)." | a1 | **F** |
| C116 | `CURRENT_STATE.md:404` | "All 196 `text-textMain` / `text-textMuted` usages were replaced with the hyphenated forms… Verified: zero camelCase occurrences remain." | a1 | **T** |
| C117 | `CURRENT_STATE.md:290` | "one FARMING expense per farmer, at close, keyed `settlement:<period>:<farmer>`" | a1 | **T** |
| C118 | `PHASE7_FEATURES.md:53` | "- Swipe left on a row to reveal Edit and Delete (mobile gesture)" | b | **F** |
| C119 | `TASK_BOARD.md:232` | "Migration `007` adds farmers, crop cycles, per-cycle participation with land and rate, advances, settlement lines, part-payments and an audit table, plus 25 functions." | a2 | **F** (29) |
| C120 | `PHASE7_FEATURES.md:2` | "> Add these tasks to TASK_BOARD.md under NOT STARTED section." | a1 | **F** |

C108 is the most instructive claim in the corpus: **the count is right (27) and
every single name is wrong.** The doc lists "🍚 Groceries & Ration, ⚡ Electricity
Bill, 💧 Water Bill…"; `001_initial.sql:116-142` seeds "🛒 Groceries, 👕 Clothes,
✏️ Stationery…", and `PRODUCT_DOCUMENT.md:14` explicitly excludes electricity as
out of scope. A count check would pass. This is the exact failure mode the
package is supposed to catch, and a naïve numeric check misses it.

### Kind 9 — Not mechanically checkable (12, representative)

| # | file:line | Verbatim |
|---|---|---|
| C121 | `CURRENT_STATE.md:30` | "**What is still unproven:** backup **restore**, the offline queue, and session persistence." |
| C122 | `CURRENT_STATE.md:34` | "**Network caveat for agent sessions.** The container doing this work cannot reach `supabase.co` — the environment's network policy answers 403 to CONNECT." |
| C123 | `ENGINEERING_SPEC.md:591` | "Dashboard load (all data in IndexedDB): Target: < 1.5 seconds from tap to fully rendered" |
| C124 | `CODEBASE_STANDARDS.md:242` | "BANNED directions (causes spaghetti — never do these): components → db (NEVER — components never touch database)" |
| C125 | `CODEBASE_STANDARDS.md:270` | "Describe the component in one sentence without using AND." |
| C126 | `PRODUCT_DOCUMENT.md:31` | "**Quick Daily Entry:** A fast, mobile-friendly interface to log quick Cash/UPI transactions in under 5 seconds." |
| C127 | `FAMILY-GUIDE.md:45` | "That's it, about ten seconds." |
| C128 | `PHASE7_FEATURES.md:34` | "- Why: logging ₹850 groceries should take under 10 seconds" |
| C129 | `CURRENT_STATE.md:296` | "**Do not \"fix\" this by also booking advances as expenses.**" |
| C130 | `TASK_BOARD.md:13` | "- **COMPLETED** — built + tested + verified ✓" |
| C131 | `CODEBASE_STANDARDS.md:3` / `:415` | "This is File 4 of 4 in the GharKhata documentation system." / "*File 5 of 5 — read last, after all other docs*" |
| C132 | `FAMILY-GUIDE.md:151` | "**Your ledger is private to this family.** Nobody outside can see it, even if they have the app." |

C131 is a self-contradiction inside one 416-line file. C132 is *the* security
claim of the product and is untestable by anything short of an adversarial
integration test — which is a fair thing for v1 to decline.

---

## 3. Classification

The task's three buckets, with one split that turned out to matter more than
anything else in this exercise.

- **(a) Checkable by a shell command.** Split in two:
  - **a1 — exit-code native.** The claim is a pass/fail state some command
    already reports: `npm run lint`, `npm run build`, `test -f X`,
    `! grep -rq "pattern" src`. **Nothing from the prose is copied into the
    annotation** beyond what the claim already names.
  - **a2 — exit-code by construction.** Shell-checkable only by restating the
    asserted value inside the command: `test "$(wc -l < f)" -eq 225`,
    `npm run test:run 2>&1 | grep -q "128 passed"`. The number then lives in two
    places, and the annotation can drift from the prose it guards.
- **(b) Checkable in principle, not by a shell command alone.** Needs a database
  query, an HTTP call, a browser, a bundler graph, or an environment the
  repository cannot assume.
- **(c) Not mechanically checkable.** Subjective, aspirational, prescriptive, or
  a statement of ignorance.

| Kind | a1 | a2 | b | c | Total |
|---|---:|---:|---:|---:|---:|
| 1 · Build / lint / CI | 5 | 4 | 0 | 0 | 9 |
| 2 · Version / dependency | 2 | 5 | 2 | 2 | 11 |
| 3 · Test & check counts | 1 | 10 | 9 | 1 | 21 |
| 4 · Bundle size | 0 | 0 | 7 | 0 | 7 |
| 5 · Live database state | 0 | 0 | 18 | 0 | 18 |
| 6 · Structure / existence | 23 | 0 | 0 | 0 | 23 |
| 7 · Size / line counts | 0 | 16 | 0 | 0 | 16 |
| 8 · Code content / feature | 10 | 3 | 2 | 0 | 15 |
| 9 · Prose | 0 | 0 | 0 | 12 | 12 |
| **Total** | **41** | **38** | **38** | **15** | **132** |

**(a) = 79 (60%) · (b) = 38 (29%) · (c) = 15 (11%).**

Within (a), the split is almost exactly even: **41 a1 (31% of all claims) and
38 a2 (29%)**.

### What the shape of that table says

- **Kind 6 is a clean sweep.** File-existence claims are 23/23 shell-native and
  15/23 currently false. If v1 shipped and did *nothing but* `test -f`, it would
  already have found fifteen real errors in this repo.
- **Kind 5 is a clean miss.** 18/18 need a database. That is the v2 plugin, and
  the corpus says it is 14% of the value, not a nice-to-have.
- **Kind 7 is the awkward middle.** Sixteen claims, all mechanically checkable,
  none of them checkable without duplicating the number.

---

## 4. The format against reality

### 4.1 Where it works, unmodified

`CURRENT_STATE.md:50`, the canonical case from `07-decision.md`:

```markdown
<!-- claim: npm run lint -->
| Lint (`npm run lint`) | **0 errors** (was 26) |
```

`README.md:66`, a negative existence claim — reads well, checks cleanly:

```markdown
<!-- claim: test ! -e src/db/migrations/005_*.sql -->
There is no `005` in the repo. It was applied live as a hotfix and then folded
into `004`, so `001 → 004` from this repo produces the same result.
```

`CURRENT_STATE.md:404-408`, the Tailwind fix — a `grep` whose *absence* of a
match is the claim. This one is a genuinely elegant fit:

```markdown
<!-- claim: ! grep -rq "text-textMain\|text-textMuted" src -->
**Tailwind class mismatch — resolved** (`fd48b1f`). All 196 `text-textMain` /
`text-textMuted` usages were replaced with the hyphenated forms that actually
match the tokens in `index.css`. Verified: zero camelCase occurrences remain.
```

`CODEBASE_STANDARDS.md:171` — the format catches a false structural claim with
a five-character command:

```markdown
<!-- claim: test -f tailwind.config.ts -->
    ├── tailwind.config.ts
```

…except that this line is inside a fenced code block. See §4.2.6.

### 4.2 Where it struggles

#### 4.2.1 The table — and it is the single best target in the corpus

`CURRENT_STATE.md:46-57` is a seven-row "Health at a glance" table. Every row is
a claim. Every row wants its own annotation. The obvious attempt:

```markdown
| | |
|---|---|
| Version | **1.0.0** (was `0.0.0`) |
<!-- claim: npm run build -->
| Build (`npm run build`) | passes — `tsc -b` + vite |
<!-- claim: npm run lint -->
| Lint (`npm run lint`) | **0 errors** (was 26) |
```

**A GFM table ends at the first line that is not a table row.** An HTML comment
between rows very likely terminates the table and renders the remaining rows as
literal pipe-text. That would break the "invisible on GitHub" property that is
the format's entire justification — and it would break it in the exact file the
decision document cites as the motivating example.

**Owner: render this on GitHub before committing to the format.** If it breaks,
there are three exits, and none is free:

| Option | Cost |
|---|---|
| Put all annotations above the table | Loses the binding between a claim and its row; the report can only say "something in this table is false" |
| Put the annotation *inside* a cell | Visible in some renderers; ugly; and the pipe character constrains the command |
| Say "tables are not supported; hoist claims into prose" | Asks the user to rewrite the doc to suit the tool — the adoption-friction risk named in `04-extracted-problems.md` |

This is worth resolving before Phase 2 is written, not after.

#### 4.2.2 The claim is a number, and exit code is a boolean

This is the deepest problem and it hits **38 of 132 claims (29%)**.

`CURRENT_STATE.md:51` says **128 passing**. `README.md:304` says **111**. Both
are backed by the same command:

```markdown
<!-- claim: npm run test:run -->
| Tests (`npm run test:run`) | **128 passing**, 13 files |
```
```markdown
<!-- claim: npm run test:run -->
111 tests covering the parts where a mistake costs money:
```

`npm run test:run` exits 0 for both. **v1 reports both as true. One of them is
false.** Worse, the *false* one is in the README — the file a stranger reads.

The same shape recurs at every line count (C93–C105), every check count
(C32–C41), and every bundle figure (C42–C48). The workaround is to push the
number into the command:

```markdown
<!-- claim: test "$(wc -l < src/store/transactionStore.ts)" -eq 225 -->
### 6.1 `transactionStore` (the main store, 225 lines)
```

That works, and it correctly fails. But the number `225` now exists twice, and
nothing keeps them in step — a claim-checker that can itself drift is a poor
advertisement. **This is the argument for output matching, and it is made
entirely out of the owner's own documents.**

#### 4.2.3 One command backs several claims

`npm run build` is the evidence for at least four separate assertions:

```markdown
<!-- claim: npm run build -->
| Build (`npm run build`) | passes — `tsc -b` + vite |
...
<!-- claim: npm run build -->
| Initial bundle | **151 kB gzip** across 4 entry chunks (was 267 kB, …) |
```

v1 will run the build twice. For this repo that is `tsc -b` plus a full Vite
build, twice, on every CI run. Across the seven rows of the health table and the
`README.md` commands section, the same handful of scripts are re-run many times
over. **The corpus says command de-duplication is not a v2 optimisation; it is
the difference between a check that runs in CI and one that doesn't.**

And the second annotation is a lie anyway: `npm run build` exiting 0 says nothing
about 151 kB or four chunks.

#### 4.2.4 One claim needs several commands

`NEXT_SESSION_PLAN.md:470`:

> `- [x] `npm run lint` 0 errors · `npm run build` passes · **111 tests passing**`

Three commands, one line, and a checkbox that is itself the assertion. The
format has one `command:` slot. The options are to chain with `&&` — which makes
the failure report useless, since a red result cannot say *which* of the three
broke — or to forbid compound claims. Real documents are full of compound claims;
this corpus has four in Kind 1 alone (C05–C08).

#### 4.2.5 The claim is true only in a specific environment

`CURRENT_STATE.md:52` — `npm run test:sql` — needs a **local Postgres 16 binary
at `/usr/lib/postgresql/16/bin`**. `CURRENT_STATE.md:53` — `verify-browser.mjs`
— needs Playwright, which `README.md:160` says is *deliberately not a
dependency*: "a browser download on every `npm install` is a poor trade for a
check that runs by hand."

Annotate those and CI goes red for "missing Postgres", reported identically to
"the claim is false". The report must distinguish `failed` from `errored` —
`08-build-plan.md` Phase 3 already has three states in the return type, so the
shape is right, but the corpus proves the third state is load-bearing, not
theoretical.

#### 4.2.6 There is a trap inside `npm run test:sql` that defeats the exit-code rule outright

`package.json:14`:

```
"test:sql": "scripts/local-db.sh && psql -h /tmp -p 5433 -U postgres -d gk -f src/db/migrations/tests/007_farmer_tests.sql"
```

The harness ends (`007_farmer_tests.sql:844-846`) with
`RAISE EXCEPTION '% farmer check(s) failed'`. But **that `psql` invocation does
not pass `-v ON_ERROR_STOP=1`** — unlike `local-db.sh:41`, which does. Without
it, `psql -f` exits **0** after printing the error.

So `npm run test:sql` exits 0 whether the farmer checks pass or fail. **v1's rule
would certify "55/55" as true on a run where every check failed.** That is the
same class of bug as "the harness passed 53/53 while production was broken"
(`TASK_BOARD.md:281`) — the failure this whole package was conceived to prevent,
reproduced by the package's own v1 rule.

Nothing in v1 can detect this. It is worth a paragraph in the README: *the tool
is exactly as trustworthy as the exit codes of the commands you point it at.*

#### 4.2.7 Fenced code blocks, and where the claim lives

The most productive single source of false claims in the corpus is
`CODEBASE_STANDARDS.md:39-174` — a 135-line ASCII directory tree inside a fenced
code block, containing **at least 12 paths that do not exist**. Same for
`PROJECT_SETUP.md`, where the stale `npm install xlsx`, the phantom
`tailwind.config.ts` and an entirely obsolete `tsconfig.json` all live inside
```` ``` ```` fences.

The parser must decide: does it look inside fenced blocks? Both answers cost
something.

- **Skip fences** (the safe default): the parser cannot reach the richest vein
  of false claims in the corpus.
- **Enter fences**: `<!-- claim: ... -->` renders *visibly* inside a code block,
  breaking the invisibility property.

The honest v1 answer is to skip fences and annotate the paragraph above the
block — but then the annotation covers a 135-line tree and the report cannot say
which line is wrong. **State the rule explicitly in the parser docs either way;
silence here becomes a bug report.**

#### 4.2.8 Superseded claims sitting beside their replacements

`NEXT_SESSION_PLAN.md:435`:

```markdown
- [x] ~~**Bundle:** 267 kB gzip initial~~ — done. Reports and Settings are now
      `React.lazy` routes; the initial bundle is **146 kB gzip**
```

One line, two claims, one struck through. Which does the annotation bind to? The
same pattern appears at `:404`, `:439`, `:481` and throughout `TASK_BOARD.md`.
And `NEXT_SESSION_PLAN.md:111-115` does it in prose:

```markdown
- **Every table has 0 rows.** … **migrate freely.**
  **⚠️ No longer true.** The app has been in real use since; see the note at the
  top of §0. Re-check row counts before any destructive migration.
```

**This is the package's thesis written by hand.** A human noticed, remembered,
and typed a correction under a claim that could have caused data loss. Every one
of those hand-written "no longer true" banners — there are four in this corpus,
plus the whole opening of `cheque-feature-backup.md` — is a place the tool would
have spoken first. It is also a warning: annotate the struck-through half and
v1 reports a false failure forever.

#### 4.2.9 Claims that must *not* be annotated

40% of the corpus is historical or prescriptive.
`PRODUCTION_READINESS_REVIEW.md:19` says it plainly: "Findings below are written
as originally diagnosed." C87 ("`README.md` is still the unmodified Vite
template") is *false today and correct as history*. Annotating it produces a
permanent red build for a document that is behaving correctly.

The format has no way to express "this was true on 2026-08-13". v1 does not need
one — but the README must tell people not to annotate changelogs, session logs
and specs, or the first real user will do exactly that.

#### 4.2.10 `claimText` is captured and never used

`08-build-plan.md:84` has the parser return `{ command, claimText, line }`, and
Phase 3's `verify` returns `{ status, expected, actual }`. With no output
matching, **`claimText` is never compared to anything and `expected` has nothing
to hold.** They are decoration in v1.

That is defensible — the report prints `claimText` so a human can read what
failed — but the API should say so, or the field reads as a promise the tool
does not keep. `expected`/`actual` in particular imply a comparison v1 does not
perform.

---

## 5. The v1 gap, quantified

**v1's rule: run the command; non-zero exit = claim is false. Explicitly no
output matching.**

| Bucket | Claims | % | Does v1 cover it? |
|---|---:|---:|---|
| a1 — exit-code native | 41 | 31% | **Yes, cleanly.** The command already answers the question. |
| a2 — exit-code by construction | 38 | 29% | **Mechanically yes, honestly no.** Requires copying the asserted value into the annotation. |
| b — needs DB / HTTP / browser / bundler | 38 | 29% | **No.** |
| c — not mechanically checkable | 15 | 11% | **No, and correctly so.** |

**v1 covers 79 of 132 claims (60%) at the outside, and 41 (31%) without asking
the writer to duplicate a number.**

### Where output matching would specifically be needed

Twelve concrete cases, all from the corpus, all currently uncoverable by a bare
project command:

| Claim | Command that exists | Why the exit code is not enough |
|---|---|---|
| C21 "**128 passing**, 13 files" | `npm run test:run` | Exits 0 at 111, 128 or 5 tests |
| C22 "111 tests" (README) | `npm run test:run` | Same command, contradictory number, both "pass" |
| C28 "18 assertions" | `npm run test:run` | Same again — three docs, three numbers, one green command |
| C32 "**55/55**" | `npm run test:sql` | Exits 0 even on failure (§4.2.6) |
| C35 "53/53" | `npm run test:sql` | Contradicts C32; exit code cannot arbitrate |
| C37/C39 "25/25" vs "16/16" | `node scripts/verify-browser.mjs` | Script *does* set `exitCode = 1` on failure, so pass/fail works — but the count does not |
| C42 "151 kB gzip across 4 entry chunks" | `npm run build` | Build success says nothing about size |
| C44 "146 kB gzip" | `npm run build` | Contradicts C42 by 5 kB; both "pass" |
| C92 "14 `any` types" | `grep -c ": any" src` | `grep -c` exits 0 whenever ≥1 match — asserting *fourteen* needs the count |
| C93–C105 line counts (13 claims) | `wc -l` | `wc` always exits 0 |
| C108 "Categories (27 seeded)" | `grep -c` on the seed INSERT | Count is right, names are wrong — a count check passes on a false claim |
| C119 "plus 25 functions" | `grep -c "CREATE.*FUNCTION"` | Same: needs the number, and the number is 29 |

### The honest reading

**The v1 cut is right, and it is narrower than the decision document implies.**

`07-decision.md:69-71` cites four motivating claims: *"lint: 0 errors"*, *"build
passes"*, *"version 1.0.0"*, *"the live database holds 10 transactions"*.

Measured against the corpus:

- *"lint: 0 errors"* — a1. **v1 covers it.**
- *"build passes"* — a1. **v1 covers it.**
- *"version 1.0.0"* — a2. Needs `1.0.0` written into the annotation.
- *"the live database holds 10 transactions"* — b. **v1 does not cover it, and
  says so** (`07-decision.md:83`, database checks are v2).

So of the four flagship examples, v1 fully covers two. That is not a
contradiction of the plan — it matches `07-decision.md` exactly — but the
decision document reads as though it covers more than it does, and the corpus is
the place to correct that expectation.

**Two things the numbers argue for, both cheap:**

1. **Ship v1 as specified.** 41 exit-code-native claims across a single real
   repo, 15 of them currently false, is a package that earns its install on day
   one. Do not widen the rule before shipping — `08-build-plan.md:112` is right.
2. **Treat output matching as the first post-v1 question, not a "maybe".** The
   evidence is 38 claims — 29% of the corpus, and the entire "a number that must
   match" family, which is where the *most embarrassing* drift lives (a README
   telling the world about 111 tests that are actually 128). `07-decision.md`
   lists output matching under "What v1 deliberately excludes"; the corpus says
   it belongs at the top of `IDEAS.md`, ahead of database checks, because it is
   the same engine plus a regex.

---

## 6. Staleness check — is any of this actually false right now?

Yes. Overwhelmingly. **54 of the 132 claims are currently false**, verified by
reading the repository only. No build, test or lint was run in
`/workspace/ghar-khata-software`.

### 6.1 The headline finding: four test counts, one truth

| Claim | file:line | Actual |
|---|---|---|
| "18 assertions" | `COMPLETE_CONTEXT.md:54`, `:735` | |
| "97 tests passing" | `TASK_BOARD.md:182`, `FARMER_MODULE_PLAN.md:674` | |
| "99 tests passing" | `NEXT_SESSION_PLAN.md:387` | |
| "111 tests" | `README.md:304`, `PRODUCTION_READINESS_REVIEW.md:258`, `NEXT_SESSION_PLAN.md:470` | |
| "128 passing, 13 files" | `CURRENT_STATE.md:51`, `TASK_BOARD.md:255` | **✅ correct** |

Counted directly: **13 test files, 128 top-level `it(`/`test(` blocks**, matching
`CURRENT_STATE.md` exactly. The user-facing `README.md` is the one that is wrong.

### 6.2 Self-contradictions inside a single file

| File | Contradiction |
|---|---|
| `CURRENT_STATE.md` | `:26` "passes **16/16** checks" vs `:53` "Browser walk-through **25/25**" — 27 lines apart |
| `CURRENT_STATE.md` | `:55` "**151 kB gzip**" vs `:414` "151 kB … (146 kB before the farmer module)" vs `NEXT_SESSION_PLAN.md:436` "**146 kB gzip**" |
| `CODEBASE_STANDARDS.md` | `:3` "This is File 4 of 4" vs `:415` "*File 5 of 5*" |
| `TASK_BOARD.md` | `:15` "Never duplicate. Never leave a task in two places." vs `:24-28` P10-A…P10-E under **NOT STARTED** while `:116-120` F-A…F-E — *the same farmer module* — sit under **COMPLETED** |
| `TASK_BOARD.md` | `:2` "Location: `E:\ghar-khataa-software\docs\TASK_BOARD.md`" vs `:312` "*File location: `DOCS/APP-CONTEXT/TASK_BOARD.md`*" |
| `TASK_BOARD.md` | `:254` "53/53 SQL checks" vs `CURRENT_STATE.md:52` "**55/55**" |

### 6.3 `COMPLETE_CONTEXT.md` — 12 of 13 file sizes wrong

Full table at C93–C105. Worst offenders:

| Claimed | Actual | Delta |
|---|---:|---:|
| `syncStore` "24 lines, placeholder" | 242 | **10×**, and it is now the real sync engine |
| `SettingsTab` 419 lines | 1,109 | **2.6×** |
| `backupQueries.ts` 130 lines | 501 | **3.9×** |
| `transactionQueries.ts` 461, "largest file" | 283 | shrank 39%; no longer largest |
| `TransactionList` 390, "largest component" | 389 | off by one *and* not the largest (`SettingsTab`, 1,109) |

Only `uiStore` (58 lines) is still correct — a 1-in-13 survival rate.

### 6.4 `COMPLETE_CONTEXT.md` describes an application that no longer exists

| Claim | Reality |
|---|---|
| `:341` "permissive \"allow all for anon\" policies (single-family trust model, no auth)" | `001_initial.sql` has 5 such policies; `003_auth_and_households.sql` replaced them. Full auth + per-household RLS since. |
| `:42` "SheetJS (xlsx) 0.18.x" | `xlsx` is not in `package.json`; replaced by `exceljs@^4.4.0` |
| `:768` "no actual offline queue or sync logic is implemented. The app requires internet to work." | `src/db/outbox.ts` exists; `syncStore.ts` is 242 lines of live engine; 21 tests cover it |
| `:750` "Cheque lifecycle management (pending → cleared/bounced with validation)" — listed under **✅ Fully Working** | Removed entirely in `006_remove_cheques`; table dropped, function dropped, CHECK narrowed |
| `:786` "`CASH`, `UPI`, `CHEQUE`, `BANK_TRANSFER` … `PaymentMethodSelector` which includes all 4" | `src/constants/paymentMethods.ts` has exactly three; `006_remove_cheques.sql:345` narrows the CHECK to three |
| `:789` "Error Messages (21)" | 19 keys in `src/constants/errorMessages.ts` |
| `:746` "swipe-to-reveal" | `TASK_BOARD.md:210` records this as one of three claims found wrong when the family guide was checked against the running app |
| `:775` "Categories (27 seeded)" | **Count correct (13+10+4=27). All 27 names wrong** — see C108 |

### 6.5 `CODEBASE_STANDARDS.md` and `PROJECT_SETUP.md` — the "read this first" files

These two are what a new session or agent is instructed to read before touching
anything (`PROJECT_SETUP.md:3`: "This is the FIRST file to read before doing
anything in a fresh session").

**Twelve declared paths do not exist:** `src/pages/` (and its five `*Page.tsx`),
`src/router/AppRouter.tsx`, `src/hooks/`, `src/db/localDB.ts`,
`src/db/syncWorker.ts`, `src/constants/categories.ts`,
`src/constants/cropSeasons.ts`, `src/types/sync.ts`, `src/types/cheque.ts`,
`src/features/cheques/`, `tailwind.config.ts`, `project-state.json`.

**And every setup instruction that can be checked is wrong:**

| `PROJECT_SETUP.md` | Says | Repo |
|---|---|---|
| `:24-25` | `E:\ghar-khataa-software\docs\` / `…\app\` | `DOCS/APP-CONTEXT/` and repo root |
| `:30` | read `project-state.json` every session | deleted (`PRODUCTION_READINESS_REVIEW.md:394`, Stage 4) |
| `:85` | `npm install xlsx` | `exceljs` |
| `:137-161` | replace `tailwind.config.ts` with a JS config | Tailwind 4 via `@tailwindcss/vite`; no config file; tokens live in `src/index.css` |
| `:168-194` | a 25-line `tsconfig.json` with `paths`, `strict`, `include: ["src"]` | actual `tsconfig.json` is 6 lines of project references |
| `:240-247` | `.gitignore` containing `.env.local` | actual uses `*.local` |
| `:288` | `npx tsc --noEmit` | checks nothing under project references; real gate is `tsc -b` |
| `:311` | `npm run electron` | script is `electron:start` |

**An agent following `PROJECT_SETUP.md` today would install a vulnerable
dependency the team deliberately removed, create a Tailwind config file the
build ignores, and overwrite a working `tsconfig.json`.** This is
`04-extracted-problems.md`'s "hours of debugging the wrong thing", sitting in the
file the doc set nominates as the entry point.

### 6.6 Specs that no longer describe the code

| Claim | Reality |
|---|---|
| `ENGINEERING_SPEC.md:434` "always use: `new Intl.NumberFormat('en-IN', { … maximumFractionDigits: 0 })`" | `src/utils/currency.ts:24-30` computes `hasPaise` and uses `2` when paise exist — the spec now mandates the exact bug `PRODUCTION_READINESS_REVIEW.md` B11 fixed |
| `SYSTEM_DESIGN.md:86` `CHECK (payment_method IN ('CASH','UPI','CHEQUE','BANK_TRANSFER'))` | `006_remove_cheques.sql:345-346` narrows it to three |
| `SYSTEM_DESIGN.md:182-196` "§3.7 Table: `sync_queue`" | Never built under that name; the real thing is `src/db/outbox.ts` |
| `PHASE7_FEATURES.md:53` "Swipe left on a row to reveal Edit and Delete" | No swipe; two buttons (`FAMILY-GUIDE.md:102-104`) |
| `PHASE7_FEATURES.md:2` "Add these tasks to TASK_BOARD.md under NOT STARTED section." | All eight are under COMPLETED |

### 6.7 `PRODUCTION_READINESS_REVIEW.md` slop list — four of five items silently fixed

Written 2026-08-13, never re-annotated, so the reader cannot tell which still stand:

| `:295-300` | Now |
|---|---|
| "`README.md` is still the unmodified Vite template" | 328-line real README |
| "`project-state.json` is AI session bookkeeping … committed to the repo" | deleted |
| "`DOCS/APP-CONTEXT/` holds 3,800 lines" | **5,605** — grew 47% |
| "14 `any` types" | **8** |
| "No `.env.example`" | exists |
| "Two duplicate test setup files" (`:256`) | one |
| "`getMonthName` is defined twice … plus a third variant" (`:298`) | **still exactly true** |
| "Full read of `src/` (~7,800 LOC)" (`:4`) | **13,381** |

The one item still true is the only one not marked FIXED — accidentally correct,
by omission rather than by maintenance.

### 6.8 Claims verified currently TRUE (worth reporting)

Not everything has rotted. These 14 hold up:

`package.json:4` version `1.0.0` (C10, C11) · 13 test files / 128 tests (C21,
C27) · six migration files present, no `005` (C67, C68) · all six farmer-module
paths exist (C69) · no `vercel.json` (C70) · `src/index.css:1` does import Inter
from Google Fonts (C71) · `vite.config.ts:62` `TZ: 'Asia/Kolkata'` (C72) · zero
camelCase Tailwind occurrences remain (C116) · settlement key format
(`007…sql:1204`) (C117) · 21 outbox+sync tests (C31) · 7 farmer tables in `007`
(C64, in part) · `.github/workflows/ci.yml` runs lint → build → test (C03, C04)
· `PAYMENT_METHODS` excludes `'CHEQUE'` (contra C107) · `tools/probe.py` and
`tools/staleness.py` exist (C88).

**The pattern is unmistakable.** Every true claim is in a file the owner
maintained deliberately — `CURRENT_STATE.md`, `README.md`'s runbook sections,
`TASK_BOARD.md`'s newest entries. Every false one is in a file nobody has opened
since it was generated. **The package's real value is not on the maintained
files; it is on the ones nobody remembers to open** — and those are precisely
the ones agents are instructed to read first.

---

## 7. Recommended fixture set for Phase 2

Ten fixtures. Each is a real excerpt with a stated file:line provenance, and each
exercises one thing the parser must get right. Copy the excerpts into
`test/fixtures/` in the `verify-claims` repo — **do not** read from
`/workspace/ghar-khata-software` at test time; the fixtures must be frozen or the
tests inherit the drift they exist to catch.

| # | Fixture | Source | Exercises |
|---|---|---|---|
| F1 | `health-table.md` | `CURRENT_STATE.md:44-57` (verbatim, 7 rows) | **The hard case.** Multiple claims in a GFM table; decides the binding rule and whether comments break table rendering. Build this one first — if the format fails here it fails on the motivating example. |
| F2 | `simple-prose.md` | `CURRENT_STATE.md:404-408` + `README.md:66` | The happy path: one claim, one paragraph, exit-code-native command. Includes a **negative** claim (`test ! -e`) and a `grep`-absence claim. |
| F3 | `number-claims.md` | `COMPLETE_CONTEXT.md:360,385,397,409,422,434,447,454,461` | Nine numeric assertions with one command shape (`wc -l`). Locks in behaviour for the a2 family and documents, in a test, that v1 cannot check the number without it being restated. Eight of the nine are false — good asserts. |
| F4 | `contradictory-counts.md` | `CURRENT_STATE.md:51` + `README.md:304` + `COMPLETE_CONTEXT.md:735` | Three different numbers, one command (`npm run test:run`), all exit 0. **The regression test for the v1 gap.** When output matching lands, this fixture flips from "all pass" to "two fail" and proves the feature. |
| F5 | `compound-claim.md` | `NEXT_SESSION_PLAN.md:470` + `FARMER_MODULE_PLAN.md:674` | One claim, three commands, inside a `- [x]` checkbox. Forces a decision: chain, reject, or support multiple `claim:` comments per line. |
| F6 | `fenced-tree.md` | `CODEBASE_STANDARDS.md:39-174` (trimmed to ~40 lines) | Claims inside a fenced code block, 12 of them false. Pins down whether the parser enters fences. Whatever it does, this fixture makes it explicit. |
| F7 | `superseded.md` | `NEXT_SESSION_PLAN.md:111-115` + `:435-438` | Struck-through and self-corrected claims sitting next to their replacements — including the "tables are empty, migrate freely" line from `04-extracted-problems.md`. Ensures the parser binds to the live half. **Ship the flagship claim as a fixture.** |
| F8 | `no-claims.md` | `FAMILY-GUIDE.md` (whole file, 156 lines) | Real markdown with **zero** annotations, emoji, Kannada text (`ರೈತರ ಲಾಗಿನ್` from `README.md:198`), `→` arrows and `₹`. Parser must return `[]` and must not choke on non-ASCII. |
| F9 | `edge-comments.md` | hand-built from real shapes | HTML comments that are **not** claims (`<!-- prettier-ignore -->`), a claim comment with no following content (end of file), two claim comments in a row, a command containing `-->`, a command containing a pipe, `<!--claim:x-->` with no spaces, and `<!-- Claim: X -->` capitalised. Nothing else defines the grammar. |
| F10 | `environment-dependent.md` | `CURRENT_STATE.md:52-53` + `README.md:138-167` | `npm run test:sql` (needs local Postgres 16) and `verify-browser.mjs` (needs Playwright, deliberately not a dependency). Proves `errored` is distinct from `failed` — and documents the `ON_ERROR_STOP` trap from §4.2.6 as a known limitation, in a test, where it cannot be forgotten. |

### Two fixtures to add at Phase 4, not Phase 2

- **`glob-corpus/`** — the whole `DOCS/APP-CONTEXT/` tree (12 files, 5,605
  lines) with ~20 annotations sprinkled through it, for CLI-level tests of
  `verify-claims "DOCS/**/*.md"`: glob expansion, per-file reporting, and the
  exit-1-if-any-failed contract.
- **`command-dedup.md`** — the four `README.md:126-135` commands annotated across
  a dozen claims, to measure how many times a naïve implementation re-runs
  `npm run build`.

### What the fixture set deliberately omits

No fixture for **Kind 5** (live database, 18 claims). Those need a query engine;
they are v2. But the corpus makes the case that v2 is not optional — 14% of the
real claims in the owner's own docs, including the one that nearly caused data
loss, are on the other side of that line.

---

## 8. Recommendations, in priority order

1. **Resolve the table question before writing the parser** (§4.2.1). It is the
   motivating example from `07-decision.md` and it may not render. Ten minutes on
   GitHub settles it.
2. **Ship v1 with the exit-code rule unchanged.** 41 exit-code-native claims and
   15 real errors in one repo justify the package. `08-build-plan.md:112` is right.
3. **Promote output matching from "excluded" to the head of `IDEAS.md`**, with
   this document as the evidence: 38 claims, 29% of the corpus, and the only way
   to catch a README that advertises 111 tests when there are 128.
4. **State the fence rule and the "do not annotate history" rule in the README.**
   Both are silent-failure sources for the first real user.
5. **Document the exit-code trust boundary**, using `npm run test:sql` as the
   worked example (§4.2.6). The tool is exactly as trustworthy as the commands
   pointed at it, and this corpus contains a command that lies.
6. **Do not resolve `claimText`/`expected`/`actual` by deleting them** — resolve
   it by documenting that v1 does not populate `expected`. The fields are the
   seam output matching will grow into.
7. **For Phase 9 dogfooding, annotate in this order:**
   `CURRENT_STATE.md` (maintained, high-value, hardest layout) →
   `README.md` (public-facing, already wrong at `:304` and `:32`) →
   `CODEBASE_STANDARDS.md` (12 false paths, trivial commands, biggest ratio of
   errors-found to effort). Leave `PRODUCTION_READINESS_REVIEW.md` and the
   `TASK_BOARD.md` session log alone — they are history and are allowed to be stale.
