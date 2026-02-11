/**
 * Compare Capital One crawler output (crawled/capitalone.json) to Capital One cards in public/cards.csv.
 * Run after crawl:capitalone.
 * Outputs: correct link (if original broken), fee year 1 vs year 2, bonus amount/type, spend $ and timeframe.
 *
 * Usage: npm run crawl:capitalone:compare  or  npx tsx crawlers/compareCapitalOneToCsv.ts
 */

import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import type { CardCrawlerResult } from "./core/types";

interface CsvCapitalOneCard {
  card_name: string;
  issuer: string;
  application_link: string;
  annual_fee: string;
  annual_fee_year_1: string;
  annual_fee_year_2_plus: string;
  minimum_spend_amount: string;
  spend_time_frame: string;
  signup_bonus: string;
  signup_bonus_type: string;
  estimated_bonus_value_usd: string;
}

function normalizeName(name: string): string {
  return name
    .replace(/\s*®\s*/gi, " ")
    .replace(/\s*Credit Card\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseCsvNumber(val: string | undefined): number {
  if (val == null || val.trim() === "") return 0;
  const n = parseInt(val.replace(/[$,]/g, "").trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

function loadCsvCapitalOneCards(): CsvCapitalOneCard[] {
  const csvPath = path.join(process.cwd(), "public", "cards.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  return parsed.data
    .filter((row) => (row.issuer || "").trim().toLowerCase() === "capital one")
    .map((row) => ({
      card_name: row.card_name ?? "",
      issuer: row.issuer ?? "",
      application_link: row.application_link ?? "",
      annual_fee: row.annual_fee ?? "",
      annual_fee_year_1: row.annual_fee_year_1 ?? "",
      annual_fee_year_2_plus: row.annual_fee_year_2_plus ?? "",
      minimum_spend_amount: row.minimum_spend_amount ?? "",
      spend_time_frame: row.spend_time_frame ?? "",
      signup_bonus: row.signup_bonus ?? "",
      signup_bonus_type: row.signup_bonus_type ?? "",
      estimated_bonus_value_usd: row.estimated_bonus_value_usd ?? "",
    }));
}

function loadCrawledCapitalOne(): CardCrawlerResult[] {
  const jsonPath = path.join(process.cwd(), "crawled", "capitalone.json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error("crawled/capitalone.json not found. Run npm run crawl:capitalone first.");
  }
  const raw = fs.readFileSync(jsonPath, "utf-8");
  return JSON.parse(raw) as CardCrawlerResult[];
}

function findBestCrawlerMatch(
  csvCard: CsvCapitalOneCard,
  crawled: CardCrawlerResult[]
): CardCrawlerResult | undefined {
  const csvNorm = normalizeName(csvCard.card_name);
  const candidates = crawled.filter((c) => {
    const cNorm = normalizeName(c.cardName);
    return cNorm === csvNorm || cNorm.includes(csvNorm) || csvNorm.includes(cNorm);
  });
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];
  const exact = candidates.find((c) => normalizeName(c.cardName) === csvNorm);
  return exact ?? candidates[0];
}

type DiffKind = "annual_fee" | "fee_year1" | "fee_year2" | "bonus" | "min_spend" | "spend_timeframe";
type MatchType = "same" | "different" | "csv_only" | "crawler_only";

interface ComparisonRow {
  csvCard: CsvCapitalOneCard | null;
  crawled?: CardCrawlerResult;
  match: MatchType;
  diffs?: { kind: DiffKind; csv: string; crawled: string }[];
}

function compare(csvCards: CsvCapitalOneCard[], crawled: CardCrawlerResult[]): ComparisonRow[] {
  const rows: ComparisonRow[] = [];
  const usedCrawled = new Set<number>();

  for (const csvCard of csvCards) {
    if (!csvCard.card_name?.trim()) continue;
    const crawlerMatch = findBestCrawlerMatch(csvCard, crawled);
    const crawlerIndex = crawlerMatch ? crawled.indexOf(crawlerMatch) : -1;
    if (crawlerIndex >= 0) usedCrawled.add(crawlerIndex);

    if (!crawlerMatch) {
      rows.push({ csvCard, match: "csv_only" });
      continue;
    }

    const csvFee = parseCsvNumber(csvCard.annual_fee);
    const csvFeeY1 = parseCsvNumber(csvCard.annual_fee_year_1);
    const csvFeeY2 = parseCsvNumber(csvCard.annual_fee_year_2_plus);
    const crawlFee = crawlerMatch.annualFee ?? 0;
    const crawlFeeY1 = crawlerMatch.annualFeeYear1 ?? crawlFee;
    const crawlFeeY2 = crawlerMatch.annualFeeYear2Plus ?? crawlFee;

    const csvBonus = parseCsvNumber(csvCard.signup_bonus);
    const csvBonusUsd = parseCsvNumber(csvCard.estimated_bonus_value_usd);
    const crawlBonusAmt = crawlerMatch.signupBonusAmount ?? 0;
    const crawlBonusUsd = crawlerMatch.estimatedBonusValueUsd;
    const csvSpend = parseCsvNumber(csvCard.minimum_spend_amount);
    const crawlSpend = crawlerMatch.minimumSpendAmount ?? 0;
    const csvMonths = parseCsvNumber(csvCard.spend_time_frame);
    const crawlDays = crawlerMatch.minimumSpendWindowDays;
    const crawlMonths = crawlDays ? Math.round(crawlDays / 30) : 0;

    const diffs: { kind: DiffKind; csv: string; crawled: string }[] = [];

    if (csvFee !== crawlFee) {
      diffs.push({ kind: "annual_fee", csv: `$${csvFee}`, crawled: `$${crawlFee}` });
    }
    if (csvFeeY1 !== crawlFeeY1) {
      diffs.push({ kind: "fee_year1", csv: `$${csvFeeY1}`, crawled: `$${crawlFeeY1}` });
    }
    if (csvFeeY2 !== crawlFeeY2) {
      diffs.push({ kind: "fee_year2", csv: `$${csvFeeY2}`, crawled: `$${crawlFeeY2}` });
    }

    const bonusSame =
      csvCard.signup_bonus_type?.toLowerCase() === "dollars"
        ? csvBonusUsd === (crawlBonusUsd ?? 0)
        : csvBonus === crawlBonusAmt;
    if (!bonusSame) {
      if (csvCard.signup_bonus_type?.toLowerCase() === "dollars") {
        diffs.push({
          kind: "bonus",
          csv: `$${csvBonusUsd} (value)`,
          crawled:
            crawlBonusUsd != null ? `$${crawlBonusUsd}` : `${crawlBonusAmt} ${crawlerMatch.signupBonusCurrency || ""}`,
        });
      } else {
        diffs.push({
          kind: "bonus",
          csv: `${csvBonus} ${csvCard.signup_bonus_type || "points"} (value $${csvBonusUsd})`,
          crawled: `${crawlBonusAmt} ${crawlerMatch.signupBonusCurrency || "points"}${crawlBonusUsd != null ? ` (value $${crawlBonusUsd})` : ""}`,
        });
      }
    }

    if (csvSpend !== crawlSpend) {
      diffs.push({ kind: "min_spend", csv: `$${csvSpend}`, crawled: `$${crawlSpend}` });
    }
    if (csvMonths !== crawlMonths && (csvMonths > 0 || crawlMonths > 0)) {
      diffs.push({
        kind: "spend_timeframe",
        csv: `${csvMonths} months`,
        crawled: crawlMonths ? `${crawlMonths} months` : `${crawlDays ?? 0} days`,
      });
    }

    rows.push({
      csvCard,
      crawled: crawlerMatch,
      match: diffs.length === 0 ? "same" : "different",
      diffs: diffs.length > 0 ? diffs : undefined,
    });
  }

  for (let i = 0; i < crawled.length; i++) {
    if (usedCrawled.has(i)) continue;
    rows.push({
      csvCard: null,
      crawled: crawled[i],
      match: "crawler_only",
    });
  }

  return rows;
}

function printReport(rows: ComparisonRow[], crawled: CardCrawlerResult[]): void {
  const same = rows.filter((r) => r.match === "same");
  const different = rows.filter((r) => r.match === "different");
  const csvOnly = rows.filter((r) => r.match === "csv_only");
  const crawlerOnly = rows.filter((r) => r.match === "crawler_only");
  const brokenLinks = crawled.filter((c) => c.linkStatus === "broken" || c.linkStatus === "timeout");

  console.log("\n=== Capital One: Crawler vs cards.csv ===\n");
  console.log(`Compared ${rows.length} rows (CSV Capital One cards + crawler-only).\n`);
  console.log("Output: link status, fee (year 1 vs year 2+), bonus amount/type, spend ($ and timeframe).\n");

  if (brokenLinks.length > 0) {
    console.log("--- Broken application links ---");
    brokenLinks.forEach((c) => {
      console.log(`  ${c.cardName}`);
      console.log(`    CSV link: ${c.applicationLink ?? c.sourceUrl}`);
      if (c.linkError) console.log(`    Error: ${c.linkError}`);
      if (c.suggestedLink) console.log(`    Correct link (suggested): ${c.suggestedLink}`);
      if (c.suggestedSearchUrl) console.log(`    Search: ${c.suggestedSearchUrl}`);
      console.log("");
    });
  }

  if (same.length > 0) {
    console.log("--- Same (no differences) ---");
    same.forEach((r) => console.log(`  ${r.csvCard!.card_name}`));
    console.log("");
  }

  if (different.length > 0) {
    console.log("--- Different (CSV vs crawler) ---");
    different.forEach((r) => {
      const c = r.crawled!;
      console.log(`  ${r.csvCard!.card_name}`);
      console.log(`    Fee year 1: $${c.annualFeeYear1 ?? c.annualFee ?? "?"} | year 2+: $${c.annualFeeYear2Plus ?? c.annualFee ?? "?"}`);
      console.log(`    Bonus: ${c.signupBonusAmount ?? "?"} ${c.signupBonusCurrency ?? ""} | spend: $${c.minimumSpendAmount ?? "?"} in ${c.minimumSpendWindowDays ? `${Math.round(c.minimumSpendWindowDays / 30)} months` : "?"}`);
      r.diffs?.forEach((d) => console.log(`    ${d.kind}: ${d.csv} → ${d.crawled}`));
      if (c.linkStatus !== "ok" && c.suggestedLink) {
        console.log(`    Use this link: ${c.suggestedLink}`);
      }
      console.log("");
    });
  }

  if (csvOnly.length > 0) {
    console.log("--- In cards.csv only (not in crawler) ---");
    csvOnly.forEach((r) => r.csvCard && console.log(`  ${r.csvCard.card_name}`));
    console.log("");
  }

  if (crawlerOnly.length > 0) {
    console.log("--- In crawler only (not in cards.csv) ---");
    crawlerOnly.forEach((r) => console.log(`  ${r.crawled?.cardName}`));
    console.log("");
  }
}

function main(): void {
  const csvCards = loadCsvCapitalOneCards();
  const crawled = loadCrawledCapitalOne();
  console.log(`Loaded ${csvCards.length} Capital One cards from public/cards.csv`);
  console.log(`Loaded ${crawled.length} cards from crawled/capitalone.json`);
  const rows = compare(csvCards, crawled);
  printReport(rows, crawled);
}

main();
