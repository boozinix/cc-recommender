# Card crawlers

Crawl bank credit card pages and save signup bonus, spend requirement, and annual fee into JSON for the recommender.

## Commands

| Command | Description |
|---------|-------------|
| `npm run crawl:chase` | Run Chase crawler only |
| `npm run crawl:chase:compare` | Compare crawler output to `public/cards.csv` |
| `npm run crawl:citi` | Run Citi crawler only |
| `npm run crawl:citi:compare` | Compare crawler output to `public/cards.csv` |
| `npm run crawl:all` | Run all bank crawlers sequentially |
| `npm run crawl:view` | View crawled data (all banks or `npx tsx scripts/view-crawled.ts chase`) |

Output: `crawled/{bankId}.json` (array of `CardCrawlerResult` objects).

## Layout

- **core/** – Shared types, HTTP client, HTML parsing, logging, text parsers (bonus/spend/fee).
- **banks/** – One crawler per bank (e.g. `chaseCrawler.ts`).
- **runChase.ts**, **runAll.ts** – CLI entries.

## Adding another bank

1. Create `banks/fooCrawler.ts` with a `fetchFooCards()` that returns `CardCrawlerResult[]`.
   - Import `fetchHtml`, `loadHtml`, `parseSignupBonus`, `parseSpendRequirement`, `parseAnnualFee` from `../core/*`.
   - Maintain a list of card URLs or a listing URL to discover cards.
   - For each URL: fetch HTML → extract text with selectors → parse with shared helpers → push to results array.
   - Use per-card try/catch so one bad page does not stop the crawl.

2. Add `runFoo.ts` that calls `fetchFooCards()` and writes `crawled/foo.json`.

3. In `package.json`, add `"crawl:foo": "tsx crawlers/runFoo.ts"`.

4. In `runAll.ts`, add to `CRAWLERS`:
   ```ts
   { bankId: "foo", fetch: fetchFooCards },
   ```

5. In `app/lib/crawledDataLoader.ts`, add `foo: "Foo Bank"` to `BANK_TO_ISSUER` if the issuer name differs from the bank id.

## Integration with the app

The loader in `app/lib/crawledDataLoader.ts` can:

- `loadCrawledCards()` / `loadCrawledCardsByBank(bankId)` – load JSON from `crawled/`
- `mapCrawlerResultToCard(crawled)` – convert to `Card` shape for `resultsScoring`
- `mergeCrawledIntoCards(cards)` – merge crawled data into existing Cards (e.g. from CSV) by matching card name

Use from server-side only (API routes, scripts) – it uses Node `fs`.

## Link checking and web search

The crawler checks each application link before fetching. If a link returns 404, times out, or fails:

1. **Link status** is recorded as `broken` or `timeout` in the output.
2. **Web search** (optional): If `SERP_API_KEY` is set in your environment, the crawler searches for a correct link and tries it. Get a free key at [serpapi.com](https://serpapi.com).
3. **Suggested search URL**: When no API key, a Google search URL is included so you can manually find the correct link.
4. The **comparison report** lists broken links first, with suggested alternatives.

Example: `SERP_API_KEY=your_key npm run crawl:chase`

## Revert

- Remove deps: `npm uninstall axios cheerio @types/cheerio`
- Delete `crawlers/`, `crawled/`, the crawl scripts from `package.json`, and `app/lib/crawledDataLoader.ts`.
