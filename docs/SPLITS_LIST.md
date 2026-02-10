# Splits that will help the code

Smaller files are faster to open, read, and edit. Do **one split at a time**, run the app and your checklist, then commit.

---

## Already done

- **Scoring** → `app/lib/resultsScoring.ts`. Results and sandbox-results both use it.

---

## High impact (results / sandbox-results: ~1,270 and ~1,350 lines)

| # | Split | New file(s) | What moves | Benefit |
|---|--------|-------------|------------|--------|
| 1 | **Refinement questions config** | `app/lib/refinementQuestions.ts` | The `refinementQuestions` array (and optionally `initialQuestions` if shared with wizard). | One place to add/change refinement questions; results + sandbox pages lose ~150 lines each. |
| 2 | **Results left panel** | `app/components/ResultsLeftPanel.tsx` | Back link, Personal/Business toggle, “Your answers” box, refinement show/hide, refinement form (questions + Apply), “Show 3 more / fewer”, business/personal card type toggle. Props: `answers`, `setAnswers`, `theme`, `refinementVisible`, `setRefinementVisible`, `initialQuestions`, `refinementQuestions`, etc. | Results page becomes layout + right side only; left panel is one file to edit for all refinement UI. |
| 3 | **useResultsRanking hook** | `app/hooks/useResultsRanking.ts` (or `app/lib/useResultsRanking.ts`) | Logic that uses `getGoalRanks`, filters (brand/bank, issuer excluded), `scoreCard`, dedupe, top N, “other type” top 3. Input: `answers`, `cards`. Output: primary list, other-type list, leaving cards (or whatever the page needs). | Page is mostly UI; ranking is testable and reusable (sandbox can use same hook). |
| 4 | **Results right panel** | `app/components/ResultsRightPanel.tsx` | Main card list (with first-card modal/expand), “Other card type” section, “Cards you’re leaving” section. Props: ranked lists, handlers (compare, owned, show more/fewer), theme, card mode. | Clean separation: left = refinement, right = cards. Only do this if the results page is still too long after 1–3. |

---

## Medium impact (other big files)

| # | Split | New file(s) | What moves | Benefit |
|---|--------|-------------|------------|--------|
| 5 | **Wizard questions config** | `app/lib/wizardQuestions.ts` | The `questions` array from `app/wizard/page.tsx`. | Wizard page shorter; single place to change wizard steps. Can later share with results “initial questions” if you unify. |
| 6 | **Wizard steps / layout** | `app/components/WizardSteps.tsx` or split by step | Per-step content (question + options + nav). | Wizard page becomes flow control + theme; each step is a smaller component. |
| 7 | **Comparison table** | `app/components/ComparisonTable.tsx` | The comparison table markup and row logic from `app/comparison/page.tsx`. | Comparison page = layout + “compare more” CTA; table is one component. |
| 8 | **Max-rewards allocation UI** | `app/components/MaxRewardsAllocation.tsx` | Slider/list that assigns spend and computes bonus per card. | max-rewards page = layout + this component; allocation logic in one place. |

---

## Lower impact (already reasonably sized)

| # | Split | New file(s) | What moves | Benefit |
|---|--------|-------------|------------|--------|
| 9 | **Card detail option 1 modal** | Already in `app/components/card-detail/`. | — | No change; already split. |
| 10 | **Sandbox-results** | Reuse ResultsLeftPanel + useResultsRanking + optionally ResultsRightPanel once they exist. | Replace duplicated refinement + ranking with shared components/hook. | Sandbox-results page shrinks a lot and stays in sync with results. |

---

## Suggested order

1. **Refinement questions config** (1) – quick win, no UI move.
2. **Results left panel** (2) – biggest single chunk of results UI.
3. **useResultsRanking** (3) – then refactor sandbox-results to use it (10).
4. **Wizard questions** (5) – if you want wizard and results to share question definitions later.
5. Then (4), (6), (7), (8) as needed.

---

## After each split

- Run `npm run dev`, open the affected flow (e.g. wizard → results → refinement → compare).
- Commit with a message like: `Extract refinement questions to app/lib/refinementQuestions.ts`.
