/**
 * Citi credit card crawler.
 * Fetches card pages from citi.com and creditcards.aa.com (AAdvantage cards) and extracts bonus, spend, and fee.
 * URLs are loaded from public/cards.csv (application_link for issuer=Citi).
 */

import * as path from "path";
import * as fs from "fs";
import Papa from "papaparse";
import { loadHtml } from "../core/htmlParser";
import { logError, logInfo, logWarn } from "../core/logger";
import { parseSignupBonus, parseSpendRequirement, parseAnnualFee } from "../core/parsers";
import type { CardCrawlerResult, ParseStatus } from "../core/types";
import { fetchHtml } from "../core/httpClient";
import { checkLink, searchForCardLink } from "../core/linkChecker";

const BANK_ID = "citi";

interface CitiCsvCard {
  card_name: string;
  application_link: string;
  annual_fee: string;
  minimum_spend_amount: string;
  signup_bonus: string;
  signup_bonus_type: string;
  estimated_bonus_value_usd: string;
  spend_time_frame: string;
}

/** Citi cards from cards.csv with all fields needed for CSV fallback. */
function getCitiCardsFromCsv(): CitiCsvCard[] {
  const csvPath = path.join(process.cwd(), "public", "cards.csv");
  const raw = fs.readFileSync(csvPath, "utf-8");
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true });
  const cards: CitiCsvCard[] = [];
  for (const row of parsed.data) {
    const issuer = (row.issuer || "").trim().toLowerCase();
    if (issuer !== "citi") continue;
    const card_name = (row.card_name || "").trim();
    const link = (row.application_link || "").trim();
    if (!card_name) continue;
    if (!link || !link.startsWith("http")) {
      logWarn("Citi card missing application_link", { card_name });
      continue;
    }
    cards.push({
      card_name,
      application_link: link,
      annual_fee: row.annual_fee ?? "",
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
    /\$(\d+)\s*annual fee/i,
    /annual fee\s*[:\s]*\$?(\d+)/i,
    /ANNUAL FEE\s*\$?(\d+)/i,
    /annual fee\s+of\s+\$?(\d+)/i,
    /\$(\d+)\s*\/\s*year/i,
  ];
  for (const re of patterns) {
    const m = body.match(re);
    if (m) {
      const amount = parseInt(m[1], 10);
      if (amount <= 1000) return `$${amount} annual fee`;
    }
  }
  const noFee = body.match(/(?:No annual fee|\$0\s*annual fee|annual fee\s*[:\s]*\$?0|Annual Fee\s*[–-]\s*None)/i);
  if (noFee) return noFee[0].trim();
  return "";
}

/** Use extracted value if valid; otherwise fall back to CSV. */
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
  csv: CitiCsvCard,
  bonusText: string,
  spendText: string,
  feeText: string,
  opts: BuildResultOptions = {}
): CardCrawlerResult {
  const bonus = parseSignupBonus(bonusText);
  const spend = parseSpendRequirement(spendText || bonus.raw);
  const fee = parseAnnualFee(feeText);

  const csvFee = parseCsvNum(csv.annual_fee);
  const csvSpend = parseCsvNum(csv.minimum_spend_amount);
  const csvBonus = parseCsvNum(csv.signup_bonus);
  const csvBonusUsd = parseCsvNum(csv.estimated_bonus_value_usd);
  const csvMonths = parseCsvNum(csv.spend_time_frame);

  const validFee = (n: number) => n >= 0 && n <= 1000;
  const validSpend = (n: number) => n >= 0 && n < 100000 && (n < 2020 || n > 2030);
  const validBonus = (n: number) => n >= 0 && n < 10000000;

  const annualFee = orCsv(fee.amount, csvFee, validFee);
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
    annualFeeWaivedFirstYear: fee.waivedFirstYear ?? false,
    annualFeeNotes: fee.raw || undefined,
    lastSeenAt: new Date().toISOString(),
    sourceUrl: url,
    parseStatus,
    applicationLink: url,
    estimatedBonusValueUsd,
  };
}

export async function fetchCitiCards(): Promise<CardCrawlerResult[]> {
  const csvCards = getCitiCardsFromCsv();
  logInfo("Citi cards from CSV", { count: csvCards.length });

  const urlToCsvCards = new Map<string, CitiCsvCard[]>();
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
      const search = await searchForCardLink(firstCard.card_name, "Citi", url);
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
