# Version history

Track of major checkpoints and what changed in each. Git tag and commit are listed so you can return to any version.

---

## v0.12 — **Canon** (current)

**Tag:** `v0.12`  
**Commit:** `8604a17`  
**Date:** Feb 2025

Canon checkpoint. Restore to this if you need to undo later changes.

### What changed (since v0.11)
- **Bonus + include travel:** When primary is Sign up bonus and user chooses "Include travel cards", refinement now shows "What kind of travel rewards?" and (if Airline/Hotel) airline or hotel preference so users can target high-bonus airline/hotel cards.
- **Dark mode:** Personal/Business toggle unselected button ("Business" / "Personal") uses readable light text in dark mode on both results and wizard (same as other similar buttons).
- **Docs:** `REFINEMENT_QUESTION_TREE.md` updated for Bonus branch (include-travel path with travel type and airline/hotel follow-ups).

### How to restore this version
```bash
git checkout v0.12
```

---

## v0.11

**Tag:** `v0.11`  
**Commit:** `0c94d0f`  
**Date:** Feb 2025

### What changed (since v0.10)
- **Dark mode (results):** Left-panel answer boxes and refinement option buttons use dark-mode-only CSS so text is readable (no white boxes, no invisible selected/option text).
- **Dark mode (wizard):** "Your answers so far" rows, helper text, selected option button text, and Continue button use dark-mode-only overrides for readability.
- **Hide button:** "Hide other card type" → dynamic "Hide business cards" / "Hide personal cards" depending on which type the section is showing.
- **Card animation:** Enter/leave duration 0.35s → 0.55s; leave list merged on refinement change so rapid toggles don’t cut the animation short.
- **0% APR question:** Reduced to 2 options: "Yes, 0% APR is important to me" / "No, I don't care about intro APR". Scoring and prompt parsing use value "Yes".
- **Docs:** `docs/REFINEMENT_QUESTION_TREE.md` — tree of how wizard Q1 (primary goal) affects which refinement questions appear on the results page.

### How to restore this version
```bash
git checkout v0.11
```

---

## v0.10 — **Canon**

**Tag:** `v0.10`  
**Commit:** `03a7305`  
**Date:** Feb 2025

Canon checkpoint before further edits. Restore to this if you need to undo later changes.

### What changed (since v0.9)
- **Results list:** 3 → 6 → 9 cards. At 6 you can "Show fewer options" (back to 3) or "Show 3 more" (to 9). Button text "Hide extra recommendations" replaced with "Show fewer options".
- **Divider:** Bolder line (2px) between main recommendations and alternate (personal/business) section.
- **Refinement order:** "Exclude travel and hotel branded cards?" is first when Bonus is primary; title updated; when user excludes travel, airline/hotel preference questions are hidden.
- **Travel included:** When not excluding travel, results show both airline and hotel cards. Bonus + exclude travel: fixed zero results.

### How to restore this version
```bash
git checkout v0.10
```

---

## v0.9 — **Checkpoint before experiments**

**Tag:** `v0.9`  
**Commit:** `c140768`  
**Date:** Feb 2025

Saved state before running experiments. Use this to restore if you need to undo experiment changes.

### What changed (since v0.8)
- **Reward program names:** Results and comparison show proper names (Ultimate Rewards, Membership Rewards, Thank You Points, United miles, cash, etc.).
- **Compare button:** Restored “Compare N cards →” on results when 2+ cards are selected.
- **Left panel:** No max-height; panel grows with content so 2–3 questions don’t need a small scroll.
- **Results heading:** “Your top picks — based on your answers” with Geist font and stronger typography.

### How to restore this version
```bash
git checkout v0.9
```

---

## v0.8 — **Major checkpoint**

**Tag:** `v0.8`  
**Commit:** `42c5508`  
**Date:** Feb 2025

Official save point: dark mode, UI cleanup, pros/cons, and Back buttons.

### What changed

**Dark / light mode**
- Site follows the device’s light or dark setting.
- CSS variables in `app/globals.css` for backgrounds, text, borders, pros/cons.
- Home, wizard, results, and comparison pages use these variables so they look correct in both modes.

**Citi color**
- Citi issuer pill color changed from app blue (`#2563eb`) to teal (`#0e7490`) so it doesn’t match the main buttons.

**Buttons**
- “Show 3 more recommendations”, “Hide extra recommendations”, “Show personal/business cards too”, and refinement option pills: square with rounded corners (no longer pill-shaped).
- “Compare N cards” button: same rounded-square style.

**Questions removed**
- “Do you have a Bank of America checking or savings account?”
- “Have you had a Wells Fargo checking or savings account for 1 year or more?”
- Related scoring and Wells Fargo–only filtering removed.

**Home page**
- Text prompt input: visible border and background so the box is clear in light and dark (`--input-border`, `--input-bg`).

**Wizard**
- Option buttons (questions 2 & 3): clear border and background so they look like clickable boxes.
- Back button: white text on dark background so it’s readable in dark mode; rounded-square shape.

**Results page**
- “Start over” replaced with a black “← Back” button (same style as wizard Back).
- Pros/cons: show **every** line item (no 3-item limit); split by `;` or `•`.
- Pros/cons: green left border for Pros, red left border for Cons so they stay clearly green/red in both themes.

### Files touched in this version
- `app/globals.css`
- `app/page.tsx`
- `app/wizard/page.tsx`
- `app/results/page.tsx`
- `app/comparison/page.tsx`
- `public/cards.csv`

### How to restore this version
```bash
git checkout v0.8
```

---

## Earlier versions

- **v0.7** — (existing tag in repo)
- **v0.2** — (existing tag in repo)
- **baseline-before-experiments** — (existing tag in repo)

---

*Add new sections above “Earlier versions” when you create the next checkpoint. Keep the same format: version, tag, commit, date, and a bullet list of what changed.*
