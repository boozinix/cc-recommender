/**
 * CLI entry: run Capital One crawler and write crawled/capitalone.json
 * Run with: npm run crawl:capitalone
 */

import * as fs from "fs";
import * as path from "path";
import { fetchCapitalOneCards } from "./banks/capitalOneCrawler";
import { logInfo } from "./core/logger";

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), "crawled");
  const outFile = path.join(outDir, "capitalone.json");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  logInfo("Starting Capital One crawler");
  const cards = await fetchCapitalOneCards();
  logInfo("Crawl finished", { count: cards.length });
  fs.writeFileSync(outFile, JSON.stringify(cards, null, 2), "utf-8");
  logInfo("Wrote output", { path: outFile });
}

main().catch((err) => {
  console.error("[crawl] Fatal:", err);
  process.exit(1);
});
