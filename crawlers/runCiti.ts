/**
 * CLI entry: run Citi crawler and write crawled/citi.json
 * Run with: npm run crawl:citi
 */

import * as fs from "fs";
import * as path from "path";
import { fetchCitiCards } from "./banks/citiCrawler";
import { logInfo } from "./core/logger";

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), "crawled");
  const outFile = path.join(outDir, "citi.json");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  logInfo("Starting Citi crawler");
  const cards = await fetchCitiCards();
  logInfo("Crawl finished", { count: cards.length });
  fs.writeFileSync(outFile, JSON.stringify(cards, null, 2), "utf-8");
  logInfo("Wrote output", { path: outFile });
}

main().catch((err) => {
  console.error("[crawl] Fatal:", err);
  process.exit(1);
});
