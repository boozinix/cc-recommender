# 🛡️ Safety Guide - How to Revert Changes

Since you're new to coding, here's a simple guide on how to undo changes if something goes wrong.

## Quick Revert Commands

### See What Changed
```bash
git status
```
Shows you what files were modified.

### Undo Changes to ONE File
```bash
git restore app/wizard/page.tsx
```
This will undo all changes to that specific file and restore it to the last saved version.

### Revert Only the Left-Panel Answer/Refinement UI (Results Page)
The "Your answers" and "Refine your results" boxes were updated with a reversible design. To undo just that UI:
1. In `app/results/page.tsx`, search for `REVERSIBLE:` to find the two blocks.
2. Restore the previous version of those blocks from git (e.g. `git show HEAD:app/results/page.tsx` and copy the old markup), or revert the whole file with `git restore app/results/page.tsx` if you want to undo all results-page changes.

### Undo ALL Changes (Nuclear Option)
```bash
git reset --hard HEAD
```
⚠️ **Warning**: This will delete ALL uncommitted changes. Only use if you're sure!

### See History of Changes
```bash
git log --oneline
```
Shows a list of all commits. Each has a code (like `abc1234`). You can go back to any of these.

### Go Back to a Previous Version
```bash
git checkout <commit-code>
```
Replace `<commit-code>` with one of the codes from `git log`.

### Come Back to Latest Version
```bash
git checkout main
```
After going back in time, this brings you back to the latest version.

## How to Ask for Help

When something breaks, tell me:
1. **What were you trying to do?**
2. **What error message do you see?** (copy/paste it)
3. **What's the last thing that worked?**

I'll help you fix it or revert to a working state.

## Before Big Changes

I'll always:
1. ✅ Save your current work (commit to git)
2. ✅ Explain what I'm about to change
3. ✅ Show you how to undo it if needed
4. ✅ Test it works before calling it done

## Your Safety Net

Every time I make changes, I'll create a "checkpoint" (git commit). Think of it like saving a game - you can always go back to a previous save point!

## Running Experiments

If you're about to run **experiments** (e.g. on scoring logic), the current code is **locked in** with a tag and an experiments branch. See **EXPERIMENTS.md** for the full workflow: how to experiment safely and how to revert to the locked baseline.
