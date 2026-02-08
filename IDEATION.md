# CC-Recommender – Ideation Backlog

**Purpose:** Park product and data ideas here. Add rows as new ideas come up. No commitment—just a running list.

---

## 1. Product & UX Ideas

| # | Area | Idea | Notes |
|---|------|------|--------|
| 1 | Expert users | Expert mode toggle: fee sliders, exclude issuer, “only cards not in family,” lounge/travel insurance filters | Power users want more control |
| 2 | Expert users | Side-by-side comparison (2–4 cards): fee, bonus, earn rates, benefits; export or share link | Already have comparison page; could extend |
| 3 | Expert users | “Why not this card?” for cards that almost made the list | Surfaces scoring logic |
| 4 | Expert users | Optional score breakdown (goal match, fee, bonus efficiency, etc.) | Trust + transparency |
| 5 | Expert users | Saved profiles (“Travel churner” vs “Daily cashback”) | Avoid re-answering |
| 6 | Branded cards | Add Disney and other retail/entertainment co-brands to CSV + optional “Favorite brands” in wizard | Same pattern as airline/hotel |
| 7 | UI polish | Restraint: one accent, one neutral; fewer gradients/shadows; solid or subtle backgrounds | Less “AI slop” |
| 8 | UI polish | Single clear font hierarchy; consistent spacing and alignment (e.g. 8px grid) | Professional feel |
| 9 | UI polish | Short, direct copy; avoid generic “Discover your perfect card” | Human, scannable |
| 10 | Results tiles | One clear hierarchy per tile: name + one key number; progressive disclosure for details | Neat, tidy |
| 11 | Results tiles | Lead with the number that matches their goal (bonus vs rate vs fee) | Informational |
| 12 | Results tiles | Fewer decorative tags/shadows; small consistent icons for travel/cashback/bonus | Professional look |
| 13 | Insights feel | Narrative one-liner per card: “Best for you: strong bonus, no annual fee” (templates from goals) | No AI; feels curated |
| 14 | Insights feel | Summary at top: “You want travel, prefer Delta, OK with higher fee. We ranked matches.” | Reuse wizard inputs |
| 15 | Insights feel | “Top pick” badge + one-line why; optional “If you’re open to cashback, X is a strong alternative” | Contrarian tip = rule-based |
| 16 | Explanations | Reason “atoms”: ~10–15 reusable reasons (goal match, fee fit, brand match, bonus efficiency…); per-card = 2–4 atoms | Avoid 100+ combos; same logic as scoring |
| 17 | *(add more)* | | |

---

## 1b. Design exploration (visualize before coding)

*Ways to see what “cleaner, neater, not AI slop” could look like **without running the app**.*

| Approach | What it is | Use when |
|----------|------------|----------|
| **Generated mockup images** | Static images of key screens (homepage, wizard step, results tile) in a target style. Stored in project assets; open in Finder/IDE. | You want to eyeball layout, density, and tone before touching code. |
| **Written design direction** | Short spec: palette (one accent + neutrals), type scale, spacing (e.g. 8px grid), do’s and don’ts. No pixels, just principles. | You or a designer will implement; you want a shared “north star.” |
| **Static HTML mockup** | Single `.html` file with inline CSS you open in a browser. One page or one component (e.g. one results card). Throwaway. | You want to click around one screen without running Next.js. |
| **Reference screenshots** | Links or saved screenshots of sites you like (e.g. NerdWallet, bank product pages); notes on what to steal (layout, hierarchy, restraint). | You want to copy “vibe” from real products. |

*Generated concepts (no code run):*  
- `cc-recommender-homepage-concept.png` – Homepage: two paths, minimal, one accent, lots of whitespace. **(Option 1 color scheme – consider for landing/login.)**  
- `cc-recommender-results-tile-concept.png` – One result card: compact, one key number, minimal decoration. **(Direction for neater results tiles.)**  
- `cc-recommender-wizard-step-concept.png` – One wizard question: clear question, simple options, single Next.  
- `cc-recommender-results-page-redesign-mockup.png` – **Full results page** in the same clean style: Option 1 colors, neat tile rows (logo + name + one key number), simplified left sidebar (Your answers + Refine), no big green/red pros-cons blocks, scannable and minimal.  

*(Images live in Cursor project assets; add more concepts as needed.)*

---

## 1c. Results tile ideas (keep the tiles – 3 directions)

*You want to keep the full tile content (logo, name, key stat, pros, cons, CTA). Here are 3 different visual directions for those same tiles.*

