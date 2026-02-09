# CSV Verification Report

Verified card data against bank/issuer websites (Feb 2025). Focus: signup bonus (points/miles/cash), annual fee, minimum spend, spend timeframe, cashback rate, intro APR.

## Verified — Correct ✓

| Card | Signup | Min Spend | Timeframe | Annual Fee | Intro APR | Notes |
|------|--------|-----------|-----------|------------|-----------|-------|
| Chase Freedom Unlimited | $200 | $500 | 3 mo | $0 | 0% 15 mo | 5/3/1.5% cashback ✓ |
| Chase Freedom Flex | $200 | $500 | 3 mo | $0 | 0% 15 mo | 5% quarterly, 3% dining/drugstores ✓ |
| Chase Sapphire Preferred | 75,000 pts | $5,000 | 3 mo | $95 | — | ✓ |
| Chase Sapphire Reserve | 125,000 pts | $6,000 | 3 mo | $795 | — | ✓ (revamped offer) |
| Capital One Quicksilver | $200 | $500 | 3 mo | $0 | 0% 15 mo | 1.5% cashback ✓ |
| Capital One Venture | 75,000 miles | $4,000 | 3 mo | $95 | — | ✓ |

## Could Not Verify (page issues)

- **Citi Double Cash** — Citi page returned placeholder values ($Cash Back, $, months)
- **Amex Blue Cash Everyday** — Page returned minimal content (privacy/terms only)
- **Bank of America cards** — Fetch returned 404 / content not found
- **Barclays, U.S. Bank, Wells Fargo** — Not yet fetched

## Chase Sapphire Reserve for Business

Personal Sapphire Reserve was revamped (125k, $6k, $795). Business version may have different terms. Current CSV: 60k pts, $4k, 3 mo, $550. **Recommend manual check** at Chase business site.

## Airline cards (Frontier / Spirit)

- **Frontier:** Present in `cards.csv` — Barclays Frontier Airlines World Mastercard.
- **Spirit:** Not in `cards.csv` yet. The refinement question "Which airline do you usually fly?" includes Spirit as an option; when you add Spirit-branded card(s) to the CSV, they will be ranked when the user selects Spirit.

## Next Steps

1. Re-verify Citi, Amex, BoA when pages load correctly
2. Verify Chase Sapphire Reserve for Business terms
3. Verify remaining cards (U.S. Bank, Barclays, Wells Fargo) in batches
4. Consider periodic re-verification (offers change frequently)
