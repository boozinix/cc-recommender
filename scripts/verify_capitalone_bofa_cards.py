#!/usr/bin/env python3
"""
Verify Capital One and Bank of America cards.
Updates: application_link, ftf, lounge, ge_tsa_precheck, special_feature_1, special_feature_2,
         signup_bonus, minimum_spend_amount, spend_time_frame, annual_fee, etc.
Source: Capital One and Bank of America websites (Feb 2025).
"""

import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "..", "public", "cards.csv")

# Application links from user (exact URLs)
LINKS = {
    "Capital One Quicksilver": "https://www.capitalone.com/credit-cards/quicksilver/",
    "Capital One SavorOne": "https://www.capitalone.com/credit-cards/savorone/",
    "Capital One Venture": "https://www.capitalone.com/credit-cards/venture/",
    "Capital One Venture X": "https://www.capitalone.com/credit-cards/venture-x/",
    "Capital One Platinum": "https://www.capitalone.com/credit-cards/platinum/",
    "Capital One Spark Cash": "https://www.capitalone.com/small-business/credit-cards/spark-cash/",
    "Capital One Spark Cash Plus": "https://www.capitalone.com/small-business/credit-cards/spark-cash-plus/",
    "Capital One Spark Cash Select": "https://www.capitalone.com/small-business/credit-cards/spark-cash-select/",
    "Capital One Venture X Business": "https://www.capitalone.com/small-business/credit-cards/venture-x-business/",
    "Capital One Spark Miles": "https://www.capitalone.com/small-business/credit-cards/spark-miles/",
    "Bank of America Customized Cash": "https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/",
    "Bank of America Unlimited Cash": "https://www.bankofamerica.com/credit-cards/products/unlimited-cash-back-credit-card/",
    "Bank of America Travel Rewards": "https://www.bankofamerica.com/credit-cards/products/travel-rewards-credit-card/",
    "Bank of America Premium Rewards": "https://www.bankofamerica.com/credit-cards/products/premium-rewards-credit-card/",
    "Bank of America Business Advantage Travel Rewards": "https://business.bankofamerica.com/en/credit-cards/business-advantage-travel-rewards?campaign=4076928~NJ~en_US",
    "Bank of America Business Advantage Customized Cash Rewards": "https://business.bankofamerica.com/en/credit-cards/business-advantage-customized-cash-rewards?campaign=4076847~NX~en_US",
    "Alaska Airlines Visa Signature": "https://www.bankofamerica.com/credit-cards/products/alaska-airlines-credit-card/",
    "Atmos Rewards Summit Visa Infinite": "https://www.bankofamerica.com/credit-cards/products/alaska-airlines-infinite-credit-card/",
}

