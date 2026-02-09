#!/usr/bin/env python3
"""Add bonus_to_spend_ratio column after minimum_spend_amount in cards.csv.
Ratio = estimated_bonus_value_usd / minimum_spend_amount (when min spend > 0).
"""
import csv
import re

CSV_PATH = "public/cards.csv"

def parse_amount(s):
    """Parse amount string like '$5,000' or '$500' or '500' to int. Returns 0 if invalid/empty."""
    if not s or not str(s).strip():
        return 0
    s = str(s).strip().replace("$", "").replace(",", "").strip()
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return 0

def parse_bonus_value(s):
    """Parse estimated_bonus_value_usd to float. Returns 0 if invalid/empty."""
    if not s or not str(s).strip():
        return 0
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0

def main():
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        rows = list(reader)

    if not rows:
        print("CSV is empty")
        return

    header = rows[0]
    try:
        idx_bonus = header.index("estimated_bonus_value_usd")
        idx_min_spend = header.index("minimum_spend_amount")
    except ValueError as e:
        print("Column not found:", e)
        return

    # Insert new column name after minimum_spend_amount
    new_col_name = "bonus_to_spend_ratio"
    new_header = header[: idx_min_spend + 1] + [new_col_name] + header[idx_min_spend + 1 :]

    new_rows = [new_header]

    for row in rows[1:]:
        if len(row) <= max(idx_bonus, idx_min_spend):
            # Row too short; append empty ratio and pad if needed
            ratio_cell = ""
            new_row = row[: idx_min_spend + 1] + [ratio_cell] + row[idx_min_spend + 1 :]
        else:
            bonus_val = parse_bonus_value(row[idx_bonus])
            min_spend = parse_amount(row[idx_min_spend])

            if min_spend and min_spend > 0:
                ratio = bonus_val / min_spend
                ratio_cell = f"{ratio:.4f}"
            else:
                ratio_cell = ""

            new_row = row[: idx_min_spend + 1] + [ratio_cell] + row[idx_min_spend + 1 :]

        new_rows.append(new_row)

    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerows(new_rows)

    print(f"Added column '{new_col_name}' after minimum_spend_amount. Processed {len(new_rows)-1} data rows.")

if __name__ == "__main__":
    main()
