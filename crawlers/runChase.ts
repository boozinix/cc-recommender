/**
 * CLI entry: run Chase crawler and write crawled/chase.json
 * Run with: npm run crawl:chase  (or npx tsx crawlers/runChase.ts)
 */

import * as fs from "fs";
import * as path from "path";
import { fetchChaseCards } from "./banks/chaseCrawler";
import { logInfo } from "./core/logger";

async function main(): Promise<void> {
  const outDir = path.join(process.cwd(), "crawled");
  const outFile = path.join(outDir, "chase.json");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  logInfo("Starting Chase crawler");
  const cards = await fetchChaseCards();
  logInfo("Crawl finished", { count: cards.length });
  fs.writeFileSync(outFile, JSON.stringify(cards, null, 2), "utf-8");
  logInfo("Wrote output", { path: outFile });
}

main().catch((err) => {
  console.error("[crawl] Fatal:", err);
  process.exit(1);
});
