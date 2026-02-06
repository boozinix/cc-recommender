# Version history

Track of major checkpoints and what changed in each. Git tag and commit are listed so you can return to any version.

---

## v0.8 — **Major checkpoint** (current)

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
