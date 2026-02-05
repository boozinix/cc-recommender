# 🧪 Experiments Workflow

This guide explains how the code is **locked in** and how to run **experiments** safely.

---

## What’s Locked In Right Now

### Git tag: `v0.4` (current checkpoint)
- **Tag:** `v0.4`
- **Meaning:** Bonus-to-min-spend ratio in scoring; bonus display shows “if you spend $X in N months”; “Expected cashback” label; “Exclude travel cards?” refinement (when Bonus is primary); left-panel UI: boxed “Your answers” and “Refine your results” with hierarchy, pills, hover Edit, microcopy, and card-per-question refinements. Reversible blocks marked in code and in SAFETY_GUIDE.
- **To return here:** `git checkout v0.4` or `git reset --hard v0.4` (on a branch).

### Other tags
- **`v0.3`** – Bank + brand logos, unified card layout; before bonus ratio and left-panel polish.
- **`v0.2`** – Scoring, refinements, travel tier, alternate-list brand priority, UI phrasing; before logo work.
- **`baseline-before-experiments`** – Code before any scoring/UX experiments (earlier snapshot).

### Branch: `main`
- `main` is your main branch. Right now it has the same code as the tag above.
- After experiments, you can either keep results on `main` or merge from a branch.

---

## How to Run Experiments

### Option A: Experiment on `main` (simplest)
1. **Do your experiments** – change scoring logic, UI, etc. in the repo.
2. **Commit often** – e.g. `git add -A && git commit -m "Experiment: try X"`.
3. **If you don’t like it** – revert to the baseline (see below).
4. **If you like it** – you’re done; the experiment is your new “main”.

### Option B: Experiment on a separate branch (recommended)
1. **Switch to the experiments branch:**
   ```bash
   git checkout experiments
   ```
2. **Do your experiments** – edit code as usual.
3. **Commit on `experiments`:**
   ```bash
   git add -A && git commit -m "Experiment: description of change"
   ```
4. **If you don’t like it** – switch back to main and discard:
   ```bash
   git checkout main
   ```
   (Your experiment stays on `experiments` but `main` is unchanged.)
5. **If you like it** – merge into main:
   ```bash
   git checkout main
   git merge experiments
   ```

---

## How to Go Back to the Locked Baseline

Anytime you want to **discard experiments** and return to the code as it was before experiments:

```bash
git checkout main
git reset --hard baseline-before-experiments
```

This makes `main` exactly match the tagged baseline.  
**Warning:** Any uncommitted changes and any commits after the tag on `main` will be gone. If you used Option B and only committed on `experiments`, `main` will just go back to the baseline; your experiment commits remain on `experiments`.

To return to the baseline but **without** touching your current branch name:

```bash
git checkout baseline-before-experiments
```

You’ll be in “detached HEAD” at that snapshot. To make a new branch from there later:  
`git checkout -b new-branch-name`.

---

## Quick Reference

| Goal | Command |
|------|--------|
| See current branch | `git branch` |
| See saved tags | `git tag -l` |
| Lock in current code (already done) | Tag: `baseline-before-experiments` |
| Start experimenting on a branch | `git checkout experiments` |
| Go back to main | `git checkout main` |
| Reset main to locked baseline | `git checkout main` then `git reset --hard baseline-before-experiments` |
| See what changed vs baseline | `git diff baseline-before-experiments` |

---

## Summary

- **Locked in:** Tag `baseline-before-experiments` + branch `main` (and branch `experiments` created from the same point).
- **Experiments:** Either on `main` with commits, or on `experiments` branch.
- **Revert:** `git checkout main` then `git reset --hard baseline-before-experiments` to restore the locked-in code.
