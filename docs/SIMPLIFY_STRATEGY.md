# Strategy: Simplify the code without losing functionality (no QA engineer)

You want to reduce bloat and make the code easier to maintain, but you’re worried that refactoring might break something and be hard to fix without a dedicated QA person. Here’s a **low-risk strategy** you can follow.

---

## 1. Treat the sandbox as your safety net

- **Use `/sandbox`** to try refactors and new patterns *first*.
- Implement the “simplified” version in the sandbox (e.g. a smaller results card, a different refinement UI).
- Manually click through the sandbox and compare behavior to the real app.
- Only **copy code back** into the main app when you’re happy and have clicked through the main flows (wizard → results → compare).

This way the main app stays stable while you experiment.

---

## 2. One change at a time, one commit per change

- Do **one** simplification per step (e.g. “extract one helper”, “replace one duplicated block with a component”).
- After each step: **run the app**, go through the flows that touch that code, then **commit** with a clear message (e.g. “Extract CardTile into component”).
- If something breaks, you know exactly which change caused it; you can `git revert` or `git restore` that commit and fix before continuing.

Avoid “big cleanup” commits that touch many files at once; those are hard to debug without QA.

---

## 3. Use feature flags / toggles you already have

- You already use flags (e.g. in `card-detail/constants.ts`) to turn options on/off.
- Use the same idea for **simplifications**: e.g. “use new simplified card tile when this flag is true, else old”.
- Deploy with the flag **off**, turn it **on** for yourself, click through everything, then remove the old path and the flag once you’re confident.

That way you can switch back instantly if the new path breaks something.

---

## 4. Document before you move

- Before extracting or deleting code, add a **short comment or doc** (even in a file like `docs/SIMPLIFY_STRATEGY.md` or next to the code): “This block does X; used by Y and Z.”
- When you pull logic into a shared component or helper, keep a one-line note: “Used by: results main list, results leaving cards, other-type cards.”
- That makes it easier to remember what to re-check after a change and reduces the “did I break something I forgot about?” feeling.

---

## 5. Keep a “must still work” checklist

- Write a **short checklist** of flows that must still work (no formal QA needed). For example:
  - Home → type prompt → Get recommendations → results load.
  - Home → Answer questions → complete wizard → results load.
  - Results: change refinement → cards update (and animate).
  - Results: Show 3 more / Show fewer → cards animate.
  - Results: Show/Hide business or personal cards → section appears/disappears with animation.
  - Results: click Apply / Add to compare; open comparison with 2+ cards.
  - Mobile: refinement Show/Hide; Apply/Compare centered in tile.
- After each simplification, run through this list (or the part that touches your change). If anything fails, fix or revert before the next change.

You can keep this list in `docs/SIMPLIFY_STRATEGY.md` or in a `CHECKLIST.md` and update it as the app grows.

---

## 6. Prefer “duplicate then dedupe”

- If you’re unsure whether two blocks are really the same, **first** make the “simplified” version in the sandbox or in a single place (e.g. one card type).
- Confirm behavior there, then **replace** the other duplicated block with the new version one at a time, with a commit and a quick check after each replacement.
- That’s safer than deduplicating in one big step and hoping both paths still work.

---

## 7. Where to simplify first (ideas only)

- **Results page** is the heaviest (one big file, repeated card markup). A good first step is to extract a single **reusable card tile component** and use it in one place (e.g. main list only), then gradually switch the other places (leaving cards, other-type cards) to the same component. Each switch is one small commit + checklist run.
- **Refinement section**: already behind a mobile show/hide; the “refinement content” block could be a separate component so the results page is easier to read.
- **Scoring and filtering**: already in functions; you could move them into a single `lib/scoring.ts` (or similar) if they’re still in the page file, so the page is mostly UI and wiring.

You can try the “one card component” idea in the sandbox first (render a few fake cards with the new component) and only then replace one block on the real results page.

---

## 8. Next splits (refactor plan)

Already done:

- **Scoring engine** → `app/lib/resultsScoring.ts`. Results and sandbox-results both import from here; no duplicate scoring logic.

Possible next splits (smaller files = faster to read and edit):

| Split | Where | Benefit |
|-------|--------|--------|
| **Refinement questions config** | Extract the refinement question tree (ids, options, multiSelect) into a small module (e.g. `app/lib/refinementQuestions.ts`). | Results/sandbox pages get shorter; one place to add or change refinement questions. |
| **Results left panel** | Extract the left column (refinement controls, "Show 3 more / fewer", business/personal toggle) into e.g. `app/components/ResultsLeftPanel.tsx`. | Results page focuses on layout and right-hand card list. |
| **Results right panel** | Optionally extract the main card list + "other type" + leaving-cards into `ResultsRightPanel` if the main page is still too long. | Cleaner separation of concerns. |
| **useResultsRanking hook** | Move the logic that builds ranked lists (goal ranks, brand/bank filters, dedupe, top N) into a hook like `useResultsRanking(answers, cards)`. | Page becomes mostly UI; ranking logic is testable and reusable (e.g. sandbox can use same hook). |

Do these one at a time, with a commit and a quick run of the "must still work" checklist after each.

---

## Summary

- **Sandbox** = try ideas and refactors without touching the main app.
- **One change, one commit, then run the app** = easy to find and fix regressions.
- **Flags and “duplicate then dedupe”** = safe rollout and rollback.
- **Short docs + checklist** = you act as your own QA in a repeatable way.

You don’t need a QA engineer to simplify; you need a **small, repeatable process** (sandbox → one change → commit → quick manual check) and a **short list of flows that must still work** so you don’t miss breakage.
