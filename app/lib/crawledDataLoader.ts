/**
 * Load crawled card data from crawled/*.json and map to Card shape for resultsScoring.
 * Use from server-side only (API routes, scripts) - uses Node fs/path.
 */

import * as fs from "fs";
import * as path from "path";
import type { Card } from "./cardTypes";
import type { CardCrawlerResult } from "@/crawlers/core/types";

const CRAWLED_DIR = "crawled";

/** Map bankId to issuer display name. */
const BANK_TO_ISSUER: Record<string, string> = {
  chase: "Chase",
  amex: "American Express",
  citi: "Citi",
  "capital one": "Capital One",
  "bank of america": "Bank of America",
  barclays: "Barclays",
  "u.s. bank": "U.S. Bank",
  "wells fargo": "Wells Fargo",
};

/**
 * Load all crawled cards from crawled/{bankId}.json files.
 * Returns an array of CardCrawlerResult for each bank file found.
 */
export function loadCrawledCards(): CardCrawlerResult[] {
  const results: CardCrawlerResult[] = [];
  const cwd = process.cwd();
  const crawledPath = path.join(cwd, CRAWLED_DIR);

  if (!fs.existsSync(crawledPath)) {
    return results;
  }

  const files = fs.readdirSync(crawledPath);
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(crawledPath, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const arr = JSON.parse(raw) as CardCrawlerResult[];
      if (Array.isArray(arr)) {
        results.push(...arr);
      }
    } catch {
      // Skip invalid files
    }
  }
  return results;
}

/**
 * Load crawled cards for a specific bank.
 */
export function loadCrawledCardsByBank(bankId: string): CardCrawlerResult[] {
  const cwd = process.cwd();
  const filePath = path.join(cwd, CRAWLED_DIR, `${bankId}.json`);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const arr = JSON.parse(raw) as CardCrawlerResult[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/**
 * Compute estimated bonus value in USD from crawled result.
 * Uses explicit estimatedBonusValueUsd when present; otherwise estimates from points/miles.
 */
function getCrawledBonusValueUsd(crawled: CardCrawlerResult): number {
  if (crawled.estimatedBonusValueUsd != null) {
    return crawled.estimatedBonusValueUsd;
  }
  const amt = crawled.signupBonusAmount ?? 0;
  const currency = (crawled.signupBonusCurrency || "").toLowerCase();
  if (currency === "dollars") return amt;
  // Default Chase UR cpp for points; use 1.0 for unknown
  const cpp = currency === "miles" ? 1.0 : 1.25;
  return Math.round((amt * cpp) / 100);
}

/**
 * Map a CardCrawlerResult to a Card-like object suitable for resultsScoring.
 * Fills in string fields expected by Card; missing fields use empty strings or defaults.
 */
export function mapCrawlerResultToCard(
  crawled: CardCrawlerResult,
  defaults?: Partial<Card>
): Card {
  const bankId = (crawled.bankId || "").toLowerCase();
  const issuer = BANK_TO_ISSUER[bankId] ?? bankId.charAt(0).toUpperCase() + bankId.slice(1);
  const bonusValueUsd = getCrawledBonusValueUsd(crawled);
  const currency = (crawled.signupBonusCurrency || "points").toLowerCase();
  const signupBonusType = currency === "dollars" ? "dollars" : currency;

  const spendWindowMonths =
    crawled.minimumSpendWindowDays != null
      ? Math.round(crawled.minimumSpendWindowDays / 30)
      : undefined;

  const card: Card = {
    card_name: crawled.cardName || "Unknown",
    issuer: defaults?.issuer ?? issuer,
    card_type: defaults?.card_type ?? "personal",
    annual_fee: String(crawled.annualFee ?? 0),
    reward_model: defaults?.reward_model ?? "",
    card_family: defaults?.card_family ?? crawled.cardName ?? "",
    cashback_rate_effective: defaults?.cashback_rate_effective ?? "0",
    estimated_bonus_value_usd: String(bonusValueUsd),
    minimum_spend_amount: crawled.minimumSpendAmount != null ? String(crawled.minimumSpendAmount) : "",
    spend_time_frame: spendWindowMonths != null ? String(spendWindowMonths) : "",
    signup_bonus: crawled.signupBonusAmount != null ? String(crawled.signupBonusAmount) : crawled.signupBonusText || "",
    signup_bonus_type: signupBonusType,
    intro_apr_purchase: defaults?.intro_apr_purchase ?? "",
    best_for: defaults?.best_for ?? "",
    pros: defaults?.pros ?? "",
    cons: defaults?.cons ?? "",
    application_link: crawled.applicationLink ?? crawled.sourceUrl ?? "",
    ...defaults,
  };

  return card;
}

/**
 * Build a map of card name (normalized) -> CardCrawlerResult for quick lookup.
 */
function buildCrawledMap(crawled: CardCrawlerResult[]): Map<string, CardCrawlerResult> {
  const map = new Map<string, CardCrawlerResult>();
  for (const c of crawled) {
    const key = normalizeCardName(c.cardName);
    // Prefer first match; crawler order is usually stable
    if (!map.has(key)) {
      map.set(key, c);
    }
  }
  return map;
}

function normalizeCardName(name: string): string {
  return name
    .replace(/\s*®\s*/gi, " ")
    .replace(/\s*Credit Card\s*$/i, "")
    .replace(/^\s*The New\s+/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Merge crawled data into an existing Card when we have a match by name.
 * Overwrites: annual_fee, estimated_bonus_value_usd, minimum_spend_amount,
 * spend_time_frame, signup_bonus, signup_bonus_type, application_link.
 * Returns the card unchanged if no crawled match.
 */
export function mergeCrawledIntoCard(
  card: Card,
  crawledMap: Map<string, CardCrawlerResult>
): Card {
  const key = normalizeCardName(card.card_name);
  const crawled = crawledMap.get(key);
  if (!crawled) return card;

  const bonusValueUsd = getCrawledBonusValueUsd(crawled);
  const currency = (crawled.signupBonusCurrency || "points").toLowerCase();
  const signupBonusType = currency === "dollars" ? "dollars" : currency;
  const spendWindowMonths =
    crawled.minimumSpendWindowDays != null
      ? Math.round(crawled.minimumSpendWindowDays / 30)
      : undefined;

  return {
    ...card,
    annual_fee: String(crawled.annualFee ?? parseInt(card.annual_fee || "0", 10)),
    estimated_bonus_value_usd: String(bonusValueUsd),
    minimum_spend_amount:
      crawled.minimumSpendAmount != null ? String(crawled.minimumSpendAmount) : card.minimum_spend_amount ?? "",
    spend_time_frame:
      spendWindowMonths != null ? String(spendWindowMonths) : card.spend_time_frame ?? "",
    signup_bonus:
      crawled.signupBonusAmount != null ? String(crawled.signupBonusAmount) : card.signup_bonus ?? "",
    signup_bonus_type: signupBonusType,
    application_link: crawled.applicationLink ?? crawled.sourceUrl ?? card.application_link ?? "",
  };
}

/**
 * Load all crawled cards and merge their data into a list of Cards.
 * Cards with a matching crawled entry get their bonus/fee/spend fields updated.
 */
export function mergeCrawledIntoCards(cards: Card[]): Card[] {
  const crawled = loadCrawledCards();
  const map = buildCrawledMap(crawled);
  return cards.map((c) => mergeCrawledIntoCard(c, map));
}
