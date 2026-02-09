# Point and mile valuations

Estimated bonus values (e.g. “Worth $750”) are now computed from **signup bonus × program value** instead of a flat 100 points = $1.

## Where it’s defined

**`app/lib/pointValues.ts`**

- **`POINT_VALUES_CPP`** – table of **cents per point** by program (e.g. `1.25` = 1.25¢ per point = $12.50 per 1,000 points).
- **`getCentsPerPoint(rewardsType)`** – returns the value for a given `rewards_type` (from CSV), or `1.0` if unknown.
- **`getEstimatedBonusValueUsd(card)`** – returns USD value: for **dollars** uses the CSV value; for **points/miles** uses `signup_bonus × (cpp / 100)`.

## How it’s used

When cards are loaded from `cards.csv` (results, sandbox-results, max-rewards-mode, comparison, pro-churner), each card’s **`estimated_bonus_value_usd`** is set from `getEstimatedBonusValueUsd(card)`. Scoring, bonus display, and the maximize-spend optimizer all use this value.

## Editing the table

1. Open **`app/lib/pointValues.ts`**.
2. In **`POINT_VALUES_CPP`**, change the number for a program (e.g. `"Ultimate Rewards (UR)": 1.25`).
3. To add a new program (e.g. a new airline):
   - Add a key to the **`PointValueKey`** type (e.g. `"New Airline Miles"`).
   - Add an entry in **`POINT_VALUES_CPP`** (e.g. `"New Airline Miles": 1.2`).

The key must match **`rewards_type`** in `cards.csv` exactly (including spaces and parentheses). Unknown programs fall back to **1.0 cpp** (same as the old 100 = $1).

## Current programs in the table

- **Bank / transferable:** Ultimate Rewards (UR), Membership Rewards (MR), Thank You Points (TYP), Bank of America Points, U.S. Bank Points, Wells Fargo Rewards, Capital One Miles.
- **Airlines:** United, Southwest, Delta, AAdvantage, Alaska, JetBlue TrueBlue, BreezePoints, Atmos Miles, Airline Miles.
- **Hotels:** Marriott Bonvoy, Hilton Honors, World of Hyatt, IHG One Rewards, Wyndham Rewards, Choice Privileges.

Values are example defaults; you can replace them with your own research (e.g. TPG, Bankrate, or your own redemptions).
