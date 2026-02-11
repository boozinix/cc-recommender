/**
 * Capital One credit card crawler.
 * Fetches card pages from capitalone.com and extracts bonus, spend, fee (year 1 vs year 2+).
 * URLs from public/cards.csv. Checks links first; searches for correct link when broken.
 */

import * as path from "path";
import * as fs from "fs";
import Papa from "papaparse";
import { loadHtml } from "../core/htmlParser";
import { logError, logInfo, logWarn } from "../core/logger";
import {
  parseSignupBonus,
  parseSpendRequirement,
  parseAnnualFee,
  parseAnnualFeeWithYears,
} from "../core/parsers";
import type { CardCrawlerResult, ParseStatus } from "../core/types";
import { fetchHtml } from "../core/httpClient";
import { checkLink, searchForCardLink } from "../core/linkChecker";

const BANK_ID = "capitalone";

interface CapitalOneCsvCard {
  card_name: string;
  application_link: string;
  annual_fee: string;
  annual_fee_year_1: string;
  annual_fee_year_2_plus: string;
  minimum_spend_amount: string;
  signup_bonus: string;
  signup_bonus_type: string;
  estimated_bonus_value_usd: string;
  spend_time_frame: string;
}

function getCapitalOneCardsFromCsv(): CapitalOneCsvCard[] {
  const csvPath = path.join(process.cwd(), "public", "cards.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  const cards: CapitalOneCsvCard[] = [];
  for (const row of parsed.data) {
    const issuer = (row.issuer || "").trim().toLowerCase();
    if (issuer !== "capital one") continue;
    const card_name = (row.card_name || "").trim();
    const link = (row.application_link || "").trim();
    if (!card_name) continue;
    if (!link || !link.startsWith("http")) {
      logWarn("Capital One card missing application_link", { card_name });
      continue;
    }
    cards.push({
      card_name,
      application_link: link,
      annual_fee: row.annual_fee ?? "",
      annual_fee_year_1: row.annual_fee_year_1 ?? "",
      annual_fee_year_2_plus: row.annual_fee_year_2_plus ?? "",
      minimum_spend_amount: row.minimum_spend_amount ?? "",
      signup_bonus: row.signup_bonus ?? "",
      signup_bonus_type: row.signup_bonus_type ?? "",
      estimated_bonus_value_usd: row.estimated_bonus_value_usd ?? "",
      spend_time_frame: row.spend_time_frame ?? "",
    });
  }
  return cards;
}

function parseCsvNum(val: string): number {
  if (!val || !val.trim()) return 0;
  const n = parseInt(val.replace(/[$,]/g, "").trim(), 10);
  return Number.isNaN(n) ? 0 : n;
}

function extractBonusText($: ReturnType<typeof loadHtml>): string {
  const body = $("body").text();
  const earnMatch = body.match(/Earn\s+(?:a\s+)?(?:up to\s+)?(?:\$?\d[^.]*?)(?:after[^.]*?\.|\.)/i);
  if (earnMatch) return earnMatch[0].trim();
  const bonusMatch = body.match(/(\$?\d{1,3}(?:,\d{3})*)\s*(?:bonus|points?|miles?|cash\s*back?)/i);
  if (bonusMatch) return bonusMatch[0].trim();
  return "";
}

function extractSpendText($: ReturnType<typeof loadHtml>): string {
  const body = $("body").text();
  const spendMatch = body.match(/spend\s+\$?(\d[^.]*?)\s*(?:in|on).*?(?:\d+)\s*months?/i)
    ?? body.match(/\$?(\d{3,})[^.]*?(?:first\s+)?(\d+)\s*months?/i);
  if (spendMatch) return spendMatch[0].trim();
  const afterMatch = body.match(/after you spend \$?\d[^.]*?\./i);
  if (afterMatch) return afterMatch[0].trim();
  return "";
}

function extractFeeText($: ReturnType<typeof loadHtml>): string {
  const body = $("body").text();
  const patterns: RegExp[] = [
    /\$0\s*(?:intro|for\s*the\s*first\s*year)[^$]*?(?:then|after)\s*\$?(\d+)/i,
    /\$(\d+)\s*(?:annual fee|per year)/i,
    /annual fee\s*[:\s]*\$?(\d+)/i,
    /(?:No annual fee|\$0\s*annual fee)/i,
  ];
  for (const re of patterns) {
    const m = body.match(re);
    if (m) {
      if (m[1] != null) {
        const amount = parseInt(m[1], 10);
        if (amount <= 1000) return m[0].trim();
      }
      return m[0].trim();
    }
  }
  return "";
}

function orCsv<T>(extracted: T | undefined, csvVal: T, isValid: (v: T) => boolean): T {
  if (extracted != null && isValid(extracted)) return extracted;
  return csvVal;
}

interface BuildResultOptions {
  linkStatus?: CardCrawlerResult["linkStatus"];
  linkError?: string;
  suggestedLink?: string;
  suggestedSearchQuery?: string;
  suggestedSearchUrl?: string;
}

function buildResult(
  url: string,
  csv: CapitalOneCsvCard,
  bonusText: string,
  spendText: string,
  feeText: string,
  opts: BuildResultOptions = {}
): CardCrawlerResult {
  const bonus = parseSignupBonus(bonusText);
  const spend = parseSpendRequirement(spendText || bonus.raw);
  const fee = parseAnnualFee(feeText);
  const feeYears = parseAnnualFeeWithYears(feeText);

  const csvFee = parseCsvNum(csv.annual_fee);
  const csvFeeY1 = parseCsvNum(csv.annual_fee_year_1);
  const csvFeeY2 = parseCsvNum(csv.annual_fee_year_2_plus);
  const csvSpend = parseCsvNum(csv.minimum_spend_amount);
  const csvBonus = parseCsvNum(csv.signup_bonus);
  const csvBonusUsd = parseCsvNum(csv.estimated_bonus_value_usd);
  const csvMonths = parseCsvNum(csv.spend_time_frame);

  const validFee = (n: number) => n >= 0 && n <= 1000;
  const validSpend = (n: number) => n >= 0 && n < 100000 && (n < 2020 || n > 2030);
  const validBonus = (n: number) => n >= 0 && n < 10000000;

  const annualFee = orCsv(fee.amount ?? feeYears.year2Plus, csvFee || csvFeeY2, validFee);
  const annualFeeYear1 = orCsv(feeYears.year1, csvFeeY1 >= 0 ? csvFeeY1 : annualFee, validFee);
  const annualFeeYear2Plus = orCsv(feeYears.year2Plus ?? fee.amount, csvFeeY2 >= 0 ? csvFeeY2 : annualFee, validFee);
  const minimumSpendAmount = orCsv(spend.amount, csvSpend, validSpend);
  const signupBonusAmount = orCsv(bonus.amount, csvBonus, validBonus);
  const minimumSpendWindowDays = orCsv(spend.windowDays, csvMonths * 30, (d) => d > 0 && d <= 365);

  let estimatedBonusValueUsd: number;
  if (bonus.currency === "dollars" && bonus.amount != null && validBonus(bonus.amount)) {
    estimatedBonusValueUsd = bonus.amount;
  } else if (csvBonusUsd > 0) {
    estimatedBonusValueUsd = csvBonusUsd;
  } else {
    estimatedBonusValueUsd = signupBonusAmount;
  }

  const extractedOk = (bonus.raw || fee.raw) && validFee(annualFee);
  let parseStatus: ParseStatus = extractedOk ? "ok" : "partial";

  return {
    bankId: BANK_ID,
    cardName: csv.card_name,
    linkStatus: opts.linkStatus,
    linkError: opts.linkError,
    suggestedLink: opts.suggestedLink,
    suggestedSearchQuery: opts.suggestedSearchQuery,
    suggestedSearchUrl: opts.suggestedSearchUrl,
    signupBonusText: bonus.raw || bonusText || `${signupBonusAmount} ${csv.signup_bonus_type || "points"}`,
    signupBonusAmount,
    signupBonusCurrency: bonus.currency || (csv.signup_bonus_type?.toLowerCase() || "points"),
    minimumSpendAmount,
    minimumSpendWindowDays: minimumSpendWindowDays > 0 ? minimumSpendWindowDays : undefined,
    annualFee,
    annualFeeWaivedFirstYear: fee.waivedFirstYear ?? (annualFeeYear1 === 0 && annualFeeYear2Plus > 0),
    annualFeeYear1,
    annualFeeYear2Plus,
    annualFeeNotes: fee.raw || undefined,
    lastSeenAt: new Date().toISOString(),
    sourceUrl: url,
    parseStatus,
    applicationLink: url,
    estimatedBonusValueUsd,
  };
}

export async function fetchCapitalOneCards(): Promise<CardCrawlerResult[]> {
  const csvCards = getCapitalOneCardsFromCsv();
  logInfo("Capital One cards from CSV", { count: csvCards.length });

  const urlToCsvCards = new Map<string, CapitalOneCsvCard[]>();
  for (const c of csvCards) {
    const list = urlToCsvCards.get(c.application_link) ?? [];
    list.push(c);
    urlToCsvCards.set(c.application_link, list);
  }

  const results: CardCrawlerResult[] = [];
  for (const [url, csvCardsForUrl] of urlToCsvCards) {
    let bonusText = "";
    let spendText = "";
    let feeText = "";
    let fetchOk = false;
    let effectiveUrl = url;
    const linkCheck = await checkLink(url);
    let linkOpts: BuildResultOptions = {
      linkStatus: linkCheck.status === "ok" ? "ok" : linkCheck.status,
      linkError: linkCheck.error,
    };

    if (linkCheck.status !== "ok") {
      logWarn("Link broken or unreachable", { url, error: linkCheck.error });
      const firstCard = csvCardsForUrl[0];
      const search = await searchForCardLink(firstCard.card_name, "Capital One", url);
      linkOpts = {
        ...linkOpts,
        suggestedLink: search.suggestedLink,
        suggestedSearchQuery: search.suggestedSearchQuery,
        suggestedSearchUrl: search.suggestedSearchUrl,
      };
      if (search.suggestedLink) {
        logInfo("Trying suggested link from search", { suggested: search.suggestedLink });
        const altCheck = await checkLink(search.suggestedLink);
        if (altCheck.status === "ok") {
          effectiveUrl = search.suggestedLink;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    try {
      logInfo("Fetching", { url: effectiveUrl, cards: csvCardsForUrl.length });
      const html = await fetchHtml(effectiveUrl);
      const $ = loadHtml(html);
      bonusText = extractBonusText($);
      spendText = extractSpendText($);
      feeText = extractFeeText($);
      fetchOk = true;
    } catch (err) {
      logError("Failed to crawl", { url: effectiveUrl, error: err instanceof Error ? err.message : String(err) });
    }

    for (const csv of csvCardsForUrl) {
      const result = buildResult(effectiveUrl, csv, bonusText, spendText, feeText, linkOpts);
      result.applicationLink = url;
      result.sourceUrl = effectiveUrl;
      if (!fetchOk) result.parseStatus = "failed";
      else if (result.parseStatus !== "ok") {
        logWarn("Partial or failed parse, using CSV fallback", { cardName: csv.card_name, url: effectiveUrl, parseStatus: result.parseStatus });
      }
      results.push(result);
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  return results;
}
