#!/usr/bin/env python3
"""Update Citi card application links per verified URLs."""

import csv

INPUT = "public/cards.csv"

# Card name -> new application_link
UPDATES = {
    "Citi AAdvantage Platinum Select World Elite Mastercard": "https://creditcards.aa.com/credit-cards/citi-platinum-card-american-airlines-direct/",
    "Citi AAdvantage Globe Mastercard": "https://creditcards.aa.com/credit-cards/citi-globe-card-american-airlines-direct/",
    "Citi AAdvantage Executive World Elite Mastercard": "https://creditcards.aa.com/credit-cards/citi-executive-card-american-airlines-direct/",
    "Citi AAdvantage MileUp Card": "https://creditcards.aa.com/credit-cards/citi-mileup-card-american-airlines-direct/",
    "Citi AAdvantage Business World Elite Mastercard": "https://creditcards.aa.com/credit-cards/citi-business-card-american-airlines-direct/",
    "Costco Anywhere Visa Business Card by Citi": "https://www.citi.com/credit-cards/citi-costco-anywhere-visa-business-credit-card",
}

if __name__ == "__main__":
    with open(INPUT, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        fieldnames = reader.fieldnames

    updated = 0
    for row in rows:
        name = row.get("card_name", "").strip()
        if name in UPDATES:
            row["application_link"] = UPDATES[name]
            updated += 1

    with open(INPUT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    print(f"Updated {updated} Citi card application links:")
    for name in UPDATES:
        print(f"  • {name}")
