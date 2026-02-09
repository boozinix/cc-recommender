#!/usr/bin/env python3
"""
Chase card data verification crawler.
Compares CSV fields to what we can extract from each card's application_link page.
Output: chase_diff_report.csv in scripts/
"""
import os
import re
import time
import csv

import requests
from bs4 import BeautifulSoup

# Paths relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(SCRIPT_DIR, "..", "public", "cards.csv")
REPORT_PATH = os.path.join(SCRIPT_DIR, "chase_diff_report.csv")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

FIELDS = [
    "annual_fee",
    "signup_bonus",
    "minimum_spend_amount",
    "spend_time_frame",
    "intro_apr_purchase",
    "foreign_tx_fee",
]


def clean(text):
    return re.sub(r"\s+", " ", (text or "").strip())


def fetch_page(url):
    r = requests.get(url, headers=HEADERS, timeout=15)
    r.raise_for_status()
    # Use built-in parser so we don't require lxml
    return BeautifulSoup(r.text, "html.parser")


def extract_text(soup):
    return clean(soup.get_text(" "))


def extract_annual_fee(text):
    match = re.search(r"annual fee[^$]*\$?\d+", text, re.I)
    return match.group(0) if match else None


def extract_welcome_bonus(text):
    match = re.search(r"(earn|get|receive)[^.]{10,120}", text, re.I)
    return match.group(0) if match else None


def extract_spend_requirement(text):
    amt = re.search(r"\$\d{1,3}(?:,\d{3})+|\$\d+", text)
    timef = re.search(r"(first|within)\s+\d+\s+(months|days)", text, re.I)
    return (
        amt.group(0) if amt else None,
        timef.group(0) if timef else None,
    )


def extract_intro_apr(text):
    match = re.search(r"0%\s+intro[^.]{5,80}", text, re.I)
    return match.group(0) if match else None


def extract_ftf(text):
    match = re.search(r"foreign transaction fee[^.]{0,40}", text, re.I)
    return match.group(0) if match else None


def compare(csv_val, site_val):
    if not site_val:
        return "MISSING"
    if csv_val is None or str(csv_val).strip() == "":
        return "MISSING"
    csv_str = str(csv_val).strip()
    return "MATCH" if csv_str.lower() in site_val.lower() else "MISMATCH"


def run():
    if not os.path.isfile(CSV_PATH):
        print(f"CSV not found: {CSV_PATH}")
        return

    rows = []
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        all_rows = list(reader)

    chase = [r for r in all_rows if (r.get("issuer") or "").strip().lower() == "chase"]

    for row in chase:
        card = (row.get("card_name") or "").strip()
        url = (row.get("application_link") or "").strip()

        if not url:
            for field in FIELDS:
                rows.append({
                    "card_name": card,
                    "field": field,
                    "csv_value": str(row.get(field, "")),
                    "website_value": "",
                    "status": "NO_URL",
                    "source_url": "",
                })
            continue

        print(f"Checking {card} ...")

        try:
            soup = fetch_page(url)
            text = extract_text(soup)

            annual_fee = extract_annual_fee(text)
            welcome_bonus = extract_welcome_bonus(text)
            spend_amt, spend_time = extract_spend_requirement(text)
            intro_apr = extract_intro_apr(text)
            ftf = extract_ftf(text)

            extracted = {
                "annual_fee": annual_fee,
                "signup_bonus": welcome_bonus,
                "minimum_spend_amount": spend_amt,
                "spend_time_frame": spend_time,
                "intro_apr_purchase": intro_apr,
                "foreign_tx_fee": ftf,
            }

            for field in FIELDS:
                csv_val = row.get(field, "")
                site_val = extracted.get(field)
                rows.append({
                    "card_name": card,
                    "field": field,
                    "csv_value": str(csv_val),
                    "website_value": site_val or "",
                    "status": compare(csv_val, site_val),
                    "source_url": url,
                })

            time.sleep(2)  # polite crawling

        except Exception as e:
            for field in FIELDS:
                rows.append({
                    "card_name": card,
                    "field": field,
                    "csv_value": str(row.get(field, "")),
                    "website_value": str(e),
                    "status": "ERROR",
                    "source_url": url,
                })

    with open(REPORT_PATH, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["card_name", "field", "csv_value", "website_value", "status", "source_url"])
        w.writeheader()
        w.writerows(rows)

    print(f"Done. Output: {REPORT_PATH}")


if __name__ == "__main__":
    run()