| Idea | Name | What changes | What stays |
|------|------|--------------|------------|
| **1** | **Soft card panel** | One subtle shadow or light border; single background (white or off-white). Pros/cons as simple bullet lists with small checkmark/cross icons—no big green/red boxes. One accent color only for the “Apply” button. Tags (Amex, Travel) in muted gray pills. | Header (logo + name), key stat line (e.g. “$700 value if you spend $8k in 6 mo”), pros list, cons list, Apply, Add to compare. |
| **2** | **Zoned with dividers** | No colored blocks. Thin horizontal dividers separate: (1) header row, (2) one-line key stats (e.g. “$700 bonus · $350/yr · Delta”), (3) pros and cons side by side or stacked with minimal styling (gray text, small icons). Full-width “Apply” at bottom. Reads like a clean document. | Same content; just reorganized into clear zones with lines, not colored boxes. |
| **3** | **Collapsed by default, expand for details** | Each tile shows only: logo, card name, one headline (e.g. “$700 bonus · $350/yr”). Pros, cons, and CTA live behind “See details” or a tap/click to expand. List is very scannable; full info still in the tile when opened. | Everything stays in the tile; default view is compact, expanded view shows full pros/cons/Apply. |
| **4** | **Minimal tile + click for balloon** | **Tile:** No pros/cons on the tile. Small border around the tile. Logo, card name, key stat line. Apply + Add to compare at bottom (same placement as Idea 1). Whole tile is clickable. **On click:** A balloon/popover opens with more details: extra feature details, a short blurb “Why people love/hate this card” (new CSV column), and pros/cons in the same colors (green pros, red cons). | Tile stays clean; all detail lives in the popover. CSV: add column e.g. `user_sentiment_blurb` or `love_hate_blurb`. |

*Mockups:* `results-tile-idea-1-soft-panel.png`, `results-tile-idea-2-zoned-dividers.png`, `results-tile-idea-3-expand.png`, `results-tile-idea-4-tile-only.png` (tile), `results-tile-idea-4-with-balloon.png` (tile + balloon open).

---

## 2. CSV Dimensions – Differentiate Cards Beyond Bonus & Rewards

*Today we score mainly on: bonus value, cashback rate, annual fee, goal match, airline/hotel preference. These dimensions would let us score on **point value, support quality, acceptance, benefits**, etc.*

| # | Dimension | What it captures | Example (high vs low) | Possible CSV column(s) | Use in scoring |
|---|------------|------------------|------------------------|------------------------|----------------|
| 1 | **Point flexibility / redemption value** | How valuable and flexible the currency is (transfer partners, redemption options) | Chase UR / Amex MR (many partners, 1.25–1.5¢+ value) vs US Bank (fewer options, lower flexibility) | `point_flexibility_rating` (1–5) or `transfer_partners_count`, `typical_redemption_cpp` | Boost cards with higher flexibility when goal = Travel |
| 2 | **Customer support quality** | Ease of reaching humans, dispute handling, satisfaction | Amex / Chase (top tier) vs Citi / some others (notorious for long holds, runaround) | `customer_support_rating` (1–5) or `support_tier` | Weight in scoring or “peace of mind” filter; show in pros/explanation |
| 3 | **Network acceptance** | Where the card is widely accepted | Visa/MC (everywhere) vs Amex (less so abroad and some small merchants) | `network` (Visa/MC/Amex/Discover); already often derivable from issuer | Down-rank Amex for “use everywhere” or international-heavy users if we ask |
| 4 | **Benefits quality & claim ease** | Travel insurance, purchase protection, extended warranty—and how easy it is to actually use them | Amex/Chase often better documentation and claim experience; some issuers make it hard | `benefits_quality_rating` or separate columns per benefit type | Boost for “travel” or “peace of mind”; show in explanation |
| 5 | **Lounge access** | Priority Pass, Centurion, Delta Sky Club, etc. | Reserve/Platinum/Venture X vs no lounge | `lounge_access` (none / PP / Centurion / airline-specific) | Filter or boost for frequent travelers |
| 6 | **Foreign transaction fee** | Already in CSV as `foreign_tx_fee` | 0% FTF vs 3% | Use existing column | Already differentiator; ensure we score it for travel |
| 7 | **Ongoing value beyond SUB** | Is the card good after year 1 or mainly a churn target? | Amex Gold (4x dining/groceries ongoing) vs one-and-done bonus cards | `ongoing_value_rating` or category multipliers in data | Optional “long-term keeper” vs “churn” lens in expert mode |
| 8 | **Approval difficulty / issuer rules** | 5/24, once-per-lifetime, etc. | Chase 5/24; Amex once per lifetime; Citi 24–48mo | `bank_rules` (you have); could add `approval_difficulty` | Show in UI; don’t recommend Chase if user might be over 5/24 if we ever ask |
| 9 | **Fraud & dispute handling** | How much issuer sides with cardholder in disputes | Amex known for siding with customer; others vary | `dispute_friendliness_rating` (1–5) | “Peace of mind” or expert dimension |
| 10 | **Mobile app & digital experience** | Ease of managing card, offers, redemption | Chase/Amex generally strong; some issuers lag | `digital_experience_rating` (1–5) | Nice-to-have differentiator; lower priority |
| 11 | **Authorized user benefits** | Free AU, AU lounge access, etc. | Amex Platinum AU gets Centurion; some cards free AU with perks | `au_benefits` (text or structured) | Filter or boost for “family” or “shared travel” if we ask |
| 12 | **Retention / product change path** | Can you downgrade to no-AF version and keep history? | Chase (downgrade to Freedom); Amex (sometimes); Citi (some cards) | `downgrade_path` (yes/no or product name) | “Flexibility” or “exit strategy” for fee-sensitive users |
| 13 | *(add more)* | | | | |

