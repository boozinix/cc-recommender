#!/usr/bin/env python3
"""Remove bank_rules from cards.csv, add ftf, lounge, ge_tsa_precheck, special_feature_1, special_feature_2."""
import csv

INPUT = "public/cards.csv"
NEW_COLS = ["ftf", "lounge", "ge_tsa_precheck", "special_feature_1", "special_feature_2"]

with open(INPUT, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = list(reader.fieldnames)

# Remove bank_rules
if "bank_rules" in fieldnames:
    fieldnames.remove("bank_rules")

# Add new cols after application_link
try:
    idx = fieldnames.index("application_link") + 1
except ValueError:
    idx = len(fieldnames)
for c in reversed(NEW_COLS):
    fieldnames.insert(idx, c)

with open(INPUT, "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
    w.writeheader()
    for row in rows:
        new_row = {k: row.get(k, "") for k in fieldnames}
        for k in NEW_COLS:
            new_row[k] = ""
        w.writerow(new_row)

print(f"Updated {len(rows)} rows. Removed bank_rules, added: {', '.join(NEW_COLS)}")
