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

## 3. Quick reference – existing CSV columns (from `cards.csv`)

*So we don’t duplicate:*

`card_name`, `issuer`, `card_type`, `annual_fee`, `annual_fee_year_1`, `annual_fee_year_2_plus`, `reward_model`, `card_family`, `cashback_rate_display`, `cashback_rate_effective`, `signup_bonus`, `signup_bonus_type`, `estimated_bonus_value_usd`, `minimum_spend_amount`, `spend_time_frame`, `intro_apr_purchase`, `foreign_tx_fee`, `best_for`, `why_this_card_exiss`, `pros`, `cons`, `application_link`, `bank_rules`

---

*Last updated: ideation doc created; add new rows to the tables as ideas come in.*
