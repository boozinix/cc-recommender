#!/usr/bin/env python3
"""Apply verified data from Chase card pages (batch 3) to cards.csv."""

import csv

INPUT = "public/cards.csv"

# Verified from Chase card pages (Feb 2025)
UPDATES = {
    "Southwest Rapid Rewards Premier Business": {
        "signup_bonus": "60000",
        "minimum_spend_amount": "$3,000",
        "spend_time_frame": "3",
        "annual_fee": "149",
        "annual_fee_year_1": "149",
        "annual_fee_year_2_plus": "149",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "6,000 pts anniversary",
        "special_feature_2": "15% flight discount; Preferred seat within 48hrs",
    },
    "IHG One Rewards Premier Business": {
        "signup_bonus": "140000",
        "minimum_spend_amount": "$4,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "466",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "Anniversary free night (40k)",
        "special_feature_2": "$100+10k pts after $20k/yr; 4th night free",
    },
    "World of Hyatt Business Credit Card": {
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "$100 Hyatt credits ($50 x2); Discoverist + 5 employees",
        "special_feature_2": "5 Tier Nights per $10k; 10% pts back after $50k",
    },
}

with open(INPUT, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = list(reader.fieldnames)

updated = 0
for row in rows:
    name = row.get("card_name", "").strip()
    if name in UPDATES:
        for k, v in UPDATES[name].items():
            if k in fieldnames:
                row[k] = v
        updated += 1

with open(INPUT, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    w.writeheader()
    w.writerows(rows)

print(f"Updated {updated} cards: {list(UPDATES.keys())}")