---

## 3. Desktop vs mobile – separate versions / better mobile experience

*Current situation: app doesn’t feel great on mobile. Below are ways to get “separate” desktop vs mobile experiences (or one experience that works well on both).*

### 3a. Approaches (how to get desktop vs mobile)

| Approach | What it means | Pros | Cons |
|----------|----------------|------|------|
| **Responsive (one codebase)** | Same pages; CSS/layout changes with screen size (breakpoints). Components stack, font sizes and padding adjust, some UI hides or simplifies on small screens. | One codebase to maintain; one URL; no device detection. | Mobile can feel like “shrunk desktop” if not designed for touch and narrow screens. |
| **Mobile-first responsive** | Design and build for mobile first, then add layout/features for larger screens. | Mobile gets proper attention; desktop is “enhanced mobile.” | Requires rethinking flows; easy to under-serve desktop if not careful. |
| **Separate mobile layout (same app)** | Same routes and data; different React components or layout wrappers when `window width < N` or `user-agent` is mobile. Show “mobile” version of wizard, results, comparison. | Can optimize each experience (e.g. wizard one question per screen on mobile, multi-column on desktop). | Two layouts to design and maintain; need to keep logic in sync. |
| **Separate mobile site (subdomain or path)** | e.g. `m.yoursite.com` or `/m/` with different pages/components. Device detection or user choice sends to mobile vs desktop. | Full freedom to simplify mobile (fewer steps, different navigation). | Two code paths; possible duplicate logic; SEO and sharing (desktop vs mobile URLs) to think through. |
| **Progressive enhancement** | One layout that works everywhere; add touch-friendly controls, larger tap targets, and optional “mobile” tweaks (e.g. bottom nav, swipe) when on small screens. | Single codebase; mobile improves without a separate “version.” | Still one design; may not feel “native” or fully tailored. |

*Recommendation to explore first:* **Responsive + mobile-first tweaks** (or **separate mobile layout in same app** if specific screens like results or comparison need a different structure). Avoid a full second “mobile site” unless you have a clear reason.

### 3b. Mobile pain points to fix (ideas, no code)

| # | Area | Likely issue | Idea to improve |
|---|------|--------------|-----------------|
| 1 | Wizard | Too much on one screen; small tap targets; long scrolling | One question per screen on mobile; big buttons; “Next” sticky at bottom. |
| 2 | Results | Tiles too wide or too dense; hard to scan | Single column; one key number per card; tap to expand details; optional “list” vs “card” view. |
| 3 | Comparison | Table doesn’t fit; horizontal scroll is awkward | Stack rows on mobile (card per product) or show 2 cards at a time with “Compare next” to swap. |
| 4 | Homepage | Two paths (wizard vs prompt) may feel cramped | Stack choices vertically; full-width buttons; maybe hide or shorten prompt on very small screens. |
| 5 | Navigation / chrome | Header or sidebar eats space; links too small | Collapsible menu (hamburger); bottom nav for main actions (Home, Results, Compare) on mobile. |
| 6 | Typography / touch | Text too small; links/buttons hard to tap | Min font size (e.g. 16px body); tap targets ≥ 44px; more spacing between interactive elements. |
| 7 | Left panel (results) | Summary panel might dominate or scroll oddly on narrow screens | Collapse to a “Your choices” drawer or top summary bar on mobile; details on tap. |
| 8 | *(add more)* | | |

### 3c. “Separate version” in practice (no code)

- **You don’t need two codebases.** “Separate” usually means: **different layout and component choices** when the app detects small width (or mobile), not a second repo or site.
- **One way to do it:** Define breakpoints (e.g. 768px); below that, render a “mobile” layout (e.g. `ResultsMobile`, `WizardMobile`) that reuses the same data and state. Same URLs, same logic, different UI.
- **Another way:** Use responsive CSS only (flexbox/grid, `max-width`, hide/show with media queries) so one component tree works on all sizes. Often enough if the main issues are density and tap targets.

