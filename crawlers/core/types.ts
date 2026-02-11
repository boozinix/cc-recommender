/**
 * Shared types for the card crawler framework.
 * Output is designed to map to app/lib Card and resultsScoring.
 */

export type ParseStatus = "ok" | "partial" | "failed";

/** Link validation result. */
export type LinkStatus = "ok" | "broken" | "timeout";

/** One crawled card result; fields align with what resultsScoring and Card expect. */
export interface CardCrawlerResult {
  cardId?: string;
  bankId: string;
  cardName: string;
  /** Whether the application link was reachable. */
  linkStatus?: LinkStatus;
  linkError?: string;
  /** Suggested correct link from web search (when original was broken). */
  suggestedLink?: string;
  /** Search query and URL for manual lookup when link broken and no suggestedLink. */
  suggestedSearchQuery?: string;
  suggestedSearchUrl?: string;
  /** Parsed numeric bonus (e.g. 60000 points or 200 dollars). */
  signupBonusAmount?: number;
  signupBonusCurrency?: string;
  signupBonusText: string;
  minimumSpendAmount?: number;
  minimumSpendCurrency?: string;
  minimumSpendWindowDays?: number;
  annualFee?: number;
  annualFeeWaivedFirstYear?: boolean;
  /** Annual fee year 1 (intro/first year); may differ from year 2+. */
  annualFeeYear1?: number;
  /** Annual fee year 2 and beyond. */
  annualFeeYear2Plus?: number;
  annualFeeNotes?: string;
  lastSeenAt: string;
  sourceUrl: string;
  parseStatus: ParseStatus;
  applicationLink?: string;
  /** For scoring: estimated USD value when known (points * rate or cash). */
  estimatedBonusValueUsd?: number;
}

/** Source entry: which URL to crawl for which product. */
export interface CardCrawlerSource {
  bankId: string;
  url: string;
  productFamily?: string;
}
