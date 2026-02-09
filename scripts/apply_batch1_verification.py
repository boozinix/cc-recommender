#!/usr/bin/env python3
"""Apply verified data from Chase card pages (batch 1) to cards.csv."""

import csv

INPUT = "public/cards.csv"

# Verified from https://creditcards.chase.com pages (Feb 2025)
UPDATES = {
    "Chase Freedom Unlimited": {
        "minimum_spend_amount": "$500",
        "spend_time_frame": "3",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "6mo DashPass",
        "special_feature_2": "$10/qtr DoorDash",
    },
    "Chase Freedom Flex": {
        "minimum_spend_amount": "$500",
        "spend_time_frame": "3",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Cell phone protection",
        "special_feature_2": "6mo DashPass",
    },
    "Chase Amazon Prime Visa": {
        "minimum_spend_amount": "$0",
        "spend_time_frame": "0",
        "signup_bonus": "150",
        "signup_bonus_type": "dollars",
        "estimated_bonus_value_usd": "150",
        "intro_apr_purchase": "",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "$150 gift card on approval",
        "special_feature_2": "",
    },
    "Chase Freedom Rise": {
        "signup_bonus": "0",
        "estimated_bonus_value_usd": "0",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "$25 for autopay enrollment",
        "special_feature_2": "",
    },
    "Chase Sapphire Preferred": {
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "$50 hotel credit/yr",
        "special_feature_2": "10% anniversary bonus",
    },
    "Chase Sapphire Reserve": {
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "lounge": "Priority Pass + Chase lounges",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "$300 travel credit",
        "special_feature_2": "$500 The Edit hotel credit",
    },
    "Chase Ink Cash": {
        "minimum_spend_amount": "$6,000",
        "spend_time_frame": "3",
        "signup_bonus": "750",
        "signup_bonus_type": "dollars",
        "estimated_bonus_value_usd": "750",
        "foreign_tx_fee": "No",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5% Lyft thru 9/27",
        "special_feature_2": "",
    },
    "Chase Ink Unlimited": {
        "minimum_spend_amount": "$6,000",
        "spend_time_frame": "3",
        "signup_bonus": "750",
        "signup_bonus_type": "dollars",
        "estimated_bonus_value_usd": "750",
        "foreign_tx_fee": "No",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5% Lyft thru 9/27",
        "special_feature_2": "",
    },
    "United Gateway Card": {
        "intro_apr_purchase": "0% for 12 months",
        "foreign_tx_fee": "No",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "2 checked bags after $10k/yr",
        "special_feature_2": "25% back inflight",
    },
    "United Club Infinite Card": {
        "signup_bonus": "90000",
        "minimum_spend_amount": "$5,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "900",
        "foreign_tx_fee": "No",
        "ftf": "0%",
        "lounge": "United Club included",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "Free 1st+2nd checked bags",
        "special_feature_2": "Over $875 annual credits",
    },
    "Southwest Rapid Rewards Priority": {
        "foreign_tx_fee": "No",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "$75 Southwest credit",
        "special_feature_2": "7,500 pts anniversary",
    },
}

# United Club: Page shows 90,000 bonus + 10k AU, $5,000 spend. CSV had 100,000. Updating to 90,000.
# Ink Cash/Unlimited: $750 after $6,000 (not $500) - major correction.

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