---

## 4. Quick reference – existing CSV columns (from `cards.csv`)

*So we don’t duplicate:*

`card_name`, `issuer`, `card_type`, `annual_fee`, `annual_fee_year_1`, `annual_fee_year_2_plus`, `reward_model`, `card_family`, `cashback_rate_display`, `cashback_rate_effective`, `signup_bonus`, `signup_bonus_type`, `estimated_bonus_value_usd`, `minimum_spend_amount`, `spend_time_frame`, `intro_apr_purchase`, `foreign_tx_fee`, `best_for`, `why_this_card_exiss`, `pros`, `cons`, `application_link`, `bank_rules`

*Idea 4 (balloon): add CSV column e.g. `user_sentiment_blurb` or `love_hate_blurb` – short “why people love/hate this card” for the popover.*

---

## 5. Logic – Spend allocation (maximize rewards with fixed budget)

*User says: "I have $20k to spend. I want to maximize signup bonuses." Many combinations: e.g. 2 cards × $10k min / $1k bonus = $2k total; or 5 cards × $4k min / $600 bonus = $3k total; or 4 × $5k / $700 = $2.8k, etc. How to implement?*

### Doable? **Yes.**

The problem is a **0/1 knapsack**: capacity = user's total spend budget; each "item" = a card with weight = minimum spend requirement, value = bonus (USD). Choose a subset of cards so total min spend ≤ budget and total bonus is maximized. Each card at most once (one SUB per card).

### Core algorithm

| Step | What to do |
|------|------------|
| 1. **Inputs** | User provides: total spend budget (e.g. $20,000) and optionally time window (e.g. next 6 months). |
| 2. **Item list** | From CSV: every eligible card (not owned, passes filters) with a SUB: `minimum_spend_amount`, `estimated_bonus_value_usd`, `spend_time_frame`. Parse min spend to a number (e.g. $4,000 → 4000). |
| 3. **Knapsack** | 0/1 knapsack: capacity = budget (e.g. 20000), for each card weight = min_spend, value = bonus. DP in dollars: `dp[capacity]` = max total bonus. Backtrack to get which cards were chosen. |
| 4. **Output** | List of chosen cards; for each: "Put $X on this card" (X = its min spend); total bonus; leftover spend (budget − sum of chosen min spends) with a note like "put leftover on best ongoing card" or ignore. |

**Complexity:** O(n × budget). With n ≈ 50 cards and budget = 20,000, that's ~1M steps—fine in JS/TS.

### Simplifications for v1

- **No calendar:** Assume "$20k" is total spend the user can put toward SUBs in the period. Don't model overlapping "spend $4k in 3 months" windows; just enforce sum(min_spends) ≤ budget.
- **Eligibility:** Reuse existing filters (not owned, issuer OK, etc.). Optionally exclude cards user likely can't get (e.g. Chase if over 5/24) or show a disclaimer.
- **One card per family?** Optional: restrict knapsack so at most one card per `card_family` (or per issuer) to avoid "5 Chase cards" when that's not realistic. Can be a toggle.

### Edge cases

- **Time window:** If you want "only cards whose spend window fits in the next 6 months," filter by `spend_time_frame` (e.g. "3 months" or "6 months") and maybe assume user can do 2–3 cards in parallel. v2 could model calendar (harder).
- **Same issuer:** Knapsack can return multiple cards from one issuer; add a post-step or constraint (e.g. max 1–2 per issuer) if needed.
- **Ties:** Multiple combinations with same total bonus—pick one (e.g. fewer cards, or higher bonus-per-card). Or show top 2–3 plans.

### Where it lives in the app

- **Wizard or refinements:** New question: "How much can you put toward signup bonuses in the next 6–12 months?" (e.g. $5k / $10k / $20k / $50k / Other). If user picks "Maximize rewards" as goal and enters a number, run the knapsack and show a **separate "Optimized plan"** section: "With $20k spend, we recommend these 5 cards: … Total bonus: $3,000."
- **Data:** Use existing `minimum_spend_amount`, `estimated_bonus_value_usd`, `spend_time_frame`. No new CSV columns required for the core logic.

### Summary

| Question | Answer |
|----------|--------|
| Doable? | Yes. |
| Algorithm | 0/1 knapsack (DP). |
| Inputs | Budget (user), min_spend + bonus per card (CSV). |
| Output | Set of cards + allocation (min spend each) + total bonus. |
| Optional | Limit cards per issuer/family; filter by time window; show top 2–3 plans. |

---

*Last updated: added Section 5 (spend allocation logic); add new rows to the tables as ideas come in.*