# Verified data updates (Capital One + BoA)
UPDATES = {
    # --- Capital One ---
    "Capital One Quicksilver": {
        "signup_bonus": "200",
        "minimum_spend_amount": "$500",
        "spend_time_frame": "3",
        "annual_fee": "0",
        "application_link": "https://www.capitalone.com/credit-cards/quicksilver/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Capital One Travel; price drop protection",
        "special_feature_2": "Hertz Five Star status",
    },
    "Capital One SavorOne": {
        # SavorOne for Fair Credit has $39 AF per Capital One site
        "signup_bonus": "200",
        "minimum_spend_amount": "$500",
        "spend_time_frame": "3",
        "annual_fee": "39",
        "annual_fee_year_1": "39",
        "annual_fee_year_2_plus": "39",
        "application_link": "https://www.capitalone.com/credit-cards/savorone/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "3% grocery (excl. Walmart/Target), dining, entertainment, streaming",
        "special_feature_2": "1% all other",
    },
    "Capital One Venture": {
        "signup_bonus": "75000",
        "signup_bonus_type": "miles",
        "estimated_bonus_value_usd": "750",
        "minimum_spend_amount": "$4,000",
        "spend_time_frame": "3",
        "annual_fee": "95",
        "application_link": "https://www.capitalone.com/credit-cards/venture/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "$250 travel credit (yr 1); 5× hotels/rental cars via Capital One Travel",
        "special_feature_2": "Hertz Five Star; $50 Lifestyle Collection credit",
    },
    "Capital One Venture X": {
        "signup_bonus": "75000",
        "signup_bonus_type": "miles",
        "estimated_bonus_value_usd": "750",
        "minimum_spend_amount": "$4,000",
        "spend_time_frame": "3",
        "annual_fee": "395",
        "application_link": "https://www.capitalone.com/credit-cards/venture-x/",
        "ftf": "0%",
        "lounge": "Capital One Lounges + Priority Pass",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "$300 annual travel credit; 10k anniversary miles",
        "special_feature_2": "Hertz President's Circle; PRIOR ($149); Cultivist 50% off",
    },
    "Capital One Platinum": {
        "application_link": "https://www.capitalone.com/credit-cards/platinum/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Credit building; no rewards",
        "special_feature_2": "",
    },
    "Capital One Spark Cash": {
        "signup_bonus": "1000",
        "signup_bonus_type": "dollars",
        "estimated_bonus_value_usd": "1000",
        "minimum_spend_amount": "$10,000",
        "spend_time_frame": "3",
        "annual_fee": "0",
        "annual_fee_year_1": "0",
        "annual_fee_year_2_plus": "95",
        "cashback_rate_display": "2",
        "cashback_rate_effective": "2.0",
        "application_link": "https://www.capitalone.com/small-business/credit-cards/spark-cash/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5% hotels and rental cars via Capital One Business Travel",
        "special_feature_2": "2% unlimited on all purchases",
    },
    "Capital One Spark Cash Plus": {
        "signup_bonus": "2000",
        "minimum_spend_amount": "$30,000",
        "spend_time_frame": "3",
        "annual_fee": "150",
        "application_link": "https://www.capitalone.com/small-business/credit-cards/spark-cash-plus/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "$2,000+ per $500k first year; 5% hotels/cars via Business Travel",
        "special_feature_2": "AF refund if spend $150k/year; charge card",
    },
    "Capital One Spark Cash Select": {
        "signup_bonus": "750",
        "minimum_spend_amount": "$6,000",
        "spend_time_frame": "3",
        "annual_fee": "0",
        "application_link": "https://www.capitalone.com/small-business/credit-cards/spark-cash-select/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "5% hotels/rental cars via Capital One Business Travel",
        "special_feature_2": "1.5% unlimited; no annual fee",
    },
    "Capital One Venture X Business": {
        "signup_bonus": "150000",
        "signup_bonus_type": "miles",
        "estimated_bonus_value_usd": "1500",
        "minimum_spend_amount": "$30,000",
        "spend_time_frame": "3",
        "annual_fee": "395",
        "application_link": "https://www.capitalone.com/small-business/credit-cards/venture-x-business/",
        "ftf": "0%",
        "lounge": "Capital One Lounges + Priority Pass",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "$300 annual travel credit; 10k anniversary miles",
        "special_feature_2": "10× hotels/cars; 5× flights/vacation rentals via Business Travel",
    },
    "Capital One Spark Miles": {
        "signup_bonus": "50000",
        "minimum_spend_amount": "$4,500",
        "spend_time_frame": "3",
        "annual_fee": "0",
        "annual_fee_year_1": "0",
        "annual_fee_year_2_plus": "95",
        "application_link": "https://www.capitalone.com/small-business/credit-cards/spark-miles/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "Yes ($120/4yr)",
        "special_feature_1": "5× hotels/rental cars via Capital One Business Travel",
        "special_feature_2": "Hertz Five Star; Lifestyle Collection $50 credit",
    },
    # --- Bank of America ---
    "Bank of America Customized Cash": {
        "application_link": "https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "3% choice category; 2% grocery, wholesale",
        "special_feature_2": "Preferred Rewards boost up to 5.25%",
    },
    "Bank of America Unlimited Cash": {
        "application_link": "https://www.bankofamerica.com/credit-cards/products/unlimited-cash-back-credit-card/",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "1.5% unlimited",
        "special_feature_2": "Preferred Rewards up to 2.625%",
    },
    "BankAmericard Cash Rewards": {
        # User linked cash-back-credit-card twice; BoA has Customized vs Unlimited. BankAmericard Cash = older name
        "application_link": "https://www.bankofamerica.com/credit-cards/products/cash-back-credit-card/",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "3% choice; 2% grocery/wholesale",
        "special_feature_2": "Preferred Rewards boost",
    },
    "Bank of America Travel Rewards": {
        "application_link": "https://www.bankofamerica.com/credit-cards/products/travel-rewards-credit-card/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "1.5 pts/$; redeem for travel statement credit",
        "special_feature_2": "Preferred Rewards up to 2.625 pts",
    },
    "Bank of America Premium Rewards": {
        "application_link": "https://www.bankofamerica.com/credit-cards/products/premium-rewards-credit-card/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "2× travel, dining; $100 airline incidental credit",
        "special_feature_2": "Preferred Rewards boost; Global Entry credit",
    },
    "Bank of America Business Advantage Travel Rewards": {
        "signup_bonus": "30000",
        "signup_bonus_type": "points",
        "minimum_spend_amount": "$3,000",
        "spend_time_frame": "3",
        "application_link": "https://business.bankofamerica.com/en/credit-cards/business-advantage-travel-rewards?campaign=4076928~NJ~en_US",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "3× Travel Center; 1.5× all other",
        "special_feature_2": "Preferred Rewards for Business up to 5.25×",
    },
    "Bank of America Business Advantage Atmos Rewards": {
        # Atmos Visa Business - different product; user linked alaskaair Atmos biz
        "application_link": "https://www.alaskaair.com/atmosrewards/content/credit-cards/benefits/visa-small-business",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "70k pts + $99 Companion Fare; $4k spend in 90 days",
        "special_feature_2": "3× Alaska/Hawaiian; 2× gas, EV, shipping, transit",
    },
    "Bank of America Business Advantage Customized Cash Rewards": {
        "signup_bonus": "300",
        "signup_bonus_type": "dollars",
        "minimum_spend_amount": "$3,000",
        "spend_time_frame": "3",
        "application_link": "https://business.bankofamerica.com/en/credit-cards/business-advantage-customized-cash-rewards?campaign=4076847~NX~en_US",
        "ftf": "3%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "3% choice; 2% dining; 1% other (cap $50k/yr combined)",
        "special_feature_2": "Preferred Rewards for Business boost",
    },
    "Alaska Airlines Visa Signature": {
        "application_link": "https://www.bankofamerica.com/credit-cards/products/alaska-airlines-credit-card/",
        "ftf": "0%",
        "lounge": "",
        "ge_tsa_precheck": "",
        "special_feature_1": "Companion Fare; free checked bag",
        "special_feature_2": "3× Alaska; 20% inflight; Alaska Lounge+ discount",
    },
    "Atmos Rewards Summit Visa Infinite": {
        "application_link": "https://www.bankofamerica.com/credit-cards/products/alaska-airlines-infinite-credit-card/",
        "ftf": "0%",
        "lounge": "Alaska Lounge",
        "ge_tsa_precheck": "",
        "special_feature_1": "2 Global Companion Awards/yr; $395 AF",
        "special_feature_2": "3× Alaska, dining; Premier Collection hotels",
    },
}


def col_index(headers, name):
    try:
        return headers.index(name)
    except ValueError:
        return -1


def main():
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    # Ensure columns exist
    required = ["ftf", "lounge", "ge_tsa_precheck", "special_feature_1", "special_feature_2", "application_link"]
    for col in required:
        if col not in fieldnames:
            fieldnames.append(col)

    updated = 0
    for row in rows:
        name = row.get("card_name", "").strip()
        if not name:
            continue
        if name in UPDATES:
            for k, v in UPDATES[name].items():
                if k in row:
                    row[k] = str(v) if v is not None else ""
            updated += 1
        # Also apply links-only for any card in LINKS not in UPDATES
        elif name in LINKS:
            row["application_link"] = LINKS[name]
            updated += 1

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

    print(f"Updated {updated} cards.")


if __name__ == "__main__":
    main()
