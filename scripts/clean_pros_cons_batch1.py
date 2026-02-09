#!/usr/bin/env python3
"""
Batch 1: Clean pros and cons for Chase cards (rows 2-25).
Style: Neat bullets, proper capitalization, emojis (✓ 💰 🌍 ✈️ ⚠️ 📉).
"""

import csv

INPUT = "public/cards.csv"

# Card name -> (pros, cons) - cleaned format
UPDATES = {
    "Chase Freedom Unlimited": (
        "• 5% rotating categories (quarterly) ✓ • 1.5% base rate ✓ • Pairs with Sapphire ✓",
        "• Foreign transaction fee 🌍 • Quarterly activation required • Bonus caps",
    ),
    "Chase Freedom Flex": (
        "• 5% quarterly rotating categories ✓ • 3% drugstores, dining ✓ • No annual fee ✓",
        "• Quarterly activation required • $1,500/qtr cap • Foreign transaction fee 🌍",
    ),
    "Chase Amazon Prime Visa": (
        "• 5% Amazon and Whole Foods ✓ • 2% restaurants, gas, drugstores ✓ • No annual fee ✓",
        "• Requires Prime membership ⚠️ • Foreign transaction fee 🌍 • Value drops without Prime",
    ),
    "Chase Freedom Rise": (
        "• No annual fee ✓ • Fair-credit approval ✓ • 1.5% earning ✓",
        "• Low 1.5% rate • Foreign transaction fee 🌍 • No intro APR",
    ),
    "Chase Sapphire Preferred": (
        "• 60k+ welcome bonus ✓ • Transferable to 14+ partners ✓ • 3× dining, 2× travel ✓",
        "• $95 annual fee 💰 • Less lounge access than Reserve • Portal favors Chase",
    ),
    "Chase Sapphire Reserve": (
        "• $300 travel credit ✓ • Priority Pass lounges ✓ • 1.5× portal boost ✓",
        "• $795 annual fee 💰 • Needs heavy travel to justify • Credits need optimization",
    ),
    "Chase Ink Cash": (
        "• 5% office, internet, cable, phone ✓ • 2% gas, dining ✓ • No annual fee ✓",
        "• 5% capped at $25k/yr • Foreign transaction fee 🌍 • Weak outside categories",
    ),
    "Chase Ink Unlimited": (
        "• 1.5% on all purchases ✓ • No annual fee ✓ • Doesn't count toward 5/24 ✓",
        "• No category bonuses • Foreign transaction fee 🌍 • Lower earning ceiling",
    ),
    "United Gateway Card": (
        "• No annual fee ✓ • 2× United ✓ • Bonus miles on anniversary ✓",
        "• No free checked bag ✈️ • Smaller welcome bonus • Limited perks",
    ),
    "United Club Infinite Card": (
        "• United Club included (~$650 value) ✓ • 4× United ✓ • Free checked bags ✓",
        "• $695 annual fee 💰 • Needs frequent United travel • Niche outside United hubs",
    ),
    "Southwest Rapid Rewards Priority": (
        "• $75 Southwest credit ✓ • 7,500 anniversary pts ✓ • 4× Southwest ✓ • No foreign transaction fee ✓",
        "• $149 annual fee 💰 • Needs regular Southwest use • Credits expire annually",
    ),
    "Southwest Rapid Rewards Premier": (
        "• 6,000 anniversary pts ✓ • 3× Southwest ✓ • Companion Pass qualification ✓",
        "• $149 annual fee 💰 • Fewer perks than Priority • Best with Companion Pass goal",
    ),
    "Marriott Bonvoy Bountiful": (
        "• 6× Marriott ✓ • 4× dining, 2× travel ✓ • Free night (50k pts) ✓",
        "• $250 annual fee 💰 • Free night caps at 50k • Marriott-only value",
    ),
    "IHG One Rewards Premier": (
        "• 10× IHG ✓ • Free night (40k pts) ✓ • Platinum Elite status ✓",
        "• $99 annual fee 💰 • Free night ≤40k only • IHG loyalty needed",
    ),
    "IHG One Rewards Traveler": (
        "• No annual fee ✓ • 5× IHG ✓ • 3× gas, dining ✓",
        "• No free night • No elite status • Lower value than Premier",
    ),
    "Chase Sapphire Reserve for Business": (
        "• $300 travel credit ✓ • Priority Pass ✓ • Doesn't count toward 5/24 ✓",
        "• $795 annual fee 💰 • Needs high travel spend • Overlaps personal Reserve",
    ),
    "Ink Business Preferred Credit Card": (
        "• 100k+ welcome bonus ✓ • 3× travel, shipping, internet, ads ✓ • Transferable UR ✓ • Doesn't count 5/24 ✓",
        "• $95 annual fee 💰 • 3× capped at $150k/yr • Tied to Chase UR partners",
    ),
    "Ink Business Premier Credit Card": (
        "• 2.5% on ≥$5k purchases ✓ • 2% elsewhere ✓ • $1,000 welcome bonus ✓",
        "• $195 annual fee 💰 • Cash only, no transfers • Needs high spend to justify",
    ),
    "United Business Card": (
        "• First year free ✓ • 100k+ welcome bonus ✓ • Free checked bag ✓ • Doesn't count 5/24 ✓",
        "• $150 after year one 💰 • Best with regular United travel • Fewer perks than Club",
    ),
    "United Club Business Card": (
        "• United Club included ✓ • 4× United ✓ • Free bags ✓ • Doesn't count 5/24 ✓",
        "• $695 annual fee 💰 • Needs very frequent United travel • Niche outside United hubs",
    ),
    "Southwest Rapid Rewards Performance Business": (
        "• 120k welcome bonus ✓ • 9,000 anniversary pts ✓ • Wi-Fi, upgraded boarding ✓",
        "• $299 annual fee 💰 • Credits need active use • Tied to Southwest",
    ),
    "Southwest Rapid Rewards Premier Business": (
        "• 6,000 anniversary pts ✓ • 3× Southwest ✓ • Companion Pass qualification ✓",
        "• $149 annual fee 💰 • Fewer perks than Performance • Best with Companion Pass",
    ),
    "IHG One Rewards Premier Business": (
        "• 10× IHG ✓ • Free night (40k pts) ✓ • Platinum Elite status ✓",
        "• $99 annual fee 💰 • Free night caps at 40k • IHG loyalty needed",
    ),
    "World of Hyatt Business Credit Card": (
        "• 5 elite nights per $10k spend ✓ • 4× Hyatt ✓ • Doesn't count toward 5/24 ✓",
        "• $199 annual fee 💰 • Hyatt footprint only • Elite caps",
    ),
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
            pros, cons = UPDATES[name]
            row["pros"] = pros
            row["cons"] = cons
            updated += 1

    with open(INPUT, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)

    print(f"Batch 1: Updated {updated} Chase cards.")
    for name in UPDATES:
        print(f"  • {name}")
