# Step 2D — Patterns across the owner's whole GitHub

Date: 2026-08-15. Added after the owner said not to restrict the search to one
repo: *"there are a lot of problems and patterns you can identify from my GitHub
and my application."* They were right — one repo was too small a sample.

Scope: 37 repositories under `shrinivas-sn`. Two were cloned and read in full
(`dev-recipes`, `budget-buddy`); the rest were analysed by name, recency and
visibility.

---

## Pattern 1 — The same application, rebuilt repeatedly

| Category | Repos |
|---|---|
| Personal finance | `expense-tracker-app`, `budget-buddy`, `ghar-khata-software` |
| Wellness / habits | `wellness-tracker-app`, `wellness-companion-app`, `daily-habits-tracker-app` |
| Student portal | `Student-portal-web-app`, `rural-student-portal` |
| Price list | `price-list-webapp`, `price-list-webapplication` |
| Portfolio | `portfolio-website`, `freelance-portfolio-website` |
| Chest X-ray | `chest-xray-images-analyzer`, `chest-xray-analyzer-final` |
| Agriculture | `krishi-sahayak`, `mandi-api`, plus the farmer module in `ghar-khata` |
| Learning repos | `js-`, `react-js-`, `react-native-`, `tailwind-css-`, `git-github-gitflow-`, `gitflow-learning-repo` |

`budget-buddy`'s internal `package.json` name is literally `my-expense-tracker` —
it is the second attempt at `expense-tracker-app`, and `ghar-khata-software` is
the third at the same domain.

**Reading:** every rebuild re-solves problems the previous build already solved.
That is the shape of the owner's real cost, and it is invisible inside any single
repository — which is why the first pass missed it.

---

## Pattern 2 — The owner already built the mitigation, by hand

`dev-recipes` is a public repo whose README states the problem in the owner's own
words:

> "Reusable, battle-tested feature patterns — **extracted from real projects after
> actually debugging them once, so the next project doesn't repeat the same
> mistakes**."
>
> "Each folder is self-contained: a `README.md` (architecture + setup checklist +
> gotchas) and a `templates/` directory with **copy-in-ready files**."

Current recipes: PWA push notifications on a free stack, production SEO for React
SPAs, headless screenshot fallback, production-grade bug review, Shopify
buildout, website animation patterns, and two "no AI slop" workflows.

This is a serious, sustained piece of work. It is also **distribution by
copy-paste**, which has a known failure mode — see Pattern 3.

*(Aside, for the record: the original brief in this project — an AI-slop detector
— came from `no-ai-slop-scratch-build` / `no-ai-slop-existing-app` here. It was
not a random idea. The owner still directed it be dropped, and it stays dropped;
noted only so the audit trail explains where it came from.)*

---

## Pattern 3 — A lesson learned in one project does not reach the next

This is the finding with the hardest evidence.

In `ghar-khata-software`, `src/utils/currency.ts` is one centralised formatter
carrying a documented, hard-won decision:

> "The previous version forced `maximumFractionDigits: 0` against a
> `NUMERIC(12,2)` column, so a row of ₹1,200.60 displayed as '₹1,201' while the
> totals summed the real values — **a column of amounts did not add up to the
> total printed underneath it.** In a ledger that reads as a bug even when the
> arithmetic is right."

In `budget-buddy` — the *same domain*, money — that lesson is absent. `en-IN`
formatting is written inline in **at least 12 separate places**, with
inconsistent options each time:

```
src/pages/tools/CashRunwayPage.tsx:36      n.toLocaleString("en-IN", …)
src/pages/tools/PercentageCalcPage.tsx:28  n.toLocaleString("en-IN", …)
src/pages/tools/XirrCalcPage.tsx:305       …{ minimumFractionDigits: 2, … }
src/lib/wallet-analytics.ts:358            `₹${largest.amount.toLocaleString("en-IN")}`
src/components/ui/DatePicker.tsx:33        d.toLocaleDateString("en-IN", { day: "2-digit", … })
src/hooks/use-mf-nav-sync.ts:32            d.toLocaleDateString("en-IN", { day: "numeric", … })
```

Note `day: "2-digit"` in one file and `day: "numeric"` in another — the same app
formats the same kind of value two different ways. And `wallet-analytics.ts`
prints a rupee figure with no fraction control at all, which is precisely the bug
class `currency.ts` was written to prevent.

**The knowledge existed. It did not travel.** `dev-recipes` is the manual attempt
to make it travel, and copy-paste is why it only partly works: a copied template
is a fork, and forks drift silently from the original the moment either side
changes.

---

## The unifying thesis

Every confirmed pain across this whole GitHub is one failure mode:

> **Something asserts a fact about a system. Nothing checks it. It goes silently
> false. Someone then acts on it and loses hours.**

Three faces of the same thing, all evidenced:

| Face | Evidence |
|---|---|
| **Docs drift from reality** | "the tables are empty, migrate freely" — obsolete, nearly authorised a destructive migration |
| **Fixtures drift from production** | "the harness passed 53/53 while production was broken" |
| **Copied templates drift from their source** | `dev-recipes` templates; the `currency.ts` lesson never reaching `budget-buddy` |

The owner's own summary of the cost, given when shown the first two faces:
**"hours of debugging the wrong thing."**

This is a genuinely bigger and better-supported thesis than what a single-repo
analysis produced. The owner's push to widen the search was correct and changed
the conclusion.

---

## Honest counterweight: "think big" has a failure mode too

The thesis is big. A **package** still has to be small, or it never ships — and
an unshipped package teaches nothing about publishing, which is the stated goal.

The resolution is not to shrink the ambition. It is to pick the **smallest real
slice of the big idea** as v1, instead of an unrelated toy:

- Same domain, so learning compounds instead of being thrown away.
- Small enough to publish in days, so the packaging pipeline is actually
  exercised end to end.
- Useful on its own, so publishing it is not a lie.
- Extensible toward the full thesis, so v1 is a foundation and not a detour.

This supersedes the Step 3 recommendation of an unrelated money-splitting
utility. That candidate was correctly sized but wrongly aimed: it taught
packaging while teaching nothing about the owner's actual problem. It stays on
record in `05-synthesis.md` as a rejected option, with the reason.

**Not choosing the slice here.** That is the owner's call, and it is the question
put to them next.
