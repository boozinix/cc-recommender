#!/usr/bin/env python3
"""
Comprehensive Citi card verification. Updates from AA.com and Citi.com (Feb 2025).
Fields: signup_bonus, min_spend, timeframe, intro_apr, annual_fee, cashback_rate,
        application_link, ftf, lounge, ge_tsa_precheck, special_feature_1, special_feature_2
"""

import csv

INPUT = "public/cards.csv"

# Verified from AA.com and Citi.com (Feb 2025)
# Format: updates to apply (only include fields that need changing)
UPDATES = {
    # --- Citi AAdvantage cards (AA.com) ---
    "Citi AAdvantage Platinum Select World Elite Mastercard": {
        "signup_bonus": "80000",
        "estimated_bonus_value_usd": "800",
        "minimum_spend_amount": "$3,500",
        "spend_time_frame": "4",
        "annual_fee": "99",
        "annual_fee_year_1": "0",
        "annual_fee_year_2_plus": "99",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Free checked bag + 4 companions",
        "special_feature_2": "25% inflight savings; $125 flight discount after $20k",
    },
    "Citi AAdvantage Globe Mastercard": {
        # Globe was revamped - now $350 AF, 90k bonus, premium benefits
        "signup_bonus": "90000",
        "estimated_bonus_value_usd": "900",
        "minimum_spend_amount": "$5,000",
        "spend_time_frame": "4",
        "annual_fee": "350",
        "annual_fee_year_1": "350",
        "annual_fee_year_2_plus": "350",
        "ftf": "0%",
        "lounge": "4 Admirals Club passes/yr",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "Companion certificate (yr 2+); Free bag +8 companions",
        "special_feature_2": "$100 Splurge + $240 Turo + $100 inflight credits",
    },
    "Citi AAdvantage Executive World Elite Mastercard": {
        "signup_bonus": "100000",
        "estimated_bonus_value_usd": "1000",
        "minimum_spend_amount": "$10,000",
        "spend_time_frame": "3",
        "annual_fee": "595",
        "annual_fee_year_1": "595",
        "annual_fee_year_2_plus": "595",
        "ftf": "0%",
        "lounge": "Admirals Club included",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "10× hotels/cars (aadvantagehotels.com, aadvantagecars.com)",
        "special_feature_2": "4× AA; $120 Avis/Budget + Lyft + Grubhub credits",
    },
    "Citi AAdvantage MileUp Card": {
        "minimum_spend_amount": "$500",
        "spend_time_frame": "3",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "25% inflight food/beverage savings",
        "special_feature_2": "",
    },
    "Citi AAdvantage Business World Elite Mastercard": {
        "minimum_spend_amount": "$4,000",
        "spend_time_frame": "4",
        "annual_fee": "99",
        "annual_fee_year_1": "0",
        "annual_fee_year_2_plus": "99",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Free checked bag + 4 companions",
        "special_feature_2": "25% inflight; Companion cert after $30k spend",
    },
    # --- Other Citi cards ---
    "Citi Double Cash": {
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5% hotels/cars/attractions via Citi Travel",
        "special_feature_2": "",
    },
    "Citi Custom Cash": {
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "4% hotels/cars/attractions via Citi Travel",
        "special_feature_2": "",
    },
    "Citi Strata Premier": {
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "10× hotels/cars/attractions (Citi Travel)",
        "special_feature_2": "$100 hotel credit ($500+ stay)",
    },
    "Citi Strata Elite Credit Card": {
        "ftf": "0%",
        "lounge": "Priority Pass Select + 4 Admirals Club passes",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "$300 hotel + $200 Splurge + $200 Blacklane credits",
        "special_feature_2": "12× Citi Travel; 6× AA (Citi Travel); 6× Citi Nights dining",
    },
    "Citi Strata Credit Card": {
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5× Citi Travel; 3× self-select category",
        "special_feature_2": "Intro APR on purchases and balance transfers",
    },
    "Citi Diamond Preferred Credit Card": {
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "21-month 0% balance transfers",
        "special_feature_2": "21-month 0% purchases",
    },
    "Citi Simplicity Credit Card": {
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "No late fees ever",
        "special_feature_2": "No penalty APR",
    },
    "Citi Secured Mastercard": {
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Security deposit $200-$2,500",
        "special_feature_2": "Path to unsecured",
    },
    "Costco Anywhere Visa Business Card by Citi": {
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5% Costco gas; 4% other gas/EV (to $7k/yr)",
        "special_feature_2": "3% restaurants, travel; 2% Costco; Rewards in Feb",
    },
}

# Fix Citi Simplicity typo (永久 -> "permanent")
WHY_THIS_CARD_FIXES = {
    "Citi Simplicity Credit Card": "Unique no-penalty structure with no late fees ever for users wanting payment flexibility and simplicity",
}

if __name__ == "__main__":
    with open(INPUT, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    updated = []
    for row in rows:
        name = row.get("card_name", "").strip()

        # Apply Citi updates
        if name in UPDATES:
            for k, v in UPDATES[name].items():
                if k in fieldnames:
                    row[k] = str(v)
            if name in WHY_THIS_CARD_FIXES:
                row["why_this_card_exiss"] = WHY_THIS_CARD_FIXES[name]
            updated.append(name)

        # Fix Wells Fargo Signify ftf column (had bank_rules in wrong column)
        if name == "Wells Fargo Signify Business Cash":
            row["ftf"] = ""
            if name not in updated:
                updated.append(name)

    with open(INPUT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    print(f"Updated {len(updated)} cards:")
    for name in updated:
        suffix = " (cleared ftf)" if name == "Wells Fargo Signify Business Cash" else ""
        print(f"  • {name}{suffix}")
