# Card data verification crawler – execution plan

## Goal
Automate checking that `public/cards.csv` matches what each bank shows on their website. When offers, fees, or spend requirements change, we detect mismatches instead of relying on manual updates.

## Scope

### What we verify (priority)
| Field | Notes |
|-------|------|
| `annual_fee` / `annual_fee_year_1` / `annual_fee_year_2_plus` | Often in “pricing” or “rates & fees” |
| `signup_bonus` + `signup_bonus_type` | Welcome offer text (points, miles, dollars) |
| `minimum_spend_amount` + `spend_time_frame` | e.g. “$500 in 3 months” |
| `intro_apr_purchase` | 0% APR duration if any |
| `foreign_tx_fee` | Yes/No or % (maps to `ftf`) |
| `application_link` | URL still returns 200 and is the right product |

### What we do not crawl (or do later)
- Long-form copy: `best_for`, `why_this_card_exiss`, `pros`, `cons`
- Display rates: `cashback_rate_display`, `cashback_rate_effective` (derived; can recompute from rules)
- Perk bullets: `lounge`, `ge_tsa_precheck`, `special_feature_1/2` (optional phase 2)

---

## Banks and card counts (from cards.csv)

| # | Issuer | Cards | Base domain / notes |
|---|--------|-------|----------------------|
| 1 | Chase | 24 | creditcards.chase.com |
| 2 | Citi | 14 | citi.com, creditcards.aa.com (AA cards) |
| 3 | Capital One | 10 | capitalone.com |
| 4 | Bank of America | 10 | bankofamerica.com, business.bankofamerica.com, alaskaair.com (Atmos) |
| 5 | U.S. Bank | 12 | usbank.com |
| 6 | Amex | 19 | americanexpress.com |
| 7 | Barclays | 6 | cards.barclaycardus.com |
| 8 | Wells Fargo | 7 | creditcards.wellsfargo.com |

**Total: 102 cards across 8 issuers.**

---

## Architecture

### Option A (recommended): One framework, per-bank adapters
- **Single entrypoint:** e.g. `scripts/verify_cards.py` (or `run_verification.py`).
- **Shared:** CSV read/write, report format (JSON + human-readable summary), rate limiting, retries.
- **Per bank:** One module (e.g. `crawlers/chase.py`, `crawlers/amex.py`) that:
  - Takes a card row (and its `application_link`).
  - Fetches the page (or known product URL).
  - Parses HTML (or embedded JSON) and returns a **normalized dict** of the fields we verify.
- **Comparison:** For each card, compare CSV row vs crawled result; output match / mismatch / could_not_fetch / could_not_parse.

### Option B: Fully separate script per bank
- One script per issuer (e.g. `verify_chase.py`, `verify_citi.py`). Simpler to run one bank at a time, but more duplication and no shared report format unless we add it later.

**Recommendation:** Option A so we have one report format and one way to run “all banks” or “one bank.”

---

## Tech choices

- **Language:** Python 3 (matches existing `scripts/`).
- **HTTP:** `requests` + optional `requests-cache` for dev (avoid hammering sites).
- **Parsing:** Prefer **HTML + regex or BeautifulSoup** first. If a site loads offers via JS only, we can add **Playwright** later for that bank.
- **Rate limiting:** 1–2 requests per second per domain; random short delay between cards.
- **Identification:** Match CSV row to page by `application_link` (we already have it). No need to “discover” card URLs; we crawl the URL we have.

---

## Per-bank execution order (check in after each)

We go **one bank at a time**. For each bank we will:

1. Implement the crawler/adapter (fetch + parse).
2. Run it against that bank’s cards in the CSV.
3. Produce a small report: matches, mismatches, errors.
4. Check in with you before moving to the next bank.

Suggested order (by card count and likely complexity):

| Step | Bank | Cards | Rationale |
|------|------|-------|-----------|
| 1 | **Chase** | 24 | Most cards; if we get Chase right, pattern is set for others |
| 2 | **Citi** | 14 | Mix of citi.com + AA; good test of multi-domain |
| 3 | **Capital One** | 10 | Already have manual verification script; can compare |
| 4 | **Bank of America** | 10 | BoA + Alaska/Atmos; similar to Citi |
| 5 | **Amex** | 19 | Often JS-heavy; may need Playwright |
| 6 | **U.S. Bank** | 12 | Mid-size, single domain |
| 7 | **Barclays** | 6 | Fewer cards, quick win |
| 8 | **Wells Fargo** | 7 | Last |

After you approve this order, we start with **Chase** and then check in.

---

## Output format (shared across banks)

- **Console:** Summary per bank/card: `OK`, `MISMATCH`, `FETCH_ERROR`, `PARSE_ERROR`.
- **File:** `scripts/verification_report_YYYYMMDD.json` (or similar) with:
  - Per card: `card_name`, `issuer`, `status`, `csv_values`, `crawled_values`, `url`, `error` (if any).
- Optional: `scripts/verification_report_YYYYMMDD.txt` – same info in readable form for quick review.

---

## Risks and mitigations

| Risk | Mitigation |
|------|-------------|
| Blocking / rate limits | Throttle requests; cache responses during dev; optional User-Agent rotation |
| JavaScript-only content | Start with HTML; add Playwright only for banks that need it |
| Page structure changes | Parsers may break; report “PARSE_ERROR” and log raw snippet for debugging |
| ToS | Crawl only public product pages; no auth; respectful rate limits |
| Co-brand URLs (AA, Alaska, etc.) | Treat as same as issuer: one “Citi” adapter can have sub-logic for AA URLs |

---

## Deliverables (after all banks)

1. **`scripts/verify_cards.py`** – Entrypoint: `--issuer Chase` or `--all`, reads CSV, runs the right crawler(s), writes report.
2. **`scripts/crawlers/`** – One module per bank (e.g. `chase.py`, `citi.py`, …) with a common interface.
3. **Report** – JSON + optional .txt summary per run.
4. **README or section in this doc** – How to run, how to add a new bank, how to interpret the report.

---

## Next step

Confirm:
1. This plan (scope, architecture, order).
2. Start with **Chase** (design the adapter + report format on Chase’s 24 cards).

Then we implement Chase only and check in with you before Citi.
