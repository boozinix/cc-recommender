#!/usr/bin/env python3
"""Quick validation of card offers in cards.csv. No API calls; runs in seconds."""
import csv
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "..", "public", "cards.csv")

def parse_amount(s):
    if not s or not str(s).strip():
        return 0
    s = str(s).strip().replace("$", "").replace(",", "").strip()
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return 0

def parse_bonus_value(s):
    if not s or not str(s).strip():
        return 0
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0

def parse_ratio(s):
    if not s or not str(s).strip():
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None

def main():
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        rows = list(csv.reader(f))
    if not rows or len(rows) < 2:
        print("CSV empty or no data rows.")
        return
    header = rows[0]
    idx_name = header.index("card_name")
    idx_est_val = header.index("estimated_bonus_value_usd")
    idx_min_spend = header.index("minimum_spend_amount")
    idx_ratio = header.index("bonus_to_spend_ratio")

    ratio_mismatches = []
    high_ratio = []
    same_min_spend = {}

    for row in rows[1:]:
        if len(row) <= max(idx_ratio, idx_min_spend, idx_est_val):
            continue
        name = (row[idx_name] or "").strip()
        min_spend = parse_amount(row[idx_min_spend])
        est_val = parse_bonus_value(row[idx_est_val])
        csv_ratio = parse_ratio(row[idx_ratio])
        if min_spend > 0:
            same_min_spend.setdefault(min_spend, []).append(name)
        if min_spend <= 0:
            if csv_ratio is not None and csv_ratio != 0:
                ratio_mismatches.append((name, "min_spend=0 but ratio set"))
            continue
        expected_ratio = est_val / min_spend
        if csv_ratio is not None:
            if abs(csv_ratio - expected_ratio) > 0.0001:
                ratio_mismatches.append((name, "CSV %.4f vs expected %.4f" % (csv_ratio, expected_ratio)))
            elif csv_ratio > 0.5:
                high_ratio.append((name, csv_ratio, min_spend, est_val))

    print("=" * 60)
    print("CARD OFFER VALIDATION")
    print("=" * 60)
    if ratio_mismatches:
        print("\nRATIO MISMATCHES:")
        for name, msg in ratio_mismatches:
            print("  * %s: %s" % (name, msg))
    else:
        print("\nNo ratio mismatches.")
    if high_ratio:
        print("\nHIGH RATIO (>0.5):")
        for name, r, spend, val in high_ratio:
            print("  * %s: ratio %.2f ($%s / $%s)" % (name, r, val, spend))
    repeated = [(k, v) for k, v in same_min_spend.items() if len(v) > 4]
    if repeated:
        print("\nSAME MIN SPEND ON 5+ CARDS:")
        for amount, cards in sorted(repeated, key=lambda x: -len(x[1])):
            print("  * $%s on %d cards" % (amount, len(cards)))
    print("\nTotal rows: %d" % (len(rows) - 1))
    print("=" * 60)

if __name__ == "__main__":
    main()
