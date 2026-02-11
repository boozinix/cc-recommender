/**
 * CLI entry: run all bank crawlers sequentially and write crawled/{bankId}.json
 * Run with: npm run crawl:all
 *
 * Add new banks by importing their fetch function and adding to CRAWLERS.
 */

import * as fs from "fs";
import * as path from "path";
import { fetchChaseCards } from "./banks/chaseCrawler";
import { fetchCitiCards } from "./banks/citiCrawler";
import { fetchCapitalOneCards } from "./banks/capitalOneCrawler";
import { logInfo } from "./core/logger";

type CrawlerEntry = { bankId: string; fetch: () => Promise<unknown[]> };

const CRAWLERS: CrawlerEntry[] = [
  { bankId: "chase", fetch: fetchChaseCards },
  { bankId: "citi", fetch: fetchCitiCards },
  { bankId: "capitalone", fetch: fetchCapitalOneCards },
];

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), "crawled");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  logInfo("Starting crawl:all");
  for (const { bankId, fetch } of CRAWLERS) {
    try {
      logInfo(`Running ${bankId} crawler`);
      const cards = await fetch();
      const outFile = path.join(outDir, `${bankId}.json`);
      fs.writeFileSync(outFile, JSON.stringify(cards, null, 2), "utf-8");
      logInfo(`Wrote ${bankId}`, { count: cards.length, path: outFile });
      await new Promise((r) => setTimeout(r, 1500)); // Rate limit between banks
    } catch (err) {
      logInfo("ERROR", { bankId, error: err instanceof Error ? err.message : String(err) });
    }
  }
  logInfo("Crawl finished");
}

main().catch((err) => {
  console.error("[crawl] Fatal:", err);
  process.exit(1);
});
