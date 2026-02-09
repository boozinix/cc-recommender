#!/usr/bin/env python3
"""Apply verified data from Chase card pages (batch 2) to cards.csv."""

import csv

INPUT = "public/cards.csv"

# Verified from https://creditcards.chase.com pages (Feb 2025)
UPDATES = {
    "Southwest Rapid Rewards Premier": {
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "6,000 pts anniversary",
        "special_feature_2": "15% flight discount yearly",
    },
    "Marriott Bonvoy Bountiful": {
        "signup_bonus": "85000",
        "minimum_spend_amount": "$4,000",
        "spend_time_frame": "3",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "Free night after $15k (50k pts)",
        "special_feature_2": "15 Elite Night Credits, Gold Elite",
    },
    "IHG One Rewards Premier": {
        "signup_bonus": "175000",
        "minimum_spend_amount": "$5,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "583",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "Anniversary free night (40k)",
        "special_feature_2": "$100+10k pts after $20k/yr",
    },
    "IHG One Rewards Traveler": {
        "signup_bonus": "90000",
        "minimum_spend_amount": "$2,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "300",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "Silver Elite; up to 120k with 3x bonus",
        "special_feature_2": "10k pts after $10k/yr; 4th night free",
    },
    "Chase Sapphire Reserve for Business": {
        "signup_bonus": "150000",
        "minimum_spend_amount": "$20,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "1500",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "lounge": "Priority Pass + Chase lounges",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "$300 travel credit",
        "special_feature_2": "$500 The Edit + DoorDash $420",
    },
    "Ink Business Preferred Credit Card": {
        "signup_bonus": "90000",
        "minimum_spend_amount": "$8,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "900",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "5x Lyft thru 9/27",
        "special_feature_2": "12mo DashPass, $10/mo DoorDash",
    },
    "Ink Business Premier Credit Card": {
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "Cell phone protection",
        "special_feature_2": "2.5% on $5k+ purchases",
    },
    "United Business Card": {
        "signup_bonus": "100000",
        "minimum_spend_amount": "$5,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "1000",
        "annual_fee_year_1": "0",
        "annual_fee_year_2_plus": "150",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "special_feature_1": "2 United Club passes/yr",
        "special_feature_2": "Over $600 partner credits",
    },
    "United Club Business Card": {
        "signup_bonus": "100000",
        "minimum_spend_amount": "$5,000",
        "spend_time_frame": "3",
        "estimated_bonus_value_usd": "1000",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "lounge": "United Club included",
        "special_feature_1": "Free 1st+2nd checked bags",
        "special_feature_2": "Over $925 partner credits",
    },
    "Southwest Rapid Rewards Performance Business": {
        "annual_fee": "299",
        "ftf": "0%",
        "foreign_tx_fee": "No",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "9,000 pts anniversary",
        "special_feature_2": "Preferred seat at booking, Extra Legroom",
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
